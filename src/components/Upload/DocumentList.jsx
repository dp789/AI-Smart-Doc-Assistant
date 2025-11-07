import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useMsal } from '@azure/msal-react';
import { 
    Snackbar, 
    Alert, 
    AlertTitle,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Checkbox,
    Typography,
    Box,
    Chip,
    Paper,
    IconButton,
    Tooltip,
    Menu,
    MenuItem
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { 
    Article as FolderIcon,
    Description as DescriptionIcon,
    CloudUpload as CloudUploadIcon,
    Search as SearchIcon,
    ViewList as ViewListIcon,
    GridView as GridViewIcon,
    Insights as IngestIcon,
    Warning as WarningIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    Info as InfoIcon,
    Schedule as ScheduleIcon,
    Psychology as AIIcon,
    AutoAwesome as AIProcessingIcon,
    SmartToy as AICompletedIcon,
    ErrorOutline as AIErrorIcon,
    AccessTime as AIPendingIcon,
    Sync as AISyncIcon,
    Web as WebUploadIcon,
    ShareOutlined as SharePointIcon,
    Computer as LocalUploadIcon,
    Source as SourceIcon,
    PictureAsPdf as PdfIcon,
    Image as ImageIcon,
    VideoFile as VideoIcon,
    AudioFile as AudioIcon,
    Archive as ArchiveIcon,
    InsertDriveFile as DefaultFileIcon,
    TableChart as ExcelIcon,
    Code as CodeIcon,
    Category as CategoryIcon,
    Add as AddIcon,
    Preview as PreviewIcon,
    MoreVert as MoreVertIcon,
    ContentCopy as LongContextIcon,
    ShortText as ShortContextIcon
} from '@mui/icons-material';
import envConfig, { verifyEnvironmentUrls } from '../../envConfig';
import { getAuthHeaders } from '../../utils/authUtils';
import { useUserProfile } from '../../hooks/useUserProfile';
import { updateDocumentMetadataCategory, fetchDocumentCategoryById } from '../../services/documentCategoryService';
import DocumentViewer from '../DocumentViewer';
import './DocumentList.css';

// Constants
const BYPASS_USER_ID = 'd4b2fbfe-702b-49d4-9b42-41d343c26da5';
const INGESTION_SOURCE_ID = 3;
const CORS_PROXY_URL = 'https://cors-anywhere.herokuapp.com/';
const TARGET_INGEST_URL = 'https://smartdocs-funcapp-783.azurewebsites.net/api/process_smartdocs_document?code=E9YySL3xbCQVPydpn5nD-ebjRxACxdoCWsyvAOwbiLkxAzFuQmLMYA%3D%3D';

// Status configurations
const STATUS_CONFIG = {
    active: { text: 'Active', color: 'status-active', icon: <CheckCircleIcon className="status-icon" /> },
    inactive: { text: 'Inactive', color: 'status-inactive', icon: <ErrorIcon className="status-icon" /> },
    processing: { text: 'Processing', color: 'status-processing', icon: <InfoIcon className="status-icon" /> },
    default: { text: 'Unknown', color: 'status-unknown', icon: <WarningIcon className="status-icon" /> }
};

// AI Ingestion Status configurations
const INGESTION_STATUS_CONFIG = {
    pending: { 
        text: 'Pending', 
        color: 'ingestion-pending', 
        icon: <AIPendingIcon className="ingestion-icon pending" />,
        animated: false
    },
    processing: { 
        text: 'Processing', 
        color: 'ingestion-processing', 
        icon: <AISyncIcon className="ingestion-icon processing rotating" />,
        animated: true
    },
    completed: { 
        text: 'AI Ready', 
        color: 'ingestion-completed', 
        icon: <AICompletedIcon className="ingestion-icon completed" />,
        animated: false
    },
    failed: { 
        text: 'Failed', 
        color: 'ingestion-failed', 
        icon: <AIErrorIcon className="ingestion-icon failed" />,
        animated: false
    },
    error: { 
        text: 'Error', 
        color: 'ingestion-error', 
        icon: <AIErrorIcon className="ingestion-icon error" />,
        animated: false
    },
    default: { 
        text: 'Not Processed', 
        color: 'ingestion-not-processed', 
        icon: <AIIcon className="ingestion-icon default" />,
        animated: false
    }
};

// Source configurations based on ingestion_source_id
const SOURCE_CONFIG = {
    1: {
        text: 'SharePoint',
        shortText: 'SharePoint',
        color: 'source-sharepoint',
        icon: <SharePointIcon className="source-icon sharepoint" />,
        description: 'Imported from SharePoint'
    },
    2: {
        text: 'Web Upload',
        shortText: 'Web',
        color: 'source-web',
        icon: <WebUploadIcon className="source-icon web" />,
        description: 'Uploaded via web interface'
    },
    3: {
        text: 'Local Upload',
        shortText: 'Local',
        color: 'source-local',
        icon: <LocalUploadIcon className="source-icon local" />,
        description: 'Uploaded from local device'
    },
    default: {
        text: 'Unknown',
        shortText: 'Unknown',
        color: 'source-unknown',
        icon: <SourceIcon className="source-icon unknown" />,
        description: 'Unknown source'
    }
};

// Toast configuration
const TOAST_CONFIG = {
    duration: 6000,
    position: { vertical: 'bottom', horizontal: 'left' }
};

const DocumentList = ({ refreshTrigger = 0 }) => {
    // State management
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('list');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [selectedDocuments, setSelectedDocuments] = useState(new Set());
    const [ingestingDocuments, setIngestingDocuments] = useState(new Set());
    const [bulkProcessing, setBulkProcessing] = useState(false);
    const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
    
    // Document viewer state
    const [viewerOpen, setViewerOpen] = useState(false);
    const [viewingDocument, setViewingDocument] = useState(null);
    
    // Toast state
    const [toast, setToast] = useState({
        open: false,
        message: '',
        severity: 'info',
        title: ''
    });

    // Custom tooltip state
    const [tooltip, setTooltip] = useState({
        show: false,
        text: '',
        x: 0,
        y: 0
    });

    // Category suggestions tooltip state
    const [categoryTooltip, setCategoryTooltip] = useState({
        show: false,
        documentId: null,
        x: 0,
        y: 0
    });

    // Context menu state
    const [contextMenu, setContextMenu] = useState({
        open: false,
        documentId: null,
        anchorEl: null
    });

    // Hooks
    const userProfile = useUserProfile();
    const { accounts } = useMsal();

    // Loading spinner component
    const LoadingSpinner = () => (
        <div className="loading-spinner-small"></div>
    );

    // Utility functions
    const isBypassMode = () => sessionStorage.getItem('bypass_auth') === 'true';

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

    const getAuthConfig = useCallback(async () => {
        const bypassMode = isBypassMode();
        const endpoint = bypassMode ? 'test/ingestion-source/3' : '/';
        
        const headers = bypassMode ? {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        } : {
            ...(await getAuthHeaders()),
            'X-Requested-With': 'XMLHttpRequest'
        };

        return { headers, endpoint };
    }, []);

    const showToast = useCallback((message, severity = 'info', title = '') => {
        setToast({
            open: true,
            message,
            severity,
            title
        });
    }, []);

    const hideToast = useCallback(() => {
        setToast(prev => ({ ...prev, open: false }));
    }, []);

    const showCustomTooltip = useCallback((event, text) => {
        const rect = event.target.getBoundingClientRect();
        setTooltip({
            show: true,
            text,
            x: rect.left + rect.width / 2,
            y: rect.top - 35
        });
    }, []);

    const hideCustomTooltip = useCallback(() => {
        setTooltip(prev => ({ ...prev, show: false }));
    }, []);

    const showCategoryTooltip = useCallback((event, document) => {
        const rect = event.target.getBoundingClientRect();
        setCategoryTooltip({
            show: true,
            documentId: document.id,
            x: rect.left + rect.width / 2,
            y: rect.top - 35
        });
    }, []);

    const hideCategoryTooltip = useCallback(() => {
        setCategoryTooltip(prev => ({ ...prev, show: false }));
    }, []);

    const handleContextMenuOpen = useCallback((event, documentId) => {
        event.stopPropagation();
        setContextMenu({
            open: true,
            documentId,
            anchorEl: event.currentTarget
        });
    }, []);

    const handleContextMenuClose = useCallback(() => {
        setContextMenu({
            open: false,
            documentId: null,
            anchorEl: null
        });
    }, []);

    const handleAddToLongContext = useCallback((documentId) => {
        const document = documents.find(doc => doc.id === documentId);
        if (document) {
            console.log('Adding to long context:', document.fileName);
            showToast(`Added "${document.fileName}" to long context`, 'success', 'Context Updated');
            // TODO: Implement actual long context functionality
        }
        handleContextMenuClose();
    }, [documents, showToast]);

    const handleAddToShortContext = useCallback((documentId) => {
        const document = documents.find(doc => doc.id === documentId);
        if (document) {
            console.log('Adding to short context:', document.fileName);
            showToast(`Added "${document.fileName}" to short context`, 'success', 'Context Updated');
            // TODO: Implement actual short context functionality
        }
        handleContextMenuClose();
    }, [documents, showToast]);

    const formatDate = useCallback((dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }, []);

    const getStatusConfig = useCallback((status) => {
        return STATUS_CONFIG[status] || STATUS_CONFIG.default;
    }, []);

    const getIngestionStatusConfig = useCallback((status) => {
        // Handle legacy boolean values for backward compatibility
        if (status === true || status === 'true') {
            return INGESTION_STATUS_CONFIG.completed;
        }
        if (status === false || status === 'false') {
            return INGESTION_STATUS_CONFIG.failed;
        }
        return INGESTION_STATUS_CONFIG[status] || INGESTION_STATUS_CONFIG.default;
    }, []);

    const getSourceConfig = useCallback((sourceId) => {
        return SOURCE_CONFIG[sourceId] || SOURCE_CONFIG.default;
    }, []);

    // Enhanced tooltip component for category suggestions
    const CategorySuggestionsTooltip = ({ document, onClose }) => {
        const [selectedCategory, setSelectedCategory] = useState(null);
        const [updating, setUpdating] = useState(false);
        const [availableCategories, setAvailableCategories] = useState([]);
        const [loadingCategories, setLoadingCategories] = useState(false);
        const [currentCategoryDetails, setCurrentCategoryDetails] = useState(null);
        const [loadingCurrentCategory, setLoadingCurrentCategory] = useState(false);
        
        // Fetch available categories when tooltip opens
        useEffect(() => {
            const fetchCategories = async () => {
                try {
                    setLoadingCategories(true);
                    const config = verifyEnvironmentUrls();
                    const authHeaders = await getAuthHeaders();
                    
                    const response = await fetch(`${config.apiUrl}/document-categories`, {
                        method: 'GET',
                        headers: {
                            ...authHeaders,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (response.ok) {
                        const result = await response.json();
                        if (result.success) {
                            setAvailableCategories(result.data.filter(cat => cat.id)); // Filter out null IDs
                        }
                    }
                } catch (error) {
                    console.warn('⚠️ Could not fetch available categories:', error);
                } finally {
                    setLoadingCategories(false);
                }
            };
            
            fetchCategories();
        }, []);
        
        // Fetch current category details when tooltip opens
        useEffect(() => {
            const fetchCurrentCategory = async () => {
                if (document.documentCategory && typeof document.documentCategory === 'number') {
                    try {
                        setLoadingCurrentCategory(true);
                        const categoryDetails = await fetchDocumentCategoryById(document.documentCategory);
                        setCurrentCategoryDetails(categoryDetails);
                    } catch (error) {
                        console.warn('⚠️ Could not fetch current category details:', error);
                        setCurrentCategoryDetails(null);
                    } finally {
                        setLoadingCurrentCategory(false);
                    }
                } else {
                    setCurrentCategoryDetails(null);
                    setLoadingCurrentCategory(false);
                }
            };
            
            fetchCurrentCategory();
        }, [document.documentCategory]);
        
        const handleCategorySelect = async (categoryType) => {
            try {
                setUpdating(true);
                console.log(`🔄 Updating document ${document.id} with category: "${categoryType}"`);
                console.log(`📄 Document: ${document.fileName}`);
                console.log(`🔍 Looking for category: "${categoryType}"`);
                
                await updateDocumentMetadataCategory(document.id, categoryType);
                
                // Update local state - we'll get the actual category ID from the response
                setDocuments(prevDocs => prevDocs.map(doc => 
                    doc.id === document.id 
                        ? { ...doc, documentCategory: categoryType }
                        : doc
                ));
                
                showToast(`Successfully assigned category "${categoryType}" to ${document.fileName}`, 'success', 'Category Updated');
                onClose();
                
            } catch (error) {
                console.error('❌ Error updating document category:', error);
                let errorMessage = error.message;
                
                // Provide more helpful error messages
                if (errorMessage.includes('Category type') && errorMessage.includes('not found')) {
                    errorMessage = `Category "${categoryType}" not found. Please check the available categories.`;
                } else if (errorMessage.includes('Failed to update')) {
                    errorMessage = `Failed to update category. Please try again.`;
                }
                
                showToast(errorMessage, 'error', 'Category Update Failed');
            } finally {
                setUpdating(false);
            }
        };

        if (!document.categorySuggestions) return null;

        // Handle different data formats for category suggestions
        let suggestions = [];
        try {
            if (Array.isArray(document.categorySuggestions)) {
                suggestions = document.categorySuggestions;
            } else if (typeof document.categorySuggestions === 'string') {
                // Handle comma-separated values like "Research Paper, Training Document"
                if (document.categorySuggestions.includes(',')) {
                    suggestions = document.categorySuggestions
                        .split(',')
                        .map(s => s.trim())
                        .filter(s => s.length > 0);
                } else {
                    // Single value without comma
                    suggestions = [document.categorySuggestions.trim()];
                }
            } else if (typeof document.categorySuggestions === 'object') {
                // Convert object to array of values
                suggestions = Object.values(document.categorySuggestions);
            } else {
                suggestions = [String(document.categorySuggestions)];
            }
        } catch (error) {
            console.warn('⚠️ Error parsing category suggestions:', error);
            suggestions = ['Unknown Category'];
        }

        // Filter out empty or invalid suggestions
        suggestions = suggestions.filter(suggestion => 
            suggestion && 
            typeof suggestion === 'string' && 
            suggestion.trim().length > 0
        );

        // Log the parsed suggestions for debugging
        console.log('📋 Parsed category suggestions:', {
            original: document.categorySuggestions,
            parsed: suggestions,
            count: suggestions.length
        });

        if (suggestions.length === 0) {
            return (
                <div className="category-suggestions-tooltip">
                    <div className="tooltip-header">
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#8b5cf6' }}>
                            {document.documentCategory ? (
                                loadingCurrentCategory ? 'Document Category' : 
                                currentCategoryDetails ? `Document Category: ${currentCategoryDetails.label || currentCategoryDetails.value || 'Unknown'}` : 
                                'Document Category'
                            ) : 'Category Suggestions'}
                        </Typography>
                        <IconButton 
                            size="small" 
                            onClick={onClose}
                            sx={{ color: '#64748b' }}
                        >
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </div>
                    <div className="tooltip-content">
                        {document.documentCategory ? (
                            <>
                                {/* Current Document Category Info */}
                                <Box sx={{ mb: 2, p: 1, backgroundColor: 'rgba(34, 197, 94, 0.1)', borderRadius: 1, border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                                    <Typography variant="caption" sx={{ color: '#16a34a', fontWeight: 500 }}>
                                        Current Category: {document.documentCategory}
                                    </Typography>
                                </Box>
                                <Typography variant="body2" sx={{ color: '#ffffff' }}>
                                    <div>This document is categorized as "{loadingCurrentCategory ? '...' : (currentCategoryDetails ? (currentCategoryDetails.label || currentCategoryDetails.value || `ID: ${document.documentCategory}`) : `ID: ${document.documentCategory}`)}".</div>
                                    <div style={{ marginTop: '4px', fontSize: '0.9em', opacity: 0.9 }}>
                                        No additional suggestions available.
                                    </div>
                                </Typography>
                            </>
                        ) : (
                            <Typography variant="body2" sx={{ color: '#ffffff' }}>
                                No valid category suggestions available for this document.
                            </Typography>
                        )}
                    </div>
                </div>
            );
        }

        return (
            <div className="category-suggestions-tooltip">
                <div className="tooltip-header">
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#8b5cf6' }}>
                        {document.documentCategory ? (
                            loadingCurrentCategory ? 'Document Category' : 
                            currentCategoryDetails ? `Document Category: ${currentCategoryDetails.label || currentCategoryDetails.value || 'Unknown'}` : 
                            'Document Category'
                        ) : `Category Suggestions (${suggestions.length})`}
                    </Typography>
                    <IconButton 
                        size="small" 
                        onClick={onClose}
                        sx={{ color: '#64748b' }}
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </div>
                <div className="tooltip-content">
                    <Typography variant="body2" sx={{ color: '#ffffff', mb: 2 }}>
                        {document.documentCategory 
                            ? (
                                <>
                                    <div>This document is already categorized.</div>
                                    <div style={{ marginTop: '4px', fontSize: '0.9em', opacity: 0.9 }}>
                                        You can change the category below if needed.
                                    </div>
                                </>
                            ) : (
                                'Click the + button to assign a category to this document'
                            )
                        }
                    </Typography>
                    
                    {/* Current Document Category Info */}
                    {document.documentCategory && (
                        <Box sx={{ mb: 2, p: 1, backgroundColor: 'rgba(34, 197, 94, 0.1)', borderRadius: 1, border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                            <Typography variant="caption" sx={{ color: '#16a34a', fontWeight: 500 }}>
                                Current Category: {loadingCurrentCategory ? (
                                    <span style={{ fontStyle: 'italic' }}>Loading...</span>
                                ) : currentCategoryDetails ? (
                                    currentCategoryDetails.label || currentCategoryDetails.value || `ID: ${document.documentCategory}`
                                ) : (
                                    `ID: ${document.documentCategory}`
                                )}
                            </Typography>
                        </Box>
                    )}
                    
                    {/* Available Categories Info - Only show if no current category */}
                    {!document.documentCategory && !loadingCategories && availableCategories.length > 0 && (
                        <Box sx={{ mb: 2, p: 1, backgroundColor: 'rgba(139, 92, 246, 0.1)', borderRadius: 1 }}>
                            <Typography variant="caption" sx={{ color: '#8b5cf6', fontWeight: 500 }}>
                                Available Categories: {availableCategories.map(c => c.label).join(', ')}
                            </Typography>
                        </Box>
                    )}
                    
                    {suggestions.map((suggestion, index) => (
                        <div key={index} className="suggestion-item">
                            <Typography variant="body2" sx={{ color: '#ffffff', flex: 1 }}>
                                {suggestion}
                            </Typography>
                            <Tooltip 
                                title={`Assign "${suggestion}" category`}
                            >
                                <IconButton
                                    size="small"
                                    onClick={() => handleCategorySelect(suggestion)}
                                    disabled={updating}
                                    sx={{
                                        color: '#8b5cf6',
                                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                                        '&:hover': {
                                            backgroundColor: 'rgba(139, 92, 246, 0.2)',
                                        },
                                        '&:disabled': {
                                            color: '#cbd5e1',
                                            backgroundColor: 'rgba(203, 213, 225, 0.1)',
                                        }
                                    }}
                                >
                                    {updating ? <LoadingSpinner /> : <AddIcon fontSize="small" />}
                                </IconButton>
                            </Tooltip>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const getFileIcon = useCallback((fileName, size = 'medium') => {
        if (!fileName) return <DefaultFileIcon className={`file-icon ${size}`} />;
        
        const extension = fileName.split('.').pop()?.toLowerCase();
        const iconClass = `file-icon ${size}`;
        
        switch (extension) {
            case 'pdf':
                return <PdfIcon className={`${iconClass} pdf`} />;
            case 'doc':
            case 'docx':
                return <DescriptionIcon className={`${iconClass} word`} />;
            case 'xls':
            case 'xlsx':
            case 'csv':
                return <ExcelIcon className={`${iconClass} excel`} />;
            case 'ppt':
            case 'pptx':
                return <DescriptionIcon className={`${iconClass} powerpoint`} />;
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
            case 'svg':
            case 'webp':
                return <ImageIcon className={`${iconClass} image`} />;
            case 'mp4':
            case 'avi':
            case 'mov':
            case 'wmv':
            case 'mkv':
                return <VideoIcon className={`${iconClass} video`} />;
            case 'mp3':
            case 'wav':
            case 'flac':
            case 'aac':
                return <AudioIcon className={`${iconClass} audio`} />;
            case 'zip':
            case 'rar':
            case '7z':
            case 'tar':
            case 'gz':
                return <ArchiveIcon className={`${iconClass} archive`} />;
            case 'js':
            case 'jsx':
            case 'ts':
            case 'tsx':
            case 'html':
            case 'css':
            case 'json':
            case 'xml':
                return <CodeIcon className={`${iconClass} code`} />;
            case 'txt':
            case 'md':
            case 'rtf':
                return <DescriptionIcon className={`${iconClass} text`} />;
            default:
                return <DefaultFileIcon className={`${iconClass} default`} />;
        }
    }, []);

    // API functions
    const updateDocumentIngestionStatus = useCallback(async (documentId, status) => {
        try {
            const { headers } = await getAuthConfig();
            const apiUrl = envConfig.apiUrl;
            
            await axios.put(`${apiUrl}/documents/${documentId}/ingestion-status`, {
                ingestionStatus: status,
                ingestionDate: new Date().toISOString()
            }, { headers });
            
            console.log(`✅ Updated ingestion status for ${documentId} to ${status}`);
        } catch (error) {
            console.warn(`⚠️ Failed to update ingestion status for ${documentId}:`, error.message);
        }
    }, [getAuthConfig]);

    const ingestDocument = useCallback(async (document) => {
        try {
            setIngestingDocuments(prev => new Set([...prev, document.id]));
            
            // Update status to pending
            await updateDocumentIngestionStatus(document.id, 'pending');
            
            // Update local state to show pending status
            setDocuments(prevDocs => prevDocs.map(doc => 
                doc.id === document.id 
                    ? { ...doc, ingestionStatus: 'pending', ingestionDate: new Date().toISOString() }
                    : doc
            ));
            
            const userId = getUserId();
            const documentId = document.documentGuid;
              
            // Update status to processing
            await updateDocumentIngestionStatus(document.id, 'processing');
            setDocuments(prevDocs => prevDocs.map(doc => 
                doc.id === document.id 
                    ? { ...doc, ingestionStatus: 'processing' }
                    : doc
            ));
            
            let response;
            
            // Try backend proxy first
            try {
                const apiUrl = envConfig.ingestApiUrl;
                
                // Determine file type from file extension
                const getFileType = (fileName) => {
                    const extension = fileName.split('.').pop()?.toLowerCase();
                    switch (extension) {
                        case 'pdf':
                            return 'pdf';
                        case 'docx':
                        case 'doc':
                            return 'docx';
                        default:
                            return 'pdf'; // Default to PDF for unknown types
                    }
                };
                
                const fileType = getFileType(document.fileName);
                
                response = await axios.post(`${apiUrl}/ingest-document`, {
                    workspace_id: userId,
                    document_id: documentId,
                    ingestion_source_id: document.ingestionSourceId,
                    file_type: fileType,
                    file_name: document.fileName,
                    document_category: document.documentCategory,
                    keywords: document.keywords
                }, {
                    headers: { 'Content-Type': 'application/json' }
                });
            } catch (proxyError) {
                console.warn('⚠️ Backend proxy failed, trying CORS proxy:', proxyError.message);
                
                // Fallback to CORS proxy service
                const fileType = getFileType(document.fileName);
                response = await axios.post(`${CORS_PROXY_URL}${TARGET_INGEST_URL}`, {
                    workspace_id: userId,
                    document_id: documentId,
                    ingestion_source_id: document.ingestionSourceId,
                    file_type: fileType,
                    file_name: document.fileName,
                    document_category: document.documentCategory,
                    keywords: document.keywords
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Origin': window.location.origin
                    }
                });
            }
            
            console.log('✅ Ingest API response:', response.data);
            
            // Update status to completed
            await updateDocumentIngestionStatus(document.id, 'completed');
            setDocuments(prevDocs => prevDocs.map(doc => 
                doc.id === document.id 
                    ? { ...doc, ingestionStatus: 'completed', ingestionDate: new Date().toISOString() }
                    : doc
            ));
            
            showToast(`${document.fileName} has been successfully processed for AI!`, 'success', 'AI Processing Complete');
            
        } catch (error) {
            console.error('❌ Error ingesting document:', error);
            
            // Update status to failed
            await updateDocumentIngestionStatus(document.id, 'failed');
            setDocuments(prevDocs => prevDocs.map(doc => 
                doc.id === document.id 
                    ? { ...doc, ingestionStatus: 'failed', ingestionDate: new Date().toISOString() }
                    : doc
            ));
            
            let errorMessage = 'Failed to process document for AI';
            if (error.response) {
                errorMessage += `: ${error.response.status} - ${error.response.data?.message || error.response.statusText}`;
            } else if (error.request) {
                errorMessage += ': Network error - please check your connection';
            } else {
                errorMessage += `: ${error.message}`;
            }
            
            showToast(errorMessage, 'error', 'AI Processing Failed');
        } finally {
            setIngestingDocuments(prev => {
                const newSet = new Set(prev);
                newSet.delete(document.id);
                return newSet;
            });
        }
    }, [getUserId, showToast, getAuthConfig, updateDocumentIngestionStatus]);

    const fetchDocuments = useCallback(async (forceRefresh = false) => {
        try {
            setLoading(true);
            setError(null);
            
            const { headers, endpoint } = await getAuthConfig();
            const apiUrl = envConfig.apiUrl;

            // Add cache buster if force refresh is requested
            const params = {};
            if (forceRefresh) {
                params.cacheBuster = Date.now().toString();
            }

            const workspaceId = getUserId();

            const response = await axios.get(`${apiUrl}/documents/${workspaceId}`, { 
                headers: {
                    ...headers,
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                },
                params: params
            });

            if (response.data.success) {
                setDocuments(response.data.data.documents);
                if (response.data.data.documents && response.data.data.documents.length > 0) {
                    const message = forceRefresh 
                        ? `Successfully refreshed ${response.data.data.documents.length} document(s)`
                        : `Successfully loaded ${response.data.data.documents.length} document(s)`;
                    showToast(message, 'success', forceRefresh ? 'Documents Refreshed' : 'Documents Loaded');
                    
                    // Log category suggestions data for debugging
                    const docsWithCategories = response.data.data.documents.filter(doc => doc.categorySuggestions);
                    if (docsWithCategories.length > 0) {
                        console.log('📋 Documents with category suggestions:', docsWithCategories.map(doc => ({
                            fileName: doc.fileName,
                            categorySuggestions: doc.categorySuggestions,
                            type: typeof doc.categorySuggestions,
                            hasComma: typeof doc.categorySuggestions === 'string' ? doc.categorySuggestions.includes(',') : false
                        })));
                    }
                }
            } else {
                throw new Error(response.data.message || 'Failed to fetch documents');
            }
        } catch (error) {
            console.error('Error fetching documents:', error);
            
            let errorMessage = 'Failed to fetch documents';
            
            if (error.response?.status === 401) {
                errorMessage = 'Authentication required. Please log in again or enable bypass mode for testing.';
                showToast(errorMessage, 'error', 'Authentication Error');
            } else if (error.response?.status === 403) {
                errorMessage = 'Access denied. You may not have permission to view these documents.';
                showToast(errorMessage, 'error', 'Access Denied');
            } else {
                errorMessage = error.response?.data?.message || error.message || 'Failed to fetch documents';
                showToast(errorMessage, 'error', 'Error Loading Documents');
            }
            
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [getAuthConfig, showToast, getUserId]);

    // Force refresh function
    const forceRefreshDocuments = useCallback(() => {
        fetchDocuments(true);
    }, [fetchDocuments]);

    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);

    // Auto-refresh when refreshTrigger changes (upload success)
    useEffect(() => {
        if (refreshTrigger > 0) {
            fetchDocuments(true); // Use force refresh for upload-triggered refreshes
        }
    }, [refreshTrigger, fetchDocuments]);

    // Handle clicking outside category tooltip
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (categoryTooltip.show) {
                const tooltipElement = document.querySelector('.category-tooltip-container');
                if (tooltipElement && !tooltipElement.contains(event.target)) {
                    hideCategoryTooltip();
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [categoryTooltip.show, hideCategoryTooltip]);

    const downloadDocument = useCallback(async (docItem) => {
        try {
            const { headers } = await getAuthConfig();
            const apiUrl = envConfig.apiUrl;

            const response = await axios.get(`${apiUrl}/documents/${docItem.id}/content`, {
                headers,
                responseType: 'json'
            });

            if (response?.data?.success && response?.data?.data?.content) {
                const { content: base64Content, fileName = docItem.fileName, contentType = 'application/octet-stream' } = response?.data?.data;
                
                const binaryString = atob(base64Content);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                
                const blob = new Blob([bytes], { type: contentType });
                const url = window.URL.createObjectURL(blob);
                const link = window.document.createElement('a');
                link.href = url;
                link.download = fileName;
                window.document.body.appendChild(link);
                link.click();
                window.document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
                

                showToast(`Successfully downloaded: ${docItem.fileName}`, 'success', 'Download Complete');
            
            } else {
                throw new Error('No content received or invalid response format');
            }
        } catch (error) {
            console.error('Error downloading document:', error);
            showToast(`Failed to download document: ${error.message}`, 'error');
        }
    }, [getAuthConfig, showToast]);

    const handleViewDocument = useCallback((docItem) => {
        setViewingDocument(docItem);
        setViewerOpen(true);
    }, []);

    const handleCloseViewer = useCallback(() => {
        setViewerOpen(false);
        setViewingDocument(null);
    }, []);

    const handleDownloadFromViewer = useCallback(async (docItem) => {
        try {
            await downloadDocument(docItem);
        } catch (error) {
            console.error('Error downloading document:', error);
            showToast(`Failed to download document: ${error.message}`, 'error');
        }
    }, [downloadDocument, showToast]);

    // Filtered documents
    const filteredDocuments = documents.filter(doc =>
        doc.fileName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Event handlers
    const handleDocumentClick = useCallback((document) => {
        setSelectedDocument(document.id === selectedDocument?.id ? null : document);
        console.log('Selected document:', document);
    }, [selectedDocument]);

    const handleCheckboxChange = useCallback((documentId, event) => {
        event.stopPropagation();
        const newSelected = new Set(selectedDocuments);
        if (newSelected.has(documentId)) {
            newSelected.delete(documentId);
        } else {
            newSelected.add(documentId);
        }
        setSelectedDocuments(newSelected);
    }, [selectedDocuments]);

    const handleSelectAll = useCallback(() => {
        if (selectedDocuments.size === filteredDocuments.length) {
            setSelectedDocuments(new Set());
        } else {
            const allIds = filteredDocuments.map(doc => doc.id);
            setSelectedDocuments(new Set(allIds));
        }
    }, [selectedDocuments.size, filteredDocuments]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (event) => {
            // Ctrl+A or Cmd+A to select all
            if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
                event.preventDefault();
                handleSelectAll();
            }
            // Escape to clear selection
            if (event.key === 'Escape') {
                setSelectedDocuments(new Set());
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleSelectAll]);

    // Bulk ingestion function
    const handleBulkIngest = useCallback(async () => {
        if (selectedDocuments.size === 0) {
            showToast('Please select documents to process', 'warning', 'No Documents Selected');
            return;
        }

        const selectedDocs = documents.filter(doc => selectedDocuments.has(doc.id));
        const processableDocs = selectedDocs.filter(doc => {
            const isIngested = doc.ingestionStatus === 'completed' || doc.ingestionStatus === true || doc.ingestionStatus === 'true';
            const isProcessing = doc.ingestionStatus === 'processing' || doc.ingestionStatus === 'pending';
            return !isIngested && !isProcessing;
        });

        if (processableDocs.length === 0) {
            showToast('No documents available for processing', 'info', 'No Processable Documents');
            return;
        }

        setBulkProcessing(true);
        setBulkProgress({ current: 0, total: processableDocs.length });
        showToast(`Starting AI processing for ${processableDocs.length} document(s)...`, 'info', 'Bulk Processing Started');

        // Process documents sequentially to avoid overwhelming the API
        for (let i = 0; i < processableDocs.length; i++) {
            const doc = processableDocs[i];
            try {
                setBulkProgress({ current: i + 1, total: processableDocs.length });
                await ingestDocument(doc);
                // Small delay between requests
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
                console.error(`Failed to process ${doc.fileName}:`, error);
            }
        }

        setBulkProcessing(false);
        setBulkProgress({ current: 0, total: 0 });
        
        // Clear selection after processing
        setSelectedDocuments(new Set());
        showToast(`Completed processing ${processableDocs.length} document(s)`, 'success', 'Bulk Processing Complete');
        
        // Refresh the document list to show updated ingestion statuses
        setTimeout(() => {
            fetchDocuments(true);
        }, 1000);
    }, [selectedDocuments, documents, ingestDocument, showToast]);



    // Render loading state
    if (loading) {
        return (
            <div className="document-list-container">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading documents...</p>
                </div>
            </div>
        );
    }

    // Render error state
    if (error) {
        return (
            <div className="document-list-container">
                <div className="error-container">
                    <div className="error-icon"><WarningIcon /></div>
                    <h3>Error Loading Documents</h3>
                    <p>{error}</p>
                    <div className="error-actions">
                        <button onClick={() => {
                            showToast('Retrying to fetch documents...', 'info', 'Retrying');
                            fetchDocuments();
                        }} className="retry-button">
                            <IngestIcon className="button-icon" /> Retry
                        </button>
                        <button 
                            onClick={() => {
                                sessionStorage.setItem('bypass_auth', 'true');
                                showToast('Bypass mode enabled. Reloading...', 'info', 'Bypass Mode');
                                window.location.reload();
                            }} 
                            className="bypass-button"
                        >
                            <CloudUploadIcon className="button-icon" /> Enable Bypass Mode
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="document-list-container">
            <div className="document-list-header">
                <div className="header-left">
                    <h2><FolderIcon className="header-icon" /> Document Files</h2>
                    <p>{filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''} found</p>
                </div>
                <div className="header-right">
                    <div className="search-container">
                        <SearchIcon className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search documents..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-input"
                        />
                    </div>
                    <div className="header-actions">
                        <button 
                            className="refresh-button"
                            title="Refresh Documents"
                            onClick={forceRefreshDocuments}
                            disabled={loading}
                        >
                            <AISyncIcon className={`button-icon ${loading ? 'rotating' : ''}`} />
                            {loading ? 'Refreshing...' : 'Refresh'}
                        </button>
                       
                    </div>
                    <div className="view-toggle">
                        <button
                            className={`view-button ${viewMode === 'list' ? 'active' : ''}`}
                            onClick={() => setViewMode('list')}
                            title="List View"
                        >
                            <ViewListIcon />
                        </button>
                        <button
                            className={`view-button ${viewMode === 'grid' ? 'active' : ''}`}
                            onClick={() => setViewMode('grid')}
                            title="Grid View"
                        >
                            <GridViewIcon />
                        </button>
                    </div>
                </div>
            </div>

            {filteredDocuments.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon"><DescriptionIcon /></div>
                    <h3>No documents found</h3>
                    <p>{searchQuery ? 'Try adjusting your search terms.' : 'No documents have been uploaded yet.'}</p>
                </div>
            ) : viewMode === 'list' ? (
                <div className="list-view-container">
                    {/* List Header */}
                    <div className="list-header">
                        <div className="list-header-content">
                            {/* Checkbox Column */}
                            <div className="list-header-checkbox">
                                <Checkbox
                                    checked={selectedDocuments.size === filteredDocuments.length && filteredDocuments.length > 0}
                                    onChange={handleSelectAll}
                                    sx={{ p: 0 }}
                                />
                            </div>
                            
                            {/* File Icon Placeholder + Filename */}
                            <div className="list-header-filename">
                                <div className="list-header-icon-placeholder"></div>
                                <Typography variant="subtitle2" className="list-header-column">
                                    Filename
                                </Typography>
                            </div>
                            
                            {/* Status Column */}
                            <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: '120px' }}>
                                <Typography variant="subtitle2" className="list-header-column">
                                    Status
                                </Typography>
                            </Box>
                            
                            {/* AI Ingestion Status Column */}
                            <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: '120px', marginLeft: '20px' }}>
                                <Typography variant="subtitle2" className="list-header-column">
                                    AI Ingested
                                </Typography>
                            </Box>
                            
                            {/* Source Column */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: '100px', marginLeft: '20px' }}>
                                <Typography variant="subtitle2" className="list-header-column">
                                    Source
                                </Typography>
                            </Box>
                            
                            {/* Actions Column */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: '120px' }}>
                                <Typography variant="subtitle2" className="list-header-column">
                                    Actions
                                </Typography>
                            </Box>
                        </div>
                    </div>

                    {/* Bulk Actions Bar */}
                    {selectedDocuments.size > 0 && (
                        <div className="bulk-actions-bar">
                            <div className="bulk-actions-content">
                                <div className="bulk-actions-left">
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#8b5cf6' }}>
                                        {selectedDocuments.size} document{selectedDocuments.size !== 1 ? 's' : ''} selected
                                    </Typography>
                                    <Chip 
                                        label="Multiple Selection Active" 
                                        size="small" 
                                        sx={{ 
                                            backgroundColor: 'rgba(139, 92, 246, 0.2)',
                                            color: '#8b5cf6',
                                            fontWeight: 500
                                        }}
                                        title="Use Ctrl+A to select all, Escape to clear selection"
                                    />
                                   
                                </div>
                                <div className="bulk-actions-right">
                                    {bulkProcessing ? (
                                        <div className="bulk-progress">
                                            <div className="progress-text">
                                                Processing {bulkProgress.current} of {bulkProgress.total}
                                            </div>
                                            <div className="progress-bar">
                                                <div 
                                                    className="progress-fill"
                                                    style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={handleBulkIngest}
                                            className="bulk-ingest-button"
                                        >
                                            <AIProcessingIcon sx={{ fontSize: '1.1rem' }} />
                                            Process {selectedDocuments.size} Document{selectedDocuments.size !== 1 ? 's' : ''} for AI
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setSelectedDocuments(new Set())}
                                        className="clear-selection-button"
                                        disabled={bulkProcessing}
                                    >
                                        Clear Selection
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Scrollable List Container */}
                    <div className="list-scroll-container">
                        <List sx={{ p: 0 }}>
                            {filteredDocuments.map((doc) => {
                                const statusConfig = getStatusConfig(doc.uploadStatus);
                                const ingestionConfig = getIngestionStatusConfig(doc.ingestionStatus);
                                const sourceConfig = getSourceConfig(doc.ingestionSourceId);
                                const isIngested = doc.ingestionStatus === 'completed' || doc.ingestionStatus === true || doc.ingestionStatus === 'true';
                                const isProcessing = doc.ingestionStatus === 'processing' || doc.ingestionStatus === 'pending';
                                
                                return (
                                    <ListItem
                                        key={doc.id}
                                        disablePadding
                                        sx={{
                                            backgroundColor: selectedDocument?.id === doc.id ? 'rgba(102, 126, 234, 0.1)' : 'transparent',
                                            borderRadius: 2,
                                            mb: 1,
                                            border: selectedDocuments.has(doc.id) ? '2px solid #8b5cf6' : '1px solid rgba(255, 255, 255, 0.2)',
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                                transform: 'translateY(-1px)',
                                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                                            }
                                        }}
                                    >
                                        <ListItemButton
                                            onClick={() => handleDocumentClick(doc)}
                                            sx={{ p: 2, gap: 2 }}
                                        >
                                            {/* Checkbox */}
                                            <Checkbox
                                                checked={selectedDocuments.has(doc.id)}
                                                onChange={(e) => handleCheckboxChange(doc.id, e)}
                                                onClick={(e) => e.stopPropagation()}
                                                sx={{ p: 0 }}
                                            />
                                            
                                            {/* File Icon and Name */}
                                            <ListItemIcon sx={{ minWidth: 'auto', mr: 2 }}>
                                                {getFileIcon(doc.fileName, 'small')}
                                            </ListItemIcon>
                                            
                                            <ListItemText
                                                primary={
                                                    <Typography 
                                                        variant="body2" 
                                                        sx={{ 
                                                            fontWeight: 500,
                                                            color: '#1e293b',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                            maxWidth: '200px'
                                                        }}
                                                        onMouseEnter={(e) => showCustomTooltip(e, doc.fileName)}
                                                        onMouseLeave={hideCustomTooltip}
                                                    >
                                                        {doc.fileName}
                                                    </Typography>
                                                }
                                                sx={{ flex: 1, minWidth: 0 }}
                                            />
                                            
                                            {/* Status */}
                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: '120px' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                    <CheckCircleIcon sx={{ color: '#16a34a', fontSize: '1rem' }} />
                                                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
                                                        {statusConfig.text}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <ScheduleIcon sx={{ color: '#64748b', fontSize: '0.8rem' }} />
                                                    <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                                                        {formatDate(doc.uploadTime)}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                            
                                            {/* AI Ingestion Status */}
                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: '120px' }}>
                                                <Chip
                                                    icon={ingestionConfig.icon}
                                                    label={ingestionConfig.text}
                                                    size="small"
                                                    sx={{
                                                        backgroundColor: `var(--${ingestionConfig.color}-bg, rgba(139, 92, 246, 0.1))`,
                                                        color: `var(--${ingestionConfig.color}-text, #8b5cf6)`,
                                                        border: `1px solid var(--${ingestionConfig.color}-border, rgba(139, 92, 246, 0.3))`,
                                                        fontWeight: 500,
                                                        mb: 0.5
                                                    }}
                                                />
                                                {doc.ingestionDate && (
                                                    <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                                                        {formatDate(doc.ingestionDate)}
                                                    </Typography>
                                                )}
                                            </Box>
                                            
                                            {/* Source */}
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: '100px' }}>
                                                <Chip
                                                    icon={sourceConfig.icon}
                                                    label={sourceConfig.shortText}
                                                    size="small"
                                                    sx={{
                                                        backgroundColor: `var(--${sourceConfig.color}-bg, rgba(139, 92, 246, 0.1))`,
                                                        color: `var(--${sourceConfig.color}-text, #8b5cf6)`,
                                                        border: `1px solid var(--${sourceConfig.color}-border, rgba(139, 92, 246, 0.3))`,
                                                        fontWeight: 500
                                                    }}
                                                />
                                            </Box>
                                            
                                            {/* Actions */}
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: '120px' }}>
                                                {/* Category Suggestions Icon */}
                                                {doc.categorySuggestions && (
                                                    <Box
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        width: 32,
                                                        height: 32,
                                                        border: 'none',
                                                        borderRadius: 1,
                                                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                                        color: '#64748b',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.3s ease',
                                                        backdropFilter: 'blur(10px)',
                                                        border: '1px solid rgba(102, 126, 234, 0.1)',
                                                        '&:hover': {
                                                            backgroundColor: 'rgba(102, 126, 234, 0.1)',
                                                            borderColor: 'rgba(102, 126, 234, 0.4)',
                                                            color: '#667eea',
                                                            transform: 'translateY(-1px)'
                                                        }
                                                    }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            showCategoryTooltip(e, doc);
                                                        }}
                                                        title="Click to view category suggestions"
                                                    >
                                                        <CategoryIcon sx={{ fontSize: '1.1rem'}} />
                                                        {Array.isArray(doc.categorySuggestions) && doc.categorySuggestions.length > 1 && (
                                                            <Box
                                                                sx={{
                                                                    position: 'absolute',
                                                                    top: -6,
                                                                    right: -6,
                                                                    backgroundColor: '#ef4444',
                                                                    color: 'white',
                                                                    borderRadius: '50%',
                                                                    width: 16,
                                                                    height: 16,
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    fontSize: '0.65rem',
                                                                    fontWeight: 600,
                                                                    border: '2px solid white',
                                                                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                                                                }}
                                                            >
                                                                {doc.categorySuggestions.length}
                                                            </Box>
                                                        )}
                                                    </Box>
                                                )}
                                                
                                                {/* Download Button */}
                                                <Box
                                                    component="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleViewDocument(doc);
                                                    }}
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        width: 32,
                                                        height: 32,
                                                        border: 'none',
                                                        borderRadius: 1,
                                                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                                        color: '#64748b',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.3s ease',
                                                        backdropFilter: 'blur(10px)',
                                                        border: '1px solid rgba(102, 126, 234, 0.1)',
                                                        '&:hover': {
                                                            backgroundColor: 'rgba(102, 126, 234, 0.1)',
                                                            borderColor: 'rgba(102, 126, 234, 0.4)',
                                                            color: '#667eea',
                                                            transform: 'translateY(-1px)'
                                                        }
                                                    }}
                                                    title="View File"
                                                >
                                                    <PreviewIcon sx={{ fontSize: '1.1rem' }} />
                                                </Box>
                                                
                                                {/* Ingest Button */}
                                                <Box
                                                    component="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (!isIngested && !isProcessing) {
                                                            ingestDocument(doc);
                                                        }
                                                    }}
                                                    disabled={isIngested || isProcessing || ingestingDocuments.has(doc.id)}
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        width: 32,
                                                        height: 32,
                                                        border: 'none',
                                                        borderRadius: 1,
                                                        backgroundColor: isIngested 
                                                            ? 'rgba(34, 197, 94, 0.1)' 
                                                            : isProcessing 
                                                            ? 'rgba(59, 130, 246, 0.1)'
                                                            : 'rgba(255, 255, 255, 0.9)',
                                                        color: isIngested 
                                                            ? '#16a34a' 
                                                            : isProcessing 
                                                            ? '#2563eb'
                                                            : '#64748b',
                                                        cursor: isIngested || isProcessing ? 'not-allowed' : 'pointer',
                                                        transition: 'all 0.3s ease',
                                                        backdropFilter: 'blur(10px)',
                                                        border: `1px solid ${
                                                            isIngested 
                                                                ? 'rgba(34, 197, 94, 0.3)' 
                                                                : isProcessing 
                                                                ? 'rgba(59, 130, 246, 0.3)'
                                                                : 'rgba(102, 126, 234, 0.1)'
                                                        }`,
                                                        '&:hover': {
                                                            backgroundColor: isIngested 
                                                                ? 'rgba(34, 197, 94, 0.2)' 
                                                                : isProcessing 
                                                                ? 'rgba(59, 130, 246, 0.2)'
                                                                : 'rgba(102, 126, 234, 0.1)',
                                                            transform: isIngested || isProcessing ? 'none' : 'translateY(-1px)'
                                                        }
                                                    }}
                                                    title={
                                                        isIngested ? 'Document already processed for AI' : 
                                                        isProcessing ? 'AI processing in progress...' : 
                                                        'Process document for AI'
                                                    }
                                                >
                                                    {ingestingDocuments.has(doc.id) ? (
                                                        <LoadingSpinner />
                                                    ) : isIngested ? (
                                                        <AICompletedIcon sx={{ fontSize: '1.1rem' }} />
                                                    ) : isProcessing ? (
                                                        <AISyncIcon sx={{ fontSize: '1.1rem' }} className="rotating" />
                                                    ) : (
                                                        <AIProcessingIcon sx={{ fontSize: '1.1rem' }} />
                                                    )}
                                                </Box>
                                                  {/* 3-Dot Context Menu */}
                                                  <Box
                                                    component="button"
                                                    onClick={(e) => handleContextMenuOpen(e, doc.id)}
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        width: 32,
                                                        height: 32,
                                                        border: 'none',
                                                        borderRadius: 1,
                                                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                                        color: '#64748b',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.3s ease',
                                                        backdropFilter: 'blur(10px)',
                                                        border: '1px solid rgba(102, 126, 234, 0.1)',
                                                        '&:hover': {
                                                            backgroundColor: 'rgba(102, 126, 234, 0.1)',
                                                            borderColor: 'rgba(102, 126, 234, 0.4)',
                                                            color: '#667eea',
                                                            transform: 'translateY(-1px)'
                                                        }
                                                    }}
                                                    title="More options"
                                                    disabled={!isIngested || isProcessing}
                                                >
                                                    <MoreVertIcon sx={{ fontSize: '1.1rem' }} />
                                                </Box>
                                            </Box>
                                        </ListItemButton>
                                    </ListItem>
                                );
                            })}
                        </List>
                    </div>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="document-list grid-view">
                    <div className="grid-container">
                        {filteredDocuments.map((doc) => {
                            const statusConfig = getStatusConfig(doc.uploadStatus);
                            const ingestionConfig = getIngestionStatusConfig(doc.ingestionStatus);
                            const sourceConfig = getSourceConfig(doc.ingestionSourceId);
                            const isIngested = doc.ingestionStatus === 'completed' || doc.ingestionStatus === true || doc.ingestionStatus === 'true';
                            const isProcessing = doc.ingestionStatus === 'processing' || doc.ingestionStatus === 'pending';
                            
                            return (
                                <div 
                                    key={doc.id}
                                    className={`grid-item ${selectedDocuments.has(doc.id) ? 'selected' : ''}`}
                                    onClick={() => handleDocumentClick(doc)}
                                >
                                    {/* Top Row: Checkbox, File Name, and Actions in Single Line */}
                                    <div className="grid-top-row">
                                        {/* Checkbox */}
                                        <div className="grid-item-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={selectedDocuments.has(doc.id)}
                                                onChange={(e) => handleCheckboxChange(doc.id, e)}
                                                className="document-checkbox"
                                            />
                                        </div>
                                        <div className="document-icon">
                                            <div className="file-icon-container">
                                                {getFileIcon(doc.fileName, 'large')}
                                            </div>
                                             {/* File Name */}
                                        <div className="grid-filename-section">
                                            <h4 className="document-name" title={doc.fileName}>{doc.fileName}</h4>
                                        </div>
                                        </div>
                                        
                                       
                                        
                                        {/* Action Buttons */}
                                        <div className="grid-item-actions">
                                             {/* Category Suggestions Icon for Grid View */}
                                             {doc.categorySuggestions && (
                                                    <div 
                                                        className={`category-suggestions-icon-grid ${doc.documentCategory ? 'has-category' : ''}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            showCategoryTooltip(e, doc);
                                                        }}
                                                        title={doc.documentCategory ? "Document has assigned category" : "Click to view category suggestions"}
                                                    >
                                                        {doc.documentCategory ? (
                                                            <CategoryIcon className="category-icon-grid assigned" />
                                                        ) : (
                                                            <CategoryIcon className="category-icon-grid" />
                                                        )}
                                                        {Array.isArray(doc.categorySuggestions) && doc.categorySuggestions.length > 1 && (
                                                            <span className="category-count-badge-grid">
                                                                {doc.categorySuggestions.length}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            <button 
                                                className="action-button view-button"
                                                title="View File"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleViewDocument(doc);
                                                }}
                                            >
                                                <PreviewIcon />
                                            </button>
                                            <button 
                                                className={`action-button ingest-button ${isIngested ? 'ingested' : ''} ${isProcessing ? 'processing' : ''}`}
                                                title={
                                                    isIngested ? 'Document already processed for AI' : 
                                                    isProcessing ? 'AI processing in progress...' : 
                                                    'Process document for AI'
                                                }
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (!isIngested && !isProcessing) {
                                                        ingestDocument(doc);
                                                    }
                                                }}
                                                disabled={isIngested || isProcessing || ingestingDocuments.has(doc.id)}
                                            >
                                                {ingestingDocuments.has(doc.id) ? (
                                                    <LoadingSpinner />
                                                ) : isIngested ? (
                                                    <AICompletedIcon />
                                                ) : isProcessing ? (
                                                    <AISyncIcon className="rotating" />
                                                ) : (
                                                    <AIProcessingIcon />
                                                )}
                                            </button>
                                              {/* 3-Dot Context Menu for Grid View */}
                                              <button 
                                                className="action-button context-menu-button"
                                                title="More options"
                                                onClick={(e) => handleContextMenuOpen(e, doc.id)}
                                            >
                                                <MoreVertIcon />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    {/* File Icon */}
                                  
                                    
                                    {/* Document Info */}
                                    <div className="document-info">
                                        <div className="document-details">
                                            <div className="grid-status-section">
                                                <CheckCircleIcon className="status-icon-green-grid" />
                                                <span className="upload-status-grid">{statusConfig.text}</span>
                                                <span className="upload-time-grid">
                                                    <ScheduleIcon className="time-icon-small" />
                                                    {formatDate(doc.uploadTime)}
                                                </span>
                                            </div>
                                            <div className="grid-source-section">
                                                <span className={`source-indicator-grid ${sourceConfig.color}`} title={sourceConfig.description}>
                                                    {sourceConfig.icon}
                                                    <span className="source-text-grid">{sourceConfig.shortText}</span>
                                                </span>
                                            </div>
                                            <span className={`ingestion-status-grid ${ingestionConfig.color}`} title={ingestionConfig.text}>
                                                {ingestionConfig.icon}
                                                <span className="ingestion-text">{ingestionConfig.text}</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : null}

            {/* Enhanced Category Suggestions Tooltip */}
            {categoryTooltip.show && (
                <div 
                    className="category-tooltip-container"
                    style={{
                        position: 'fixed',
                        left: categoryTooltip.x - 150, // Center the tooltip
                        top: categoryTooltip.y,
                        zIndex: 10001,
                        pointerEvents: 'auto',
                        maxHeight: '80vh',
                        overflowY: 'auto'
                    }}
                >
                    <CategorySuggestionsTooltip 
                        document={documents.find(doc => doc.id === categoryTooltip.documentId)}
                        onClose={hideCategoryTooltip}
                    />
                </div>
            )}

            {/* Custom Tooltip */}
            {tooltip.show && (
                <div 
                    className="custom-tooltip-element"
                    style={{
                        position: 'fixed',
                        left: tooltip.x,
                        top: tooltip.y,
                        zIndex: 10000,
                        pointerEvents: 'none'
                    }}
                >
                    <div className="tooltip-content">
                        {tooltip.text}
                        <div className="tooltip-arrow"></div>
                    </div>
                </div>
            )}
        
            {/* Document Viewer */}
            <DocumentViewer
                open={viewerOpen}
                document={viewingDocument}
                onClose={handleCloseViewer}
                onDownload={handleDownloadFromViewer}
            />

            {/* Context Menu */}
            <Menu
                anchorEl={contextMenu.anchorEl}
                open={contextMenu.open}
                onClose={handleContextMenuClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                sx={{
                    '& .MuiPaper-root': {
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(102, 126, 234, 0.2)',
                        borderRadius: '8px',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                        minWidth: '200px'
                    }
                }}
            >
                <MenuItem 
                    onClick={() => handleAddToLongContext(contextMenu.documentId)}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        py: 1.5,
                        px: 2,
                        '&:hover': {
                            backgroundColor: 'rgba(102, 126, 234, 0.1)'
                        }
                    }}
                >
                    <LongContextIcon sx={{ color: '#667eea', fontSize: '1.2rem' }} />
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        Add to long context
                    </Typography>
                </MenuItem>
                <MenuItem 
                    onClick={() => handleAddToShortContext(contextMenu.documentId)}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        py: 1.5,
                        px: 2,
                        '&:hover': {
                            backgroundColor: 'rgba(102, 126, 234, 0.1)'
                        }
                    }}
                >
                    <ShortContextIcon sx={{ color: '#667eea', fontSize: '1.2rem' }} />
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        Add to short context
                    </Typography>
                </MenuItem>
            </Menu>

            {/* Toast Notification */}
            <Snackbar
                open={toast.open}
                autoHideDuration={TOAST_CONFIG.duration}
                onClose={hideToast}
                anchorOrigin={TOAST_CONFIG.position}
                className="toast-container"
                sx={{
                    '& .MuiSnackbar-root': {
                        position: 'fixed',
                        bottom: '20px',
                        left: '20px',
                        zIndex: 9999
                    }
                }}
            >
                <Alert 
                    onClose={hideToast} 
                    severity={toast.severity} 
                    sx={{ 
                        width: '100%',
                        minWidth: '300px',
                        maxWidth: '600px',
                        boxShadow: '0 4px 20px rgba(0,0, 0, 0.15)',
                        borderRadius: '8px'
                    }}
                >
                    {toast.title && <AlertTitle>{toast.title}</AlertTitle>}
                    {toast.message}
                </Alert>
            </Snackbar>
        </div>
    );
};

export default DocumentList;
