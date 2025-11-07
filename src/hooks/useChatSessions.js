import { useState, useEffect, useCallback } from 'react';
import chatSessionService from '../services/chatSessionService';

/**
 * Custom hook for managing chat sessions and conversations
 */
export const useChatSessions = () => {
    const [conversations, setConversations] = useState([]);
    const [currentConversation, setCurrentConversation] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState(null);

    /**
     * Load all conversations for the current user
     */
    const loadConversations = useCallback(async (workspaceId, includeArchived = false) => {
        if (!workspaceId) {
            setError('Workspace ID is required');
            return;
        }

        setIsLoading(true);
        setError(null);
        
        try {
            const response = await chatSessionService.getConversations(workspaceId, includeArchived);
            if (response.success) {
                setConversations(response.data);
            } else {
                setError(response.error || 'Failed to load conversations');
            }
        } catch (err) {
            setError(err.error || 'Failed to load conversations');
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Load conversation statistics
     */
    const loadStats = useCallback(async (workspaceId) => {
        if (!workspaceId) return;
        
        try {
            const response = await chatSessionService.getConversationStats(workspaceId);
            if (response.success) {
                setStats(response.data);
            }
        } catch (err) {
            console.error('Failed to load conversation stats:', err);
        }
    }, []);

    /**
     * Get or create current active conversation
     */
    const getOrCreateCurrentConversation = useCallback(async (workspaceId, chatTitle = 'New Chat Session') => {
        if (!workspaceId) {
            setError('Workspace ID is required');
            return null;
        }

        setIsLoading(true);
        setError(null);
        
        try {
            const response = await chatSessionService.getOrCreateCurrentConversation(workspaceId, chatTitle);
            if (response.success) {
                setCurrentConversation(response.data);
                return response.data;
            } else {
                setError(response.error || 'Failed to get/create current conversation');
                return null;
            }
        } catch (err) {
            setError(err.error || 'Failed to get/create current conversation');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Create a new conversation
     */
    const createConversation = useCallback(async (conversationData) => {
        if (!conversationData.workspace_id) {
            setError('Workspace ID is required in conversation data');
            return null;
        }

        setIsLoading(true);
        setError(null);
        
        try {
            const response = await chatSessionService.createConversation(conversationData);
            if (response.success) {
                const newConversation = response.data;
                setConversations(prev => [newConversation, ...prev]);
                setCurrentConversation(newConversation);
                return newConversation;
            } else {
                setError(response.error || 'Failed to create conversation');
                return null;
            }
        } catch (err) {
            setError(err.error || 'Failed to create conversation');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Load a specific conversation by ID
     */
    const loadConversation = useCallback(async (chatId, workspaceId) => {
        if (!workspaceId) {
            setError('Workspace ID is required');
            return null;
        }

        setIsLoading(true);
        setError(null);
        
        try {
            const response = await chatSessionService.getConversation(chatId, workspaceId);
            if (response.success) {
                setCurrentConversation(response.data);
                return response.data;
            } else {
                setError(response.error || 'Failed to load conversation');
                return null;
            }
        } catch (err) {
            setError(err.error || 'Failed to load conversation');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Update conversation messages
     */
    const updateConversation = useCallback(async (chatId, updateData) => {
        if (!updateData.workspace_id) {
            setError('Workspace ID is required in update data');
            return null;
        }

        try {
            const response = await chatSessionService.updateConversation(chatId, updateData);
            if (response.success) {
                const updatedConversation = response.data;
                
                // Update current conversation if it's the one being updated
                if (currentConversation && currentConversation.chat_id === chatId) {
                    setCurrentConversation(updatedConversation);
                }
                
                // Update conversations list
                setConversations(prev => 
                    prev.map(conv => 
                        conv.chat_id === chatId ? updatedConversation : conv
                    )
                );
                
                return updatedConversation;
            } else {
                setError(response.error || 'Failed to update conversation');
                return null;
            }
        } catch (err) {
            setError(err.error || 'Failed to update conversation');
            return null;
        }
    }, [currentConversation]);

    /**
     * Add a message to a conversation
     */
    const addMessage = useCallback(async (chatId, message) => {
        if (!message.workspace_id) {
            setError('Workspace ID is required in message data');
            return null;
        }

        try {
            const response = await chatSessionService.addMessage(chatId, message);
            if (response.success) {
                const updatedConversation = response.data;
                
                // Update current conversation if it's the one being updated
                if (currentConversation && currentConversation.chat_id === chatId) {
                    setCurrentConversation(updatedConversation);
                }
                
                // Update conversations list
                setConversations(prev => 
                    prev.map(conv => 
                        conv.chat_id === chatId ? updatedConversation : conv
                    )
                );
                
                return updatedConversation;
            } else {
                setError(response.error || 'Failed to add message');
                return null;
            }
        } catch (err) {
            setError(err.error || 'Failed to add message');
            return null;
        }
    }, [currentConversation]);

    /**
     * Archive a conversation
     */
    const archiveConversation = useCallback(async (chatId, workspaceId) => {
        if (!workspaceId) {
            setError('Workspace ID is required');
            return false;
        }

        try {
            const response = await chatSessionService.archiveConversation(chatId, workspaceId);
            if (response.success) {
                // Remove from conversations list
                setConversations(prev => prev.filter(conv => conv.chat_id !== chatId));
                
                // Clear current conversation if it's the one being archived
                if (currentConversation && currentConversation.chat_id === chatId) {
                    setCurrentConversation(null);
                }
                
                return true;
            } else {
                setError(response.error || 'Failed to archive conversation');
                return false;
            }
        } catch (err) {
            setError(err.error || 'Failed to archive conversation');
            return false;
        }
    }, [currentConversation]);

    /**
     * Delete a conversation permanently
     */
    const deleteConversation = useCallback(async (chatId, workspaceId) => {
        if (!workspaceId) {
            setError('Workspace ID is required');
            return false;
        }

        try {
            const response = await chatSessionService.deleteConversation(chatId, workspaceId);
            if (response.success) {
                // Remove from conversations list
                setConversations(prev => prev.filter(conv => conv.chat_id !== chatId));
                
                // Clear current conversation if it's the one being deleted
                if (currentConversation && currentConversation.chat_id === chatId) {
                    setCurrentConversation(null);
                }
                
                return true;
            } else {
                setError(response.error || 'Failed to delete conversation');
                return false;
            }
        } catch (err) {
            setError(err.error || 'Failed to delete conversation');
            return false;
        }
    }, [currentConversation]);

    /**
     * Clear current conversation
     */
    const clearCurrentConversation = useCallback(() => {
        setCurrentConversation(null);
    }, []);

    /**
     * Clear error state
     */
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    // Load conversations and stats on mount
    useEffect(() => {
        loadConversations();
        loadStats();
    }, [loadConversations, loadStats]);

    return {
        // State
        conversations,
        currentConversation,
        isLoading,
        error,
        stats,
        
        // Actions
        loadConversations,
        loadStats,
        getOrCreateCurrentConversation,
        createConversation,
        loadConversation,
        updateConversation,
        addMessage,
        archiveConversation,
        deleteConversation,
        clearCurrentConversation,
        clearError
    };
};

export default useChatSessions;
