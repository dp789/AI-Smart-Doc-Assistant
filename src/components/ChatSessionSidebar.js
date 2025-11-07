import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import useChatSessions from '../hooks/useChatSessions';
import ChatDownloadService from '../services/chatDownloadService';
import './ChatSessionSidebar.css';

const ChatSessionSidebar = ({ 
    isOpen, 
    onClose, 
    onSelectConversation, 
    currentConversationId,
    onCreateNewConversation,
    workspaceId 
}) => {
    const {
        conversations,
        isLoading,
        error,
        stats,
        loadConversations,
        archiveConversation,
        deleteConversation,
        clearError
    } = useChatSessions();

    const [showArchived, setShowArchived] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const [isDownloading, setIsDownloading] = useState(false);

    // Load conversations when sidebar opens
    useEffect(() => {
        if (isOpen && workspaceId) {
            loadConversations(workspaceId, showArchived);
        }
    }, [isOpen, showArchived, workspaceId, loadConversations]);


    // Filter conversations based on search query
    const filteredConversations = conversations.filter(conv =>
        conv.chat_title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Format date for display
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            return 'Today';
        } else if (diffDays === 2) {
            return 'Yesterday';
        } else if (diffDays <= 7) {
            return `${diffDays - 1} days ago`;
        } else {
            return date.toLocaleDateString();
        }
    };

    // Handle conversation selection
    const handleSelectConversation = (conversation) => {
        onSelectConversation(conversation);
        onClose();
    };

    // Handle archive conversation
    const handleArchiveConversation = async (conversationId, event) => {
        event.stopPropagation();
        if (!workspaceId) return;
        
        const success = await archiveConversation(conversationId, workspaceId);
        if (success) {
            // Reload conversations
            loadConversations(workspaceId, showArchived);
        }
    };

    // Handle delete conversation
    const handleDeleteConversation = async (conversationId) => {
        if (!workspaceId) return;
        
        const success = await deleteConversation(conversationId, workspaceId);
        if (success) {
            setShowDeleteConfirm(null);
            // Reload conversations
            loadConversations(workspaceId, showArchived);
        }
    };

    // Handle new conversation
    const handleNewConversation = () => {
        onCreateNewConversation();
        onClose();
    };

    // Handle download conversation as PDF
    const handleDownloadConversation = async (conversation, event) => {
        event.stopPropagation();
        setIsDownloading(true);
        
        try {
            await ChatDownloadService.downloadConversation(conversation, 'pdf');
        } catch (error) {
            console.error('Download failed:', error);
            // You could add a toast notification here
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="chat-sidebar-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />
                    
                    {/* Sidebar */}
                    <motion.div
                        className="chat-session-sidebar"
                        initial={{ x: -400 }}
                        animate={{ x: 0 }}
                        exit={{ x: -400 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    >
                        {/* Header */}
                        <div className="chat-sidebar-header">
                            <div className="chat-sidebar-title">
                                <h3>Chat History</h3>
                                {stats && (
                                    <span className="chat-stats">
                                        {stats.active_conversations} active
                                    </span>
                                )}
                            </div>
                            <button 
                                className="chat-sidebar-close"
                                onClick={onClose}
                                aria-label="Close sidebar"
                            >
                               <CloseIcon />
                            </button>
                        </div>

                        {/* New Conversation Button */}
                        <div className="chat-sidebar-actions">
                            <button 
                                className="new-conversation-btn"
                                onClick={handleNewConversation}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                                New Conversation
                            </button>
                        </div>

                        {/* Search */}
                        <div className="chat-sidebar-search">
                            <input
                                type="text"
                                placeholder="Search conversations..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="chat-search-input"
                            />
                        </div>                      

                        {/* Error Display */}
                        {error && (
                            <div className="chat-sidebar-error">
                                <p>{error}</p>
                                <button onClick={clearError}>Dismiss</button>
                            </div>
                        )}

                        {/* Conversations List */}
                        <div className="chat-conversations-list">
                            {isLoading ? (
                                <div className="chat-loading">
                                    <div className="loading-spinner"></div>
                                    <p>Loading conversations...</p>
                                </div>
                            ) : filteredConversations.length === 0 ? (
                                <div className="chat-empty">
                                    <div className="empty-icon">
                                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                        </svg>
                                    </div>
                                    <p>
                                        {searchQuery 
                                            ? 'No conversations match your search'
                                            : showArchived 
                                                ? 'No archived conversations'
                                                : 'No conversations yet'
                                        }
                                    </p>
                                    {!searchQuery && !showArchived && (
                                        <button 
                                            className="start-chat-btn"
                                            onClick={handleNewConversation}
                                        >
                                            Start your first chat
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="conversations-container">
                                    {filteredConversations.map((conversation) => (
                                        <motion.div
                                            key={conversation.chat_id}
                                            className={`conversation-item ${
                                                currentConversationId === conversation.chat_id ? 'active' : ''
                                            } ${!conversation.is_active ? 'archived' : ''}`}
                                            onClick={() => handleSelectConversation(conversation)}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <div className="conversation-content">
                                                <div className="conversation-title">
                                                    {conversation.chat_title}
                                                </div>
                                                <div className="conversation-meta">
                                                    <span className="conversation-date">
                                                        {formatDate(conversation.updated_at)}
                                                    </span>
                                                    <span className="conversation-message-count">
                                                        {conversation.chat_json?.length || 0} messages
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            <div className="conversation-actions">
                                                <button
                                                    className="download-btn"
                                                    onClick={(e) => handleDownloadConversation(conversation, e)}
                                                    disabled={isDownloading}
                                                    title="Download conversation as PDF"
                                                >
                                                    <DownloadIcon style={{ fontSize: 14 }} />
                                                </button>
                                                
                                                {conversation.is_active ? (
                                                    <button
                                                        className="archive-btn"
                                                        onClick={(e) => handleArchiveConversation(conversation.chat_id, e)}
                                                        title="Archive conversation"
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <polyline points="21 8 21 21 3 21 3 8"></polyline>
                                                            <rect x="1" y="3" width="22" height="5"></rect>
                                                            <line x1="10" y1="12" x2="14" y2="12"></line>
                                                        </svg>
                                                    </button>
                                                ) : (
                                                    <button
                                                        className="delete-btn"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setShowDeleteConfirm(conversation.chat_id);
                                                        }}
                                                        title="Delete conversation"
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <polyline points="3 6 5 6 21 6"></polyline>
                                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Delete Confirmation Modal */}
                    <AnimatePresence>
                        {showDeleteConfirm && (
                            <motion.div
                                className="delete-confirm-modal"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <motion.div
                                    className="delete-confirm-content"
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.9, opacity: 0 }}
                                >
                                    <h3>Delete Conversation</h3>
                                    <p>Are you sure you want to permanently delete this conversation? This action cannot be undone.</p>
                                    <div className="delete-confirm-actions">
                                        <button
                                            className="cancel-btn"
                                            onClick={() => setShowDeleteConfirm(null)}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            className="delete-confirm-btn"
                                            onClick={() => handleDeleteConversation(showDeleteConfirm)}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            )}
        </AnimatePresence>
    );
};

export default ChatSessionSidebar;