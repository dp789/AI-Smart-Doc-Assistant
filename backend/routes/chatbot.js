const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');
const azureAuth = require('../middleware/azureAuth');
const axios = require('axios');

/**
 * Chatbot Routes
 * Provides AI-powered chat functionality with document context
 */

/**
 * POST /api/chatbot
 * Process chat message with document context
 * 
 * Body:
 * - message: string (required) - The user's message
 * - workspace_id: string (required) - Workspace identifier
 * - document_category: string (optional) - Document category filter
 * - conversation_history: array (optional) - Previous conversation messages
 * - max_context_chunks: number (optional) - Max document chunks to include
 * - temperature: number (optional) - AI response creativity (0-1)
 * - model: string (optional) - AI model to use
 * - include_sources: boolean (optional) - Whether to include source references
 */
router.post('/', azureAuth.authenticate, azureAuth.validateOrganizationalAccess, async (req, res) => {
  await chatbotController.processChatMessage(req, res);
});

/**
 * POST /api/chatbot/test
 * Test chatbot without authentication (for testing purposes)
 * Same parameters as main chatbot endpoint
 */
router.post('/test', async (req, res) => {
  console.log('🧪 Testing chatbot endpoint (no auth)');
  await chatbotController.processChatMessage(req, res);
});

/**
 * GET /api/chatbot/test-connection
 * Test chatbot service connection
 */
router.get('/test-connection', azureAuth.authenticate, azureAuth.validateOrganizationalAccess, async (req, res) => {
  await chatbotController.testConnection(req, res);
});

/**
 * GET /api/chatbot/test-connection
 * Test chatbot service connection without authentication
 */
router.get('/test-connection-public', async (req, res) => {
  console.log('🧪 Testing chatbot connection (no auth)');
  await chatbotController.testConnection(req, res);
});

/**
 * GET /api/chatbot/models
 * Get available AI models
 */
router.get('/models', azureAuth.authenticate, azureAuth.validateOrganizationalAccess, async (req, res) => {
  await chatbotController.getAvailableModels(req, res);
});

/**
 * GET /api/chatbot/models
 * Get available AI models without authentication
 */
router.get('/models-public', async (req, res) => {
  console.log('📋 Getting available models (no auth)');
  await chatbotController.getAvailableModels(req, res);
});

/**
 * POST /api/my-chat-bot
 * Proxy to external chatbot API at localhost:7071
 * No authentication required for testing
 */
router.post('/my-chat-bot', async (req, res) => {
  try {
    console.log('🤖 Proxying chat request to external API:', req.body);
    
    const {
      message,
      workspace_id,
      document_category,
      conversation_history,
      filters = {},
      max_context_chunks,
      temperature,
      model,
      include_sources,
      enable_global_search,
      global_search_requested
    } = req.body;

    console.log('🔍 Filters being sent:', filters);

    // Validate required parameters
    if (!message || !workspace_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: message, workspace_id'
      });
    }

    // Call the external API
    const response = await axios.post('https://smartdocs-docxingestion.azurewebsites.net/api/chatbot?code=REDACTED_AZURE_FUNCTION_KEY', {
      message,
      workspace_id,
      document_category,
      conversation_history,
      filters,
      max_context_chunks,
      temperature,
      model,
      include_sources,
      enable_global_search,
      global_search_requested
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 second timeout
    });

    
    // Extract data from the external API response structure
    const externalData = response.data;
    const chatbotResponse = externalData.chatbot_response || {};
    const searchContext = externalData.search_context || {};
    const sources = externalData.sources || [];
    const metadata = externalData.metadata || {};
    
    // Return the formatted response
    res.json({
      success: true,
      response: {
        text: chatbotResponse.response?.text || chatbotResponse.response || 'No response generated',
        formatted_text: chatbotResponse.response?.formatted_text || chatbotResponse.response?.text || 'No response generated',
        type: chatbotResponse.response?.type || 'text',
        key_points: chatbotResponse.response?.key_points || [],
        code_snippets: chatbotResponse.response?.code_snippets || [],
        word_count: chatbotResponse.response?.word_count || 0,
        has_lists: chatbotResponse.response?.has_lists || false,
        has_code: chatbotResponse.response?.has_code || false,
        has_headers: chatbotResponse.response?.has_headers || false
      },
      model_used: chatbotResponse.model_used || model,
      temperature: chatbotResponse.temperature || 0.7,
      context_chunks_used: chatbotResponse.context_chunks_used || 0,
      total_context_length: chatbotResponse.total_context_length || 0,
      conversation_turn: chatbotResponse.conversation_turn || 1,
      search_context: {
        query: searchContext.query || message,
        workspace_id: searchContext.workspace_id || workspace_id,
        document_category: searchContext.document_category || document_category,
        chunks_found: searchContext.chunks_found || 0,
        chunks_used: searchContext.chunks_used || 0,
        average_relevance_score: searchContext.average_relevance_score || 0,
        summary_requested: searchContext.summary_requested || ''
      },
      sources: sources.map(source => ({
        filename: source.filename || '',
        document_id: source.document_id || '',
        chunk_index: source.chunk_index || 0,
        relevance_score: source.relevance_score || 0,
        page_number: source.page_number || 0
      })),
      metadata: {
        processing_timestamp: metadata.processing_timestamp || new Date().toISOString(),
        search_success: metadata.search_success || false,
        ai_generation_success: metadata.ai_generation_success || false,
        function_app: metadata.function_app || 'unknown'
      },
      timestamp: new Date().toISOString(),
      external_api: true
    });

  } catch (error) {
    console.error('❌ External API proxy error:', error);
    
    let errorMessage = '';
    if (error.code === 'ECONNREFUSED') {
      errorMessage = 'External API server not running on port 7071';
    } else if (error.response?.status === 404) {
      console.log('External API endpoint not found');
      errorMessage = 'External API endpoint not found';
    } else if (error.response?.status >= 500) {
      errorMessage = `External API server error: ${error.response.status}`;
    } else {
      errorMessage = error.response?.data?.message || error.message || 'Failed to connect to external API';
    }
    
    res.status(500).json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Chatbot service is healthy',
    timestamp: new Date().toISOString(),
    endpoints: {
      'POST /api/chatbot': 'Process chat message (authenticated)',
      'POST /api/chatbot/test': 'Process chat message (no auth)',
      'POST /api/my-chat-bot': 'Proxy to external API (localhost:7071)',
      'GET /api/chatbot/test-connection': 'Test connection (authenticated)',
      'GET /api/chatbot/test-connection-public': 'Test connection (no auth)',
      'GET /api/chatbot/models': 'Get available models (authenticated)',
      'GET /api/chatbot/models-public': 'Get available models (no auth)',
      'GET /api/chatbot/health': 'Health check'
    }
  });
});

module.exports = router;
