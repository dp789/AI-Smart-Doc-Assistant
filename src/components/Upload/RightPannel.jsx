import React, { useState, useRef, useCallback, useEffect } from 'react';
import './Upload.css';
import { 
    Computer as ComputerIcon,
    Cloud as CloudIcon,
    Language as LanguageIcon,
    Upload as UploadIcon,
    FileUpload as FileUploadIcon,
    CloudUpload as CloudUploadIcon,
    Link as LinkIcon
} from '@mui/icons-material';
import { getUploadAuthHeaders, getAccessToken  } from '../../utils/authUtils';
import envConfig, { verifyEnvironmentUrls } from '../../envConfig';

import SharePointTreeView from '../SharePointTreeView/SharePointTreeView';
import '../SharePointTreeView/SharePointTreeView.css';
import { ToastNotification, ConfirmPopup } from '../HelperComponent';
import useToast from '../../hooks/useToast';
import { useMsal } from '@azure/msal-react';
import { useUserProfile } from '../../hooks/useUserProfile';
import { getErrorMessage, validateScrapingURL } from '../../utils/helper';
import axios from 'axios';
  

const RightPanelContent = ({ onUploadSuccess }) => {
    const [activeTab, setActiveTab] = useState('local');
    const [uploadStatus, setUploadStatus] = useState('idle'); // idle, uploading, success, error
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadMessage, setUploadMessage] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    // Removed category-related state variables - using default category instead
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState(null);
    const [sharepointSites, setSharepointSites] = useState([]);
    const fileInputRef = useRef(null);
    const [url, setUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [showUploadConfirm, setShowUploadConfirm] = useState(false);
    const [showImportConfirm, setShowImportConfirm] = useState(false);
    const { toast, showSuccess, showError, hideToast } = useToast();

    const tabs = [
        { id: 'local', label: 'Local Device', icon: <ComputerIcon /> },
        { id: 'sharepoint', label: 'SharePoint', icon: <CloudIcon /> },
        { id: 'web', label: 'Web URL', icon: <LanguageIcon /> }
    ];

    const allowedMimeTypes = [
        'application/pdf',           
        'application/msword',        
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        'text/csv',                  
        'application/sql'            
      ];

    useEffect(() => {
      if (activeTab === "sharepoint" && sharepointSites.length === 0) {
        handleSharepointConnect();
      }
    }, [activeTab]);


  // Removed category loading useEffect - no longer needed
  const BYPASS_USER_ID = "d4b2fbfe-702b-49d4-9b42-41d343c26da5";

  const userProfile = useUserProfile();
  const { accounts } = useMsal();

  const isBypassMode = () => sessionStorage.getItem("bypass_auth") === "true";

  const getUserId = useCallback(() => {
    if (isBypassMode()) {
      console.log("🔧 Using bypass mode user ID");
      return BYPASS_USER_ID;
    }

    if (accounts && accounts.length > 0) {
      const account = accounts[0];
      const userId = account.localAccountId || account.homeAccountId || account.username;
      console.log("🔐 Using MSAL account user ID:", userId);
      return userId;
    }

    const fallbackId = userProfile.email || "unknown-user";
    console.log("📧 Using fallback user ID:", fallbackId);
    return fallbackId;
  }, [accounts, userProfile.email]);

  // Handle import confirmation
  const handleImportConfirm = () => {
    setShowImportConfirm(false);
    performImport();
  };

  // Handle import cancellation
  const handleImportCancel = () => {
    setShowImportConfirm(false);
  };

  // Show import confirmation popup
  const showImportConfirmation = () => {
    if (!url) return;
    const validationResult = validateScrapingURL(url);
    if (!validationResult.valid) {
      showError(validationResult.reason);
      setUrl("");
      return;
    }
    setShowImportConfirm(true);
  };

  // Perform the actual web URL import
  const performImport = async () => {
    const workspace_id = getUserId();
    console.log("url", url);
    if (!url) return;
    setLoading(true);
    try {
      const authHeaders = await getUploadAuthHeaders();
      if (!authHeaders.Authorization) {
        showError("Unable to get access token. Please try logging in again.");
        setLoading(false);
        return;
      }
      const apiUrl = envConfig.ingestApiUrl;
      let res;
      try {
        res = await axios.post(
          `${apiUrl}/scrape-web-url`,
          {
            url,
            workspace_id,
          },
          {
            headers: { "Content-Type": "application/json", ...authHeaders },
          }
        );
      } catch (error) {
        console.log("Import Failed:", error.status, error);
        const errorMessage = getErrorMessage(error.status);
        throw new Error(errorMessage);
      }
      console.log("Scrape Url Response:", res.data);

      // Show immediate success toast
      showSuccess(`Web content from "${url}" has been imported successfully!`, "Import Successful");

      // Clear URL and reset loading state
      setUrl("");
      setLoading(false);

      // Trigger document refresh
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (e) {
      setUrl("");
      showError(e.message || "Failed to import web content");
      setLoading(false);
    }
  };

    // Handle file selection
    const handleFileSelect = useCallback((file) => {
        if (!file) return;

        // Validate file type
        if (!allowedMimeTypes.includes(file.type)) {
          setUploadStatus("error");
          setUploadMessage(`Only ${allowedMimeTypes.join(", ")} files are allowed`);
          return;
        }

        // Validate file size (10MB limit)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            setUploadStatus("error");
            setUploadMessage("File size exceeds 10MB limit");
            return;
        }

        setSelectedFile(file);
        setUploadStatus('idle');
        setUploadMessage('');
    }, []);

    // Handle file input change
    const handleFileInputChange = (event) => {
        const file = event.target.files[0];
        handleFileSelect(file);
    };

    // Handle drag and drop
    const handleDragOver = (event) => {
        event.preventDefault();
        event.currentTarget.classList.add("drag-over");
    };

    const handleDragLeave = (event) => {
        event.preventDefault();
        event.currentTarget.classList.remove("drag-over");
    };

    const handleDrop = (event) => {
        event.preventDefault();
        event.currentTarget.classList.remove("drag-over");
    
        const files = event.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    // Handle upload confirmation
    const handleUploadConfirm = () => {
        setShowUploadConfirm(false);
        performUpload();
    };

    // Handle upload cancellation
    const handleUploadCancel = () => {
        setShowUploadConfirm(false);
    };

    // Show upload confirmation popup
    const showUploadConfirmation = () => {
        setShowUploadConfirm(true);
    };

    // Perform the actual file upload
    const performUpload = async () => {
        setUploadStatus('uploading');
        setUploadProgress(0);
        setUploadMessage('Uploading file...');

        try {
            const formData = new FormData();
            formData.append('pdfFile', selectedFile);
            // No category needed - backend will handle with default values
            // formData.append('category', ''); // Removed - backend uses null by default

            // Simulate upload progress
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 200);

            // Verify environment configuration before upload
            const config = verifyEnvironmentUrls();
            
            // Initialize upload endpoint
            let uploadEndpoint = `${config.apiUrl}/upload/pdf`;
            
            const authHeaders = await getUploadAuthHeaders();
            console.log('Auth headers:', authHeaders);
            console.log('🎯 Upload endpoint:', uploadEndpoint);
            console.log('🌐 Environment:', config.environment);
            
            let response;
            
            try {
                // Try the main upload endpoint first
                response = await fetch(uploadEndpoint, {
                    method: 'POST',
                    body: formData,
                    headers: authHeaders
                });
                
                console.log('Upload response status:', response.status);
                console.log('Upload response headers:', response.headers);
                
            } catch (fetchError) {
                console.warn('Main upload endpoint failed, trying fallback:', fetchError);
                
                // Try the simple upload endpoint as fallback
                uploadEndpoint = `${config.apiUrl}/upload/pdf-simple`;
                response = await fetch(uploadEndpoint, {
                    method: 'POST',
                    body: formData,
                    headers: authHeaders
                });
            }

            clearInterval(progressInterval);
            setUploadProgress(100);

            if (!response.ok) {
                const errorText = await response.text();
                let errorData;
                
                try {
                    errorData = JSON.parse(errorText);
                } catch (parseError) {
                    console.error('Error parsing response:', parseError);
                    errorData = { message: errorText || `HTTP ${response.status}: ${response.statusText}` };
                }
                
                console.error('Upload failed:', errorData);
                throw new Error(errorData.message || errorData.error || 'Upload failed');
            }

            const result = await response.json();
            console.log('Upload successful:', result);
            
            setUploadStatus('success');
            const fileName = result?.data?.fileName || selectedFile?.name || 'file';
            setUploadMessage(`File "${fileName}" uploaded successfully!`);
            
            // Reset file selection after successful upload
            setSelectedFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

            // Trigger refresh of document list in left panel
            if (onUploadSuccess) {
                onUploadSuccess();
            }

        } catch (error) {
            console.error('Upload error details:', {
                message: error.message,
                stack: error.stack,
                endpoint: uploadEndpoint || 'endpoint not set'
            });
            
            setUploadStatus('error');
            
            // Provide more specific error messages
            let errorMessage = error.message || 'Upload failed. Please try again.';
            
            if (error.message.includes('Failed to fetch')) {
                errorMessage = 'Network error. Please check your connection and try again.';
            } else if (error.message.includes('CORS')) {
                errorMessage = 'Cross-origin request blocked. Please contact support.';
            } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                errorMessage = 'Authentication failed. Please log in again.';
            } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
                errorMessage = 'Access denied. Please check your permissions.';
            }
            
            setUploadMessage(errorMessage);
        }
    };

    // Handle browse button click
    const handleBrowseClick = () => {
        fileInputRef.current?.click();
    };

    const handleSharepointConnect = async () => {
        setIsConnecting(true);
        setError(null);

        try {
            const authHeaders = await getUploadAuthHeaders();
            if (!authHeaders.Authorization) {
                setError("Unable to get access token. Please try logging in again.");
                return;
            }
            const domain = "nitoronline.sharepoint.com";
            const config = verifyEnvironmentUrls();
            const sharepointSitesUrl = `${config.apiUrl}/sharepoint/sharepoint-sites/${domain}`;
            console.log("Auth headers:", authHeaders);
            console.log("Sharepoint sites URL:", sharepointSitesUrl);

            const response = await fetch(sharepointSitesUrl, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    ...authHeaders
                },
            });

            const data = await response.json();
            if (data.success) {
                setSharepointSites(data.spDetails.site_names);
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.log("Error:", error);
            setError("Failed to connect to SharePoint" || error.message);
        } finally {
            setIsConnecting(false);
        }
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'local':
                return (
                    <div className="tab-content">
                        <div 
                            className={`upload-area ${uploadStatus === 'uploading' ? 'uploading' : ''} ${uploadStatus === 'success' ? 'success' : ''} ${uploadStatus === 'error' ? 'error' : ''}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            <FileUploadIcon className="upload-area-icon" />
                            <h3>Upload Document from Local Device</h3>
                            <p>Drag and drop document here or click to browse</p>
                            
                            {/* File input (hidden) */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                onChange={handleFileInputChange}
                                style={{ display: 'none' }}
                            />
                            
                            {/* Selected file info */}
                            {selectedFile && (
                                <div className="selected-file">
                                    <p><strong>Selected:</strong> {selectedFile.name}</p>
                                    <p><strong>Size:</strong> {(selectedFile.size / 1024).toFixed(2)} KB</p>
                                </div>
                            )}
                            
                            {/* Document Category section removed - using default category in backend */}
                            
                            {/* Upload button */}
                            {selectedFile && (
                                <div className="upload-button-container-upload">
                                    <button 
                                        className="upload-button-upload"
                                        onClick={showUploadConfirmation}
                                        disabled={uploadStatus === 'uploading'}
                                        style={{ marginRight: '2rem' }}
                                    >
                                        {uploadStatus === 'uploading' ? 'Uploading...' : 'Upload Document'}
                                    </button>
                                </div>
                            )}
                            
                            {/* Upload progress */}
                            {uploadStatus === 'uploading' && (
                                <div className="upload-progress">
                                    <div className="progress-bar">
                                        <div 
                                            className="progress-fill" 
                                            style={{ width: `${uploadProgress}%` }}
                                        ></div>
                                    </div>
                                    <p>{uploadProgress}%</p>
                                </div>
                            )}
                            
                            {/* Upload message */}
                            {uploadMessage && (
                                <div className={`upload-message ${uploadStatus}`}>
                                    {uploadMessage}
                                </div>
                            )}
                            
                            {/* Action buttons */}
                            <div className="upload-actions">
                                <button 
                                    className="browse-button"
                                    onClick={handleBrowseClick}
                                    disabled={uploadStatus === 'uploading'}
                                >
                                    Browse Files
                                </button>
                            </div>
                        </div>
                    </div>
                );
            case "sharepoint":
                  return (
                    <div className={`tab-content sharepoint`}>
                      <div className="sharepoint-content">
                        {isConnecting && (
                          <div className="loading-state">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 12a9 9 0 11-6.219-8.56" />
                            </svg>
                            <h3>Connecting to SharePoint...</h3>
                          </div>
                        )}
                        {error && <div className="error-message">{error}</div>}
                        {sharepointSites.length && <SharePointTreeView sharepointSites={sharepointSites} onUploadSuccess={onUploadSuccess} />}
                      </div>
                    </div>
                  );
            case 'web':
                return (
                    <div className="tab-content">
                        <div className="web-url-content">
                            <LinkIcon className="web-url-icon" />
                            <h3>Import from Web URL</h3>
                            <p>Enter a URL to import documents or files</p>
                            <div className="url-form">
                                <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.example.com/article" className="form-input" />
                                <button className="import-button" onClick={showImportConfirmation} disabled={loading || !url}> {loading ? "Importing..." : "Import"}</button>
                                {toast && <ToastNotification toast={toast} onClose={hideToast} />}
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <>
            <div className="panel-header-with-tabs">
                <div className="header-text-section">
                    <h2>Upload Documents</h2>
                    <p>Choose your preferred upload method</p>
                </div>
                <div className="tabs-header">
                    {tabs.map((tab) => (
                        <button key={tab.id} className={`tab-button ${activeTab === tab.id ? "active" : ""}`} onClick={() => setActiveTab(tab.id)}>
                            <span className="tab-icon">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>
            <div className="panel-content">
                <div className="tabs-container">
                    <div className={`tabs-content ${activeTab === "sharepoint" ? "sharepoint" : ""}`}>{renderTabContent()}</div>
                </div>
            </div>

            {/* Upload Confirmation Popup */}
            <ConfirmPopup
                isOpen={showUploadConfirm}
                title="Confirm Document Upload"
                message={`Are you sure you want to upload "${selectedFile?.name}"? This action cannot be undone.`}
                confirmText="Upload Document"
                cancelText="Cancel"
                confirmButtonClass="confirm-button"
                cancelButtonClass="cancel-button"
                onConfirm={handleUploadConfirm}
                onCancel={handleUploadCancel}
                showIcon={true}
                icon={<UploadIcon />}
                size="medium"
            />

            {/* Import Confirmation Popup */}
            <ConfirmPopup
                isOpen={showImportConfirm}
                title="Confirm Web Import"
                message={`Are you sure you want to import content from "${url}"? This will process and store the content in your workspace.`}
                confirmText="Import Content"
                cancelText="Cancel"
                confirmButtonClass="confirm-button"
                cancelButtonClass="cancel-button"
                onConfirm={handleImportConfirm}
                onCancel={handleImportCancel}
                showIcon={true}
                icon={<LinkIcon />}
                size="medium"
            />
        </>
    );
};

export default RightPanelContent;