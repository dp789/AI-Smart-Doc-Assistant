const express = require('express');
const router = express.Router();
const chatSessionController = require('../controllers/chatSessionController');
const azureAuth = require('../middleware/azureAuth');

/**
 * Chat Session Routes
 * Provides CRUD operations for chat conversations and session management
 */

/**
 * GET /api/chat-sessions
 * Get all conversations for the current user
 * Query params:
 * - include_archived: boolean (default: false) - Include archived conversations
 */
router.get('/', azureAuth.authenticate, azureAuth.validateOrganizationalAccess, async (req, res) => {
    await chatSessionController.getConversations(req, res);
});

/**
 * GET /api/chat-sessions/stats
 * Get conversation statistics for the current user
 */
router.get('/stats', azureAuth.authenticate, azureAuth.validateOrganizationalAccess, async (req, res) => {
    await chatSessionController.getConversationStats(req, res);
});

/**
 * POST /api/chat-sessions/current
 * Get or create current active conversation
 * Body:
 * - chat_title: string (optional) - Title for new conversation
 */
router.post('/current', azureAuth.authenticate, azureAuth.validateOrganizationalAccess, async (req, res) => {
    await chatSessionController.getOrCreateCurrentConversation(req, res);
});

/**
 * POST /api/chat-sessions
 * Create a new chat conversation
 * Body:
 * - chat_title: string (required) - Title of the conversation
 * - initial_message: string (optional) - Initial user message
 */
router.post('/', azureAuth.authenticate, azureAuth.validateOrganizationalAccess, async (req, res) => {
    await chatSessionController.createConversation(req, res);
});

/**
 * GET /api/chat-sessions/:chatId
 * Get a specific conversation by ID
 */
router.get('/:chatId', azureAuth.authenticate, azureAuth.validateOrganizationalAccess, async (req, res) => {
    await chatSessionController.getConversation(req, res);
});

/**
 * PUT /api/chat-sessions/:chatId
 * Update conversation messages and/or title
 * Body:
 * - messages: array (required) - Updated conversation messages
 * - chat_title: string (optional) - Updated conversation title
 */
router.put('/:chatId', azureAuth.authenticate, azureAuth.validateOrganizationalAccess, async (req, res) => {
    await chatSessionController.updateConversation(req, res);
});

/**
 * POST /api/chat-sessions/:chatId/messages
 * Add a message to an existing conversation
 * Body:
 * - role: string (required) - 'user' or 'assistant'
 * - content: string (required) - Message content
 * - metadata: object (optional) - Additional message metadata
 */
router.post('/:chatId/messages', azureAuth.authenticate, azureAuth.validateOrganizationalAccess, async (req, res) => {
    await chatSessionController.addMessage(req, res);
});

/**
 * PATCH /api/chat-sessions/:chatId/archive
 * Archive/deactivate a conversation
 */
router.patch('/:chatId/archive', azureAuth.authenticate, azureAuth.validateOrganizationalAccess, async (req, res) => {
    await chatSessionController.archiveConversation(req, res);
});

/**
 * DELETE /api/chat-sessions/:chatId
 * Delete a conversation permanently
 */
router.delete('/:chatId', azureAuth.authenticate, azureAuth.validateOrganizationalAccess, async (req, res) => {
    await chatSessionController.deleteConversation(req, res);
});

/**
 * Health check endpoint
 */
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Chat sessions service is healthy',
        timestamp: new Date().toISOString(),
        endpoints: {
            'GET /api/chat-sessions': 'Get all conversations for current user',
            'GET /api/chat-sessions/stats': 'Get conversation statistics',
            'POST /api/chat-sessions/current': 'Get or create current active conversation',
            'POST /api/chat-sessions': 'Create new conversation',
            'GET /api/chat-sessions/:chatId': 'Get specific conversation',
            'PUT /api/chat-sessions/:chatId': 'Update conversation',
            'POST /api/chat-sessions/:chatId/messages': 'Add message to conversation',
            'PATCH /api/chat-sessions/:chatId/archive': 'Archive conversation',
            'DELETE /api/chat-sessions/:chatId': 'Delete conversation',
            'GET /api/chat-sessions/health': 'Health check'
        }
    });
});

module.exports = router;
