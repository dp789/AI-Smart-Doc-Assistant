import React, { useState, useEffect } from 'react';
import useChatSessions from '../hooks/useChatSessions';
import ChatSessionSidebar from './ChatSessionSidebar';

/**
 * Example integration component showing how to add session management to DocumentChat
 * This is a simplified version - integrate these patterns into your existing DocumentChat component
 */
const DocumentChatSessionIntegration = () => {
    // Chat session management
    const {
        conversations,
        currentConversation,
        isLoading: sessionsLoading,
        getOrCreateCurrentConversation,
        updateConversation,
        addMessage
    } = useChatSessions();

    // UI state
    const [showSessionSidebar, setShowSessionSidebar] = useState(false);
    const [currentSessionId, setCurrentSessionId] = useState(null);
    const [messages, setMessages] = useState([]);

    // Initialize session on component mount
    useEffect(() => {
        const initializeSession = async () => {
            try {
                const session = await getOrCreateCurrentConversation('Research Assistant Chat');
                if (session) {
                    setCurrentSessionId(session.chat_id);
                    
                    // Load existing messages if any
                    if (session.chat_json && session.chat_json.length > 0) {
                        const existingMessages = session.chat_json.map(msg => ({
                            text: msg.content,
                            isBot: msg.role === 'assistant',
                            timestamp: new Date(msg.timestamp)
                        }));
                        setMessages(existingMessages);
                    } else {
                        // Set welcome message
                        setMessages([{
                            text: "🔬 Welcome to the Research Document AI Assistant! I specialize in analyzing, summarizing, and extracting insights from your research documents. Upload documents, ask questions, or use semantic search to uncover valuable information. How can I assist your research today?",
                            isBot: true,
                            timestamp: new Date()
                        }]);
                    }
                }
            } catch (error) {
                console.error('Failed to initialize session:', error);
            }
        };
        
        initializeSession();
    }, [getOrCreateCurrentConversation]);

    // Enhanced message functions that save to session
    const addUserMessage = async (text, hasAttachment = false, attachment = null) => {
        const newMessage = {
            text,
            isBot: false,
            timestamp: new Date(),
            hasAttachment,
            attachment
        };
        setMessages(prev => [...prev, newMessage]);
        
        // Save to session
        if (currentSessionId) {
            try {
                await addMessage(currentSessionId, {
                    role: 'user',
                    content: text,
                    metadata: { hasAttachment, attachment }
                });
            } catch (error) {
                console.error('Failed to save user message:', error);
            }
        }
    };

    const addBotMessage = async (text) => {
        const newMessage = {
            text,
            isBot: true,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, newMessage]);
        
        // Save to session
        if (currentSessionId) {
            try {
                await addMessage(currentSessionId, {
                    role: 'assistant',
                    content: text
                });
            } catch (error) {
                console.error('Failed to save bot message:', error);
            }
        }
    };

    // Handle session selection
    const handleSelectConversation = async (conversation) => {
        setCurrentSessionId(conversation.chat_id);
        
        // Load conversation messages
        const conversationMessages = conversation.chat_json.map(msg => ({
            text: msg.content,
            isBot: msg.role === 'assistant',
            timestamp: new Date(msg.timestamp)
        }));
        setMessages(conversationMessages);
    };

    // Handle new conversation creation
    const handleCreateNewConversation = async () => {
        try {
            const newSession = await getOrCreateCurrentConversation('New Research Chat');
            if (newSession) {
                setCurrentSessionId(newSession.chat_id);
                setMessages([{
                    text: "🔬 Welcome to the Research Document AI Assistant! I specialize in analyzing, summarizing, and extracting insights from your research documents. Upload documents, ask questions, or use semantic search to uncover valuable information. How can I assist your research today?",
                    isBot: true,
                    timestamp: new Date()
                }]);
            }
        } catch (error) {
            console.error('Failed to create new conversation:', error);
        }
    };

    return (
        <div className="document-chat-with-sessions">
            {/* Session Management Button */}
            <div className="session-management-header">
                <button 
                    className="session-toggle-btn"
                    onClick={() => setShowSessionSidebar(true)}
                    title="Manage Chat Sessions"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    Sessions ({conversations.length})
                </button>
                
                {currentSessionId && (
                    <div className="current-session-info">
                        Current Session: {currentConversation?.chat_title || 'Untitled'}
                    </div>
                )}
            </div>

            {/* Your existing DocumentChat content would go here */}
            <div className="chat-content">
                <div className="messages-container">
                    {messages.map((message, index) => (
                        <div key={index} className={`message ${message.isBot ? 'bot' : 'user'}`}>
                            <div className="message-content">
                                {message.text}
                            </div>
                            <div className="message-time">
                                {message.timestamp.toLocaleTimeString()}
                            </div>
                        </div>
                    ))}
                </div>
                
                {/* Example input area */}
                <div className="input-area">
                    <input 
                        type="text" 
                        placeholder="Type your message..."
                        onKeyPress={(e) => {
                            if (e.key === 'Enter' && e.target.value.trim()) {
                                addUserMessage(e.target.value);
                                e.target.value = '';
                            }
                        }}
                    />
                </div>
            </div>

            {/* Session Sidebar */}
            <ChatSessionSidebar
                isOpen={showSessionSidebar}
                onClose={() => setShowSessionSidebar(false)}
                onSelectConversation={handleSelectConversation}
                currentConversationId={currentSessionId}
                onCreateNewConversation={handleCreateNewConversation}
            />
        </div>
    );
};

export default DocumentChatSessionIntegration;
