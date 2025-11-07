const ChatConversation = require('../models/ChatConversation');

class ChatSessionController {
    constructor() {
        this.chatConversation = ChatConversation;
    }

    /**
     * Create a new chat conversation
     * POST /api/chat-sessions
     */
    async createConversation(req, res) {
        try {
            const { chat_title, initial_message, workspace_id, chat_json } = req.body;

            if (!workspace_id) {
                return res.status(400).json({
                    success: false,
                    error: 'workspace_id is required in request body'
                });
            }

            if (!chat_title) {
                return res.status(400).json({
                    success: false,
                    error: 'Chat title is required'
                });
            }

            // Use provided chat_json if available, otherwise initialize with welcome message or initial message
            let initialMessages;
            if (chat_json && Array.isArray(chat_json) && chat_json.length > 0) {
                // Use the provided chat_json from frontend
                initialMessages = chat_json;
                console.log('📝 Using provided chat_json with', chat_json.length, 'messages');
            } else if (initial_message) {
                // Fallback to initial_message
                initialMessages = [
                    { role: 'user', content: initial_message, timestamp: new Date().toISOString() }
                ];
            } else {
                // Default welcome message
                initialMessages = [
                    { 
                        role: 'assistant', 
                        content: "🔬 Welcome to the Research Document AI Assistant! I specialize in analyzing, summarizing, and extracting insights from your research documents. Upload documents, ask questions, or use semantic search to uncover valuable information. How can I assist your research today?", 
                        timestamp: new Date().toISOString() 
                    }
                ];
            }

            const conversationData = {
                workspace_id,
                chat_title,
                chat_json: initialMessages
            };

            const result = await this.chatConversation.createConversation(conversationData);

            if (result.success) {
                res.status(201).json({
                    success: true,
                    data: result.data,
                    message: 'Conversation created successfully'
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: result.error
                });
            }
        } catch (error) {
            console.error('Error in createConversation:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Get all conversations for the current user
     * GET /api/chat-sessions
     */
    async getConversations(req, res) {
        try {
            const { workspace_id, include_archived = false } = req.query;

            if (!workspace_id) {
                return res.status(400).json({
                    success: false,
                    error: 'workspace_id is required in query parameters'
                });
            }

            const result = await this.chatConversation.getConversationsByUser(
                workspace_id, 
                !include_archived
            );

            if (result.success) {
                res.json({
                    success: true,
                    data: result.data,
                    count: result.data.length
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: result.error
                });
            }
        } catch (error) {
            console.error('Error in getConversations:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Get a specific conversation by ID
     * GET /api/chat-sessions/:chatId
     */
    async getConversation(req, res) {
        try {
            const { chatId } = req.params;
            const { workspace_id } = req.query;

            if (!workspace_id) {
                return res.status(400).json({
                    success: false,
                    error: 'workspace_id is required in query parameters'
                });
            }

            if (!chatId) {
                return res.status(400).json({
                    success: false,
                    error: 'Chat ID is required'
                });
            }

            const result = await this.chatConversation.getConversationById(chatId, workspace_id);

            if (result.success) {
                res.json({
                    success: true,
                    data: result.data
                });
            } else {
                res.status(404).json({
                    success: false,
                    error: result.error
                });
            }
        } catch (error) {
            console.error('Error in getConversation:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Update conversation messages
     * PUT /api/chat-sessions/:chatId
     */
    async updateConversation(req, res) {
        try {
            const { chatId } = req.params;
            const { messages, chat_title, workspace_id } = req.body;

            if (!workspace_id) {
                return res.status(400).json({
                    success: false,
                    error: 'workspace_id is required in request body'
                });
            }

            if (!chatId) {
                return res.status(400).json({
                    success: false,
                    error: 'Chat ID is required'
                });
            }

            if (!messages || !Array.isArray(messages)) {
                return res.status(400).json({
                    success: false,
                    error: 'Messages array is required'
                });
            }

            const result = await this.chatConversation.updateConversation(
                chatId, 
                workspace_id, 
                messages, 
                chat_title
            );

            if (result.success) {
                res.json({
                    success: true,
                    data: result.data,
                    message: 'Conversation updated successfully'
                });
            } else {
                res.status(404).json({
                    success: false,
                    error: result.error
                });
            }
        } catch (error) {
            console.error('Error in updateConversation:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Add a message to an existing conversation
     * POST /api/chat-sessions/:chatId/messages
     */
    async addMessage(req, res) {
        try {
            const { chatId } = req.params;
            const { role, content, metadata = {}, workspace_id } = req.body;

            if (!workspace_id) {
                return res.status(400).json({
                    success: false,
                    error: 'workspace_id is required in request body'
                });
            }

            if (!chatId) {
                return res.status(400).json({
                    success: false,
                    error: 'Chat ID is required'
                });
            }

            if (!role || !content) {
                return res.status(400).json({
                    success: false,
                    error: 'Role and content are required'
                });
            }

            const message = {
                role,
                content,
                timestamp: new Date().toISOString(),
                metadata
            };

            console.log('📝 Adding message to conversation:', {
                chatId,
                workspace_id,
                message: {
                    role: message.role,
                    content: message.content.substring(0, 50) + '...',
                    timestamp: message.timestamp
                }
            });

            const result = await this.chatConversation.addMessageToConversation(
                chatId, 
                workspace_id, 
                message
            );

            if (result.success) {
                console.log('✅ Message added successfully to conversation:', chatId);
                console.log('📋 Updated conversation has', result.data.chat_json?.length || 0, 'messages');
                res.json({
                    success: true,
                    data: result.data,
                    message: 'Message added successfully'
                });
            } else {
                console.error('❌ Failed to add message to conversation:', result.error);
                res.status(404).json({
                    success: false,
                    error: result.error
                });
            }
        } catch (error) {
            console.error('Error in addMessage:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Archive a conversation
     * PATCH /api/chat-sessions/:chatId/archive
     */
    async archiveConversation(req, res) {
        try {
            const { chatId } = req.params;
            const { workspace_id } = req.query;

            if (!workspace_id) {
                return res.status(400).json({
                    success: false,
                    error: 'workspace_id is required in query parameters'
                });
            }

            if (!chatId) {
                return res.status(400).json({
                    success: false,
                    error: 'Chat ID is required'
                });
            }

            const result = await this.chatConversation.archiveConversation(chatId, workspace_id);

            if (result.success) {
                res.json({
                    success: true,
                    message: result.message
                });
            } else {
                res.status(404).json({
                    success: false,
                    error: result.error
                });
            }
        } catch (error) {
            console.error('Error in archiveConversation:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Delete a conversation permanently
     * DELETE /api/chat-sessions/:chatId
     */
    async deleteConversation(req, res) {
        try {
            const { chatId } = req.params;
            const { workspace_id } = req.query;

            if (!workspace_id) {
                return res.status(400).json({
                    success: false,
                    error: 'workspace_id is required in query parameters'
                });
            }

            if (!chatId) {
                return res.status(400).json({
                    success: false,
                    error: 'Chat ID is required'
                });
            }

            const result = await this.chatConversation.deleteConversation(chatId, workspace_id);

            if (result.success) {
                res.json({
                    success: true,
                    message: result.message
                });
            } else {
                res.status(404).json({
                    success: false,
                    error: result.error
                });
            }
        } catch (error) {
            console.error('Error in deleteConversation:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Get conversation statistics
     * GET /api/chat-sessions/stats
     */
    async getConversationStats(req, res) {
        try {
            const { workspace_id } = req.query;

            if (!workspace_id) {
                return res.status(400).json({
                    success: false,
                    error: 'workspace_id is required in query parameters'
                });
            }

            const result = await this.chatConversation.getConversationStats(workspace_id);

            if (result.success) {
                res.json({
                    success: true,
                    data: result.data
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: result.error
                });
            }
        } catch (error) {
            console.error('Error in getConversationStats:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Create or get current active conversation
     * POST /api/chat-sessions/current
     */
    async getOrCreateCurrentConversation(req, res) {
        try {
            const { chat_title = 'New Chat Session', workspace_id } = req.body;

            if (!workspace_id) {
                return res.status(400).json({
                    success: false,
                    error: 'workspace_id is required in request body'
                });
            }

            // First, try to get the most recent active conversation
            const conversationsResult = await this.chatConversation.getConversationsByUser(workspace_id, true);
            
            if (conversationsResult.success && conversationsResult.data.length > 0) {
                // Return the most recent active conversation
                res.json({
                    success: true,
                    data: conversationsResult.data[0],
                    is_existing: true
                });
            } else {
                // Create a new conversation
                const conversationData = {
                    workspace_id,
                    chat_title,
                    chat_json: [
                        { 
                            role: 'assistant', 
                            content: "🔬 Welcome to the Research Document AI Assistant! I specialize in analyzing, summarizing, and extracting insights from your research documents. Upload documents, ask questions, or use semantic search to uncover valuable information. How can I assist your research today?", 
                            timestamp: new Date().toISOString() 
                        }
                    ]
                };

                const result = await this.chatConversation.createConversation(conversationData);

                if (result.success) {
                    res.status(201).json({
                        success: true,
                        data: result.data,
                        is_existing: false,
                        message: 'New conversation created'
                    });
                } else {
                    res.status(500).json({
                        success: false,
                        error: result.error
                    });
                }
            }
        } catch (error) {
            console.error('Error in getOrCreateCurrentConversation:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
}

module.exports = new ChatSessionController();
