import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './MCPChat.css';

const MCPChat = () => {
    const [messages, setMessages] = useState([
        { text: "👋 Welcome to MCP Assistant! I can help you explore available tools and capabilities. What would you like to know?", isBot: true, timestamp: new Date() }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(true);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const chatContainerRef = useRef(null);

    // Predefined suggestions for users to quickly interact with
    const suggestions = [
        "What tools do you have?",
        "How can I use MCP?",
        "Tell me about available features",
        "What protocols are supported?"
    ];

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
        setShowSuggestions(false);

        // Reset input field height
        if (inputRef.current) {
            inputRef.current.style.height = 'auto';
        }

        try {
            // Call the MCP server webhook
            const response = await axios.post('https://n8n.srv810548.hstgr.cloud/webhook/mcp-trigger-1', {
                query: inputMessage
            });

            // Process the response to extract the content properly
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

            // Add bot message with delay to simulate typing
            setTimeout(() => {
                setMessages(prev => [...prev, {
                    text: botResponse,
                    isBot: true,
                    timestamp: new Date()
                }]);
                setIsTyping(false);
                setIsSending(false);
            }, 1000);
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
                    text: "Sorry, I encountered an error processing your request. Please try again later.",
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

    const handleSuggestionClick = (suggestion) => {
        setInputMessage(suggestion);
        // Slight delay to let the state update
        setTimeout(() => {
            handleSendMessage();
        }, 100);
    };

    // Custom renderer for markdown content
    const renderMessageContent = (text, isBot) => {
        if (!isBot) {
            return <div className="message-content">{text}</div>;
        }
        
        return (
            <div className="message-content">
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

    const formatTime = (date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="mcp-chat-container" ref={chatContainerRef}>
            <div className="mcp-chat-header">
                <div className="mcp-chat-title">
                    <svg className="mcp-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <h2>MCP Assistant</h2>
                </div>
                <div className="mcp-status">
                    <span className="status-indicator"></span>
                    {isTyping ? 'Processing...' : 'Ready'}
                </div>
            </div>
            
            <div className="mcp-messages-container">
                <div className="mcp-message-wrapper">
                    <AnimatePresence>
                        {messages.map((message, index) => (
                            <motion.div
                                key={index}
                                className={`mcp-message ${message.isBot ? 'bot' : 'user'}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="mcp-message-meta">
                                    <div className="mcp-message-sender">
                                        {message.isBot ? 'MCP Assistant' : 'You'}
                                    </div>
                                    <div className="mcp-message-time">
                                        {formatTime(message.timestamp)}
                                    </div>
                                </div>
                                <div className="mcp-message-bubble">
                                    {renderMessageContent(message.text, message.isBot)}
                                </div>
                            </motion.div>
                        ))}

                        {isTyping && (
                            <motion.div 
                                className="mcp-typing-indicator"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <div className="mcp-typing-content">
                                    <div className="mcp-typing-dots">
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

            {showSuggestions && messages.length <= 1 && (
                <div className="mcp-suggestions">
                    <h4>Suggested Questions</h4>
                    <div className="mcp-suggestion-buttons">
                        {suggestions.map((suggestion, index) => (
                            <button 
                                key={index} 
                                onClick={() => handleSuggestionClick(suggestion)}
                                className="mcp-suggestion-btn"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <form onSubmit={handleSendMessage} className="mcp-input-form">
                <div className="mcp-input-container">
                    <textarea
                        ref={inputRef}
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask something about MCP tools and capabilities..."
                        className="mcp-input"
                        rows={1}
                        disabled={isSending}
                    />
                    <button 
                        type="submit" 
                        className="mcp-send-button"
                        disabled={!inputMessage.trim() || isSending}
                        aria-label="Send message"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13"></line>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                    </button>
                </div>
                <div className="mcp-input-hint">
                    Press Enter to send, Shift+Enter for a new line
                </div>
            </form>
        </div>
    );
};

export default MCPChat; 