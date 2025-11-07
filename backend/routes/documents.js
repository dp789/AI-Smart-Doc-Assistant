const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const azureAuth = require('../middleware/azureAuth');
const BlobChunksService = require('../services/blobChunksService');

// Get all documents (defaults to ingestion source 3) - requires authentication
router.get('/:workspaceId', azureAuth.authenticate, azureAuth.validateOrganizationalAccess, documentController.getDocumentsList);

// // Get documents by ingestion source ID - requires authentication
// router.get('/list', azureAuth.authenticate, azureAuth.validateOrganizationalAccess, documentController.getDocumentsList);

// Get document content by document ID - requires authentication
router.get('/:documentId/content', azureAuth.authenticate, azureAuth.validateOrganizationalAccess, documentController.getDocumentContent);

// Get document view URL by document ID - requires authentication (for viewing purposes)
router.get('/:documentId/view', azureAuth.authenticate, azureAuth.validateOrganizationalAccess, documentController.getDocumentViewUrl);



// Get processed chunks for document by document ID - requires authentication
router.get('/:documentId/chunks', azureAuth.authenticate, azureAuth.validateOrganizationalAccess, async (req, res) => {
  try {
    const { documentId } = req.params;
    const { chunkingStrategy = 'balanced', maxChunks = 10 } = req.query;
    
    console.log(`🚀 Retrieving processed chunks for document ${documentId} with strategy: ${chunkingStrategy}`);
    
    // Get document metadata from database
    const DocumentMetadata = require('../models/DocumentMetadata');
    const document = await DocumentMetadata.getDocumentById(documentId);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found',
        documentId
      });
    }

    console.log('📄 Document metadata:', {
      id: document.id,
      fileName: document.file_name,
      documentGuid: document.document_guid,
      workspaceId: document.workspace_id,
      ingestionSourceId: document.ingestion_source_id
    });
    
    // Initialize blob chunks service
    const blobChunksService = new BlobChunksService();
    
    // Build document metadata for blob path construction using database fields
    const documentMetadata = {
      workspace_id: document.workspace_id || req.user?.workspaceId || 'd4b2fbfe-702b-49d4-9b42-41d343c26da5',
      document_id: document.document_guid || document.id,
      ingestion_source_id: document.ingestion_source_id?.toString() || '3',
      document_guid: document.document_guid
    };

    // Construct the expected blob path format
    const expectedBlobPath = `short_chunks/${documentMetadata.workspace_id}_${documentMetadata.document_id}_${documentMetadata.ingestion_source_id}_chunks.json`;
    console.log('📍 Expected blob path:', expectedBlobPath);

    console.log('🔍 Attempting to retrieve chunks with metadata:', documentMetadata);

    // Get chunks from blob storage
    const chunksResult = await blobChunksService.getDocumentChunks(documentMetadata);
    
    if (!chunksResult.success) {
      return res.status(404).json({
        success: false,
        error: `No processed chunks found for document: ${chunksResult.error}`,
        documentId,
        expectedPath: expectedBlobPath,
        suggestion: 'Document may need to be reprocessed to generate chunks'
      });
    }

    // Process chunks for AI consumption
    const processedResult = await blobChunksService.processChunksForAI(
      chunksResult.chunksData,
      chunkingStrategy,
      maxChunks
    );

    if (!processedResult.success) {
      return res.status(500).json({
        success: false,
        error: `Failed to process chunks: ${processedResult.error}`,
        documentId
      });
    }
    
    // Get chunks statistics
    const chunksStats = blobChunksService.getChunksStats(processedResult.chunks);

    console.log('✅ Successfully retrieved and processed chunks');
    
    const result = {
      success: true,
      documentId,
      fileName: document.file_name,
      documentGuid: document.document_guid,
      originalContent: processedResult.originalContent,
      chunks: processedResult.chunks,
      processingInfo: {
        ...processedResult.processingInfo,
        blobPath: chunksResult.blobPath,
        expectedPath: expectedBlobPath,
        stats: chunksStats
      },
      metadata: {
        blobSource: true,
        workspaceId: documentMetadata.workspace_id,
        ingestionSourceId: documentMetadata.ingestion_source_id,
        chunkingStrategy,
        maxChunks,
        retrievedAt: new Date().toISOString(),
        ...chunksResult.metadata
      }
    };
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ Error retrieving processed chunks:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      documentId: req.params.documentId,
      errorType: 'chunks_retrieval_error'
    });
  }
});

// Update document ingestion status - requires authentication
router.put('/:documentId/ingestion-status', azureAuth.authenticate, azureAuth.validateOrganizationalAccess, documentController.updateIngestionStatus);

// Update document metadata - requires authentication
router.put('/:documentId/metadata', azureAuth.authenticate, azureAuth.validateOrganizationalAccess, documentController.updateDocumentMetadata);

// Debug blob storage - requires authentication
router.get('/debug/:documentId?', azureAuth.authenticate, azureAuth.validateOrganizationalAccess, documentController.debugBlobStorage);

// Process document for AI - DEPRECATED: Use GET /:documentId/chunks instead
// This route redirects to the new chunks endpoint for backward compatibility
router.post('/:documentId/process-for-ai', azureAuth.authenticate, azureAuth.validateOrganizationalAccess, async (req, res) => {
  try {
    const { documentId } = req.params;
    const { chunkingStrategy = 'balanced', maxChunks = 10 } = req.body;
    
    console.log(`⚠️ DEPRECATED: /process-for-ai endpoint called. Use GET /chunks instead.`);
    console.log(`🔄 Redirecting to chunks endpoint for document ${documentId} with strategy: ${chunkingStrategy}`);
    
    // Redirect to the new chunks endpoint
    const redirectUrl = `/api/documents/${documentId}/chunks?chunkingStrategy=${chunkingStrategy}&maxChunks=${maxChunks}`;
    
    return res.status(301).json({
      success: false,
      deprecated: true,
      message: 'This endpoint is deprecated. Use GET /api/documents/{id}/chunks instead.',
      redirectTo: redirectUrl,
      migration: {
        old: `POST /api/documents/${documentId}/process-for-ai`,
        new: `GET /api/documents/${documentId}/chunks?chunkingStrategy=${chunkingStrategy}&maxChunks=${maxChunks}`,
        method: 'GET'
      }
    });
    
  } catch (error) {
    console.error('❌ Error in deprecated process-for-ai endpoint:', error);
    res.status(500).json({
      success: false,
      deprecated: true,
      error: 'Deprecated endpoint error. Please use GET /api/documents/{id}/chunks instead.',
      migration: {
        newEndpoint: `GET /api/documents/${req.params.documentId}/chunks`,
        documentation: 'See ENHANCED_BLOB_CHUNKS_SOLUTION.md for migration guide'
      }
    });
  }
});

// REMOVED OLD IMPLEMENTATION - Use /chunks endpoint instead
/*
// Old implementation code was removed to avoid confusion
// All functionality moved to GET /:documentId/chunks endpoint
*/



// Test endpoint for documents without authentication (for development/testing)
router.get('/test/ingestion-source/:ingestionSourceId', documentController.getDocumentsList);

// Test endpoint for document content without authentication (for development/testing)
router.get('/test/ingestion-source/:ingestionSourceId/:documentId/content', documentController.getDocumentContent);

// Test endpoint for debug without authentication (for development/testing)
router.get('/test/debug/:documentId?', documentController.debugBlobStorage);

module.exports = router; 