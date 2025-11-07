/**
 * Test Enhanced Analysis Routes (NO AUTHENTICATION REQUIRED)
 * Temporary routes for testing AI analysis functionality without auth
 * Remove these routes in production!
 */

const express = require('express');
const router = express.Router();
const EnhancedDocumentAnalysisService = require('../services/enhancedDocumentAnalysisService');
const BlobChunksService = require('../services/blobChunksService');

const analysisService = new EnhancedDocumentAnalysisService();
const blobChunksService = new BlobChunksService();

/**
 * POST /api/test-enhanced-analysis/comprehensive
 * Test comprehensive analysis without authentication
 */
router.post('/comprehensive', async (req, res) => {
  try {
    console.log('🧪 TEST: Starting comprehensive document analysis (no auth)...');
    
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

    // If documentId is provided, try to fetch content from chunks
    if (documentId && !documentContent) {
      console.log(`🧪 TEST: Fetching content for document: ${documentId}`);
      
      try {
        // Use a hardcoded document metadata for testing
        const testDocumentMetadata = {
          workspace_id: 'd4b2fbfe-702b-49d4-9b42-41d343c26da5',
          document_id: '38d492da-a38c-468a-aaca-118760d099d6', 
          ingestion_source_id: '3'
        };

        console.log('🧪 TEST: Using test document metadata:', testDocumentMetadata);

        const chunksResult = await blobChunksService.getDocumentChunks(testDocumentMetadata);
        if (chunksResult.success) {
          const processedResult = await blobChunksService.processChunksForAI(
            chunksResult.chunksData,
            'balanced',
            50
          );

          if (processedResult.success) {
            contentToAnalyze = processedResult.originalContent?.text || processedResult.originalContent;
            console.log('🧪 TEST: Successfully retrieved document content from chunks');
          }
        } else {
          console.log('🧪 TEST: Could not retrieve chunks, using fallback content');
          contentToAnalyze = "This is a comprehensive business strategy document outlining digital transformation initiatives for 2024. The document covers strategic planning, technology implementation, market analysis, and operational procedures. Key focus areas include Digital Innovation and AI Implementation, Customer Experience Enhancement, Market Expansion Strategies, Operational Excellence Programs, Risk Management and Cybersecurity, and Sustainability and ESG Initiatives. The document emphasizes data-driven decision making, agile methodologies, and innovative approaches to business challenges. Financial projections indicate strong growth potential with proper execution of outlined strategies.";
        }
      } catch (chunkError) {
        console.log('🧪 TEST: Chunk retrieval failed, using fallback content:', chunkError.message);
        contentToAnalyze = "This is a comprehensive business strategy document outlining digital transformation initiatives for 2024. The document covers strategic planning, technology implementation, market analysis, and operational procedures. Key focus areas include Digital Innovation and AI Implementation, Customer Experience Enhancement, Market Expansion Strategies, Operational Excellence Programs, Risk Management and Cybersecurity, and Sustainability and ESG Initiatives. The document emphasizes data-driven decision making, agile methodologies, and innovative approaches to business challenges. Financial projections indicate strong growth potential with proper execution of outlined strategies.";
      }
    }

    if (typeof contentToAnalyze === 'object') {
      contentToAnalyze = JSON.stringify(contentToAnalyze);
    }

    if (!contentToAnalyze || contentToAnalyze.length < 50) {
      return res.status(400).json({
        success: false,
        error: 'Document content is too short for meaningful analysis',
        contentLength: contentToAnalyze ? contentToAnalyze.length : 0
      });
    }

    // Perform comprehensive analysis
    console.log(`🧪 TEST: Analyzing content (${contentToAnalyze.length} characters)...`);
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
      documentId: documentId || 'test-document',
      analysisId: analysisResult.analysisId,
      timestamp: new Date().toISOString(),
      analysis: analysisResult.data,
      processingTime: analysisResult.processingTime,
      contentLength: contentToAnalyze.length,
      testMode: true
    };

    console.log('🧪 TEST: Comprehensive analysis completed successfully');
    res.status(200).json(response);

  } catch (error) {
    console.error('🧪 TEST: Comprehensive analysis failed:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during analysis',
      details: error.message,
      timestamp: new Date().toISOString(),
      testMode: true
    });
  }
});

/**
 * POST /api/test-enhanced-analysis/summary
 * Test summary analysis without authentication
 */
router.post('/summary', async (req, res) => {
  try {
    const { documentContent, modelType = 'gpt4o-mini' } = req.body;
    
    const testContent = documentContent || "This is a comprehensive business strategy document outlining digital transformation initiatives for 2024. The document covers strategic planning, technology implementation, market analysis, and operational procedures. Key focus areas include Digital Innovation and AI Implementation, Customer Experience Enhancement, Market Expansion Strategies, Operational Excellence Programs, Risk Management and Cybersecurity, and Sustainability and ESG Initiatives.";
    
    const summaryResult = await analysisService.performSummaryAnalysis(testContent, modelType);
    
    res.status(200).json({
      success: true,
      summary: summaryResult,
      timestamp: new Date().toISOString(),
      testMode: true
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      testMode: true
    });
  }
});

module.exports = router;
