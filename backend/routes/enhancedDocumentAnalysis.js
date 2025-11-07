const express = require('express');
const router = express.Router();
const azureAuth = require('../middleware/azureAuth');
const EnhancedDocumentAnalysisService = require('../services/enhancedDocumentAnalysisService');
const { DocumentMetadata } = require('../models/DocumentMetadata');
const BlobChunksService = require('../services/blobChunksService');

/**
 * Enhanced Document Analysis Routes
 * Provides comprehensive AI-powered document analysis capabilities
 */

const analysisService = new EnhancedDocumentAnalysisService();
const blobChunksService = new BlobChunksService();

/**
 * POST /api/enhanced-analysis/comprehensive
 * Perform comprehensive document analysis
 */
router.post('/comprehensive', azureAuth.authenticate, azureAuth.validateOrganizationalAccess, async (req, res) => {
  try {
    console.log('🔍 Starting comprehensive document analysis...');
    
    const {
      documentId,
      documentContent,
      options = {}
    } = req.body;

    if (!documentId && !documentContent) {
      return res.status(400).json({
        success: false,
        error: 'Either documentId or documentContent is required',
        timestamp: new Date().toISOString()
      });
    }

    let contentToAnalyze = documentContent;

    // If documentId is provided, fetch content from blob storage
    if (documentId && !documentContent) {
      console.log(`📄 Fetching content for document: ${documentId}`);
      
      const document = await DocumentMetadata.getDocumentById(documentId);
      if (!document) {
        return res.status(404).json({
          success: false,
          error: 'Document not found',
          documentId: documentId
        });
      }

      // Get document chunks content
      const documentMetadata = {
        workspace_id: document.workspace_id,
        document_id: document.document_guid,
        ingestion_source_id: document.ingestion_source_id?.toString()
      };

      const chunksResult = await blobChunksService.getDocumentChunks(documentMetadata);
      if (!chunksResult.success) {
        return res.status(404).json({
          success: false,
          error: 'Document chunks not found',
          documentId: documentId,
          details: chunksResult.error
        });
      }

      const processedResult = await blobChunksService.processChunksForAI(
        chunksResult.chunksData,
        'balanced',
        50 // More chunks for comprehensive analysis
      );

      if (!processedResult.success) {
        return res.status(500).json({
          success: false,
          error: 'Failed to process document chunks',
          documentId: documentId
        });
      }

      contentToAnalyze = processedResult.originalContent?.text || processedResult.originalContent;
      
      if (typeof contentToAnalyze === 'object') {
        contentToAnalyze = JSON.stringify(contentToAnalyze);
      }
    }

    if (!contentToAnalyze || contentToAnalyze.length < 50) {
      return res.status(400).json({
        success: false,
        error: 'Document content is too short for meaningful analysis',
        contentLength: contentToAnalyze ? contentToAnalyze.length : 0
      });
    }

    // Perform comprehensive analysis
    console.log(`📊 Analyzing content (${contentToAnalyze.length} characters)...`);
    const analysisResult = await analysisService.performComprehensiveAnalysis(contentToAnalyze, {
      modelType: options.modelType || 'gpt4o-mini',
      includeKeywords: options.includeKeywords !== false,
      includeSentiment: options.includeSentiment !== false,
      includeCategorization: options.includeCategorization !== false,
      includeSummary: options.includeSummary !== false
    });

    if (!analysisResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Analysis failed',
        details: analysisResult.error,
        timestamp: new Date().toISOString()
      });
    }

    // Add document metadata to response
    const response = {
      success: true,
      documentId: documentId,
      analysisId: analysisResult.analysisId,
      timestamp: new Date().toISOString(),
      analysis: analysisResult.data,
      processingTime: analysisResult.processingTime,
      contentLength: contentToAnalyze.length
    };

    console.log('✅ Comprehensive analysis completed successfully');
    res.status(200).json(response);

  } catch (error) {
    console.error('❌ Comprehensive analysis failed:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during analysis',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/enhanced-analysis/summary
 * Get document summary only
 */
router.post('/summary', azureAuth.authenticate, azureAuth.validateOrganizationalAccess, async (req, res) => {
  try {
    const { documentId, documentContent, modelType = 'gpt4o-mini' } = req.body;
    
    let contentToAnalyze = documentContent;
    if (documentId && !documentContent) {
      // Fetch content logic (similar to comprehensive analysis)
      const document = await DocumentMetadata.getDocumentById(documentId);
      if (!document) {
        return res.status(404).json({ success: false, error: 'Document not found' });
      }
      
      const documentMetadata = {
        workspace_id: document.workspace_id,
        document_id: document.document_guid,
        ingestion_source_id: document.ingestion_source_id?.toString()
      };

      const chunksResult = await blobChunksService.getDocumentChunks(documentMetadata);
      if (chunksResult.success) {
        const processedResult = await blobChunksService.processChunksForAI(chunksResult.chunksData, 'balanced', 30);
        if (processedResult.success) {
          contentToAnalyze = processedResult.originalContent?.text || processedResult.originalContent;
        }
      }
    }

    const summaryResult = await analysisService.performSummaryAnalysis(contentToAnalyze, modelType);
    
    res.status(200).json({
      success: true,
      documentId: documentId,
      summary: summaryResult,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/enhanced-analysis/keywords
 * Extract keywords from document
 */
router.post('/keywords', azureAuth.authenticate, azureAuth.validateOrganizationalAccess, async (req, res) => {
  try {
    const { documentId, documentContent, modelType = 'gpt4o-mini' } = req.body;
    
    let contentToAnalyze = documentContent;
    if (documentId && !documentContent) {
      // Fetch content logic (similar to comprehensive analysis)
      const document = await DocumentMetadata.getDocumentById(documentId);
      if (!document) {
        return res.status(404).json({ success: false, error: 'Document not found' });
      }
      
      const documentMetadata = {
        workspace_id: document.workspace_id,
        document_id: document.document_guid,
        ingestion_source_id: document.ingestion_source_id?.toString()
      };

      const chunksResult = await blobChunksService.getDocumentChunks(documentMetadata);
      if (chunksResult.success) {
        const processedResult = await blobChunksService.processChunksForAI(chunksResult.chunksData, 'balanced', 20);
        if (processedResult.success) {
          contentToAnalyze = processedResult.originalContent?.text || processedResult.originalContent;
        }
      }
    }

    const keywordsResult = await analysisService.performKeywordExtraction(contentToAnalyze, modelType);
    
    res.status(200).json({
      success: true,
      documentId: documentId,
      keywords: keywordsResult,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/enhanced-analysis/categorization
 * Categorize document
 */
router.post('/categorization', azureAuth.authenticate, azureAuth.validateOrganizationalAccess, async (req, res) => {
  try {
    const { documentId, documentContent, modelType = 'gpt4o-mini' } = req.body;
    
    let contentToAnalyze = documentContent;
    if (documentId && !documentContent) {
      // Fetch content logic (similar to comprehensive analysis)
      const document = await DocumentMetadata.getDocumentById(documentId);
      if (!document) {
        return res.status(404).json({ success: false, error: 'Document not found' });
      }
      
      const documentMetadata = {
        workspace_id: document.workspace_id,
        document_id: document.document_guid,
        ingestion_source_id: document.ingestion_source_id?.toString()
      };

      const chunksResult = await blobChunksService.getDocumentChunks(documentMetadata);
      if (chunksResult.success) {
        const processedResult = await blobChunksService.processChunksForAI(chunksResult.chunksData, 'balanced', 20);
        if (processedResult.success) {
          contentToAnalyze = processedResult.originalContent?.text || processedResult.originalContent;
        }
      }
    }

    const categorizationResult = await analysisService.performCategorization(contentToAnalyze, modelType);
    
    res.status(200).json({
      success: true,
      documentId: documentId,
      categorization: categorizationResult,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/enhanced-analysis/sentiment
 * Analyze document sentiment
 */
router.post('/sentiment', azureAuth.authenticate, azureAuth.validateOrganizationalAccess, async (req, res) => {
  try {
    const { documentId, documentContent, modelType = 'gpt4o-mini' } = req.body;
    
    let contentToAnalyze = documentContent;
    if (documentId && !documentContent) {
      // Fetch content logic (similar to comprehensive analysis)
      const document = await DocumentMetadata.getDocumentById(documentId);
      if (!document) {
        return res.status(404).json({ success: false, error: 'Document not found' });
      }
      
      const documentMetadata = {
        workspace_id: document.workspace_id,
        document_id: document.document_guid,
        ingestion_source_id: document.ingestion_source_id?.toString()
      };

      const chunksResult = await blobChunksService.getDocumentChunks(documentMetadata);
      if (chunksResult.success) {
        const processedResult = await blobChunksService.processChunksForAI(chunksResult.chunksData, 'balanced', 20);
        if (processedResult.success) {
          contentToAnalyze = processedResult.originalContent?.text || processedResult.originalContent;
        }
      }
    }

    const sentimentResult = await analysisService.performSentimentAnalysis(contentToAnalyze, modelType);
    
    res.status(200).json({
      success: true,
      documentId: documentId,
      sentiment: sentimentResult,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/enhanced-analysis/export
 * Export analysis results in different formats
 */
router.post('/export', azureAuth.authenticate, azureAuth.validateOrganizationalAccess, async (req, res) => {
  try {
    const { analysisData, format = 'json', filename } = req.body;

    if (!analysisData) {
      return res.status(400).json({
        success: false,
        error: 'Analysis data is required for export'
      });
    }

    const exportResult = await analysisService.exportAnalysisResults(analysisData, format);

    if (!exportResult.success) {
      return res.status(500).json({
        success: false,
        error: exportResult.error
      });
    }

    // Set appropriate headers for file download
    const actualFilename = filename || exportResult.filename;
    res.setHeader('Content-Type', exportResult.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${actualFilename}"`);
    
    res.status(200).send(exportResult.data);

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/enhanced-analysis/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'Enhanced Document Analysis Service',
    status: 'operational',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

module.exports = router;
