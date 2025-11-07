import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import axios from 'axios';
import { useMsal } from '@azure/msal-react';
import { useUserProfile } from '../hooks/useUserProfile';
import { getAuthHeaders } from '../utils/authUtils';
import envConfig from '../envConfig';
import n8nRagService from '../services/n8nRagService';
import './ChatBot.css';

const ChatBot = () => {
    const { accounts } = useMsal();
    const userProfile = useUserProfile();
    
    const [messages, setMessages] = useState([
        { 
            text: "🤖 Hello! I'm your AI Assistant powered by advanced RAG (Retrieval-Augmented Generation). I can answer questions based on your uploaded documents with full conversational context. How can I help you today?", 
            isBot: true,
            timestamp: new Date()
        }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [conversationHistory, setConversationHistory] = useState([]);
    const [workspaceId, setWorkspaceId] = useState(null);
    const [userDocuments, setUserDocuments] = useState([]); // Store user's documents
    const [isLoadingDocuments, setIsLoadingDocuments] = useState(true);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Bypass mode configuration
    const BYPASS_USER_ID = "d4b2fbfe-702b-49d4-9b42-41d343c26da5";
    
    const isBypassMode = () => sessionStorage.getItem("bypass_auth") === "true";

    // Get user ID function
    const getUserId = useCallback(() => {
        if (isBypassMode()) {
            return BYPASS_USER_ID;
        }
        
        if (accounts && accounts.length > 0) {
            const account = accounts[0];
            return account.localAccountId || account.homeAccountId || account.username;
        }
        
        return userProfile.email || 'unknown-user';
    }, [accounts, userProfile.email]);

    // Set workspace ID when user ID is available
    useEffect(() => {
        const userId = getUserId();
        if (userId) {
            setWorkspaceId(userId);
            console.log('✅ Workspace ID set to:', userId);
        }
    }, [getUserId]);

    // Fetch user's documents for filtering
    useEffect(() => {
        let isMounted = true;
        
        const fetchUserDocuments = async () => {
            try {
                const userId = getUserId();
                if (!userId || userId === 'unknown-user') {
                    console.warn('⚠️ No valid user ID for fetching documents');
                    return;
                }

                setIsLoadingDocuments(true);
                const authHeaders = await getAuthHeaders();
                
                console.log('📚 Fetching user documents for filtering...');
                const response = await axios.get(`${envConfig.apiUrl}/documents/${userId}`, {
                    headers: {
                        ...authHeaders,
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache'
                    },
                    params: {
                        cacheBuster: Date.now().toString()
                    }
                });

                if (!isMounted) return;

                if (response.data.success) {
                    const documents = response.data.data.documents;
                    // Only use completed/ingested documents
                    const completedDocs = documents.filter(doc => 
                        doc.ingestionStatus === 'completed'
                    );
                    
                    console.log(`✅ Fetched ${completedDocs.length} completed documents for user`);
                    console.log('📄 Document IDs:', completedDocs.map(d => d.documentGuid));
                    
                    setUserDocuments(completedDocs);
                } else {
                    console.warn('⚠️ Failed to fetch documents:', response.data.message);
                }
            } catch (error) {
                console.error('❌ Error fetching user documents:', error);
                // Non-blocking error - chat can still work without specific document filtering
            } finally {
                if (isMounted) {
                    setIsLoadingDocuments(false);
                }
            }
        };

        if (workspaceId) {
            fetchUserDocuments();
        }

        return () => {
            isMounted = false;
        };
    }, [workspaceId, getUserId]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Auto-resize input field as user types
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.style.height = 'auto';
            inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`;
        }
    }, [inputMessage]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        
        if (!inputMessage.trim() || isSending) return;

        // Validate workspace ID
        if (!workspaceId) {
            console.error('❌ Workspace ID not available');
            setMessages(prev => [...prev, {
                text: "⚠️ Unable to send message: User workspace not initialized. Please refresh the page.",
                isBot: true,
                timestamp: new Date(),
                isError: true
            }]);
            return;
        }

        // Add user message to UI
        const userMessage = { 
            text: inputMessage, 
            isBot: false, 
            timestamp: new Date(),
            role: 'user'
        };
        
        setMessages(prev => [...prev, userMessage]);
        
        // Update conversation history for context
        const newConversationHistory = [
            ...conversationHistory,
            {
                role: 'user',
                content: inputMessage
            }
        ];
        setConversationHistory(newConversationHistory);

        const currentMessage = inputMessage;
        setInputMessage('');
        setIsTyping(true);
        setIsSending(true);

        // Reset input field height
        if (inputRef.current) {
            inputRef.current.style.height = 'auto';
        }

        try {
            console.log('🚀 Calling n8n RAG workflow...');
            console.log('📨 Message:', currentMessage);
            console.log('👤 Workspace ID:', workspaceId);
            console.log('💬 Conversation history:', newConversationHistory);

            // Extract document IDs from user's completed documents
            const userDocumentIds = userDocuments
                .filter(doc => doc.documentGuid) // Ensure documentGuid exists
                .map(doc => doc.documentGuid);

            console.log(`📄 Filtering by ${userDocumentIds.length} user document(s)`);
            console.log('🔖 Document IDs:', userDocumentIds);

            // Call n8n RAG workflow with conversation context AND document filtering
            const response = await n8nRagService.sendMessage({
                message: currentMessage,
                userId: workspaceId,
                context: newConversationHistory,
                documentIds: userDocumentIds, // IMPORTANT: Only query user's documents
                metadata: {
                    timestamp: new Date().toISOString(),
                    documentCount: userDocumentIds.length
                }
            });

            console.log('✅ Response received:', response);

            if (response.success) {
                // Extract bot response
                const botResponseText = response.response;
                
                // Add bot response to UI
                const botMessage = {
                    text: botResponseText,
                    isBot: true,
                    timestamp: new Date(),
                    role: 'assistant',
                    sources: response.sources || [],
                    metadata: response.metadata || {}
                };

                // Add typing delay for better UX
                await new Promise(resolve => setTimeout(resolve, 500));
                
                setMessages(prev => [...prev, botMessage]);
                
                // Update conversation history with bot response
                const updatedConversationHistory = [
                    ...newConversationHistory,
                    {
                        role: 'assistant',
                        content: botResponseText
                    }
                ];
                setConversationHistory(updatedConversationHistory);

            } else {
                // Handle error response
                throw new Error(response.error || 'Failed to get response from n8n workflow');
            }

        } catch (error) {
            console.error('❌ Error sending message:', error);
            
            // Show error message to user
            const errorMessage = {
                text: `⚠️ Sorry, I encountered an error: ${error.message || 'Unable to process your request'}. Please try again or check if the n8n workflow is active.`,
                isBot: true,
                timestamp: new Date(),
                isError: true
            };
            
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
            setIsSending(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(e);
        }
    };

    // Custom renderer for markdown content with source citations
    const renderMessageContent = (message) => {
        if (!message.isBot) {
            return <div className="message-content">{message.text}</div>;
        }
        
        return (
            <div className="message-content">
                <div className="markdown-content">
                    <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                            // Override default elements with custom styling
                            h1: ({node, ...props}) => <h1 className="markdown-h1" {...props} />,
                            h2: ({node, ...props}) => <h2 className="markdown-h2" {...props} />,
                            h3: ({node, ...props}) => <h3 className="markdown-h3" {...props} />,
                            p: ({node, ...props}) => <p className="markdown-p" {...props} />,
                            ul: ({node, ...props}) => <ul className="markdown-ul" {...props} />,
                            ol: ({node, ...props}) => <ol className="markdown-ol" {...props} />,
                            li: ({node, ...props}) => <li className="markdown-li" {...props} />,
                            code: ({node, inline, ...props}) => 
                                inline 
                                    ? <code className="markdown-inline-code" {...props} />
                                    : <div className="markdown-code-block">
                                        <code {...props} />
                                    </div>,
                            pre: ({node, ...props}) => <pre className="markdown-pre" {...props} />,
                            blockquote: ({node, ...props}) => <blockquote className="markdown-blockquote" {...props} />,
                            table: ({node, ...props}) => <table className="markdown-table" {...props} />,
                            a: ({node, ...props}) => <a className="markdown-link" target="_blank" rel="noopener noreferrer" {...props} />
                        }}
                    >
                        {message.text}
                    </ReactMarkdown>
                </div>
                
                {/* Show sources if available */}
                {message.sources && message.sources.length > 0 && (
                    <div className="message-sources">
                        <div className="sources-header">📚 Sources:</div>
                        <div className="sources-list">
                            {message.sources.slice(0, 3).map((source, idx) => (
                                <div key={idx} className="source-item">
                                    <span className="source-title">
                                        {source.filename || source.title || `Source ${idx + 1}`}
                                    </span>
                                    {source.relevance_score && (
                                        <span className="source-score">
                                            {(source.relevance_score * 100).toFixed(0)}% relevant
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="chatbot-container">
            <div className="chatbot-header">
                <h2>AI Assistant</h2>
                <div>
                    <span className="status-indicator"></span>
                    {isTyping ? 'Thinking...' : 'Online'}
                </div>
            </div>
            
            <div className="messages-container">
                <div className="message-wrapper">
                    <AnimatePresence>
                        {messages.map((message, index) => (
                            <motion.div
                                key={index}
                                className={`message ${message.isBot ? 'bot' : 'user'} ${message.isError ? 'error' : ''}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="message-meta">
                                    <div className="message-sender">
                                        {message.isBot ? '🤖 AI Assistant' : '👤 You'}
                                    </div>
                                    {message.timestamp && (
                                        <div className="message-time">
                                            {message.timestamp.toLocaleTimeString()}
                                        </div>
                                    )}
                                </div>
                                <div className="message-bubble">
                                    {renderMessageContent(message)}
                                </div>
                            </motion.div>
                        ))}

                        {isTyping && (
                            <motion.div 
                                className="typing-indicator"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <div className="typing-indicator-content">
                                    <div className="typing-indicator-dots">
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="input-form">
                <div className="message-input-container">
                    <textarea
                        ref={inputRef}
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Message AI assistant..."
                        className="message-input"
                        rows={1}
                        disabled={isSending}
                    />
                    <button 
                        type="submit" 
                        className="send-button"
                        disabled={!inputMessage.trim() || isSending}
                        aria-label="Send message"
                    >
                    </button>
                </div>
                <div className="input-hint">
                    Press Enter to send, Shift+Enter for a new line
                </div>
            </form>
        </div>
    );
};

export default ChatBot; 