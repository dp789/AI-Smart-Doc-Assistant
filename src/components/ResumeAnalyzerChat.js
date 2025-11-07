import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './ResumeAnalyzerChat.css';

const ResumeAnalyzerChat = () => {
    const [messages, setMessages] = useState([
        { 
            text: "👨‍💼 Hello! I'm your Resume Analysis Assistant. Upload a resume document or provide a document ID to get started. I'll analyze the resume and provide insights.", 
            isBot: true, 
            timestamp: new Date(),
            type: 'greeting'
        }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [documentId, setDocumentId] = useState('');
    const [activeResume, setActiveResume] = useState(null);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const fileInputRef = useRef(null);
    const resumeAnalysisRef = useRef(null);

    // Analysis sections that will be displayed for a resume
    const analysisSections = [
        { id: 'overview', label: 'Overview', icon: 'document-text' },
        { id: 'skills', label: 'Skills', icon: 'code' },
        { id: 'experience', label: 'Experience', icon: 'briefcase' },
        { id: 'education', label: 'Education', icon: 'graduation-cap' },
        { id: 'recommendations', label: 'Recommendations', icon: 'star' }
    ];
    
    const [activeSection, setActiveSection] = useState('overview');

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

    const handleFileUpload = () => {
        fileInputRef.current?.click();
    };

    // Simulated file upload
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        
        // Simulate file upload and getting an ID
        setTimeout(() => {
            // In a real app, this would be the ID returned from the server
            const mockDocumentId = '1VbMpOHUfOy8zcpJ4mD0xLr2h8MhA1mWW';
            setDocumentId(mockDocumentId);
            setActiveResume({
                name: file.name,
                size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
                type: file.type,
                id: mockDocumentId
            });
            
            // Add message about the uploaded file
            const userMessage = {
                text: `I'd like to analyze this resume: ${file.name}`,
                isBot: false,
                timestamp: new Date(),
                attachment: {
                    name: file.name,
                    type: file.type,
                    size: (file.size / 1024 / 1024).toFixed(2) + ' MB'
                }
            };
            
            setMessages(prev => [...prev, userMessage]);
            setIsUploading(false);
            
            // Automatically analyze the resume after upload
            analyzeResume(mockDocumentId);
        }, 1500);
        
        // Reset the file input
        e.target.value = null;
    };

    // Handle analyzing a resume with a document ID
    const analyzeResume = async (id = null) => {
        if (isSending) return;
        
        const resumeId = id || documentId;
        if (!resumeId) {
            setMessages(prev => [...prev, {
                text: "Please upload a resume or provide a document ID first.",
                isBot: true,
                timestamp: new Date(),
                type: 'error'
            }]);
            return;
        }
        
        setIsTyping(true);
        setIsSending(true);
        
        try {
            // Bot message indicating analysis is starting
            setMessages(prev => [...prev, {
                text: `Analyzing resume with ID: ${resumeId}...`,
                isBot: true,
                timestamp: new Date(),
                type: 'status'
            }]);
            
            // Call the resume analysis webhook
            const response = await axios.post('https://n8n.srv810548.hstgr.cloud/webhook/analyze-resume', {
                id: resumeId
            });
            
            // Process the response to extract the content properly
            let analysisResult = {};
            
            if (typeof response.data === 'string') {
                analysisResult = { overview: response.data };
            } else if (response.data && typeof response.data === 'object') {
                if (response.data.output) {
                    const outputContent = response.data.output;
                    
                    if (typeof outputContent === 'string') {
                        analysisResult = { overview: outputContent };
                    } else if (typeof outputContent === 'object') {
                        // If we have structured data, use it
                        analysisResult = outputContent;
                    }
                } else if (response.data.error) {
                    throw new Error(response.data.error);
                } else {
                    // Try to extract meaningful content from the response
                    analysisResult = response.data;
                }
            } else {
                throw new Error("Received invalid response format");
            }
            
            // Set the active resume analysis data
            setActiveResume(prev => ({
                ...prev,
                analysis: analysisResult
            }));
            
            // Add a summary message
            const summary = analysisResult.overview || 
                            "I've analyzed the resume and found some insights. Check the analysis sidebar for details.";
            
            setTimeout(() => {
                setMessages(prev => [...prev, {
                    text: summary,
                    isBot: true,
                    timestamp: new Date(),
                    type: 'analysis'
                }]);
                setIsTyping(false);
                setIsSending(false);
            }, 1000);
            
        } catch (error) {
            console.error('Error analyzing resume:', error);
            
            // Enhanced error logging
            if (error.response) {
                console.error('Response data:', error.response.data);
                console.error('Response status:', error.response.status);
            } else if (error.request) {
                console.error('Request made but no response received:', error.request);
            } else {
                console.error('Error details:', error.message);
            }
            
            setMessages(prev => [...prev, {
                text: `Error analyzing resume: ${error.message || "An unknown error occurred. Please try again."}`,
                isBot: true,
                timestamp: new Date(),
                type: 'error'
            }]);
            setIsTyping(false);
            setIsSending(false);
        }
    };

    const handleSendMessage = async (e) => {
        e?.preventDefault();
        
        if (!inputMessage.trim() || isSending) return;

        // Check if the input is a document ID
        const idPattern = /^[a-zA-Z0-9_-]{20,}$/;
        
        // Add user message
        const userMessage = { 
            text: inputMessage, 
            isBot: false, 
            timestamp: new Date()
        };
        
        setMessages(prev => [...prev, userMessage]);
        
        // If it looks like a document ID, use it for analysis
        if (idPattern.test(inputMessage.trim())) {
            setDocumentId(inputMessage.trim());
            setInputMessage('');
            
            // Start resume analysis
            setTimeout(() => {
                analyzeResume(inputMessage.trim());
            }, 500);
            return;
        }
        
        // Handle as a regular question
        setInputMessage('');
        setIsTyping(true);
        setIsSending(true);

        try {
            // If we have an active resume, we can process questions about it
            if (activeResume) {
                // In a real app, you'd send the question to your API along with the resume ID
                setTimeout(() => {
                    setMessages(prev => [...prev, {
                        text: `I can analyze this resume but can't answer specific questions about it yet. Please check the analysis sections.`,
                        isBot: true,
                        timestamp: new Date()
                    }]);
                    setIsTyping(false);
                    setIsSending(false);
                }, 1000);
            } else {
                // No active resume
                setTimeout(() => {
                    setMessages(prev => [...prev, {
                        text: "Please upload a resume or provide a resume ID first so I can help you analyze it.",
                        isBot: true,
                        timestamp: new Date()
                    }]);
                    setIsTyping(false);
                    setIsSending(false);
                }, 1000);
            }
        } catch (error) {
            console.error('Error:', error);
            
            setTimeout(() => {
                setMessages(prev => [...prev, {
                    text: "Sorry, I encountered an error. Please try again.",
                    isBot: true,
                    timestamp: new Date(),
                    type: 'error'
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

    // Change the active analysis section
    const handleSectionChange = (sectionId) => {
        setActiveSection(sectionId);
    };

    // Format timestamp to readable time
    const formatTime = (date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Custom renderer for message content
    const renderMessageContent = (text, isBot, message) => {
        if (!isBot) {
            if (message.attachment) {
                return (
                    <div className="resume-message-content">
                        <div className="resume-attachment">
                            <div className="resume-attachment-icon">
                                <svg className="resume-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14 2 14 8 20 8"></polyline>
                                </svg>
                            </div>
                            <div className="resume-attachment-details">
                                <div className="resume-attachment-name">{message.attachment.name}</div>
                                <div className="resume-attachment-info">
                                    {message.attachment.type} • {message.attachment.size}
                                </div>
                            </div>
                        </div>
                        <div className="resume-message-text">{text}</div>
                    </div>
                );
            }
            
            return <div className="resume-message-content">{text}</div>;
        }
        
        // Render bot message with markdown
        return (
            <div className={`resume-message-content ${message.type ? `message-type-${message.type}` : ''}`}>
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

    // Helper to render the appropriate icon
    const renderIcon = (iconName) => {
        switch (iconName) {
            case 'document-text':
                return (
                    <svg className="resume-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                );
            case 'code':
                return (
                    <svg className="resume-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="16 18 22 12 16 6"></polyline>
                        <polyline points="8 6 2 12 8 18"></polyline>
                    </svg>
                );
            case 'briefcase':
                return (
                    <svg className="resume-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                    </svg>
                );
            case 'graduation-cap':
                return (
                    <svg className="resume-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                        <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"></path>
                    </svg>
                );
            case 'star':
                return (
                    <svg className="resume-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                );
            default:
                return null;
        }
    };

    // Render the resume analysis sidebar
    const renderAnalysisSidebar = () => {
        if (!activeResume || !activeResume.analysis) {
            return (
                <div className="resume-no-analysis">
                    <svg className="resume-icon large" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <h3>No Resume Analysis</h3>
                    <p>Upload a resume or provide a document ID to see the analysis here.</p>
                    <button 
                        className="resume-upload-btn"
                        onClick={handleFileUpload}
                    >
                        Upload Resume
                    </button>
                </div>
            );
        }

        // Get content for the active section
        const sectionContent = activeResume.analysis[activeSection] || 
                              "No information available for this section.";

        return (
            <div className="resume-analysis-container">
                <div className="resume-details">
                    <h3>Resume Analysis</h3>
                    {activeResume.name && (
                        <div className="resume-file-details">
                            <svg className="resume-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                            </svg>
                            <div>
                                <div className="resume-name">{activeResume.name}</div>
                                <div className="resume-meta">{activeResume.size}</div>
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="resume-analysis-tabs">
                    {analysisSections.map(section => (
                        <button
                            key={section.id}
                            className={`resume-tab-btn ${activeSection === section.id ? 'active' : ''}`}
                            onClick={() => handleSectionChange(section.id)}
                        >
                            {renderIcon(section.icon)}
                            {section.label}
                        </button>
                    ))}
                </div>
                
                <div className="resume-analysis-content">
                    <h4>{analysisSections.find(s => s.id === activeSection)?.label || 'Content'}</h4>
                    <div className="resume-section-content">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {sectionContent}
                        </ReactMarkdown>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="resume-chat-container">
            <div className="resume-chat-main">
                <div className="resume-chat-header">
                    <div className="resume-header-title">
                        <svg className="resume-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                        <h2>Resume Analyzer</h2>
                    </div>
                    <div className="resume-status">
                        <span className="resume-status-indicator"></span>
                        {isTyping ? 'Analyzing...' : isUploading ? 'Uploading...' : 'Ready'}
                    </div>
                </div>
                
                <div className="resume-messages-container">
                    <div className="resume-message-wrapper">
                        <AnimatePresence>
                            {messages.map((message, index) => (
                                <motion.div
                                    key={index}
                                    className={`resume-message ${message.isBot ? 'bot' : 'user'} ${message.type ? `type-${message.type}` : ''}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="resume-message-meta">
                                        <div className="resume-message-sender">
                                            {message.isBot ? 'Resume Analyzer' : 'You'}
                                        </div>
                                        <div className="resume-message-time">
                                            {formatTime(message.timestamp)}
                                        </div>
                                    </div>
                                    <div className="resume-message-bubble">
                                        {renderMessageContent(message.text, message.isBot, message)}
                                    </div>
                                </motion.div>
                            ))}

                            {isTyping && (
                                <motion.div 
                                    className="resume-typing-indicator"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <div className="resume-typing-content">
                                        <div className="resume-typing-dots">
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

                <form onSubmit={handleSendMessage} className="resume-input-form">
                    <div className="resume-input-container">
                        <button 
                            type="button" 
                            className="resume-upload-button"
                            onClick={handleFileUpload}
                            disabled={isSending || isUploading}
                            aria-label="Upload resume"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="17 8 12 3 7 8"></polyline>
                                <line x1="12" y1="3" x2="12" y2="15"></line>
                            </svg>
                        </button>
                        <textarea
                            ref={inputRef}
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={activeResume ? "Ask about this resume or enter another document ID..." : "Enter a resume document ID or upload a resume..."}
                            className="resume-input"
                            rows={1}
                            disabled={isSending || isUploading}
                        />
                        <button 
                            type="submit" 
                            className="resume-send-button"
                            disabled={!inputMessage.trim() || isSending || isUploading}
                            aria-label="Send message"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                            </svg>
                        </button>
                    </div>
                    <div className="resume-input-hint">
                        Upload a resume or enter a document ID like "1VbMpOHUfOy8zcpJ4mD0xLr2h8MhA1mWW"
                    </div>
                </form>
            </div>
            
            <div className="resume-analysis-sidebar" ref={resumeAnalysisRef}>
                {renderAnalysisSidebar()}
            </div>
            
            {/* Hidden file input */}
            <input 
                ref={fileInputRef}
                type="file" 
                style={{ display: 'none' }}
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx"
            />
        </div>
    );
};

export default ResumeAnalyzerChat; 