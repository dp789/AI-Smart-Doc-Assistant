import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './MCPAnalyticsChat.css';

const MCPAnalyticsChat = () => {
    const [messages, setMessages] = useState([
        { 
            text: "📊 Welcome to MCP Analytics! I can help you analyze data and generate insights. What would you like to explore today?", 
            isBot: true, 
            timestamp: new Date() 
        }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedMetric, setSelectedMetric] = useState(null);
    const [dataFilter, setDataFilter] = useState('all');
    const [timeRange, setTimeRange] = useState('7d');
    const [theme, setTheme] = useState('light');
    
    const messagesEndRef = useRef(null);
    const chartContainerRef = useRef(null);
    
    // Sample analytics metrics
    const availableMetrics = [
        { id: 'users', name: 'User Activity', icon: 'users' },
        { id: 'performance', name: 'System Performance', icon: 'activity' },
        { id: 'storage', name: 'Storage Usage', icon: 'database' },
        { id: 'traffic', name: 'Network Traffic', icon: 'globe' },
        { id: 'errors', name: 'Error Rates', icon: 'alert-circle' }
    ];
    
    // Sample time range options
    const timeRanges = [
        { id: '24h', name: 'Last 24 Hours' },
        { id: '7d', name: 'Last 7 Days' },
        { id: '30d', name: 'Last 30 Days' },
        { id: '90d', name: 'Last 90 Days' },
        { id: 'custom', name: 'Custom Range' }
    ];
    
    // Scroll to bottom of messages
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Handle sending a message
    const handleSendMessage = async (e) => {
        e?.preventDefault();
        
        if (!inputMessage.trim() || loading) return;
        
        // Add user message
        const userMessage = { 
            text: inputMessage, 
            isBot: false, 
            timestamp: new Date() 
        };
        
        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setLoading(true);
        
        try {
            // Check if message is about a specific metric
            const metricKeywords = availableMetrics.flatMap(metric => 
                [metric.name.toLowerCase(), metric.id.toLowerCase()]
            );
            
            const userMessageLower = inputMessage.toLowerCase();
            const mentionedMetric = availableMetrics.find(metric => 
                userMessageLower.includes(metric.name.toLowerCase()) || 
                userMessageLower.includes(metric.id.toLowerCase())
            );
            
            if (mentionedMetric) {
                setSelectedMetric(mentionedMetric.id);
            }
            
            // Call the MCP analytics webhook
            const response = await axios.post('https://primary-production-1e6cb.up.railway.app/webhook/mcp-analytics', {
                query: inputMessage,
                metric: mentionedMetric?.id || selectedMetric,
                timeRange: timeRange,
                filter: dataFilter
            });
            
            // Process the response
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
                                botResponse = JSON.stringify(outputContent, null, 2);
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
            
            // Add bot message after a brief delay to simulate thinking
            setTimeout(() => {
                setMessages(prev => [...prev, {
                    text: botResponse,
                    isBot: true,
                    timestamp: new Date(),
                    metric: mentionedMetric?.id
                }]);
                setLoading(false);
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
                    text: "I encountered an error while fetching analytics data. Please try again or rephrase your query.",
                    isBot: true,
                    timestamp: new Date(),
                    isError: true
                }]);
                setLoading(false);
            }, 1000);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Handle clicking on a metric
    const handleMetricClick = (metric) => {
        setSelectedMetric(metric.id);
        setInputMessage(`Show me analytics for ${metric.name}`);
        setTimeout(() => handleSendMessage(), 100);
    };

    // Handle changing time range
    const handleTimeRangeChange = (range) => {
        setTimeRange(range);
        if (selectedMetric) {
            const metric = availableMetrics.find(m => m.id === selectedMetric);
            setInputMessage(`Show me ${metric.name} analytics for the ${timeRanges.find(r => r.id === range).name}`);
            setTimeout(() => handleSendMessage(), 100);
        }
    };

    // Format timestamp
    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };
    
    // Format date for headers
    const formatDate = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString(undefined, { 
            weekday: 'long', 
            month: 'short', 
            day: 'numeric' 
        });
    };
    
    // Group messages by date
    const getMessagesByDate = () => {
        const groups = {};
        
        messages.forEach(message => {
            const date = new Date(message.timestamp).toDateString();
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(message);
        });
        
        return Object.entries(groups).map(([date, messages]) => ({
            date,
            messages
        }));
    };

    // Helper function to render icons
    const renderIcon = (iconName) => {
        switch (iconName) {
            case 'users':
                return (
                    <svg className="analytics-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                );
            case 'activity':
                return (
                    <svg className="analytics-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                    </svg>
                );
            case 'database':
                return (
                    <svg className="analytics-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
                        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
                    </svg>
                );
            case 'globe':
                return (
                    <svg className="analytics-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="2" y1="12" x2="22" y2="12"></line>
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                    </svg>
                );
            case 'alert-circle':
                return (
                    <svg className="analytics-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                );
            case 'send':
                return (
                    <svg className="analytics-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                );
            default:
                return null;
        }
    };

    // Custom renderer for message content
    const renderMessageContent = (message) => {
        if (!message.isBot) {
            return <div className="analytics-message-text">{message.text}</div>;
        }
        
        return (
            <div className="analytics-message-content">
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
                            table: ({node, ...props}) => <div className="table-wrapper"><table className="markdown-table" {...props} /></div>,
                            a: ({node, ...props}) => <a className="markdown-link" target="_blank" rel="noopener noreferrer" {...props} />
                        }}
                    >
                        {message.text}
                    </ReactMarkdown>
                </div>
                
                {message.metric && (
                    <div ref={chartContainerRef} className="analytics-chart-placeholder">
                        <div className="chart-header">
                            <h4>{availableMetrics.find(m => m.id === message.metric)?.name} Visualization</h4>
                            <span className="chart-time-range">{timeRanges.find(r => r.id === timeRange)?.name}</span>
                        </div>
                        <div className="chart-content">
                            <div className="chart-visual">
                                <div className="chart-bar-container">
                                    <div className="chart-bar" style={{ height: '60%' }}></div>
                                    <div className="chart-bar" style={{ height: '80%' }}></div>
                                    <div className="chart-bar" style={{ height: '40%' }}></div>
                                    <div className="chart-bar" style={{ height: '70%' }}></div>
                                    <div className="chart-bar" style={{ height: '90%' }}></div>
                                    <div className="chart-bar" style={{ height: '50%' }}></div>
                                    <div className="chart-bar" style={{ height: '65%' }}></div>
                                </div>
                            </div>
                            <div className="chart-legend">
                                <div className="legend-item">
                                    <span className="legend-color" style={{ backgroundColor: 'var(--analytics-primary)' }}></span>
                                    <span className="legend-label">Current</span>
                                </div>
                                <div className="legend-item">
                                    <span className="legend-color" style={{ backgroundColor: 'var(--analytics-secondary)' }}></span>
                                    <span className="legend-label">Previous Period</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const messageGroups = getMessagesByDate();

    return (
        <div className={`analytics-container ${theme}`}>
            <div className="analytics-sidebar">
                <div className="analytics-logo">
                    <div className="logo-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                        </svg>
                    </div>
                    <h1>MCP Analytics</h1>
                </div>
                
                <div className="metrics-container">
                    <h2>Analytics Metrics</h2>
                    <div className="metrics-list">
                        {availableMetrics.map(metric => (
                            <div 
                                key={metric.id} 
                                className={`metric-item ${selectedMetric === metric.id ? 'active' : ''}`}
                                onClick={() => handleMetricClick(metric)}
                            >
                                <div className="metric-icon">
                                    {renderIcon(metric.icon)}
                                </div>
                                <div className="metric-name">{metric.name}</div>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="time-range-selector">
                    <h2>Time Range</h2>
                    <div className="time-range-options">
                        {timeRanges.map(range => (
                            <div 
                                key={range.id} 
                                className={`time-range-option ${timeRange === range.id ? 'active' : ''}`}
                                onClick={() => handleTimeRangeChange(range.id)}
                            >
                                {range.name}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            
            <div className="analytics-main">
                <div className="analytics-header">
                    <h2>Data Analytics Chat</h2>
                    <div className="analytics-filters">
                        <div className="filter-label">Data Filter:</div>
                        <select 
                            value={dataFilter} 
                            onChange={(e) => setDataFilter(e.target.value)}
                            className="filter-select"
                        >
                            <option value="all">All Data</option>
                            <option value="production">Production Only</option>
                            <option value="testing">Testing Only</option>
                            <option value="development">Development Only</option>
                        </select>
                    </div>
                </div>
                
                <div className="analytics-chat">
                    <div className="messages-container">
                        {messageGroups.map((group, groupIndex) => (
                            <div key={groupIndex} className="message-group">
                                <div className="date-divider">
                                    <span>{formatDate(new Date(group.date))}</span>
                                </div>
                                
                                <AnimatePresence>
                                    {group.messages.map((message, messageIndex) => (
                                        <motion.div 
                                            key={`${groupIndex}-${messageIndex}`}
                                            className={`message ${message.isBot ? 'bot' : 'user'} ${message.isError ? 'error' : ''}`}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <div className="message-info">
                                                <span className="message-sender">
                                                    {message.isBot ? 'Analytics AI' : 'You'}
                                                </span>
                                                <span className="message-time">
                                                    {formatTime(message.timestamp)}
                                                </span>
                                            </div>
                                            
                                            <div className="message-bubble">
                                                {renderMessageContent(message)}
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        ))}
                        
                        {loading && (
                            <motion.div 
                                className="typing-indicator"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <div className="typing-dot"></div>
                                <div className="typing-dot"></div>
                                <div className="typing-dot"></div>
                            </motion.div>
                        )}
                        
                        <div ref={messagesEndRef} />
                    </div>
                    
                    <form onSubmit={handleSendMessage} className="input-form">
                        <div className="input-container">
                            <input
                                type="text"
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask about analytics data..."
                                className="chat-input"
                                disabled={loading}
                            />
                            <button 
                                type="submit" 
                                className="send-button"
                                disabled={!inputMessage.trim() || loading}
                            >
                                {renderIcon('send')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default MCPAnalyticsChat; 