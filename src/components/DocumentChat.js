import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useMsal } from '@azure/msal-react';
import { getAuthHeaders } from '../utils/authUtils';
import envConfig from '../envConfig';
import { useUserProfile } from '../hooks/useUserProfile';
import useChatSessions from '../hooks/useChatSessions';
import ChatSessionSidebar from './ChatSessionSidebar';
import './DocumentChat.css';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import { Tooltip, Button, IconButton } from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';

const DocumentChat = () => {
    const { accounts } = useMsal();
    const userProfile = useUserProfile();
    
    const [messages, setMessages] = useState([
        { 
            text: "🔬 Welcome to the Research Document AI Assistant! I specialize in analyzing, summarizing, and extracting insights from your research documents. Upload documents, ask questions, or use semantic search to uncover valuable information. How can I assist your research today?", 
            isBot: true,
            timestamp: new Date()
        }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [documentContext, setDocumentContext] = useState(null);
    const [selectedDocuments, setSelectedDocuments] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [filteredDocuments, setFilteredDocuments] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoadingDocuments, setIsLoadingDocuments] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [conversationHistory, setConversationHistory] = useState([]);
    const [workspaceId, setWorkspaceId] = useState(null);
    const [pendingGlobalSearch, setPendingGlobalSearch] = useState(false);
    const [copiedMessageId, setCopiedMessageId] = useState(null);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const fileInputRef = useRef(null);
    const documentListRef = useRef(null);
    const activeDocumentRef = useRef(null);

    // Chat session management
    const {
        conversations,
        currentConversation,
        isLoading: sessionsLoading,
        getOrCreateCurrentConversation,
        createConversation,
        updateConversation,
        addMessage,
        loadConversations
    } = useChatSessions();

    const [showSessionSidebar, setShowSessionSidebar] = useState(false);
    const [currentSessionId, setCurrentSessionId] = useState(null);
    
    // Tab management state
    const [tabs, setTabs] = useState([]);
    const [activeTabId, setActiveTabId] = useState(null);
    const [selectedModel, setSelectedModel] = useState("gpt-4o-mini");
    const [showNewTabDialog, setShowNewTabDialog] = useState(false);
    const [newTabName, setNewTabName] = useState('');
    const [editingTabId, setEditingTabId] = useState(null);
    const [editingTabName, setEditingTabName] = useState('');
    
    // New tab modal state
    const [modalMode, setModalMode] = useState('create'); // 'create' or 'select'
    const [conversationSearchQuery, setConversationSearchQuery] = useState('');
    const [selectedConversationId, setSelectedConversationId] = useState(null);

    // Bypass mode configuration
    const BYPASS_USER_ID = "d4b2fbfe-702b-49d4-9b42-41d343c26da5";
    
    const isBypassMode = () => sessionStorage.getItem("bypass_auth") === "true";

    // Get user ID function
    const getUserId = useCallback(() => {
        if (isBypassMode()) {
            console.log('🔧 Using bypass mode user ID');
            return BYPASS_USER_ID;
        }
        
        if (accounts && accounts.length > 0) {
            const account = accounts[0];
            const userId = account.localAccountId || account.homeAccountId || account.username;
            console.log('🔐 Using MSAL account user ID:', userId);
            return userId;
        }
        
        const fallbackId = userProfile.email || 'unknown-user';
        console.log('📧 Using fallback user ID:', fallbackId);
        return fallbackId;
    }, [accounts, userProfile.email]);

    // Set workspace ID when user ID is available
    useEffect(() => {
        const userId = getUserId();
        if (userId) {
            setWorkspaceId(userId);
        }
    }, [getUserId]);

    // Initialize first tab when workspace ID is available
    useEffect(() => {
        const initializeFirstTab = () => {
            if (workspaceId && tabs.length === 0) {
                console.log('🔄 Initializing first tab for workspace:', workspaceId);
                
                // Create a temporary tab without saving to database yet
                const tempTabId = `temp-${Date.now()}`;
                const newTab = {
                    id: tempTabId,
                    name: 'Research Assistant Chat',
                    sessionId: null, // Will be set when user sends first message
                    messages: [{
                        text: "🔬 Welcome to the Research Document AI Assistant! I specialize in analyzing, summarizing, and extracting insights from your research documents. Upload documents, ask questions, or use semantic search to uncover valuable information. How can I assist your research today?", 
                        isBot: true,
                        timestamp: new Date()
                    }],
                    conversationHistory: [],
                    documentContext: null,
                    selectedDocuments: [],
                    pendingGlobalSearch: false
                };
                
                setTabs([newTab]);
                setActiveTabId(tempTabId);
                setCurrentSessionId(null); // No session ID until user sends first message
                setMessages(newTab.messages);
                setConversationHistory(newTab.conversationHistory);
                setDocumentContext(newTab.documentContext);
                setSelectedDocuments(newTab.selectedDocuments);
                setPendingGlobalSearch(newTab.pendingGlobalSearch);
                
                console.log('✅ First tab initialized with temporary ID:', tempTabId);
            }
        };
        
        initializeFirstTab();
    }, [workspaceId, tabs.length]);

    // Map file type IDs to extensions
    // Currently supported file types: 1=PDF, 3=DOCX, 8=CSV
    const getFileTypeExtension = (fileTypeId) => {
        const fileTypeMap = {
            1: 'pdf',    // PDF documents
            3: 'docx',   // Word documents
            8: 'csv'     // CSV files
        };
        return fileTypeMap[fileTypeId] || 'unknown';
    };

    // Map document category IDs to string values
    const getDocumentCategoryString = (categoryId) => {
        const categoryMap = {
            1: 'research-papers',
            2: 'company-policy',
            3: 'other',
            4: 'training-documents',
            5: 'call-transcript'
        };
        return categoryMap[categoryId] || 'other';
    };

    // Transform document data to match expected format
    const transformDocumentData = (doc) => {
        return {
            id: doc.id,
            documentGuid: doc.documentGuid,
            name: doc.fileName,
            size: formatFileSize(doc.fileSize || 0),
            status: doc.uploadStatus === 'active' ? 'active' : 'inactive',
            fileType: getFileTypeExtension(doc.fileType),
            documentCategory: getDocumentCategoryString(doc.documentCategory),
            documentCategoryId: doc.documentCategory, // Keep original ID for reference
            ingestionStatus: doc.ingestionStatus,
            uploadTime: doc.uploadTime
        };
    };

    // Format file size helper
    const formatFileSize = (fileSize) => {
        if (!fileSize || fileSize === 0) return 'Unknown size';
        
        // Convert bytes to KB
        const sizeKB = fileSize / 1024;
        
        if (sizeKB < 1024) {
            return `${sizeKB.toFixed(1)} KB`;
        } else {
            return `${(sizeKB / 1024).toFixed(1)} MB`;
        }
    };

    // Fetch documents from database and handle loading states
    useEffect(() => {
        let isMounted = true;
        setIsLoadingDocuments(true);
        
        const fetchDocuments = async () => {
            try {
                const userId = getUserId();
                if (!userId) {
                    console.warn('No user ID available for fetching documents');
                    if (isMounted) {
                        setIsLoadingDocuments(false);
                        setLoadError(true);
                    }
                    return;
                }

                const authHeaders = await getAuthHeaders();
                const params = {
                    cacheBuster: Date.now().toString()
                };

                console.log('🔍 Fetching documents for workspace:', userId);
                const response = await axios.get(`${envConfig.apiUrl}/documents/${userId}`, {
                    headers: {
                        ...authHeaders,
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache'
                    },
                    params: params
                });

                if (!isMounted) return;

                if (response.data.success) {
                    const transformedData = response.data.data.documents.map(transformDocumentData);
                    console.log('📄 Fetched documents:', transformedData);
                    setDocuments(transformedData);
                    // Only show completed documents initially
                    const completedDocs = transformedData.filter(doc => doc.ingestionStatus === 'completed');
                    setFilteredDocuments(completedDocs);
                    setIsLoadingDocuments(false);
                    setLoadError(false);
                } else {
                    throw new Error(response.data.message || 'Failed to fetch documents');
                }
            } catch (error) {
                console.error('Error fetching documents:', error);
                if (isMounted) {
                    // Fallback to sample data for demo purposes
                   
                    setDocuments([]);
                    // Only show completed documents in fallback as well
                    const completedFallbackDocs = [];
                    setFilteredDocuments(completedFallbackDocs);
                    setIsLoadingDocuments(false);
                    setLoadError(true);
                }
            }
        };

        fetchDocuments();
        
        return () => {
            isMounted = false;
        };
    }, [getUserId]);

    // Filter documents based on search query and ingestion status
    useEffect(() => {
        // First filter by ingestion status (only show completed documents)
        const completedDocs = documents.filter(doc => 
            doc.ingestionStatus === 'completed'
        );

        // Then apply search filter if there's a query
        if (!searchQuery.trim()) {
            setFilteredDocuments(completedDocs);
            return;
        }

        const query = searchQuery.toLowerCase();
        const filtered = completedDocs.filter(doc => 
            doc.name.toLowerCase().includes(query)
        );
        setFilteredDocuments(filtered);
    }, [searchQuery, documents]);

    // Scroll to active document in the list
    useEffect(() => {
        if (documentContext && activeDocumentRef.current) {
            // Add a small delay to ensure the DOM has updated
            setTimeout(() => {
                activeDocumentRef.current.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest'
                });
            }, 100);
        }
    }, [documentContext]);

    // Ensure the document list is scrollable and visible
    useEffect(() => {
        if (documentListRef.current && filteredDocuments.length > 0) {
            // Reset scroll position to top when filter changes
            if (searchQuery) {
                documentListRef.current.scrollTop = 0;
            }
        }
    }, [filteredDocuments, searchQuery]);

    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
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

    // Function to truncate text with ellipsis
    const truncateText = (text, maxLength = 28) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    // Handle document selection (supports multiple documents)
    const handleSelectDocument = (document, event) => {
        // Don't allow selecting inactive documents
        if (document.status === 'inactive') return;
        
        // Check if Ctrl/Cmd key is pressed for multi-selection
        const isMultiSelect = event && (event.ctrlKey || event.metaKey);
        
        if (isMultiSelect) {
            // Multi-select mode
            setSelectedDocuments(prev => {
                const isSelected = prev.some(doc => doc.id === document.id);
                if (isSelected) {
                    // Remove from selection
                    const updated = prev.filter(doc => doc.id !== document.id);
                    // Update single document context to the first remaining document or null
                    setDocumentContext(updated.length > 0 ? updated[0] : null);
                    return updated;
                } else {
                    // Add to selection
                    const updated = [...prev, document];
                    // Set the newly selected document as the primary context
                    setDocumentContext(document);
                    return updated;
                }
            });
        } else {
            // Single select mode - replace all selections
            setSelectedDocuments([document]);
            setDocumentContext(document);
        }
        
        // Add a message to inform the user about the selected document(s)
        const selectedDocs = isMultiSelect ? 
            selectedDocuments.some(doc => doc.id === document.id) ? 
                selectedDocuments.filter(doc => doc.id !== document.id) : 
                [...selectedDocuments, document] : 
            [document];
            
        if (selectedDocs.length > 0) {
            const botMessage = {
                text: selectedDocs.length === 1 ? 
                    `I've loaded "${document.name}" for you. What would you like to know about this document?` :
                    `I've loaded ${selectedDocs.length} documents for you: ${selectedDocs.map(doc => `"${doc.name}"`).join(', ')}. What would you like to know about these documents?`,
                isBot: true,
                timestamp: new Date()
            };
            
            setMessages(prev => [...prev, botMessage]);
            
            // Update conversation history
            setConversationHistory(prev => [
                ...prev,
                { role: 'assistant', content: botMessage.text }
            ]);
            
            // Auto scroll to bottom
            setTimeout(scrollToBottom, 100);
        }
    };

    // Add user message
    const addUserMessage = async (text, hasAttachment = false, attachment = null) => {
        const newMessage = {
            text,
            isBot: false,
            timestamp: new Date(),
            hasAttachment,
            attachment
        };
        setMessages(prev => [...prev, newMessage]);
        
        // Update conversation history
        setConversationHistory(prev => [
            ...prev,
            { role: 'user', content: text }
        ]);

        // Create conversation if this is the first user message (no session ID yet)
        if (!currentSessionId && workspaceId) {
            try {
                console.log('🆕 Creating new conversation for first user message');
                
                // Get the current tab name or use a default
                const currentTab = tabs.find(tab => tab.id === activeTabId);
                const tabName = currentTab?.name || 'Research Assistant Chat';
                
                // Create conversation with all current messages (including the welcome message and the new user message)
                // Note: messages state hasn't been updated yet, so we need to manually add the new message
                const allMessages = [...messages, newMessage];
                const chatJson = allMessages.map(msg => ({
                    role: msg.isBot ? 'assistant' : 'user',
                    content: msg.text,
                    timestamp: msg.timestamp.toISOString(),
                    metadata: msg.hasAttachment ? { hasAttachment: msg.hasAttachment, attachment: msg.attachment } : undefined
                }));

                console.log('📝 Creating conversation with', chatJson.length, 'messages');

                const session = await createConversation({
                    workspace_id: workspaceId,
                    chat_title: tabName,
                    chat_json: chatJson
                });
                
                if (session) {
                    setCurrentSessionId(session.chat_id);
                    
                    // Update the current tab with the new session ID
                    setTabs(prevTabs => prevTabs.map(tab => 
                        tab.id === activeTabId ? {
                            ...tab,
                            id: session.chat_id,
                            sessionId: session.chat_id
                        } : tab
                    ));
                    setActiveTabId(session.chat_id);
                    
                    console.log('✅ Conversation created with chat_id:', session.chat_id);
                    console.log('📋 Saved messages count:', chatJson.length);
                    
                    // Return the session ID so it can be used immediately
                    return session.chat_id;
                }
            } catch (error) {
                console.error('❌ Failed to create conversation for first user message:', error);
            }
        } else if (currentSessionId && workspaceId) {
            // Save to existing session
            try {
                await addMessage(currentSessionId, {
                    role: 'user',
                    content: text,
                    metadata: { hasAttachment, attachment },
                    workspace_id: workspaceId
                });
                console.log('💾 User message saved to session');
                console.log('📋 Message save details:', {
                    chatId: currentSessionId,
                    messageType: 'user',
                    workspaceId: workspaceId
                });
                return currentSessionId;
            } catch (error) {
                console.error('❌ Failed to save user message:', error);
            }
        }
        
        return currentSessionId;
    };

    // Add bot message
    const addBotMessage = async (text, sessionId = null) => {
        const newMessage = {
            text,
            isBot: true,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, newMessage]);
        
        // Check if the bot response suggests using general knowledge
        if (checkForGlobalSearchSuggestion(text)) {
            setPendingGlobalSearch(true);
            console.log('🔍 Bot suggested global search, waiting for user confirmation');
        }
        
        // Update conversation history
        setConversationHistory(prev => [
            ...prev,
            { role: 'assistant', content: text }
        ]);

        // Use provided sessionId or current session ID
        const targetSessionId = sessionId || currentSessionId;

        // Save to session (only if session exists - if not, it will be saved when user sends next message)
        if (targetSessionId && workspaceId) {
            try {
                await addMessage(targetSessionId, {
                    role: 'assistant',
                    content: text,
                    workspace_id: workspaceId
                });
                console.log('💾 Bot message saved to session:', targetSessionId);
            } catch (error) {
                console.error('❌ Failed to save bot message:', error);
            }
        } else {
            console.log('⚠️ Bot message not saved to database yet - no session ID. Will be saved when user sends next message.');
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Preview the file
        setDocumentContext({
            name: file.name,
            size: (file.size / 1024).toFixed(2) + ' KB',
            type: file.type
        });

        // Add message about the uploaded file
        const sessionId = await addUserMessage(`I'd like to ask about the document: ${file.name}`, true, {
            name: file.name,
            type: file.type
        });

        // Bot response acknowledging the upload
        setTimeout(() => {
            addBotMessage(`I see you've uploaded *${file.name}*. What would you like to know about this document?`, sessionId);
        }, 1000);

        // Reset file input
        e.target.value = null;
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        
        if (!inputMessage.trim() || isSending) return;

        // Store the message text before clearing the input
        const messageText = inputMessage;
        
        // Clear input immediately to avoid confusion
        setInputMessage('');
        setIsTyping(true);
        setIsSending(true);

        // Reset input field height
        if (inputRef.current) {
            inputRef.current.style.height = 'auto';
        }

        // Add user message and get session ID
        const sessionId = await addUserMessage(messageText);

        try {
            // Check if user is responding affirmatively to global search suggestion
            const shouldUseGlobalSearch = pendingGlobalSearch && isAffirmativeResponse(messageText);
            
            // Check if user is responding negatively to global search suggestion
            const isNegativeResponseToGlobalSearch = pendingGlobalSearch && isNegativeResponse(messageText);
            
            // If user asks a new question (neither affirmative nor negative response), reset pending global search
            const isNewQuestion = pendingGlobalSearch && !isAffirmativeResponse(messageText) && !isNegativeResponse(messageText);
        
            // If user says no to global search, reset to normal state and continue with regular chat
            if (isNegativeResponseToGlobalSearch) {
                setPendingGlobalSearch(false);
                console.log('❌ User declined global search, continuing with normal chat');         
            }
            
            // If user asks a new question while pending global search, reset the pending state
            if (isNewQuestion) {
                setPendingGlobalSearch(false);
                console.log('🔄 User asked new question, resetting global search pending state');
            }
            
            // Prepare the request payload for your chatbot endpoint
            const requestPayload = {
                message: messageText,
                workspace_id: workspaceId,
                document_category:  'smartdocs-index',
                conversation_history: conversationHistory,
                filters: selectedDocuments.length > 0 ? {
                    document_ids: selectedDocuments.map(doc => doc.documentGuid || doc.id),
                    file_types: [...new Set(selectedDocuments.map(doc => doc.fileType))],
                    document_count: selectedDocuments.length
                } : documentContext ? {
                    document_id: documentContext.documentGuid || documentContext.id,
                    file_type: documentContext.fileType
                } : {},
                max_context_chunks: 10,
                temperature: 0.7,
                model: selectedModel,
                include_sources: true,
                enable_global_search: false,
                global_search_requested: false
                // shouldUseGlobalSearch && !isNegativeResponseToGlobalSearch
            };

            // Reset pending global search flag
            if (shouldUseGlobalSearch) {
                setPendingGlobalSearch(false);
                console.log('🌐 User confirmed global search, enabling web search');
            }

            console.log('📋 Document category being sent:', requestPayload.document_category);

            console.log('🤖 Sending chat request:', requestPayload);

            // Use backend API instead of direct function call
            const authHeaders = await getAuthHeaders();
            const response = await axios.post(`${envConfig.apiUrl}/chatbot/my-chat-bot`, requestPayload, {
                headers: {
                    ...authHeaders,
                    'Content-Type': 'application/json'
                },
                timeout: 30000 // 30 second timeout
            });

            // Process the response
            let botResponse = '';
            
            // Artificial delay for typing effect
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            console.log('🤖 Chat response received:', response.data);
            
            // Handle different response formats from backend API
            if (typeof response.data === 'string') {
                // Plain text response
                botResponse = response.data;
            } else if (response.data && typeof response.data === 'object') {
                // Handle structured response from backend API
                if (response.data.error) {
                    // Handle error from API
                    botResponse = `Error: ${response.data.error}. Please try again or rephrase your question.`;
                } else if (response.data.response) {
                    // Backend API response field - use formatted_text if available
                    const responseData = response.data.response;
                    if (responseData.formatted_text) {
                        // Use formatted_text which contains HTML
                        botResponse = responseData.formatted_text;
                    } else if (responseData.text) {
                        // Fallback to plain text
                        botResponse = responseData.text;
                    } else {
                        // Last resort - use the response object itself
                        botResponse = typeof responseData === 'string' ? responseData : JSON.stringify(responseData);
                    }
                    
                    // Check for sources/citations and append them if available
                    // Only add sources if formatted_text doesn't already contain source information
                    if (response.data.sources && response.data.sources.length > 0) {
                        const hasSourceInFormattedText = responseData.formatted_text && 
                            typeof responseData.formatted_text === 'string' &&
                            (responseData.formatted_text.includes('<b>Source:</b>') || 
                             responseData.formatted_text.includes('Source:') ||
                             responseData.formatted_text.includes('<p><b>Source:</b></p>')) ||
                             responseData.formatted_text.includes('Sources:');
                        
                        if (!hasSourceInFormattedText) {
                            if(response.data.search_context.summary_requested){
                                botResponse += "\n\n<p><b>Source:</b></p>\n";
                                response.data.sources.forEach((source, index) => {
                                const filename = source.filename ? source.filename.split('/').pop() : 'Document';
                                botResponse += `${index + 1}. ${filename}\n`;                      
                                });
                            } else {
                                botResponse += "\n\n<p><b>Source:</b></p>\n";
                                botResponse += response.data.sources ? response.data.sources[0].filename.split('/').pop() : `*${response.data.sources.length} sources found*\n`;
                            }
                        }
                      
                    }
                } else if (response.data.answer) {
                    // Alternative answer field
                    botResponse = response.data.answer;
                } else if (response.data.message) {
                    // Message field
                    botResponse = response.data.message;
                } else if (response.data.content) {
                    // Content field
                    botResponse = response.data.content;
                } else {
                    // Last resort - try to find any meaningful string in the object
                    try {
                        // Try to extract any useful text from the response object
                        const jsonString = JSON.stringify(response.data);
                        botResponse = `I received a response but couldn't format it properly. Raw response: ${jsonString}`;
                    } catch (e) {
                        console.error("Error parsing response:", e);
                        botResponse = "I received a response but couldn't process it. Please try again.";
                    }
                }
            } else {
                // Fallback for unexpected response
                botResponse = "I received a response but couldn't process it. Please try again.";
            }

            // Add bot message with the processed response
            addBotMessage(botResponse, sessionId);
        } catch (error) {
            console.error('Error sending message:', error);
            
            // Enhanced error logging
            if (error.response) {
                console.error('Response data:', error.response.data);
                console.error('Response status:', error.response.status);
            } else if (error.request) {
                console.error('Request made but no response received:', error.request);
            } else {
                console.error('Error details:', error.message);
            }
            
            // Handle different error types
            let errorMessage = "Sorry, I encountered an error processing your request.";
            
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                errorMessage = `Server error (${error.response.status}): ${error.response.data.message || 'Please try again later.'}`;
            } else if (error.request) {
                // The request was made but no response was received
                errorMessage = "I couldn't reach the server. Please check your connection and try again.";
            } else if (error.code === 'ECONNABORTED') {
                // Request timed out
                errorMessage = "The request took too long to process. This might be due to high server load or a complex query.";
            }
            
            addBotMessage(errorMessage, sessionId);
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

    const clearChat = async () => {
        const welcomeMessage = {
            text: "🔬 Welcome to the Research Document AI Assistant! I specialize in analyzing, summarizing, and extracting insights from your research documents. Upload documents, ask questions, or use semantic search to uncover valuable information. How can I assist your research today?", 
            isBot: true,
            timestamp: new Date()
        };

        setMessages([welcomeMessage]);
        setDocumentContext(null);
        setSelectedDocuments([]);
        setConversationHistory([]);
        setPendingGlobalSearch(false);

        // Update the current tab's state
        if (activeTabId) {
            setTabs(prevTabs => prevTabs.map(tab => 
                tab.id === activeTabId ? {
                    ...tab,
                    messages: [welcomeMessage],
                    conversationHistory: [],
                    documentContext: null,
                    selectedDocuments: [],
                    pendingGlobalSearch: false
                } : tab
            ));
        }

        // Reset to temporary tab when clearing chat
        if (workspaceId) {
            try {
                // Create a new temporary tab ID
                const tempTabId = `temp-${Date.now()}`;
                setCurrentSessionId(null); // No session ID until user sends first message
                
                // Update the current tab with the new temporary ID
                if (activeTabId) {
                    setTabs(prevTabs => prevTabs.map(tab => 
                        tab.id === activeTabId ? {
                            ...tab,
                            id: tempTabId,
                            sessionId: null,
                            messages: [welcomeMessage],
                            conversationHistory: [],
                            documentContext: null,
                            selectedDocuments: [],
                            pendingGlobalSearch: false
                        } : tab
                    ));
                    setActiveTabId(tempTabId);
                }
                
                console.log('🆕 Chat cleared, new temporary tab created:', tempTabId);
            } catch (error) {
                console.error('❌ Failed to clear chat:', error);
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
        
        // Update conversation history
        const history = conversation.chat_json.map(msg => ({
            role: msg.role,
            content: msg.content
        }));
        setConversationHistory(history);
        
        // Reset other states
        setDocumentContext(null);
        setSelectedDocuments([]);
        setPendingGlobalSearch(false);
        
        // Update the current tab to match the conversation
        if (activeTabId) {
            setTabs(prevTabs => prevTabs.map(tab => 
                tab.id === activeTabId ? {
                    ...tab,
                    // Keep the original tab ID unique, don't change it
                    name: conversation.chat_title, // Update tab name to match conversation title
                    sessionId: conversation.chat_id, // Update session ID
                    messages: conversationMessages,
                    conversationHistory: history,
                    documentContext: null,
                    selectedDocuments: [],
                    pendingGlobalSearch: false
                } : tab
            ));
            // Don't change the activeTabId - keep it as the unique tab ID
        }
        
        console.log('🔄 Switched to conversation:', conversation.chat_title);
    };

    // Tab management functions
    const saveCurrentTabState = () => {
        if (activeTabId) {
            setTabs(prevTabs => prevTabs.map(tab => 
                tab.id === activeTabId ? {
                    ...tab,
                    messages,
                    conversationHistory,
                    documentContext,
                    selectedDocuments,
                    pendingGlobalSearch
                } : tab
            ));
        }
    };

    const switchToTab = (tabId) => {
        saveCurrentTabState();
        
        const targetTab = tabs.find(tab => tab.id === tabId);
        if (targetTab) {
            setActiveTabId(tabId);
            setCurrentSessionId(targetTab.sessionId);
            setMessages(targetTab.messages);
            setConversationHistory(targetTab.conversationHistory);
            setDocumentContext(targetTab.documentContext);
            setSelectedDocuments(targetTab.selectedDocuments);
            setPendingGlobalSearch(targetTab.pendingGlobalSearch);
            console.log('🔄 Switched to tab:', targetTab.name);
            console.log('📋 Tab switch details:', {
                tabName: targetTab.name,
                chatId: targetTab.sessionId,
                workspaceId: workspaceId
            });
        }
    };

    const createNewTab = async (tabName) => {
        if (!workspaceId) {
            console.error('❌ No workspace ID available for creating new tab');
            return;
        }

        try {
            saveCurrentTabState();
            
            // Create a temporary tab without saving to database yet
            const tempTabId = `temp-${Date.now()}`;
            const newTab = {
                id: tempTabId,
                name: tabName,
                sessionId: null, // Will be set when user sends first message
                messages: [{
                    text: "🔬 Welcome to the Research Document AI Assistant! I specialize in analyzing, summarizing, and extracting insights from your research documents. Upload documents, ask questions, or use semantic search to uncover valuable information. How can I assist your research today?",
                    isBot: true,
                    timestamp: new Date()
                }],
                conversationHistory: [],
                documentContext: null,
                selectedDocuments: [],
                pendingGlobalSearch: false
            };

            setTabs(prevTabs => [...prevTabs, newTab]);
            setActiveTabId(tempTabId);
            setCurrentSessionId(null); // No session ID until user sends first message
            setMessages(newTab.messages);
            setConversationHistory(newTab.conversationHistory);
            setDocumentContext(newTab.documentContext);
            setSelectedDocuments(newTab.selectedDocuments);
            setPendingGlobalSearch(newTab.pendingGlobalSearch);
            
            console.log('🆕 New tab created with temporary ID:', tempTabId);
            console.log('📋 Tab details:', {
                tabName: tabName,
                tempId: tempTabId,
                workspaceId: workspaceId
            });
        } catch (error) {
            console.error('❌ Failed to create new tab:', error);
        }
    };

    const closeTab = async (tabId) => {
        if (tabs.length <= 1) {
            console.log('⚠️ Cannot close the last tab');
            return;
        }

        const tabToClose = tabs.find(tab => tab.id === tabId);
        if (!tabToClose) {
            console.log('⚠️ Tab not found:', tabId);
            return;
        }

        // If closing the active tab, switch to another tab
        if (activeTabId === tabId) {
            const remainingTabs = tabs.filter(tab => tab.id !== tabId);
            const newActiveTab = remainingTabs[0];
            if (newActiveTab && newActiveTab.id) {
                switchToTab(newActiveTab.id);
            } else {
                console.error('❌ No valid tab to switch to after closing tab:', tabId);
                // Fallback: just remove the tab without switching
            }
        }

        // Remove tab from state
        setTabs(prevTabs => prevTabs.filter(tab => tab.id !== tabId));
        
        console.log('🗑️ Tab closed:', tabToClose.name);
    };

    const renameTab = async (tabId, newName) => {
        if (!newName.trim()) return;
        
        // Find the tab to rename
        const tabToRename = tabs.find(tab => tab.id === tabId);
        if (!tabToRename) {
            console.error('❌ Tab not found for renaming:', tabId);
            return;
        }
        
        // Update local tab state
        setTabs(prevTabs => prevTabs.map(tab => 
            tab.id === tabId ? { ...tab, name: newName.trim() } : tab
        ));
        
        // If this tab has a session ID (is linked to a conversation), update the conversation title in the database
        if (tabToRename.sessionId && workspaceId) {
            try {
                console.log('💾 Updating conversation title in database:', {
                    chatId: tabToRename.sessionId,
                    newTitle: newName.trim(),
                    workspaceId: workspaceId
                });
                
                await updateConversation(tabToRename.sessionId, {
                    chat_title: newName.trim(),
                    workspace_id: workspaceId,
                    messages: tabToRename.messages.map(msg => ({
                        role: msg.isBot ? 'assistant' : 'user',
                        content: msg.text,
                        timestamp: msg.timestamp.toISOString(),
                        metadata: msg.hasAttachment ? { hasAttachment: msg.hasAttachment, attachment: msg.attachment } : undefined
                    }))
                });
                
                console.log('✅ Conversation title updated successfully');
            } catch (error) {
                console.error('❌ Failed to update conversation title:', error);
                // Revert the local change if database update failed
                setTabs(prevTabs => prevTabs.map(tab => 
                    tab.id === tabId ? { ...tab, name: tabToRename.name } : tab
                ));
                return;
            }
        }
        
        setEditingTabId(null);
        setEditingTabName('');
        console.log('✏️ Tab renamed to:', newName);
    };

    const handleNewTabClick = () => {
        setShowNewTabDialog(true);
        setNewTabName('');
        setModalMode('create');
        setConversationSearchQuery('');
        setSelectedConversationId(null);
        
        // Load conversations when opening the modal
        if (workspaceId) {
            loadConversations(workspaceId, false);
        }
    };

    const handleCreateNewTab = () => {
        if (modalMode === 'select' && selectedConversationId) {
            // Create tab from existing conversation
            createTabFromConversation(selectedConversationId);
        } else if (modalMode === 'create' && newTabName.trim()) {
            // Create new tab
            createNewTab(newTabName.trim());
        }
        setShowNewTabDialog(false);
        setNewTabName('');
        setModalMode('create');
        setConversationSearchQuery('');
        setSelectedConversationId(null);
    };

    const createTabFromConversation = async (conversationId) => {
        if (!workspaceId) {
            console.error('❌ No workspace ID available for creating tab from conversation');
            return;
        }

        try {
            saveCurrentTabState();
            
            // Find the selected conversation
            const selectedConversation = conversations.find(conv => conv.chat_id === conversationId);
            if (!selectedConversation) {
                console.error('❌ Selected conversation not found');
                return;
            }

            // Create a new tab with the conversation data (this has a real session ID since it's from existing conversation)
            const newTab = {
                id: selectedConversation.chat_id,
                name: selectedConversation.chat_title,
                sessionId: selectedConversation.chat_id,
                messages: selectedConversation.chat_json.map(msg => ({
                    text: msg.content,
                    isBot: msg.role === 'assistant',
                    timestamp: new Date(msg.timestamp)
                })),
                conversationHistory: selectedConversation.chat_json.map(msg => ({
                    role: msg.role,
                    content: msg.content
                })),
                documentContext: null,
                selectedDocuments: [],
                pendingGlobalSearch: false
            };

            setTabs(prevTabs => [...prevTabs, newTab]);
            setActiveTabId(selectedConversation.chat_id);
            setCurrentSessionId(selectedConversation.chat_id);
            setMessages(newTab.messages);
            setConversationHistory(newTab.conversationHistory);
            setDocumentContext(newTab.documentContext);
            setSelectedDocuments(newTab.selectedDocuments);
            setPendingGlobalSearch(newTab.pendingGlobalSearch);
            
            console.log('🆕 New tab created from existing conversation:', selectedConversation.chat_title);
        } catch (error) {
            console.error('❌ Failed to create tab from conversation:', error);
        }
    };

    // Filter conversations based on search query
    const filteredConversations = conversations.filter(conv =>
        conv.chat_title.toLowerCase().includes(conversationSearchQuery.toLowerCase())
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

    const handleEditTabClick = (tabId, currentName) => {
        setEditingTabId(tabId);
        setEditingTabName(currentName);
    };

    const handleRenameTab = async () => {
        if (editingTabId && editingTabName.trim()) {
            await renameTab(editingTabId, editingTabName.trim());
        }
    };

    // Handle new conversation creation (for session sidebar)
    const handleCreateNewConversation = async () => {
        if (!workspaceId) {
            console.error('❌ No workspace ID available for creating new conversation');
            return;
        }

        try {
            // Create a temporary tab without saving to database yet
            const tempTabId = `temp-${Date.now()}`;
            const welcomeMessage = {
                text: "🔬 Welcome to the Research Document AI Assistant! I specialize in analyzing, summarizing, and extracting insights from your research documents. Upload documents, ask questions, or use semantic search to uncover valuable information. How can I assist your research today?",
                isBot: true,
                timestamp: new Date()
            };
            
            setCurrentSessionId(null); // No session ID until user sends first message
            setMessages([welcomeMessage]);
            setConversationHistory([]);
            setPendingGlobalSearch(false);
            setDocumentContext(null);
            setSelectedDocuments([]);
            
            // Create a new tab for this conversation - replace all existing tabs to act like a new window
            const newTab = {
                id: tempTabId,
                name: 'New Research Chat',
                sessionId: null,
                messages: [welcomeMessage],
                conversationHistory: [],
                documentContext: null,
                selectedDocuments: [],
                pendingGlobalSearch: false
            };
            
            // Replace all existing tabs with just the new conversation tab
            setTabs([newTab]);
            setActiveTabId(tempTabId);
            
            // Close the session sidebar after creating new conversation
            setShowSessionSidebar(false);
            
            console.log('🆕 New conversation window created with temporary ID:', tempTabId);
            console.log('🔄 All existing tabs cleared - acting as new window');
        } catch (error) {
            console.error('❌ Failed to create new conversation:', error);
        }
    };

    // Check if text contains HTML tags
    const isHtmlContent = (text) => {
        return /<[^>]*>/g.test(text);
    };

    // Check if the bot response suggests using general knowledge
    const checkForGlobalSearchSuggestion = (text) => {
        const globalSearchPatterns = [
            /would you like me to search for information from general knowledge/i,
            /search for information from general knowledge/i,
            /general knowledge instead/i,
            /search the web/i,
            /search online/i,
            /general knowledge search/i,
            /web search/i,
            /online search/i
        ];
        
        return globalSearchPatterns.some(pattern => pattern.test(text));
    };

    // Check if user response indicates agreement to global search
    const isAffirmativeResponse = (text) => {
        const affirmativePatterns = [
            /^yes$/i,
            /^yeah$/i,
            /^yep$/i,
            /^sure$/i,
            /^okay$/i,
            /^ok$/i,
            /^please$/i,
            /^go ahead$/i,
            /^do it$/i,
            /^search/i,
            /^yes, please$/i,
            /^yes, go ahead$/i,
            /^yes, search$/i,
            /^please search$/i,
            /^search for me$/i,
            /^search the web$/i,
            /^search online$/i,
            /^use general knowledge$/i,
            /^general knowledge$/i,
            /^yes, please go ahead$/i,
            /^please go ahead$/i
        ];
        
        return affirmativePatterns.some(pattern => pattern.test(text.trim()));
    };

    // Check if user response indicates disagreement to global search
    const isNegativeResponse = (text) => {
        const negativePatterns = [
            /^no$/i,
            /^nope$/i,
            /^nah$/i,
            /^don't$/i,
            /^do not$/i,
            /^not interested$/i,
            /^no thanks$/i,
            /^no thank you$/i,
            /^cancel$/i,
            /^stop$/i,
            /^never mind$/i,
            /^forget it$/i,
            /^skip$/i,
            /^pass$/i,
            /^decline$/i,
            /^not now$/i,
            /^later$/i,
            /^maybe later$/i,
            /^no, thanks$/i,
            /^no thank you$/i,
            /^no, i don't$/i,
            /^i don't want to$/i,
            /^i don't need to$/i,
            /^not needed$/i,
            /^not necessary$/i
        ];
        
        return negativePatterns.some(pattern => pattern.test(text.trim()));
    };

    // Custom renderer for message content
    const renderMessageContent = (text, isBot, message) => {
        // If it's a bot message, check if it's HTML or markdown
        if (isBot) {
            // Check if the content is HTML
            if (isHtmlContent(text)) {
                return (
                    <div className="message-content bot-message">
                        <div 
                            className="html-content"
                            dangerouslySetInnerHTML={{ __html: text }}
                        />
                    </div>
                );
            } else {
                // Render as markdown
                return (
                    <div className="message-content bot-message">
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
                                    a: ({node, ...props}) => <a className="markdown-a" target="_blank" rel="noopener noreferrer" {...props} />,
                                    blockquote: ({node, ...props}) => <blockquote className="markdown-blockquote" {...props} />,
                                    code: ({node, inline, className, children, ...props}) => {
                                        const match = /language-(\w+)/.exec(className || '');
                                        return !inline && match ? (
                                            <div className="code-block-container">
                                                <div className="code-block-header">
                                                    <span className="code-language">{match[1]}</span>
                                                    <button 
                                                        className="copy-code-button"
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
                                                            // Could add a toast notification here
                                                        }}
                                                    >
                                                        Copy
                                                    </button>
                                                </div>
                                                <pre className="markdown-pre">
                                                    <code className={`markdown-code ${className}`} {...props}>
                                                        {children}
                                                    </code>
                                                </pre>
                                            </div>
                                        ) : (
                                            <code className={inline ? "markdown-code-inline" : "markdown-code"} {...props}>
                                                {children}
                                            </code>
                                        );
                                    },
                                    table: ({node, ...props}) => <div className="table-container"><table className="markdown-table" {...props} /></div>,
                                    thead: ({node, ...props}) => <thead className="markdown-thead" {...props} />,
                                    tbody: ({node, ...props}) => <tbody className="markdown-tbody" {...props} />,
                                    tr: ({node, ...props}) => <tr className="markdown-tr" {...props} />,
                                    th: ({node, ...props}) => <th className="markdown-th" {...props} />,
                                    td: ({node, ...props}) => <td className="markdown-td" {...props} />
                                }}
                            >
                                {text}
                            </ReactMarkdown>
                        </div>
                    </div>
                );
            }
        }

        // For user messages, first check if there's an attachment
        if (message.hasAttachment && message.attachment) {
                return (
                <div className="message-content">
                    <div className="message-attachment">
                        <div className="attachment-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                                <polyline points="14 2 14 8 20 8"></polyline>
                                            </svg>
                                        </div>
                        <div className="attachment-details">
                            <div className="attachment-name">{message.attachment.name}</div>
                            <div className="attachment-type">{message.attachment.type}</div>
                            </div>
                    </div>
                    <div className="message-text">{text}</div>
                    </div>
                );
        }
        
        // Regular user message (no attachment)
        return (
            <div className="message-content">
                    {text}
            </div>
        );
    };

    // Handle document search
    const handleDocumentSearch = (e) => {
        setSearchQuery(e.target.value);
    };

    // Clear all selected documents
    const clearSelectedDocuments = () => {
        setSelectedDocuments([]);
        setDocumentContext(null);
    };

    // Remove a specific document from selection
    const removeDocumentFromSelection = (documentId) => {
        setSelectedDocuments(prev => {
            const updated = prev.filter(doc => doc.id !== documentId);
            // Update primary context to the first remaining document or null
            setDocumentContext(updated.length > 0 ? updated[0] : null);
            return updated;
        });
    };

    // Copy message to clipboard
    const copyMessageToClipboard = async (messageText, messageId) => {
        try {
            // Strip HTML tags if present for plain text copy
            const plainText = messageText.replace(/<[^>]*>/g, '');
            await navigator.clipboard.writeText(plainText);
            
            // Show feedback
            setCopiedMessageId(messageId);
            setTimeout(() => {
                setCopiedMessageId(null);
            }, 2000);
        } catch (error) {
            console.error('Failed to copy message:', error);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = messageText.replace(/<[^>]*>/g, '');
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            
            setCopiedMessageId(messageId);
            setTimeout(() => {
                setCopiedMessageId(null);
            }, 2000);
        }
    };

    return (
        <div className="document-chat-container">
            <div className="document-chat-sidebar">
                <div className="document-chat-logo">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    <span>Research Assistant</span>
                </div>

                <div className="document-sidebar-content">
                    <h3 className="section-title">Research Documents</h3>
                    
                    <div className="document-search">
                        <input 
                            type="text" 
                            placeholder="Search documents..." 
                            className="document-search-input"
                            value={searchQuery}
                            onChange={handleDocumentSearch}
                        />
                    </div>

                    {/* Document Listing Section */}
                    <div className="document-listing">
                        {isLoadingDocuments ? (
                            <div className="documents-loading">
                                <div className="documents-loading-spinner"></div>
                                <p>Loading documents...</p>
                            </div>
                        ) : filteredDocuments.length === 0 ? (
                            <div className="no-documents">
                                {searchQuery ? (
                                    <p>No documents matching "{searchQuery}"</p>
                                ) : (
                                    <p>No documents found in the database.</p>
                                )}
                            </div>
                        ) : (
                            <div className="document-list" ref={documentListRef}>
                                {filteredDocuments.map((doc) => {
                                    const isSelected = selectedDocuments.some(selectedDoc => selectedDoc.id === doc.id);
                                    const isPrimary = documentContext?.id === doc.id;
                                    return (
                                        <div 
                                            key={doc.id} 
                                            className={`document-item ${isSelected ? 'selected' : ''} ${isPrimary ? 'primary' : ''} ${doc.status === 'inactive' ? 'inactive' : ''}`}
                                            onClick={(e) => doc.status !== 'inactive' && handleSelectDocument(doc, e)}
                                            title={`${doc.name}${isSelected ? ' (Selected)' : ''} - Click to select, Ctrl+Click for multi-select`}
                                            ref={isPrimary ? activeDocumentRef : null}
                                        >
                                        <div className="document-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                                <polyline points="14 2 14 8 20 8"></polyline>
                                            </svg>
                                        </div>
                                        <div className="document-details">
                                            <div className="document-name-container">
                                                <span className="document-name">{truncateText(doc.name)}</span>
                                                <div className="document-indicators">
                                                    {isSelected && (
                                                        <span className="selection-indicator" title="Selected">
                                                            ✓
                                                        </span>
                                                    )}
                                                    {/* <span className={`document-status ${doc.status}`}></span> */}
                                                </div>
                                            </div>
                                            <div className="document-meta">
                                                <span className="document-size">{doc.size}</span>
                                                {doc.fileType && (
                                                    <span className="document-type">• {doc.fileType.toUpperCase()}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    );
                                })}
                            </div>
                        )}
                        
                        {loadError && (
                            <div className="documents-error">
                                <p>Using sample data. Couldn't connect to database.</p>
                            </div>
                        )}
                    </div>

                    <div className="document-context">
                        <h3>
                            {selectedDocuments.length > 1 ? 'Selected Documents' : 'Active Document'}
                            {selectedDocuments.length > 0 && (
                                <span className="document-count">({selectedDocuments.length})</span>
                            )}
                        </h3>
                        {selectedDocuments.length > 0 ? (
                            <div className="selected-documents">
                                {selectedDocuments.map((doc, index) => (
                                    <div key={doc.id} className={`selected-document ${documentContext?.id === doc.id ? 'primary' : ''}`}>
                                        <div className="document-info">
                                            <div className="document-name" title={doc.name}>
                                                {index + 1}. {truncateText(doc.name, 25)}
                                            </div>
                                            <div className="document-meta">
                                                {doc.size}
                                                {doc.fileType && ` • ${doc.fileType.toUpperCase()}`}
                                                {doc.documentCategory && ` • ${doc.documentCategory.replace('-', ' ').toUpperCase()}`}
                                            </div>
                                        </div>
                                        <button 
                                            className="remove-document-btn"
                                            onClick={() => removeDocumentFromSelection(doc.id)}
                                            aria-label={`Remove ${doc.name}`}
                                            title="Remove from selection"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                                <line x1="6" y1="6" x2="18" y2="18"></line>
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                                <div className="document-actions">
                                    <button 
                                        className="clear-all-documents-btn"
                                        onClick={clearSelectedDocuments}
                                        title="Clear all selected documents"
                                    >
                                        Clear All
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="no-document">
                                <p>Full Workspace selected</p>
                                <p>For Documents :</p>
                                <p className="selection-hint">Click documents to select, Ctrl+Click for multi-select</p>
                                {/* <button 
                                    className="upload-document-btn" 
                                    onClick={handleFileUpload}
                                >
                                    Upload Document
                                </button> */}
                            </div>
                        )}
                    </div>
                </div>

                <div className="document-actions">
                    <button className="action-btn" onClick={clearChat}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                        Clear Chat
                    </button>
                    <button className="action-btn" onClick={handleFileUpload}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                        Upload
                    </button>
                </div>
            </div>
            
            <div className="document-chat-main">
                <div className="document-chat-header">
                    <div className="header-left">
                        <h2>Research Document Assistant</h2>
                    </div>
                    <div className="header-right">
                        <Tooltip title="Manage Chat History" arrow placement="bottom">
                            <Button
                                variant="outlined"
                                startIcon={<RestoreIcon />}
                                onClick={() => setShowSessionSidebar(true)}
                                sx={{
                                    backgroundColor: 'rgba(5, 33, 247, 0.2)',
                                    borderColor: 'rgba(10, 73, 233, 0.3)',
                                    color: 'rgb(100, 99, 99)',
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    textTransform: 'none',
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        backgroundColor: 'rgba(75, 71, 210, 0.2)',
                                        borderColor: 'rgba(10, 73, 233, 0.5)',
                                        transform: 'translateY(-1px)',
                                        boxShadow: '0 2px 8px rgba(10, 73, 233, 0.2)'
                                    },
                                    '&:active': {
                                        transform: 'translateY(0px)'
                                    }
                                }}
                            >
                                Chat History
                            </Button>
                        </Tooltip>
                        {/* <div className="status-section">
                            <span className="status-indicator"></span>
                            {isTyping ? 'Analyzing document...' : 'Ready'}
                        </div> */}
                    </div>
                </div>

                {/* Tab Bar */}
                <div className="chat-tabs-container">
                    <div className="chat-tabs">
                        {tabs.map((tab) => (
                            <div
                                key={tab.id}
                                className={`chat-tab ${activeTabId === tab.id ? 'active' : ''}`}
                                onClick={() => switchToTab(tab.id)}
                            >
                                {editingTabId === tab.id ? (
                                    <input
                                        type="text"
                                        value={editingTabName}
                                        onChange={(e) => setEditingTabName(e.target.value)}
                                        onBlur={handleRenameTab}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                handleRenameTab();
                                            } else if (e.key === 'Escape') {
                                                setEditingTabId(null);
                                                setEditingTabName('');
                                            }
                                        }}
                                        className="tab-rename-input"
                                        autoFocus
                                    />
                                ) : (
                                    <>
                                        <span className="tab-name" title={tab.name}>
                                            {tab.name}
                                        </span>
                                        <div className="tab-actions">
                                            <button
                                                className="tab-action-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEditTabClick(tab.id, tab.name);
                                                }}
                                                title="Rename tab"
                                            >
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                </svg>
                                            </button>
                                            {tabs.length > 1 && (
                                                <button
                                                    className="tab-action-btn close-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        closeTab(tab.id);
                                                    }}
                                                    title="Close tab"
                                                >
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                        <button
                            className="new-tab-btn"
                            onClick={handleNewTabClick}
                            title="Create new tab"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                        </button>
                    </div>
                </div>
                
                <div className="messages-container">
                    {messages.length === 0 ? (
                        <div className="empty-messages">
                            <div className="empty-messages-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                </svg>
                            </div>
                            <div className="empty-messages-title">Your conversation will appear here</div>
                            <div className="empty-messages-subtitle">
                                Upload research documents or ask questions about documents in our research database. 
                                The Research Assistant can perform semantic search, summarize findings, extract insights, 
                                and answer specific research questions about document content.
                            </div>
                        </div>
                    ) : (
                        <div className="message-wrapper">
                            <AnimatePresence>
                                {messages.map((message, index) => (
                                    <motion.div
                                        key={index}
                                        className={`message ${message.isBot ? 'bot' : 'user'}`}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <div className="message-meta">
                                            <div className="message-sender">
                                                {message.isBot ? 'Research Assistant' : 'You'}
                                            </div>
                                            {message.timestamp && (
                                                <div className="message-time">
                                                    {message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                </div>
                                            )}
                                        </div>
                                        <div className="message-bubble">
                                            {renderMessageContent(message.text, message.isBot, message)}
                                            <button 
                                                className="message-copy-btn"
                                                onClick={() => copyMessageToClipboard(message.text, index)}
                                                title="Copy message"
                                                aria-label="Copy message"
                                            >
                                                {copiedMessageId === index ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="20 6 9 17 4 12"></polyline>
                                                    </svg>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                                    </svg>
                                                )}
                                            </button>
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
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="input-section">
                    <form onSubmit={handleSendMessage} className="input-form">
                        <div className="message-input-wrapper">
                            <div className="message-input-container">
                                <textarea
                                    ref={inputRef}
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={selectedDocuments.length > 0 
                                        ? selectedDocuments.length === 1 
                                            ? `Ask about "${selectedDocuments[0].name}"...` 
                                            : `Ask about ${selectedDocuments.length} selected documents...`
                                        : "Ask about any document in the database..."}
                                    className="message-input"
                                    rows={1}
                                    disabled={isSending}
                                />
                                <div className="input-actions">
                                    {/* <button 
                                        type="button" 
                                        className="action-button upload-button"
                                        onClick={handleFileUpload}
                                        disabled={isSending}
                                        aria-label="Upload document"
                                        title="Upload a new document"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                            <polyline points="17 8 12 3 7 8"></polyline>
                                            <line x1="12" y1="3" x2="12" y2="15"></line>
                                        </svg>
                                    </button> */}
                                    <button 
                                        type="submit"
                                        className="action-button"
                                        disabled={!inputMessage.trim() || isSending}
                                        aria-label="Send message"
                                        title="Send message"
                                    >
                                        {isSending ? (
                                            <div className="loading-spinner"></div>
                                        ) : (
                                            <SendOutlinedIcon />
                                        )}
                                    </button>
                                </div>
                            </div>
                            <div className="input-footer">
                                <div className="input-controls">
                                    <div className="model-selector">
                                        <label htmlFor="model-select" className="model-label">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                                                <path d="M2 17l10 5 10-5"></path>
                                                <path d="M2 12l10 5 10-5"></path>
                                            </svg>
                                            Model:
                                        </label>
                                        <select
                                            id="model-select"
                                            value={selectedModel}
                                            onChange={(e) => setSelectedModel(e.target.value)}
                                            className="model-select"
                                            disabled={isSending}
                                        >
                                            <option value="gpt-4o-mini">GPT-4o Mini</option>
                                            <option value="gpt-4o">GPT-4o</option>
                                        </select>
                                    </div>
                                    <div className="input-hint">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10"></circle>
                                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                                            <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                        </svg>
                                        Press Enter to send, Shift+Enter for a new line
                                    </div>
                                </div>
                                {selectedDocuments.length > 0 && (
                                    selectedDocuments.length > 1 ? (
                                        <Tooltip 
                                            title={
                                                <div>
                                                    <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Selected documents:</div>
                                                    {selectedDocuments.map((doc, index) => (
                                                        <div key={doc.id} style={{ marginBottom: '4px' }}>
                                                            {index + 1}. {doc.name}
                                                        </div>
                                                    ))}
                                                </div>
                                            }
                                            placement="top"
                                            arrow
                                        >
                                            <div className="active-document-indicator">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                                    <polyline points="14 2 14 8 20 8"></polyline>
                                                </svg>
                                                <span>Chatting for {selectedDocuments.length} documents</span>
                                            </div>
                                        </Tooltip>
                                    ) : (
                                        <div className="active-document-indicator">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                                <polyline points="14 2 14 8 20 8"></polyline>
                                            </svg>
                                            <span>Chatting about: {selectedDocuments[0].name}</span>
                                        </div>
                                    )
                                )}
                                {pendingGlobalSearch && (
                                    <div className="global-search-pending-indicator">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="11" cy="11" r="8"></circle>
                                            <path d="M21 21l-4.35-4.35"></path>
                                        </svg>
                                        Waiting for your confirmation to search the web
                                    </div>
                                )}
                            </div>
                        </div>
                    </form>
                </div>
                
                {/* Hidden file input */}
                {/* <input 
                    ref={fileInputRef}
                    type="file" 
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.txt,.md"
                /> */}
            </div>

            {/* Chat Session Sidebar */}
            <ChatSessionSidebar
                isOpen={showSessionSidebar}
                onClose={() => setShowSessionSidebar(false)}
                onSelectConversation={handleSelectConversation}
                currentConversationId={currentSessionId}
                onCreateNewConversation={handleCreateNewConversation}
                workspaceId={workspaceId}
            />

            {/* Enhanced New Tab Dialog */}
            {showNewTabDialog && (
                <div className="modal-overlay" onClick={() => {
                    setShowNewTabDialog(false);
                    setModalMode('create');
                    setConversationSearchQuery('');
                    setSelectedConversationId(null);
                    setNewTabName('');
                }}>
                    <div className="modal-content enhanced-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Create New Tab</h3>
                            <button 
                                className="modal-close-btn"
                                onClick={() => {
                                    setShowNewTabDialog(false);
                                    setModalMode('create');
                                    setConversationSearchQuery('');
                                    setSelectedConversationId(null);
                                    setNewTabName('');
                                }}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                        
                        <div className="modal-body">
                            {/* Mode Selection */}
                            <div className="modal-mode-selector">
                                <button 
                                    className={`mode-btn ${modalMode === 'create' ? 'active' : ''}`}
                                    onClick={() => setModalMode('create')}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="12" y1="5" x2="12" y2="19"></line>
                                        <line x1="5" y1="12" x2="19" y2="12"></line>
                                    </svg>
                                    Create New Tab
                                </button>
                                <button 
                                    className={`mode-btn ${modalMode === 'select' ? 'active' : ''}`}
                                    onClick={() => setModalMode('select')}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                    </svg>
                                    Select from History
                                </button>
                            </div>

                            {/* Create New Tab Mode */}
                            {modalMode === 'create' && (
                                <div className="create-mode">
                                    <label htmlFor="tab-name">Tab Name:</label>
                                    <input
                                        id="tab-name"
                                        type="text"
                                        value={newTabName}
                                        onChange={(e) => setNewTabName(e.target.value)}
                                        placeholder="Enter tab name..."
                                        className="tab-name-input"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                handleCreateNewTab();
                                            } else if (e.key === 'Escape') {
                                                setShowNewTabDialog(false);
                                                setModalMode('create');
                                                setConversationSearchQuery('');
                                                setSelectedConversationId(null);
                                                setNewTabName('');
                                            }
                                        }}
                                        autoFocus
                                    />
                                </div>
                            )}

                            {/* Select from History Mode */}
                            {modalMode === 'select' && (
                                <div className="select-mode">
                                    <div className="conversation-search">
                                        <input
                                            type="text"
                                            placeholder="Search conversations..."
                                            value={conversationSearchQuery}
                                            onChange={(e) => setConversationSearchQuery(e.target.value)}
                                            className="conversation-search-input"
                                        />
                                    </div>
                                    
                                    <div className="conversation-list">
                                        {sessionsLoading ? (
                                            <div className="conversation-loading">
                                                <div className="loading-spinner"></div>
                                                <p>Loading conversations...</p>
                                            </div>
                                        ) : filteredConversations.length === 0 ? (
                                            <div className="no-conversations">
                                                {conversationSearchQuery ? (
                                                    <p>No conversations matching "{conversationSearchQuery}"</p>
                                                ) : (
                                                    <p>No conversations found</p>
                                                )}
                                            </div>
                                        ) : (
                                            filteredConversations.map((conversation) => (
                                                <div
                                                    key={conversation.chat_id}
                                                    className={`conversation-item ${selectedConversationId === conversation.chat_id ? 'selected' : ''}`}
                                                    onClick={() => setSelectedConversationId(conversation.chat_id)}
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
                                                    {selectedConversationId === conversation.chat_id && (
                                                        <div className="selection-indicator">
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <polyline points="20 6 9 17 4 12"></polyline>
                                                            </svg>
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="modal-footer">
                            <button 
                                className="btn-secondary"
                                onClick={() => {
                                    setShowNewTabDialog(false);
                                    setModalMode('create');
                                    setConversationSearchQuery('');
                                    setSelectedConversationId(null);
                                    setNewTabName('');
                                }}
                            >
                                Cancel
                            </button>
                            <button 
                                className="btn-primary"
                                onClick={handleCreateNewTab}
                                disabled={
                                    modalMode === 'create' ? !newTabName.trim() : 
                                    modalMode === 'select' ? !selectedConversationId : 
                                    true
                                }
                            >
                                {modalMode === 'create' ? 'Create Tab' : 'Open in New Tab'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DocumentChat; 