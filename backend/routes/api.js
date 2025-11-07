const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const auth = require('../middleware/auth');
const azureAuth = require('../middleware/azureAuth');
const axios = require('axios');
const DocumentCategorizationService = require('../services/documentCategorizationService');
const IngestionService = require('../services/ingestionService');
const { sendNotification } = require('../utils/helper');

// Import chat session routes
const chatSessionsRoutes = require('./chatSessions');

// Customer routes
router.get('/customers', customerController.getAllCustomers);
router.get('/customers/:id', customerController.getCustomerById);
router.post('/customers', auth.authenticate, customerController.createCustomer);
router.put('/customers/:id', auth.authenticate, customerController.updateCustomer);
router.delete('/customers/:id', auth.authenticate, customerController.deleteCustomer);

// Chat session routes
router.use('/chat-sessions', chatSessionsRoutes);


// Proxy route for ingest API to avoid CORS issues
router.post('/ingest-document', async (req, res) => {
    try {
        console.log('🔄 Proxying ingest request:', req.body);
        
        const { workspace_id, document_id, ingestion_source_id, file_type, file_name, document_category, keywords } = req.body;
        
        // Validate required parameters
        if (!workspace_id || !document_id || !ingestion_source_id) {
            return res.status(400).json({
                success: false,
                message: 'Missing required parameters: workspace_id, document_id, ingestion_source_id'
            });
        }
        
        // Use the ingestion service to process the document
        const ingestionService = new IngestionService();
        const result = await ingestionService.processDocument({
            workspace_id,
            document_id,
            ingestion_source_id,
            file_type,
            file_name,
            document_category,
            keywords
        });
        
        if (result.success) {
            res.json({
                success: true,
                data: result.data,
                fileType: result.fileType,
                message: result.message
            });
        } else {
            res.status(result.statusCode || 500).json({
                success: false,
                message: result.message,
                error: result.error,
                fileType: result.fileType
            });
        }
        
    } catch (error) {
        console.error('❌ Error in ingest proxy:', error);
        
        res.status(500).json({
            success: false,
            message: 'Internal server error during document ingestion',
            error: error.message
        });
    }
});

router.post('/scrape-web-url', azureAuth.authenticate, async (req, res) => {
    console.log('inside scrape-web-url route');
    try {
        const { url, workspace_id } = req.body;
        
        if (!url || !workspace_id) {
            return res.status(400).json({
                success: false,
                message: 'Missing required parameters: url, workspace_id'
            });
        }
        
        // Call function app directly from backend (no CORS issues)
        const endpoint = 'https://smartdoc-ingestion.azurewebsites.net/api/scrape?code=REDACTED_AZURE_FUNCTION_KEY'
        const response = await axios.post(
            endpoint,
            {
                url,
                workspace_id
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 60000 // 60 second timeout for scraping
            }
        );
        
        console.log('Scrape API response:', response.data);

        // Send notification if user is authenticated
        if (!req.user?.id) {
            throw new Error('No authenticated user found - skipping notification');
        }
        await sendNotification(response.data, req.user.id);

        // Check if scraping was successful and extract required parameters for categorization
        if (response.data.success && response.data.result && response.data.result.azure_upload && response.data.result.azure_upload.success) {
            try {
                // Extract required parameters from the scraping response
                const { 
                    document_metadata: { document_guid, ingestion_source_id },
                    azure_upload: { blob_url }
                } = response.data.result;
                
                console.log('🚀 Auto-triggering document categorization after successful scraping');
                
                // Use the imported categorization service
                const categorizationService = new DocumentCategorizationService();
                
                // Call categorization service with extracted parameters
                const categorizationResult = await categorizationService.categorizeDocument({
                    workspace_id,
                    document_id: document_guid,
                    ingestion_source_id,
                    blob_url
                });
                
                if (categorizationResult.success) {
                    console.log('✅ Document categorization completed successfully');
                    // Add categorization result to the response
                    response.data.categorization = {
                        success: true,
                        data: categorizationResult.data,
                        message: categorizationResult.message
                    };
                } else {
                    console.log('⚠️ Document categorization failed:', categorizationResult.message);
                    // Add categorization error to the response but don't fail the overall request
                    response.data.categorization = {
                        success: false,
                        message: categorizationResult.message,
                        error: categorizationResult.error
                    };
                }
                
            } catch (categorizationError) {
                console.error('❌ Error during auto-categorization:', categorizationError);
                // Add categorization error to the response but don't fail the overall request
                response.data.categorization = {
                    success: false,
                    message: 'Failed to categorize document',
                    error: categorizationError.message
                };
            }
        } else {
            console.log('⚠️ Skipping document categorization - scraping response indicates failure or missing required data');
        }
        
        res.json({
            success: true,
            data: response.data,
            message: response.data.message || 'Web URL scraped successfully'
        });
        
    } catch (error) {
        console.error('Error in scrape proxy:', error);

        // Send error notification if user is authenticated
        if (req.user?.id) {
            try {
                const errorNotification = {
                    success: false,
                    url: req.body.url,
                    message: error.response?.data?.message || error.message || 'Failed to scrape web URL',
                    error: error.message,
                    errorCode: 'SCRAPING_ERROR',
                    statusCode: 500
                }
                await sendNotification(errorNotification, req.user.id);
            } catch (notificationError) {
                console.error('⚠️ Failed to send error notification for web scraping:', notificationError);
            }
        }

        console.log("Error in scrape-web-url route:", error)
        const status_code = error.response.status
        res.status(status_code).json({
            success: false,
            message: error.response.data.message,
            error_type: error.response.data.error_type,
            status_code: error.response.status
        });
    }
});

// Document categorization endpoint
router.post('/categorize-document', async (req, res) => {
    try {
        const { workspace_id, document_id, ingestion_source_id, blob_url } = req.body;
        
        if (!workspace_id || !document_id || !ingestion_source_id || !blob_url) {
            return res.status(400).json({
                success: false,
                message: 'Missing required parameters: workspace_id, document_id, ingestion_source_id, blob_url'
            });
        }
        
        // Use the imported categorization service
        const categorizationService = new DocumentCategorizationService();
        
        console.log('🚀 Calling document categorization API from route');
        const result = await categorizationService.categorizeDocument({
            workspace_id,
            document_id,
            ingestion_source_id,
            blob_url
        });
        
        if (result.success) {
            res.json({
                success: true,
                data: result.data,
                message: result.message
            });
        } else {
            res.status(result.statusCode || 500).json({
                success: false,
                message: result.message,
                error: result.error
            });
        }
        
    } catch (error) {
        console.error('❌ Error in categorize-document route:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to categorize document'
        });
    }
});

module.exports = router; 