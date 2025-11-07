const axios = require('axios');

/**
 * Service for document categorization using external Azure Function API
 */
class DocumentCategorizationService {
    constructor() {
        // Configuration for the categorization endpoint
        // Endpoint and API code must come from environment variables to avoid committing secrets
        this.categorizationEndpoint = process.env.CATEGORIZATION_ENDPOINT || 'https://smartdoc-ingestion.azurewebsites.net/api/categorize_document';
        this.apiCode = process.env.CATEGORIZATION_API_CODE;
        this.timeout = 30000; // 30 second timeout
    }

    /**
     * Categorize a document using the external API
     * @param {Object} params - Categorization parameters
     * @param {string} params.workspace_id - Workspace identifier
     * @param {string} params.document_id - Document identifier
     * @param {string} params.ingestion_source_id - Ingestion source identifier
     * @param {string} params.blob_url - Blob storage URL of the document
     * @returns {Promise<Object>} - Categorization result
     */
    async categorizeDocument(params) {
        try {
            const { workspace_id, document_id, ingestion_source_id, blob_url } = params;

            // Validate required parameters
            if (!workspace_id || !document_id || !ingestion_source_id || !blob_url) {
                throw new Error('Missing required parameters: workspace_id, document_id, ingestion_source_id, blob_url');
            }

            console.log('🚀 Calling document categorization API with params:', {
                workspace_id,
                document_id,
                ingestion_source_id,
                blob_url: blob_url.substring(0, 100) + '...' // Log partial URL for security
            });

            // Validate API code before calling external Azure Function
            if (!this.apiCode) {
                throw new Error('DocumentCategorizationService misconfigured: missing CATEGORIZATION_API_CODE environment variable');
            }

            // Call the external Azure Function API
            const response = await axios.post(
                `${this.categorizationEndpoint}?code=${this.apiCode}`,
                {
                    workspace_id,
                    document_id,
                    ingestion_source_id,
                    blob_url
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    timeout: this.timeout
                }
            );

            console.log('✅ Document categorization successful:', response.data);

            return {
                success: true,
                data: response.data,
                message: 'Document categorized successfully'
            };

        } catch (error) {
            console.error('❌ Error in document categorization:', error);

            let errorMessage = 'Failed to categorize document';
            let statusCode = 500;

            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                statusCode = error.response.status;
                errorMessage = error.response.data?.message || error.response.statusText || errorMessage;
            } else if (error.request) {
                // The request was made but no response was received
                errorMessage = 'No response received from categorization service';
            } else {
                // Something happened in setting up the request that triggered an Error
                errorMessage = error.message;
            }

            // Return error object that can be handled by the caller
            return {
                success: false,
                message: errorMessage,
                error: error.message,
                statusCode: statusCode
            };
        }
    }

    /**
     * Get the full categorization endpoint URL with API code
     * @returns {string} - Full endpoint URL
     */
    getEndpointUrl() {
        return `${this.categorizationEndpoint}?code=${this.apiCode}`;
    }

    /**
     * Update the API code (useful for configuration updates)
     * @param {string} newApiCode - New API code
     */
    updateApiCode(newApiCode) {
        this.apiCode = newApiCode;
        console.log('🔑 API code updated for document categorization service');
    }

    /**
     * Update the timeout value
     * @param {number} newTimeout - New timeout in milliseconds
     */
    updateTimeout(newTimeout) {
        this.timeout = newTimeout;
        console.log(`⏱️  Timeout updated to ${newTimeout}ms for document categorization service`);
    }
}

module.exports = DocumentCategorizationService;
