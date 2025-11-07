const express = require('express');
const router = express.Router();
const axios = require('axios');
const azureAuth = require('../middleware/azureAuth');

/**
 * N8N RAG Routes
 * Proxy routes for n8n workflow integration with Pinecone RAG
 */

// N8N Webhook URL
const N8N_WEBHOOK_URL = 'https://n8n.srv810548.hstgr.cloud/webhook/summarize-documents';

/**
 * POST /api/n8n-rag/chat
 * Proxy chat requests to n8n RAG workflow
 * 
 * Body:
 * - message: string (required) - User's message
 * - userId: string (required) - User/Workspace ID
 * - context: array (optional) - Conversation history
 * - documentIds: array (optional) - Specific document IDs
 * - metadata: object (optional) - Additional metadata
 */
router.post('/chat', async (req, res) => {
  try {
    console.log('🤖 Proxying request to n8n RAG workflow...');
    
    const {
      message,
      userId,
      context = [],
      documentIds = [],
      metadata = {}
    } = req.body;

    // Validate required parameters
    if (!message || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: message, userId'
      });
    }

    console.log('📨 Message:', message);
    console.log('👤 User ID:', userId);
    console.log('💬 Context messages:', context.length);
    console.log('📄 Document IDs:', documentIds.length);

    // Prepare payload for n8n
    const n8nPayload = {
      message,
      userId,
      context,
      documentIds,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
        source: 'SmartDocs-Backend-Proxy'
      }
    };

    console.log('🚀 Calling n8n webhook:', N8N_WEBHOOK_URL);

    // Call n8n webhook
    const response = await axios.post(N8N_WEBHOOK_URL, n8nPayload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 60000 // 60 second timeout for complex queries
    });

    console.log('✅ Response received from n8n workflow');

    // Process and standardize the response
    const processedResponse = processN8NResponse(response.data);

    res.json({
      success: true,
      ...processedResponse,
      timestamp: new Date().toISOString(),
      via_proxy: true
    });

  } catch (error) {
    console.error('❌ Error proxying to n8n workflow:', error);
    
    let errorMessage = '';
    let errorStatus = 500;

    if (error.response) {
      // n8n responded with error
      errorMessage = error.response.data?.error || error.response.data?.message || 'n8n workflow error';
      errorStatus = error.response.status;
      console.error('n8n error response:', error.response.data);
    } else if (error.request) {
      // No response from n8n
      errorMessage = 'No response from n8n workflow. Check if workflow is active.';
      console.error('No response received from n8n');
    } else {
      // Request setup error
      errorMessage = error.message || 'Failed to send request to n8n workflow';
    }
    
    res.status(errorStatus).json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
      via_proxy: true
    });
  }
});

/**
 * POST /api/n8n-rag/test
 * Test n8n webhook connection
 */
router.post('/test', async (req, res) => {
  try {
    console.log('🧪 Testing n8n webhook connection...');
    
    const testPayload = {
      message: 'Hello, this is a test message.',
      userId: 'test-user',
      context: [],
      metadata: { test: true }
    };

    const response = await axios.post(N8N_WEBHOOK_URL, testPayload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });

    console.log('✅ n8n webhook is responding');

    res.json({
      success: true,
      message: 'n8n webhook is active and responding',
      webhookUrl: N8N_WEBHOOK_URL,
      response: response.data,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ n8n webhook connection test failed:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'n8n webhook is not responding',
      webhookUrl: N8N_WEBHOOK_URL,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/n8n-rag/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'n8n RAG proxy service is healthy',
    webhookUrl: N8N_WEBHOOK_URL,
    timestamp: new Date().toISOString(),
    endpoints: {
      'POST /api/n8n-rag/chat': 'Proxy chat request to n8n workflow',
      'POST /api/n8n-rag/test': 'Test n8n webhook connection',
      'GET /api/n8n-rag/health': 'Health check'
    }
  });
});

/**
 * Helper function to process various n8n response formats
 */
function processN8NResponse(data) {
  // Format 1: Direct response with 'reply' field
  if (data.reply) {
    return {
      response: data.reply,
      sources: data.sources || [],
      metadata: data.metadata || {}
    };
  }

  // Format 2: Response with 'answer' field (from Question Answer Chain)
  if (data.answer) {
    return {
      response: data.answer,
      sources: data.sources || data.sourceDocuments || [],
      metadata: data.metadata || {}
    };
  }

  // Format 3: Response with 'output' field
  if (data.output) {
    const output = typeof data.output === 'string' ? data.output : JSON.stringify(data.output);
    return {
      response: output,
      sources: data.sources || [],
      metadata: data.metadata || {}
    };
  }

  // Format 4: Response with 'text' field
  if (data.text) {
    return {
      response: data.text,
      sources: data.sources || [],
      metadata: data.metadata || {}
    };
  }

  // Format 5: Direct string response
  if (typeof data === 'string') {
    return {
      response: data,
      sources: [],
      metadata: {}
    };
  }

  // Format 6: Complex object - try to extract meaningful content
  if (typeof data === 'object' && Object.keys(data).length > 0) {
    // Try to find any text-like field
    const possibleTextFields = ['result', 'message', 'content', 'response'];
    for (const field of possibleTextFields) {
      if (data[field]) {
        return {
          response: data[field],
          sources: data.sources || [],
          metadata: data.metadata || {}
        };
      }
    }

    // Last resort: stringify the entire object
    return {
      response: JSON.stringify(data, null, 2),
      sources: [],
      metadata: {}
    };
  }

  // If nothing matches, throw error
  throw new Error('Unable to parse response from n8n workflow');
}

module.exports = router;
