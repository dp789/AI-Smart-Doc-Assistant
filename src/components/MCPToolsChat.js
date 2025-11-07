import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './MCPToolsChat.css';

const MCPToolsChat = () => {
    const [messages, setMessages] = useState([
        { 
            text: "👋 Welcome to MCP Tools Assistant! I can help you explore and use various MCP tools. What would you like to know?", 
            isBot: true, 
            timestamp: new Date()
        }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [showTools, setShowTools] = useState(true);
    const [theme, setTheme] = useState('light');
    const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    
    // Mock tools that the MCP has available
    const availableTools = [
        { id: 'search', name: 'Search', icon: 'search', description: 'Search through available resources' },
        { id: 'file', name: 'File Browser', icon: 'folder', description: 'Browse through available files' },
        { id: 'deploy', name: 'Deployment', icon: 'upload-cloud', description: 'Deploy your applications' },
        { id: 'monitor', name: 'Monitoring', icon: 'activity', description: 'Monitor system activities' },
        { id: 'config', name: 'Configuration', icon: 'settings', description: 'Configure system settings' },
    ];

    const scrollToBottom = () => {
        if (autoScrollEnabled && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, autoScrollEnabled]);

    // Auto-resize input field as user types
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.style.height = 'auto';
            inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`;
        }
    }, [inputMessage]);

    // Toggle between light and dark themes
    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    // Toggle auto-scrolling
    const toggleAutoScroll = () => {
        setAutoScrollEnabled(prev => !prev);
    };

    // Handle sending a message
    const handleSendMessage = async (e) => {
        e?.preventDefault();
        
        if (!inputMessage.trim() || isSending) return;

        // Add user message
        const userMessage = { text: inputMessage, isBot: false, timestamp: new Date() };
        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsTyping(true);
        setIsSending(true);

        // Reset input field height
        if (inputRef.current) {
            inputRef.current.style.height = 'auto';
        }

        try {
            // Call the MCP tools webhook
            const response = await axios.post('https://primary-production-1e6cb.up.railway.app/webhook/mcp-trigger', {
                query: inputMessage
            });

            // Process the response to extract the content
            let botResponse = '';
            
            if (typeof response.data === 'string') {
                botResponse = response.data;
            } else if (response.data && typeof response.data === 'object') {
                if (Object.keys(response.data).length === 1 && 'output' in response.data) {
                    const outputContent = response.data.output;
                    
                    if (typeof outputContent === 'string') {
                        botResponse = outputContent;
                    } else if (typeof outputContent === 'object') {
                        if (Object.keys(outputContent).length > 0) {
                            const firstValue = Object.values(outputContent)[0];
                            if (typeof firstValue === 'string') {
                                botResponse = firstValue;
                            } else {
                                botResponse = JSON.stringify(outputContent);
                            }
                        } else {
                            botResponse = "The response was empty.";
                        }
                    }
                } else if (response.data.answer || response.data.response) {
                    botResponse = response.data.answer || response.data.response;
                } else {
                    // Try to extract any meaningful content from the response
                    try {
                        const jsonString = JSON.stringify(response.data);
                        if (jsonString.includes('{"output":')) {
                            const match = jsonString.match(/"output":"([^"]+)"/);
                            if (match && match[1]) {
                                botResponse = match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
                            } else {
                                botResponse = jsonString;
                            }
                        } else {
                            botResponse = jsonString;
                        }
                    } catch (e) {
                        console.error("Error parsing response:", e);
                        botResponse = "I received a response but couldn't format it properly.";
                    }
                }
            } else {
                botResponse = "I received your message, but couldn't process the response format.";
            }

            // Add bot message with a delay to simulate typing
            setTimeout(() => {
                setMessages(prev => [...prev, {
                    text: botResponse,
                    isBot: true,
                    timestamp: new Date()
                }]);
                setIsTyping(false);
                setIsSending(false);
            }, 1200);
        } catch (error) {
            console.error('Error:', error);
            
            // Enhanced error logging
            if (error.response) {
                console.error('Response data:', error.response.data);
                console.error('Response status:', error.response.status);
            } else if (error.request) {
                console.error('Request made but no response received:', error.request);
            } else {
                console.error('Error details:', error.message);
            }
            
            setTimeout(() => {
                setMessages(prev => [...prev, {
                    text: "Sorry, I encountered an error while communicating with the MCP server. Please try again later.",
                    isBot: true,
                    timestamp: new Date()
                }]);
                setIsTyping(false);
                setIsSending(false);
            }, 1000);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Handle tool button click to generate a query about a specific tool
    const handleToolClick = (tool) => {
        const toolQuery = `Tell me about the ${tool.name} tool in MCP`;
        setInputMessage(toolQuery);
        
        // Small delay to ensure the state is updated
        setTimeout(() => {
            handleSendMessage();
        }, 100);
    };

    // Clear chat history
    const clearChat = () => {
        setMessages([{ 
            text: "👋 Welcome to MCP Tools Assistant! I can help you explore and use various MCP tools. What would you like to know?", 
            isBot: true, 
            timestamp: new Date()
        }]);
    };

    // Format timestamp to readable time
    const formatTime = (date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Format date for message groups
    const formatDate = (date) => {
        return date.toLocaleDateString(undefined, { 
            weekday: 'long', 
            month: 'short', 
            day: 'numeric'
        });
    };

    // Group messages by date
    const getMessagesGroupedByDate = () => {
        const groups = [];
        let currentDate = null;
        let currentGroup = [];

        messages.forEach(message => {
            const messageDate = new Date(message.timestamp).toDateString();
            
            if (messageDate !== currentDate) {
                if (currentGroup.length > 0) {
                    groups.push({
                        date: currentDate,
                        messages: currentGroup
                    });
                }
                currentDate = messageDate;
                currentGroup = [message];
            } else {
                currentGroup.push(message);
            }
        });

        if (currentGroup.length > 0) {
            groups.push({
                date: currentDate,
                messages: currentGroup
            });
        }

        return groups;
    };

    // Custom renderer for message content
    const renderMessageContent = (text, isBot) => {
        if (!isBot) {
            return <div className="tools-message-content">{text}</div>;
        }
        
        return (
            <div className="tools-message-content">
                <div className="markdown-content">
                    <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
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
                        {text}
                    </ReactMarkdown>
                </div>
            </div>
        );
    };

    // Helper function to render icons
    const renderIcon = (iconName) => {
        switch (iconName) {
            case 'search':
                return (
                    <svg className="tools-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                );
            case 'folder':
                return (
                    <svg className="tools-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                    </svg>
                );
            case 'upload-cloud':
                return (
                    <svg className="tools-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="16 16 12 12 8 16"></polyline>
                        <line x1="12" y1="12" x2="12" y2="21"></line>
                        <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"></path>
                        <polyline points="16 16 12 12 8 16"></polyline>
                    </svg>
                );
            case 'activity':
                return (
                    <svg className="tools-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                    </svg>
                );
            case 'settings':
                return (
                    <svg className="tools-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                    </svg>
                );
            case 'moon':
                return (
                    <svg className="tools-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                    </svg>
                );
            case 'sun':
                return (
                    <svg className="tools-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="5"></circle>
                        <line x1="12" y1="1" x2="12" y2="3"></line>
                        <line x1="12" y1="21" x2="12" y2="23"></line>
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                        <line x1="1" y1="12" x2="3" y2="12"></line>
                        <line x1="21" y1="12" x2="23" y2="12"></line>
                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                    </svg>
                );
            case 'auto-scroll':
                return (
                    <svg className="tools-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="7 13 12 18 17 13"></polyline>
                        <polyline points="7 6 12 11 17 6"></polyline>
                    </svg>
                );
            case 'trash':
                return (
                    <svg className="tools-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                );
            case 'send':
                return (
                    <svg className="tools-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                );
            default:
                return null;
        }
    };

    // Render the tools sidebar
    const renderToolsSidebar = () => {
        if (!showTools) return null;

        return (
            <div className="tools-sidebar">
                <div className="tools-sidebar-header">
                    <h3>Available Tools</h3>
                </div>
                <div className="tools-list">
                    {availableTools.map(tool => (
                        <div key={tool.id} className="tool-item" onClick={() => handleToolClick(tool)}>
                            <div className="tool-icon">
                                {renderIcon(tool.icon)}
                            </div>
                            <div className="tool-info">
                                <div className="tool-name">{tool.name}</div>
                                <div className="tool-description">{tool.description}</div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="tools-actions">
                    <button 
                        className="tool-action-button" 
                        onClick={toggleTheme}
                        aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                    >
                        {theme === 'light' ? renderIcon('moon') : renderIcon('sun')}
                        {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                    </button>
                    <button 
                        className={`tool-action-button ${autoScrollEnabled ? 'active' : ''}`}
                        onClick={toggleAutoScroll} 
                        aria-label={autoScrollEnabled ? 'Disable auto-scroll' : 'Enable auto-scroll'}
                    >
                        {renderIcon('auto-scroll')}
                        {autoScrollEnabled ? 'Auto-scroll On' : 'Auto-scroll Off'}
                    </button>
                    <button 
                        className="tool-action-button danger"
                        onClick={clearChat}
                        aria-label="Clear chat history"
                    >
                        {renderIcon('trash')}
                        Clear Chat
                    </button>
                </div>
            </div>
        );
    };

    // Toggle the tools sidebar
    const toggleToolsSidebar = () => {
        setShowTools(prev => !prev);
    };

    const messageGroups = getMessagesGroupedByDate();

    return (
        <div className={`tools-chat-container ${theme}`}>
            <div className="tools-main">
                <div className="tools-header">
                    <div className="tools-header-title">
                        <button 
                            className="tools-sidebar-toggle"
                            onClick={toggleToolsSidebar}
                            aria-label={showTools ? 'Hide tools' : 'Show tools'}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="3" y1="12" x2="21" y2="12"></line>
                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                <line x1="3" y1="18" x2="21" y2="18"></line>
                            </svg>
                        </button>
                        <h2>MCP Tools Assistant</h2>
                    </div>
                    <div className="tools-status">
                        <span className="tools-status-indicator"></span>
                        {isTyping ? 'Processing...' : 'Online'}
                    </div>
                </div>
                
                <div className="tools-messages-container">
                    <div className="tools-messages-wrapper">
                        {messageGroups.map((group, groupIndex) => (
                            <div key={groupIndex} className="message-date-group">
                                <div className="message-date-divider">
                                    <span>{formatDate(new Date(group.date))}</span>
                                </div>
                                <AnimatePresence>
                                    {group.messages.map((message, messageIndex) => (
                                        <motion.div
                                            key={`${groupIndex}-${messageIndex}`}
                                            className={`tools-message ${message.isBot ? 'bot' : 'user'}`}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <div className="tools-message-meta">
                                                <div className="tools-message-sender">
                                                    {message.isBot ? 'MCP Tools' : 'You'}
                                                </div>
                                                <div className="tools-message-time">
                                                    {formatTime(new Date(message.timestamp))}
                                                </div>
                                            </div>
                                            <div className="tools-message-bubble">
                                                {renderMessageContent(message.text, message.isBot)}
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        ))}

                        {isTyping && (
                            <motion.div 
                                className="tools-typing-indicator"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <div className="tools-typing-content">
                                    <div className="tools-typing-dots">
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                    <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSendMessage} className="tools-input-form">
                    <div className="tools-input-container">
                        <textarea
                            ref={inputRef}
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask about MCP tools..."
                            className="tools-input"
                            rows={1}
                            disabled={isSending}
                        />
                        <button 
                            type="submit" 
                            className="tools-send-button"
                            disabled={!inputMessage.trim() || isSending}
                            aria-label="Send message"
                        >
                            {renderIcon('send')}
                        </button>
                    </div>
                </form>
            </div>
            
            {renderToolsSidebar()}
        </div>
    );
};

export default MCPToolsChat; 