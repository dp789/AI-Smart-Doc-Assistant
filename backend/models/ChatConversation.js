const sql = require('mssql');
const dbConfig = require('../db/config');

class ChatConversation {
    constructor() {
        this.pool = null;
    }

    async getPool() {
        if (!this.pool) {
            this.pool = await sql.connect(dbConfig);
        }
        return this.pool;
    }

    /**
     * Create a new chat conversation
     * @param {Object} conversationData - The conversation data
     * @param {string} conversationData.workspace_id - User ID from UserSessions
     * @param {string} conversationData.chat_title - Title of the conversation
     * @param {Array} conversationData.chat_json - Array of conversation messages
     * @returns {Object} Created conversation
     */
    async createConversation(conversationData) {
        try {
            const pool = await this.getPool();
            const { workspace_id, chat_title, chat_json } = conversationData;
            
            const request = pool.request();
            request.input('workspace_id', sql.NVarChar(255), workspace_id);
            request.input('chat_title', sql.NVarChar(500), chat_title);
            request.input('chat_json', sql.NVarChar(sql.MAX), JSON.stringify(chat_json));
            
            await request.query(`
                INSERT INTO dbo.chat_conversation (workspace_id, chat_title, chat_json)
                VALUES (@workspace_id, @chat_title, @chat_json)
            `);
            
            // Get the inserted record using SCOPE_IDENTITY()
            const getResult = await pool.request()
                .input('workspace_id', sql.NVarChar(255), workspace_id)
                .input('chat_title', sql.NVarChar(500), chat_title)
                .query(`
                    SELECT TOP 1 * FROM dbo.chat_conversation 
                    WHERE workspace_id = @workspace_id AND chat_title = @chat_title
                    ORDER BY created_at DESC
                `);
            
            return {
                success: true,
                data: getResult.recordset[0]
            };
        } catch (error) {
            console.error('Error creating conversation:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get all conversations for a user
     * @param {string} workspace_id - User ID
     * @param {boolean} activeOnly - Whether to return only active conversations
     * @returns {Object} List of conversations
     */
    async getConversationsByUser(workspace_id, activeOnly = true) {
        try {
            const pool = await this.getPool();
            const request = pool.request();
            request.input('workspace_id', sql.NVarChar(255), workspace_id);
            
            let query = `
                SELECT 
                    chat_id,
                    workspace_id,
                    chat_title,
                    chat_json,
                    is_active,
                    created_at,
                    updated_at
                FROM dbo.chat_conversation 
                WHERE workspace_id = @workspace_id
            `;
            
            if (activeOnly) {
                query += ' AND is_active = 1';
            }
            
            query += ' ORDER BY updated_at DESC';
            
            const result = await request.query(query);
            
            // Parse chat_json for each conversation
            const conversations = result.recordset.map(conv => ({
                ...conv,
                chat_json: JSON.parse(conv.chat_json || '[]')
            }));
            
            return {
                success: true,
                data: conversations
            };
        } catch (error) {
            console.error('Error getting conversations:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get a specific conversation by ID
     * @param {string} chat_id - Conversation ID
     * @param {string} workspace_id - User ID (for security)
     * @returns {Object} Conversation data
     */
    async getConversationById(chat_id, workspace_id) {
        try {
            const pool = await this.getPool();
            const request = pool.request();
            request.input('chat_id', sql.UniqueIdentifier, chat_id);
            request.input('workspace_id', sql.NVarChar(255), workspace_id);
            
            const result = await request.query(`
                SELECT 
                    chat_id,
                    workspace_id,
                    chat_title,
                    chat_json,
                    is_active,
                    created_at,
                    updated_at
                FROM dbo.chat_conversation 
                WHERE chat_id = @chat_id AND workspace_id = @workspace_id
            `);
            
            if (result.recordset.length === 0) {
                return {
                    success: false,
                    error: 'Conversation not found'
                };
            }
            
            const conversation = result.recordset[0];
            conversation.chat_json = JSON.parse(conversation.chat_json || '[]');
            
            return {
                success: true,
                data: conversation
            };
        } catch (error) {
            console.error('Error getting conversation:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Update conversation messages
     * @param {string} chat_id - Conversation ID
     * @param {string} workspace_id - User ID (for security)
     * @param {Array} chat_json - Updated conversation messages
     * @param {string} chat_title - Optional updated title
     * @returns {Object} Updated conversation
     */
    async updateConversation(chat_id, workspace_id, chat_json, chat_title = null) {
        try {
            const pool = await this.getPool();
            const request = pool.request();
            request.input('chat_id', sql.UniqueIdentifier, chat_id);
            request.input('workspace_id', sql.NVarChar(255), workspace_id);
            request.input('chat_json', sql.NVarChar(sql.MAX), JSON.stringify(chat_json));
            
            let query = `
                UPDATE dbo.chat_conversation 
                SET chat_json = @chat_json, updated_at = GETUTCDATE()
            `;
            
            if (chat_title) {
                request.input('chat_title', sql.NVarChar(500), chat_title);
                query += ', chat_title = @chat_title';
            }
            
            query += `
                WHERE chat_id = @chat_id AND workspace_id = @workspace_id
            `;
            
            const result = await request.query(query);
            
            if (result.rowsAffected[0] === 0) {
                return {
                    success: false,
                    error: 'Conversation not found or not updated'
                };
            }
            
            // Get the updated record
            const getResult = await pool.request()
                .input('chat_id', sql.UniqueIdentifier, chat_id)
                .input('workspace_id', sql.NVarChar(255), workspace_id)
                .query(`
                    SELECT * FROM dbo.chat_conversation 
                    WHERE chat_id = @chat_id AND workspace_id = @workspace_id
                `);
            
            const conversation = getResult.recordset[0];
            conversation.chat_json = JSON.parse(conversation.chat_json || '[]');
            
            return {
                success: true,
                data: conversation
            };
        } catch (error) {
            console.error('Error updating conversation:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Add a message to an existing conversation
     * @param {string} chat_id - Conversation ID
     * @param {string} workspace_id - User ID (for security)
     * @param {Object} message - Message to add
     * @returns {Object} Updated conversation
     */
    async addMessageToConversation(chat_id, workspace_id, message) {
        try {
            console.log('📝 Model: Adding message to conversation:', chat_id);
            
            // First get the current conversation
            const currentConv = await this.getConversationById(chat_id, workspace_id);
            if (!currentConv.success) {
                console.error('❌ Model: Failed to get current conversation:', currentConv.error);
                return currentConv;
            }
            
            console.log('📝 Model: Current conversation has', currentConv.data.chat_json?.length || 0, 'messages');
            
            // Add the new message to the conversation
            const updatedMessages = [...currentConv.data.chat_json, message];
            
            console.log('📝 Model: Updated messages array has', updatedMessages.length, 'messages');
            
            // Update the conversation
            const result = await this.updateConversation(chat_id, workspace_id, updatedMessages);
            
            if (result.success) {
                console.log('✅ Model: Successfully updated conversation with', result.data.chat_json?.length || 0, 'messages');
            } else {
                console.error('❌ Model: Failed to update conversation:', result.error);
            }
            
            return result;
        } catch (error) {
            console.error('Error adding message to conversation:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Archive/deactivate a conversation
     * @param {string} chat_id - Conversation ID
     * @param {string} workspace_id - User ID (for security)
     * @returns {Object} Success status
     */
    async archiveConversation(chat_id, workspace_id) {
        try {
            const pool = await this.getPool();
            const request = pool.request();
            request.input('chat_id', sql.UniqueIdentifier, chat_id);
            request.input('workspace_id', sql.NVarChar(255), workspace_id);
            
            const result = await request.query(`
                UPDATE dbo.chat_conversation 
                SET is_active = 0, updated_at = GETUTCDATE()
                WHERE chat_id = @chat_id AND workspace_id = @workspace_id
            `);
            
            if (result.rowsAffected[0] === 0) {
                return {
                    success: false,
                    error: 'Conversation not found'
                };
            }
            
            return {
                success: true,
                message: 'Conversation archived successfully'
            };
        } catch (error) {
            console.error('Error archiving conversation:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Delete a conversation permanently
     * @param {string} chat_id - Conversation ID
     * @param {string} workspace_id - User ID (for security)
     * @returns {Object} Success status
     */
    async deleteConversation(chat_id, workspace_id) {
        try {
            const pool = await this.getPool();
            const request = pool.request();
            request.input('chat_id', sql.UniqueIdentifier, chat_id);
            request.input('workspace_id', sql.NVarChar(255), workspace_id);
            
            const result = await request.query(`
                DELETE FROM dbo.chat_conversation 
                WHERE chat_id = @chat_id AND workspace_id = @workspace_id
            `);
            
            if (result.rowsAffected[0] === 0) {
                return {
                    success: false,
                    error: 'Conversation not found'
                };
            }
            
            return {
                success: true,
                message: 'Conversation deleted successfully'
            };
        } catch (error) {
            console.error('Error deleting conversation:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get conversation statistics for a user
     * @param {string} workspace_id - User ID
     * @returns {Object} Statistics
     */
    async getConversationStats(workspace_id) {
        try {
            const pool = await this.getPool();
            const request = pool.request();
            request.input('workspace_id', sql.NVarChar(255), workspace_id);
            
            const result = await request.query(`
                SELECT 
                    COUNT(*) as total_conversations,
                    SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_conversations,
                    SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as archived_conversations,
                    MAX(updated_at) as last_activity
                FROM dbo.chat_conversation 
                WHERE workspace_id = @workspace_id
            `);
            
            return {
                success: true,
                data: result.recordset[0]
            };
        } catch (error) {
            console.error('Error getting conversation stats:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = new ChatConversation();
