import React, { useState, useEffect, useCallback } from 'react';
import { 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    IconButton, 
    Typography, 
    Box, 
    Button, 
    Chip,
    CircularProgress,
    Alert,
    Divider,
    Tooltip
} from '@mui/material';
import { 
    Close as CloseIcon,
    Download as DownloadIcon,
    ZoomIn as ZoomInIcon,
    ZoomOut as ZoomOutIcon,
    RotateRight as RotateIcon,
    Fullscreen as FullscreenIcon,
    FullscreenExit as FullscreenExitIcon,
    PictureAsPdf as PdfIcon,
    Description as WordIcon,
    TableChart as ExcelIcon,
    Image as ImageIcon,
    VideoFile as VideoIcon,
    AudioFile as AudioIcon,
    InsertDriveFile as FileIcon
} from '@mui/icons-material';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import axios from 'axios';
import { getAuthHeaders } from '../../utils/authUtils';
import envConfig from '../../envConfig';
import './DocumentViewer.css';

const DocumentViewer = ({ open, document, onClose, onDownload }) => {
    // Set up PDF.js worker when component mounts
    useEffect(() => {
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    }, []);
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [documentUrl, setDocumentUrl] = useState(null);
    const [contentType, setContentType] = useState(null);
    const [numPages, setNumPages] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [scale, setScale] = useState(1.0);
    const [rotation, setRotation] = useState(0);
    const [fullscreen, setFullscreen] = useState(false);
    const [useIframeFallback, setUseIframeFallback] = useState(false);

    // Get file icon based on file type
    const getFileIcon = (fileName) => {
        if (!fileName) return <FileIcon />;
        
        const extension = fileName.split('.').pop()?.toLowerCase();
        
        switch (extension) {
            case 'pdf':
                return <PdfIcon sx={{ color: '#ef4444' }} />;
            case 'doc':
            case 'docx':
                return <WordIcon sx={{ color: '#2563eb' }} />;
            case 'xls':
            case 'xlsx':
            case 'csv':
                return <ExcelIcon sx={{ color: '#16a34a' }} />;
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
            case 'svg':
            case 'webp':
                return <ImageIcon sx={{ color: '#10b981' }} />;
            case 'mp4':
            case 'avi':
            case 'mov':
            case 'wmv':
            case 'mkv':
                return <VideoIcon sx={{ color: '#7c3aed' }} />;
            case 'mp3':
            case 'wav':
            case 'flac':
            case 'aac':
                return <AudioIcon sx={{ color: '#f59e0b' }} />;
            default:
                return <FileIcon sx={{ color: '#64748b' }} />;
        }
    };

    // Get content type from file extension
    const getContentType = (fileName) => {
        if (!fileName) return 'application/octet-stream';
        
        const extension = fileName.split('.').pop()?.toLowerCase();
        
        switch (extension) {
            case 'pdf':
                return 'application/pdf';
            case 'doc':
                return 'application/msword';
            case 'docx':
                return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            case 'xls':
                return 'application/vnd.ms-excel';
            case 'xlsx':
                return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            case 'jpg':
            case 'jpeg':
                return 'image/jpeg';
            case 'png':
                return 'image/png';
            case 'gif':
                return 'image/gif';
            case 'svg':
                return 'image/svg+xml';
            case 'webp':
                return 'image/webp';
            case 'mp4':
                return 'video/mp4';
            case 'avi':
                return 'video/x-msvideo';
            case 'mov':
                return 'video/quicktime';
            case 'mp3':
                return 'audio/mpeg';
            case 'wav':
                return 'audio/wav';
            case 'txt':
                return 'text/plain';
            case 'md':
                return 'text/markdown';
            default:
                return 'application/octet-stream';
        }
    };

    // Check if file type is viewable
    const isViewable = (fileName) => {
        if (!fileName) return false;
        
        const extension = fileName.split('.').pop()?.toLowerCase();
        const viewableTypes = [
            'pdf', 'jpg', 'jpeg', 'png', 'gif', 'svg', 'webp',
            'mp4', 'avi', 'mov', 'mp3', 'wav', 'txt', 'md'
        ];
        
        return viewableTypes.includes(extension);
    };

    // Load document content
    const loadDocument = useCallback(async () => {
        if (!document || !open) return;

        try {
            setLoading(true);
            setError(null);

            const authHeaders = await getAuthHeaders();
            const apiUrl = envConfig.apiUrl;

            // Try the view endpoint first for better performance
            try {
                const viewResponse = await axios.get(`${apiUrl}/documents/${document.id}/view`, {
                    headers: authHeaders,
                    responseType: 'json'
                });

                if (viewResponse?.data?.success && viewResponse?.data?.data?.viewUrl) {
                    const { viewUrl, contentType: responseContentType } = viewResponse.data.data;
                    
                    // Test the view URL to make sure it's accessible
                    try {
                        const testResponse = await fetch(viewUrl, { method: 'HEAD' });
                        if (!testResponse.ok) {
                            throw new Error(`View URL test failed: ${testResponse.status}`);
                        }
                    } catch (testError) {
                        throw testError; // Force fallback to content endpoint
                    }
                    
                    // For PDFs, try to fetch the content and create a blob URL for better compatibility
                    if (responseContentType === 'application/pdf' || document.fileName?.toLowerCase().endsWith('.pdf')) {
                        try {
                            const pdfResponse = await fetch(viewUrl);
                            if (pdfResponse.ok) {
                                const pdfBlob = await pdfResponse.blob();
                                const blobUrl = URL.createObjectURL(pdfBlob);
                                setDocumentUrl(blobUrl);
                                setContentType(responseContentType);
                                return;
                            }
                        } catch (pdfError) {
                            // Continue with direct URL if blob creation fails
                        }
                    }
                    
                    // Use direct URL for non-PDF files or if blob creation failed
                    setDocumentUrl(viewUrl);
                    setContentType(responseContentType || getContentType(document.fileName));
                    return;
                }
            } catch (viewError) {
                // Fallback to content endpoint
            }

            // Fallback to content endpoint
            const response = await axios.get(`${apiUrl}/documents/${document.id}/content`, {
                headers: authHeaders,
                responseType: 'json'
            });

            if (response?.data?.success && response?.data?.data?.content) {
                const { content: base64Content, contentType: responseContentType } = response.data.data;
                
                // Convert base64 to blob
                const binaryString = atob(base64Content);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                
                const blob = new Blob([bytes], { 
                    type: responseContentType || getContentType(document.fileName) 
                });
                
                const url = URL.createObjectURL(blob);
                setDocumentUrl(url);
                setContentType(responseContentType || getContentType(document.fileName));
            } else {
                throw new Error('No content received or invalid response format');
            }
        } catch (error) {
            console.error('Error loading document:', error);
            setError(error.message || 'Failed to load document');
        } finally {
            setLoading(false);
        }
    }, [document, open]);

    // Cleanup URL when component unmounts or document changes
    useEffect(() => {
        return () => {
            if (documentUrl && documentUrl.startsWith('blob:')) {
                URL.revokeObjectURL(documentUrl);
            }
        };
    }, [documentUrl]);

    // Load document when modal opens
    useEffect(() => {
        if (open && document) {
            loadDocument();
        }
    }, [open, document, loadDocument]);

    // Handle PDF load success
    const onDocumentLoadSuccess = ({ numPages }) => {
        setNumPages(numPages);
        setCurrentPage(1);
    };

    // Handle PDF page change
    const changePage = (offset) => {
        setCurrentPage(prevPage => Math.min(Math.max(1, prevPage + offset), numPages));
    };

    // Handle zoom
    const handleZoom = (direction) => {
        if (direction === 'in') {
            setScale(prev => Math.min(prev + 0.2, 3.0));
        } else {
            setScale(prev => Math.max(prev - 0.2, 0.5));
        }
    };

    // Handle rotation
    const handleRotation = () => {
        setRotation(prev => (prev + 90) % 360);
    };

    // Handle fullscreen toggle
    const toggleFullscreen = () => {
        setFullscreen(prev => !prev);
    };

    // Render content based on file type
    const renderContent = () => {
        if (!documentUrl || !contentType) {
            return null;
        }

        const fileExtension = document.fileName?.split('.').pop()?.toLowerCase();

        // PDF files
        if (contentType === 'application/pdf' || fileExtension === 'pdf') {
            
            // If iframe fallback is enabled, use that instead
            if (useIframeFallback) {
                return (
                    <Box sx={{ textAlign: 'center', height: '100%' }}>
                        <iframe
                            src={documentUrl}
                            style={{
                                width: '100%',
                                height: fullscreen ? 'calc(100vh - 120px)' : '70vh',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px'
                            }}
                            title={document.fileName}
                            
                        />
                    </Box>
                );
            }
            
            return (
                <Box sx={{ textAlign: 'center', height: '100%' }}>
                    <Document
                        file={documentUrl}
                        onLoadSuccess={onDocumentLoadSuccess}
                        onLoadError={(error) => {
                            console.error('PDF load error:', error);
                            setUseIframeFallback(true);
                        }}
                        loading={
                            <Box sx={{ p: 4, textAlign: 'center' }}>
                                <CircularProgress size={40} />
                                <Typography variant="body2" sx={{ mt: 2 }}>
                                    Loading PDF document...
                                </Typography>
                            </Box>
                        }
                        error={
                            <Box sx={{ p: 4, textAlign: 'center' }}>
                                <Alert severity="error" sx={{ maxWidth: '400px' }}>
                                    <Typography variant="h6" gutterBottom>
                                        PDF Load Failed
                                    </Typography>
                                    <Typography variant="body2">
                                        Unable to load the PDF document. This might be due to:
                                    </Typography>
                                    <ul style={{ textAlign: 'left', margin: '10px 0' }}>
                                        <li>Browser compatibility issues</li>
                                        <li>PDF file corruption</li>
                                        <li>Network connectivity problems</li>
                                    </ul>
                                    <Button 
                                        variant="outlined" 
                                        onClick={loadDocument}
                                        sx={{ mt: 2, mr: 1 }}
                                    >
                                        Retry
                                    </Button>
                                    <Button 
                                        variant="outlined" 
                                        onClick={() => setUseIframeFallback(true)}
                                        sx={{ mt: 2 }}
                                    >
                                        Use Alternative Viewer
                                    </Button>
                                </Alert>
                            </Box>
                        }
                    >
                        <Page
                            pageNumber={currentPage}
                            scale={scale}
                            rotate={rotation}
                            loading={<CircularProgress />}
                            onLoadError={(error) => {
                                console.error('PDF page load error:', error);
                                setUseIframeFallback(true);
                            }}
                        />
                    </Document>
                    
                    {/* PDF Navigation */}
                    {numPages > 1 && (
                        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={() => changePage(-1)}
                                disabled={currentPage <= 1}
                            >
                                Previous
                            </Button>
                            <Typography variant="body2">
                                Page {currentPage} of {numPages}
                            </Typography>
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={() => changePage(1)}
                                disabled={currentPage >= numPages}
                            >
                                Next
                            </Button>
                        </Box>
                    )}
                </Box>
            );
        }

        // Image files
        if (contentType.startsWith('image/')) {
            return (
                <Box sx={{ textAlign: 'center', height: '100%' }}>
                    <img
                        src={documentUrl}
                        alt={document.fileName}
                        style={{
                            maxWidth: '100%',
                            maxHeight: fullscreen ? 'calc(100vh - 120px)' : '70vh',
                            objectFit: 'contain',
                            transform: `rotate(${rotation}deg) scale(${scale})`,
                            transition: 'transform 0.3s ease'
                        }}
                    />
                </Box>
            );
        }

        // Video files
        if (contentType.startsWith('video/')) {
            return (
                <Box sx={{ textAlign: 'center', height: '100%' }}>
                    <video
                        controls
                        style={{
                            maxWidth: '100%',
                            maxHeight: fullscreen ? 'calc(100vh - 120px)' : '70vh'
                        }}
                    >
                        <source src={documentUrl} type={contentType} />
                        Your browser does not support the video tag.
                    </video>
                </Box>
            );
        }

        // Audio files
        if (contentType.startsWith('audio/')) {
            return (
                <Box sx={{ textAlign: 'center', p: 4, height: '100%' }}>
                    <audio controls style={{ width: '100%' }}>
                        <source src={documentUrl} type={contentType} />
                        Your browser does not support the audio tag.
                    </audio>
                </Box>
            );
        }

        // Text files
        if (contentType.startsWith('text/')) {
            return (
                <Box sx={{ 
                    maxHeight: fullscreen ? 'calc(100vh - 120px)' : '70vh', 
                    overflow: 'auto',
                    backgroundColor: '#f8fafc',
                    p: 2,
                    borderRadius: 1,
                    border: '1px solid #e2e8f0'
                }}>
                    <pre style={{ 
                        margin: 0, 
                        whiteSpace: 'pre-wrap',
                        wordWrap: 'break-word',
                        fontFamily: 'monospace',
                        fontSize: '14px',
                        lineHeight: '1.5'
                    }}>
                        {/* For text files, we'd need to fetch the actual text content */}
                        <Typography variant="body2" color="text.secondary">
                            Text content preview not available. Please download the file to view content.
                        </Typography>
                    </pre>
                </Box>
            );
        }

        // Default fallback
        return (
            <Box sx={{ textAlign: 'center', p: 4, height: '100%' }}>
                <FileIcon sx={{ fontSize: 64, color: '#64748b', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                    Preview Not Available
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    This file type cannot be previewed. Please download the file to view its contents.
                </Typography>
            </Box>
        );
    };

    if (!document) return null;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth={fullscreen ? false : 'lg'}
            fullWidth={!fullscreen}
            fullScreen={fullscreen}
            PaperProps={{
                sx: {
                    height: fullscreen ? '100vh' : '80vh',
                    maxHeight: fullscreen ? '100vh' : '80vh'
                }
            }}
        >
            {/* Header */}
            <DialogTitle sx={{ 
                m: 0, 
                p: 2, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                borderBottom: '1px solid #e2e8f0'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                    {getFileIcon(document.fileName)}
                    <Box>
                        <Typography variant="h6" noWrap>
                            {document.fileName}
                        </Typography>
                    </Box>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                    {/* Zoom Controls */}
                    {isViewable(document.fileName) && (
                        <>
                            <Tooltip title="Zoom Out">
                                <IconButton onClick={() => handleZoom('out')} size="small">
                                    <ZoomOutIcon />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Zoom In">
                                <IconButton onClick={() => handleZoom('in')} size="small">
                                    <ZoomInIcon />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Rotate">
                                <IconButton onClick={handleRotation} size="small">
                                    <RotateIcon />
                                </IconButton>
                            </Tooltip>
                        </>
                    )}
                    
                    {/* Fullscreen Toggle */}
                    <Tooltip title={fullscreen ? "Exit Fullscreen" : "Fullscreen"}>
                        <IconButton onClick={toggleFullscreen} size="small">
                            {fullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                        </IconButton>
                    </Tooltip>
                    
                    {/* Download Button */}
                    <Tooltip title="Download">
                        <IconButton 
                            onClick={() => onDownload && onDownload(document)} 
                            size="small"
                            sx={{ color: '#16a34a' }}
                        >
                            <DownloadIcon />
                        </IconButton>
                    </Tooltip>
                    
                    {/* Close Button */}
                    <Tooltip title="Close">
                        <IconButton onClick={onClose} size="small">
                            <CloseIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            </DialogTitle>

            {/* Content */}
            <DialogContent sx={{ p: 0, position: 'relative' }}>
                {loading ? (
                    <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        height: '100%',
                        flexDirection: 'column',
                        gap: 2
                    }}>
                        <CircularProgress />
                        <Typography variant="body2" color="text.secondary">
                            Loading document...
                        </Typography>
                    </Box>
                ) : error ? (
                    <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        height: '100%',
                        flexDirection: 'column',
                        gap: 2
                    }}>
                        <Alert severity="error" sx={{ maxWidth: '80%' }}>
                            <Typography variant="h6" gutterBottom>
                                Failed to Load Document
                            </Typography>
                            <Typography variant="body2">
                                {error}
                            </Typography>
                        </Alert>
                        <Button 
                            variant="outlined" 
                            onClick={loadDocument}
                            startIcon={<DownloadIcon />}
                        >
                            Retry
                        </Button>
                    </Box>
                ) : (
                    <Box sx={{ 
                        height: '100%', 
                        overflow: 'auto',
                        p: 2,
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        {renderContent()}
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default DocumentViewer;
