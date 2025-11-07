import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Chip,
  Divider,
  Alert,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Slider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Send,
  Clear,
  Settings,
  ExpandMore,
  ContentCopy,
  CheckCircle,
  Error,
  Info,
  SmartToy,
  Psychology,
  AutoAwesome,
  Science,
} from '@mui/icons-material';
import './TestChatBot.css';

const TestChatBot = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiError, setApiError] = useState('');
  const [copiedMessage, setCopiedMessage] = useState(null);
  const [bypassMode, setBypassMode] = useState(sessionStorage.getItem('bypass_auth') === 'true');
  
  // API Configuration
  const [apiConfig, setApiConfig] = useState({
    workspace_id: 'f60e7a99-38bf-43c8-af15-e5ea0b9862a4',
    document_category: 'training-documents',
    max_context_chunks: 5,
    temperature: 0.7,
    model: 'gpt-4o',
    include_sources: true,
    document_id: ''
  });

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`;
    }
  }, [inputMessage]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || isSending) return;

    // Add user message
    const userMessage = { 
      text: inputMessage, 
      isBot: false, 
      timestamp: new Date(),
      role: 'user'
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);
    setIsSending(true);
    setApiError('');

    // Reset input field height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    try {
      // Prepare conversation history
      const conversationHistory = messages
        .filter(msg => msg.role === 'user' || msg.role === 'assistant')
        .map(msg => ({
          role: msg.role,
          content: msg.text
        }));

      // Call the backend API directly
      const response = await axios.post('http://localhost:8090/api/chatbot/my-chat-bot', {
        message: inputMessage,
        workspace_id: apiConfig.workspace_id,
        document_category: apiConfig.document_category,
        conversation_history: conversationHistory,
        max_context_chunks: apiConfig.max_context_chunks,
        temperature: apiConfig.temperature,
        model: apiConfig.model,
        include_sources: apiConfig.include_sources,
        document_id: apiConfig.document_id
      }, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Process the response
      let botResponse = '';
      let formattedResponse = '';
      let sources = [];
      let responseMetadata = {};
      let searchContext = {};
      
      // Handle backend API response format
      if (response.data && response.data.success) {
        // Handle the new external API response structure
        if (response.data.response && typeof response.data.response === 'object') {
          botResponse = response.data.response.text || response.data.response || 'No response received';
          formattedResponse = response.data.response.formatted_text || response.data.response.text || botResponse;
          responseMetadata = {
            model_used: response.data.model_used,
            temperature: response.data.temperature,
            context_chunks_used: response.data.context_chunks_used,
            total_context_length: response.data.total_context_length,
            conversation_turn: response.data.conversation_turn,
            word_count: response.data.response?.word_count,
            has_lists: response.data.response?.has_lists,
            has_code: response.data.response?.has_code,
            has_headers: response.data.response?.has_headers,
            key_points: response.data.response?.key_points || [],
            code_snippets: response.data.response?.code_snippets || []
          };
          searchContext = response.data.search_context || {};
        } else {
          // Fallback for simple response format
        botResponse = response.data.response || response.data.message || 'No response received';
          formattedResponse = botResponse;
        }
        sources = response.data.sources || [];
      } else if (typeof response.data === 'string') {
        botResponse = response.data;
        formattedResponse = response.data;
      } else if (response.data && typeof response.data === 'object') {
        // Handle different response formats
        if (response.data.response) {
          botResponse = response.data.response;
          formattedResponse = response.data.response;
        } else if (response.data.answer) {
          botResponse = response.data.answer;
          formattedResponse = response.data.answer;
        } else if (response.data.message) {
          botResponse = response.data.message;
          formattedResponse = response.data.message;
        } else if (response.data.content) {
          botResponse = response.data.content;
          formattedResponse = response.data.content;
        } else {
          botResponse = JSON.stringify(response.data);
          formattedResponse = botResponse;
        }
        
        // Extract sources if available
        if (response.data.sources) {
          sources = response.data.sources;
        } else if (response.data.references) {
          sources = response.data.references;
        }
      }

      // Add bot response
      const botMessage = { 
        text: botResponse, 
        formattedText: formattedResponse,
        isBot: true, 
        timestamp: new Date(),
        role: 'assistant',
        sources: sources,
        metadata: responseMetadata,
        searchContext: searchContext
      };
      
      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      console.error('API Error:', error);
      
      let errorMessage = '';
      if (error.code === 'ECONNREFUSED' || error.message.includes('timeout')) {
        errorMessage = '❌ Backend Server Not Running: Please start your backend server';
        setApiError('Backend server is not running. Please start your backend server first.');
      } else if (error.response?.status === 404) {
        errorMessage = '❌ API Endpoint Not Found: Check if the chatbot endpoint exists';
        setApiError('API endpoint not found. Please verify the backend is running.');
      } else if (error.response?.status >= 500) {
        errorMessage = `❌ Server Error: ${error.response.status} - ${error.response.statusText}`;
        setApiError(`Server error: ${error.response.status}`);
      } else {
        errorMessage = `❌ Error: ${error.response?.data?.message || error.message || 'Failed to get response from backend'}`;
        setApiError(error.response?.data?.message || error.message || 'Failed to get response from backend');
      }
      
      const errorResponse = { 
        text: errorMessage, 
        isBot: true, 
        timestamp: new Date(),
        role: 'assistant',
        isError: true
      };
      
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
      setIsSending(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setApiError('');
  };

  const handleCopyMessage = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedMessage(text);
    setTimeout(() => setCopiedMessage(null), 2000);
  };

  const handleConfigChange = (field, value) => {
    setApiConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const renderMessage = (message, index) => (
    <Box
      key={index}
      sx={{
        display: 'flex',
        justifyContent: message.isBot ? 'flex-start' : 'flex-end',
        mb: 2,
        animation: 'fadeIn 0.3s ease-in'
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 3,
          maxWidth: '80%',
          background: message.isBot 
            ? (message.isError 
                ? 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)' 
                : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
              ) 
            : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
          borderRadius: message.isBot ? '24px 24px 24px 8px' : '24px 24px 8px 24px',
          border: message.isError ? '1px solid #ef4444' : '1px solid #e2e8f0',
          position: 'relative',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
            transform: 'translateY(-1px)'
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          {message.isBot && (
            <Box sx={{ mt: 0.5 }}>
              {message.isError ? (
                <Error color="error" sx={{ fontSize: '1.2rem' }} />
              ) : (
                <SmartToy color="primary" sx={{ fontSize: '1.2rem' }} />
              )}
            </Box>
          )}
          <Box sx={{ flex: 1 }}>
            {/* Response Text - Use formatted text if available */}
            <Box
              sx={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                color: message.isBot 
                  ? (message.isError ? '#dc2626' : '#1e293b')
                  : 'white',
                lineHeight: 1.6,
                fontWeight: 400,
                '& p': { margin: '0.75rem 0', color: 'inherit' },
                '& ul, & ol': { margin: '0.75rem 0', paddingLeft: '1.5rem', color: 'inherit' },
                '& code': { 
                  backgroundColor: message.isBot ? '#f1f5f9' : 'rgba(255,255,255,0.2)', 
                  padding: '0.25rem 0.5rem', 
                  borderRadius: '0.375rem',
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  color: message.isBot ? '#1e293b' : 'white'
                },
                '& pre': { 
                  backgroundColor: message.isBot ? '#f1f5f9' : 'rgba(255,255,255,0.1)', 
                  padding: '1rem', 
                  borderRadius: '0.75rem',
                  overflow: 'auto',
                  margin: '0.75rem 0',
                  border: message.isBot ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.2)'
                }
              }}
              dangerouslySetInnerHTML={{ 
                __html: message.formattedText || message.text 
              }}
            />
            
            {/* Response Metadata - Compact Single Line */}
            {message.metadata && Object.keys(message.metadata).length > 0 && (
              <Box sx={{ 
                mt: 1.5, 
                p: 1.5, 
                background: message.isBot 
                  ? 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)'
                  : 'rgba(255,255,255,0.1)',
                borderRadius: '12px',
                border: message.isBot ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.2)',
                backdropFilter: message.isBot ? 'none' : 'blur(10px)'
              }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1.5,
                  flexWrap: 'wrap'
                }}>
                  <Typography sx={{ 
                    fontSize: '0.7rem', 
                    fontWeight: 700, 
                    color: message.isBot ? '#64748b' : 'rgba(255,255,255,0.8)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    mr: 1
                  }}>
                    Response Details:
                  </Typography>
                  
                  {message.metadata.model_used && (
                    <Chip 
                      label={`Model: ${message.metadata.model_used}`} 
                      size="small" 
                      sx={{
                        background: message.isBot ? '#6366f1' : 'rgba(99, 102, 241, 0.2)',
                        color: message.isBot ? 'white' : '#6366f1',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        height: '24px'
                      }}
                    />
                  )}
                  
                  {message.metadata.temperature && (
                    <Chip 
                      label={`Temp: ${message.metadata.temperature}`} 
                      size="small" 
                      sx={{
                        background: message.isBot ? '#10b981' : 'rgba(16, 185, 129, 0.2)',
                        color: message.isBot ? 'white' : '#10b981',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        height: '24px'
                      }}
                    />
                  )}
                  
                  {message.metadata.context_chunks_used && (
                    <Chip 
                      label={`Chunks: ${message.metadata.context_chunks_used}`} 
                      size="small" 
                      sx={{
                        background: message.isBot ? '#f59e0b' : 'rgba(245, 158, 11, 0.2)',
                        color: message.isBot ? 'white' : '#f59e0b',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        height: '24px'
                      }}
                    />
                  )}
                  
                  {message.metadata.word_count && (
                    <Chip 
                      label={`Words: ${message.metadata.word_count}`} 
                      size="small" 
                      sx={{
                        background: message.isBot ? '#8b5cf6' : 'rgba(139, 92, 246, 0.2)',
                        color: message.isBot ? 'white' : '#8b5cf6',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        height: '24px'
                      }}
                    />
                  )}
                  
                  {message.metadata.conversation_turn && (
                    <Chip 
                      label={`Turn: ${message.metadata.conversation_turn}`} 
                      size="small" 
                      sx={{
                        background: message.isBot ? '#06b6d4' : 'rgba(6, 182, 212, 0.2)',
                        color: message.isBot ? 'white' : '#06b6d4',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        height: '24px'
                      }}
                    />
                  )}
                </Box>
              </Box>
            )}
            
            {/* Search Context - Compact Single Line */}
            {message.searchContext && Object.keys(message.searchContext).length > 0 && (
              <Box sx={{ 
                mt: 1, 
                p: 1.5, 
                background: message.isBot 
                  ? 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)'
                  : 'rgba(59, 130, 246, 0.1)',
                borderRadius: '12px',
                border: message.isBot ? '1px solid #93c5fd' : '1px solid rgba(59, 130, 246, 0.2)',
                backdropFilter: message.isBot ? 'none' : 'blur(10px)'
              }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1.5,
                  flexWrap: 'wrap'
                }}>
                  <Typography sx={{ 
                    fontSize: '0.7rem', 
                    fontWeight: 700, 
                    color: message.isBot ? '#1e40af' : 'rgba(255,255,255,0.8)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    mr: 1
                  }}>
                    Search Context:
                  </Typography>
                  
                  {message.searchContext.chunks_found && (
                    <Chip 
                      label={`Found: ${message.searchContext.chunks_found} chunks`} 
                      size="small" 
                      sx={{
                        background: message.isBot ? '#3b82f6' : 'rgba(59, 130, 246, 0.2)',
                        color: message.isBot ? 'white' : '#3b82f6',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        height: '24px'
                      }}
                    />
                  )}
                  
                  {message.searchContext.chunks_used && (
                    <Chip 
                      label={`Used: ${message.searchContext.chunks_used} chunks`} 
                      size="small" 
                      sx={{
                        background: message.isBot ? '#1d4ed8' : 'rgba(29, 78, 216, 0.2)',
                        color: message.isBot ? 'white' : '#1d4ed8',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        height: '24px'
                      }}
                    />
                  )}
                  
                  {message.searchContext.average_relevance_score && (
                    <Chip 
                      label={`Relevance: ${(message.searchContext.average_relevance_score * 100).toFixed(1)}%`} 
                      size="small" 
                      sx={{
                        background: message.isBot ? '#1e40af' : 'rgba(30, 64, 175, 0.2)',
                        color: message.isBot ? 'white' : '#1e40af',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        height: '24px'
                      }}
                    />
                  )}
                </Box>
              </Box>
            )}
            
            {/* Sources - Compact Single Line */}
            {message.sources && message.sources.length > 0 && (
              <Box sx={{ 
                mt: 1, 
                p: 1.5, 
                background: message.isBot 
                  ? 'linear-gradient(135deg, #fefce8 0%, #fef3c7 100%)'
                  : 'rgba(245, 158, 11, 0.1)',
                borderRadius: '12px',
                border: message.isBot ? '1px solid #fde68a' : '1px solid rgba(245, 158, 11, 0.2)',
                backdropFilter: message.isBot ? 'none' : 'blur(10px)'
              }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1.5,
                  flexWrap: 'wrap'
                }}>
                  <Typography sx={{ 
                    fontSize: '0.7rem', 
                    fontWeight: 700, 
                    color: message.isBot ? '#92400e' : 'rgba(255,255,255,0.8)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    mr: 1
                  }}>
                    Sources ({message.sources.length}):
                  </Typography>
                  
                  {message.sources.map((source, idx) => (
                    <Chip
                      key={idx}
                      label={`Page Number: ${source.page_number || `Source ${idx + 1}`}`}
                      size="small"
                      sx={{
                        background: message.isBot ? '#f59e0b' : 'rgba(245, 158, 11, 0.2)',
                        color: message.isBot ? 'white' : '#f59e0b',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        height: '24px',
                        '&:hover': {
                          background: message.isBot ? '#d97706' : 'rgba(245, 158, 11, 0.3)',
                        }
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}
            
            <Typography
              variant="caption"
              sx={{ 
                display: 'block', 
                mt: 1.5, 
                fontSize: '0.75rem',
                textAlign: 'right',
                color: message.isBot ? '#94a3b8' : 'rgba(255,255,255,0.7)',
                fontWeight: 500
              }}
            >
              {message.timestamp.toLocaleTimeString()}
            </Typography>
          </Box>
          
          <Tooltip title={copiedMessage === message.text ? "Copied!" : "Copy message"}>
            <IconButton
              size="small"
              onClick={() => handleCopyMessage(message.formattedText || message.text)}
              sx={{ 
                opacity: 0.6, 
                background: message.isBot ? '#f1f5f9' : 'rgba(255,255,255,0.1)',
                borderRadius: '8px',
                transition: 'all 0.2s ease',
                '&:hover': { 
                  opacity: 1,
                  background: message.isBot ? '#6366f1' : 'rgba(255,255,255,0.2)',
                  transform: 'scale(1.05)'
                }
              }}
            >
              {copiedMessage === (message.formattedText || message.text) ? 
                <CheckCircle sx={{ color: message.isBot ? '#10b981' : 'white', fontSize: '1rem' }} /> : 
                <ContentCopy sx={{ color: message.isBot ? '#64748b' : 'white', fontSize: '1rem' }} />
              }
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>
    </Box>
  );

  return (
    <Box sx={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif'
    }}>
      {/* Header */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          borderRadius: 0, 
          borderBottom: '1px solid #e2e8f0',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2,
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              borderRadius: '16px',
              color: 'white',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}>
              <Science sx={{ fontSize: '1.5rem' }} />
              <Typography variant="h5" fontWeight="700" sx={{ color: 'white' }}>
                Test ChatBot
              </Typography>
            </Box>
            <Chip 
              label="API Testing" 
              sx={{ 
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                fontWeight: 600,
                boxShadow: '0 2px 4px -1px rgb(0 0 0 / 0.1)'
              }}
              size="small"
              icon={<AutoAwesome sx={{ color: 'white' }} />}
            />
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={bypassMode}
                  onChange={(e) => {
                    const newBypassMode = e.target.checked;
                    setBypassMode(newBypassMode);
                    if (newBypassMode) {
                      sessionStorage.setItem('bypass_auth', 'true');
                    } else {
                      sessionStorage.removeItem('bypass_auth');
                    }
                    // Reload to apply bypass mode changes
                    window.location.reload();
                  }}
                  color="primary"
                />
              }
              label="Demo Mode"
              sx={{ mr: 2 }}
            />
            <Tooltip title="Settings">
              <IconButton 
                onClick={() => setShowSettings(!showSettings)}
                color={showSettings ? 'primary' : 'default'}
              >
                <Settings />
              </IconButton>
            </Tooltip>
            <Tooltip title="Clear Chat">
              <IconButton onClick={handleClearChat} color="error">
                <Clear />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

      {/* Settings Panel */}
      {showSettings && (
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            m: 2, 
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
          }}
        >
          <Typography 
            variant="h6" 
            gutterBottom
            sx={{
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontWeight: 700,
              fontSize: '1.25rem'
            }}
          >
            API Configuration
          </Typography>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 4, mt: 4 }}>
            <TextField
              sx={{ mt: 1 }}
              label="Workspace ID"
              value={apiConfig.workspace_id}
              onChange={(e) => handleConfigChange('workspace_id', e.target.value)}
              fullWidth
              size="small"
            />
            
            <TextField
              sx={{ mt: 1 }}
              label="Document Category"
              value={apiConfig.document_category}
              onChange={(e) => handleConfigChange('document_category', e.target.value)}
              fullWidth
              size="small"
            />

            <TextField
              sx={{ mt: 1 }}
              label="Document ID"
              value={apiConfig.document_id}
              onChange={(e) => handleConfigChange('document_id', e.target.value)}
              fullWidth
              size="small"
            />
            
            <FormControl fullWidth size="small">
              <InputLabel sx={{ mt: 1 }}>Model</InputLabel>
              <Select
                value={apiConfig.model}
                onChange={(e) => handleConfigChange('model', e.target.value)}
                label="Model"
              >
                <MenuItem value="gpt-4o">GPT-4o Mini</MenuItem>
                <MenuItem value="gpt-4o">GPT-4o</MenuItem>
                <MenuItem value="gpt-3.5-turbo">GPT-3.5 Turbo</MenuItem>
              </Select>
            </FormControl>
            
            <Box>
              <Typography gutterBottom sx={{ mt: 1 }}>Temperature: {apiConfig.temperature}</Typography>
              <Slider
                value={apiConfig.temperature}
                onChange={(e, value) => handleConfigChange('temperature', value)}
                min={0}
                max={1}
                step={0.1}
                marks={[
                  { value: 0, label: '0' },
                  { value: 0.5, label: '0.5' },
                  { value: 1, label: '1' }
                ]}
              />
            </Box>
            
            <Box>
              <Typography gutterBottom sx={{ mt: 1 }}>Max Context Chunks: {apiConfig.max_context_chunks}</Typography>
              <Slider
                value={apiConfig.max_context_chunks}
                onChange={(e, value) => handleConfigChange('max_context_chunks', value)}
                min={1}
                max={20}
                step={1}
                marks={[
                  { value: 1, label: '1' },
                  { value: 10, label: '10' },
                  { value: 20, label: '20' }
                ]}
              />
            </Box>
            
            <FormControlLabel
              sx={{ mt: 1 }}
              control={
                <Switch
                  checked={apiConfig.include_sources}
                  onChange={(e) => handleConfigChange('include_sources', e.target.checked)}
                />
              }
              label="Include Sources"
            />
          </Box>
        </Paper>
      )}

      {/* Error Alert */}
      {apiError && (
        <Alert 
          severity="error" 
          sx={{ m: 2 }}
          onClose={() => setApiError('')}
        >
          {apiError}
        </Alert>
      )}

      {/* Messages Area */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {messages.length === 0 ? (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%',
            textAlign: 'center',
            color: 'text.secondary'
          }}>
            <Psychology sx={{ fontSize: '4rem', mb: 2, opacity: 0.5 }} />
            <Typography variant="h6" gutterBottom>
              Welcome to Test ChatBot
            </Typography>
            <Typography variant="body2" sx={{ maxWidth: 500, mb: 2 }}>
              This is a testing interface for the chatbot API. Configure your settings above and start chatting!
            </Typography>
            <Alert severity="info" sx={{ maxWidth: 500, textAlign: 'left' }}>
              <Typography variant="body2">
                <strong>🚀 External API Integration Ready:</strong>
                <br />• Uses your backend proxy at /api/chatbot/my-chat-bot
                <br />• Proxies to external API at localhost:7071
                <br />• No CORS issues - backend handles the proxy
                <br />• Supports document context and conversation history
                <br />• Make sure both servers are running: backend (8090) and external API (7071)
              </Typography>
            </Alert>
          </Box>
        ) : (
          messages.map(renderMessage)
        )}
        
        {isTyping && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <SmartToy color="primary" />
            <CircularProgress size={16} />
            <Typography variant="body2" color="text.secondary">
              AI is thinking...
            </Typography>
          </Box>
        )}
        
        <div ref={messagesEndRef} />
      </Box>

      {/* Input Area */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          borderRadius: 0, 
          borderTop: '1px solid #e2e8f0',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          boxShadow: '0 -4px 6px -1px rgb(0 0 0 / 0.1), 0 -2px 4px -2px rgb(0 0 0 / 0.1)'
        }}
      >
        <form onSubmit={handleSendMessage}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
            <TextField
              ref={inputRef}
              fullWidth
              multiline
              maxRows={4}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message here..."
              variant="outlined"
              disabled={isSending}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '24px',
                  backgroundColor: 'white',
                  border: '2px solid #e2e8f0',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: '#6366f1'
                  },
                  '&.Mui-focused': {
                    borderColor: '#6366f1',
                    boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)'
                  }
                },
                '& .MuiInputBase-input': {
                  padding: '16px 20px',
                  fontSize: '0.95rem',
                  lineHeight: 1.5
                }
              }}
            />
            <Button
              type="submit"
              variant="contained"
              disabled={!inputMessage.trim() || isSending}
              sx={{
                minWidth: 64,
                height: 64,
                borderRadius: '24px',
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                },
                '&:disabled': {
                  background: '#e2e8f0',
                  color: '#94a3b8',
                  transform: 'none',
                  boxShadow: 'none'
                }
              }}
            >
              {isSending ? <CircularProgress size={24} color="inherit" /> : <Send />}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default TestChatBot;
