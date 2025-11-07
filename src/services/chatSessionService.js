import axios from 'axios';
import { getAuthHeaders } from '../utils/authUtils';
import envConfig from '../envConfig';

class ChatSessionService {
    constructor() {
        this.baseURL = `${envConfig.apiUrl}/chat-sessions`;
    }

    /**
     * Get all conversations for the current user
     * @param {string} workspaceId - User workspace ID
     * @param {boolean} includeArchived - Whether to include archived conversations
     * @returns {Promise<Object>} API response
     */
    async getConversations(workspaceId, includeArchived = false) {
        try {
            const authHeaders = await getAuthHeaders();
            const params = { 
                workspace_id: workspaceId,
                ...(includeArchived && { include_archived: true })
            };
            
            const response = await axios.get(this.baseURL, {
                headers: authHeaders,
                params
            });
            
            return response.data;
        } catch (error) {
            console.error('Error fetching conversations:', error);
            throw this.handleError(error);
        }
    }

    /**
     * Get a specific conversation by ID
     * @param {string} chatId - Conversation ID
     * @param {string} workspaceId - User workspace ID
     * @returns {Promise<Object>} API response
     */
    async getConversation(chatId, workspaceId) {
        try {
            const authHeaders = await getAuthHeaders();
            const response = await axios.get(`${this.baseURL}/${chatId}`, {
                headers: authHeaders,
                params: { workspace_id: workspaceId }
            });
            
            return response.data;
        } catch (error) {
            console.error('Error fetching conversation:', error);
            throw this.handleError(error);
        }
    }

    /**
     * Create a new conversation
     * @param {Object} conversationData - Conversation data
     * @param {string} conversationData.chat_title - Title of the conversation
     * @param {string} conversationData.initial_message - Optional initial message
     * @param {string} conversationData.workspace_id - User workspace ID
     * @returns {Promise<Object>} API response
     */
    async createConversation(conversationData) {
        try {
            const authHeaders = await getAuthHeaders();
            const response = await axios.post(this.baseURL, conversationData, {
                headers: authHeaders
            });
            
            return response.data;
        } catch (error) {
            console.error('Error creating conversation:', error);
            throw this.handleError(error);
        }
    }

    /**
     * Get or create current active conversation
     * @param {string} workspaceId - User workspace ID
     * @param {string} chatTitle - Optional title for new conversation
     * @returns {Promise<Object>} API response
     */
    async getOrCreateCurrentConversation(workspaceId, chatTitle = 'New Chat Session') {
        try {
            const authHeaders = await getAuthHeaders();
            const response = await axios.post(`${this.baseURL}/current`, {
                chat_title: chatTitle,
                workspace_id: workspaceId
            }, {
                headers: authHeaders
            });
            
            return response.data;
        } catch (error) {
            console.error('Error getting/creating current conversation:', error);
            throw this.handleError(error);
        }
    }

    /**
     * Update conversation messages and/or title
     * @param {string} chatId - Conversation ID
     * @param {Object} updateData - Update data
     * @param {Array} updateData.messages - Updated conversation messages
     * @param {string} updateData.chat_title - Optional updated title
     * @param {string} updateData.workspace_id - User workspace ID
     * @returns {Promise<Object>} API response
     */
    async updateConversation(chatId, updateData) {
        try {
            const authHeaders = await getAuthHeaders();
            const response = await axios.put(`${this.baseURL}/${chatId}`, updateData, {
                headers: authHeaders
            });
            
            return response.data;
        } catch (error) {
            console.error('Error updating conversation:', error);
            throw this.handleError(error);
        }
    }

    /**
     * Add a message to an existing conversation
     * @param {string} chatId - Conversation ID
     * @param {Object} message - Message data
     * @param {string} message.role - 'user' or 'assistant'
     * @param {string} message.content - Message content
     * @param {Object} message.metadata - Optional message metadata
     * @param {string} message.workspace_id - User workspace ID
     * @returns {Promise<Object>} API response
     */
    async addMessage(chatId, message) {
        try {
            const authHeaders = await getAuthHeaders();
            const response = await axios.post(`${this.baseURL}/${chatId}/messages`, message, {
                headers: authHeaders
            });
            
            return response.data;
        } catch (error) {
            console.error('Error adding message:', error);
            throw this.handleError(error);
        }
    }

    /**
     * Archive a conversation
     * @param {string} chatId - Conversation ID
     * @param {string} workspaceId - User workspace ID
     * @returns {Promise<Object>} API response
     */
    async archiveConversation(chatId, workspaceId) {
        try {
            const authHeaders = await getAuthHeaders();
            const response = await axios.patch(`${this.baseURL}/${chatId}/archive`, {}, {
                headers: authHeaders,
                params: { workspace_id: workspaceId }
            });
            
            return response.data;
        } catch (error) {
            console.error('Error archiving conversation:', error);
            throw this.handleError(error);
        }
    }

    /**
     * Delete a conversation permanently
     * @param {string} chatId - Conversation ID
     * @param {string} workspaceId - User workspace ID
     * @returns {Promise<Object>} API response
     */
    async deleteConversation(chatId, workspaceId) {
        try {
            const authHeaders = await getAuthHeaders();
            const response = await axios.delete(`${this.baseURL}/${chatId}`, {
                headers: authHeaders,
                params: { workspace_id: workspaceId }
            });
            
            return response.data;
        } catch (error) {
            console.error('Error deleting conversation:', error);
            throw this.handleError(error);
        }
    }

    /**
     * Get conversation statistics
     * @param {string} workspaceId - User workspace ID
     * @returns {Promise<Object>} API response
     */
    async getConversationStats(workspaceId) {
        try {
            const authHeaders = await getAuthHeaders();
            const response = await axios.get(`${this.baseURL}/stats`, {
                headers: authHeaders,
                params: { workspace_id: workspaceId }
            });
            
            return response.data;
        } catch (error) {
            console.error('Error fetching conversation stats:', error);
            throw this.handleError(error);
        }
    }

    /**
     * Handle API errors
     * @param {Error} error - Error object
     * @returns {Object} Formatted error
     */
    handleError(error) {
        if (error.response) {
            // Server responded with error status
            return {
                success: false,
                error: error.response.data?.error || error.response.data?.message || 'Server error',
                status: error.response.status,
                data: error.response.data
            };
        } else if (error.request) {
            // Request was made but no response received
            return {
                success: false,
                error: 'Network error - please check your connection',
                status: 0
            };
        } else {
            // Something else happened
            return {
                success: false,
                error: error.message || 'An unexpected error occurred',
                status: 0
            };
        }
    }
}

export default new ChatSessionService();
