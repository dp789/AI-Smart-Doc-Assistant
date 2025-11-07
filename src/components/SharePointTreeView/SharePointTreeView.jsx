import React, { useState, useEffect } from "react";
import "./SharePointTreeView.css";
import { getFileIcon, ICONS } from "../../utils/helper";
import useToast from "../../hooks/useToast";
import { ToastNotification, ConfirmPopup } from "../HelperComponent";
import { getAccessToken } from "../../utils/authUtils";
import { verifyEnvironmentUrls } from "../../envConfig";
import { 
  CloudUpload as CloudUploadIcon, 
  Search as SearchIcon, 
  Clear as ClearIcon,
  Psychology as PsychologyIcon,
  Description as DescriptionIcon,
  AssignmentInd as AssignmentIndIcon
} from '@mui/icons-material';

const SharePointTreeView = ({ sharepointSites, onFileSelect, onUploadSuccess }) => {
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [treeData, setTreeData] = useState([]);
  const [loadingNodes, setLoadingNodes] = useState(new Set());
  const [selectedFiles, setSelectedFiles] = useState(new Map());
  const [uploadState, setUploadState] = useState({
    isUploading: false,
    progress: 0,
    totalFiles: 0,
    completedFiles: 0,
  });
  const [showUploadConfirm, setShowUploadConfirm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredTreeData, setFilteredTreeData] = useState([]);
  // AI Agent states
  const [aiAgentProcessing, setAiAgentProcessing] = useState({
    transcriptAgent: false,
    cvScreeningAgent: false,
  });

  const { toast, showSuccess, showError, showWarning, hideToast } = useToast();

  useEffect(() => {
    if (sharepointSites?.length) {
      const initialTreeData = sharepointSites.map((site) => ({
        id: site.site_id,
        label: site.label,
        type: "site",
        site_id: site.site_id,
        children: [],
      }));
      setTreeData(initialTreeData);
      setFilteredTreeData(initialTreeData);
    }
  }, [sharepointSites]);

  // Filter tree data based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredTreeData(treeData);
      return;
    }

    const filterTree = (nodes) => {
      return nodes.reduce((filtered, node) => {
        const matchesSearch = node.label.toLowerCase().includes(searchTerm.toLowerCase());
        const filteredChildren = node.children ? filterTree(node.children) : [];

        // Include node if it matches or has matching children
        if (matchesSearch || filteredChildren.length > 0) {
          filtered.push({
            ...node,
            children: filteredChildren,
            isSearchMatch: matchesSearch
          });
        }

        return filtered;
      }, []);
    };

    setFilteredTreeData(filterTree(treeData));
  }, [searchTerm, treeData]);

  const renderTreeNode = (node, level = 0) => {
    const isLoading = loadingNodes.has(node.id);
    const isExpanded = expandedNodes.has(node.id);

    const isFile = node.type?.toLowerCase() === "file";
    const isFolder = node.type?.toLowerCase() === "folder" || node.type === "site";

    const isSelected = selectedFiles.has(node.id);
    const isAllowed = true; // All files from backend are supported

    return (
      <div key={node.id} className="tree-node" style={{ marginLeft: `${level * 20}px` }}>
        <div
          className={`tree-item ${isFile ? "file-item" : "folder-item"} 
                     ${isSelected ? "selected" : ""} 
                     ${!isAllowed ? "not-allowed" : ""}
                     ${node.isSearchMatch ? "search-match" : ""}`}
          onClick={() => (isFile ? handleFileSelect(node) : handleNodeClick(node))}
        >
          {/* Checkbox for files */}
          {isFile && isAllowed && <input type="checkbox" checked={isSelected} onChange={() => handleFileSelect(node)} onClick={(e) => e.stopPropagation()} className="file-checkbox" />}

          {isFolder && <span className="expand-icon">{isLoading ? ICONS.LOADING : isExpanded ? ICONS.COLLAPSE : ICONS.EXPAND}</span>}

          <span className="item-icon">
            {node.type === "site" && ICONS.SITE}
            {node.type?.toLowerCase() === "folder" && ICONS.FOLDER}
            {node.type?.toLowerCase() === "file" && getFileIcon(node.label)}
          </span>

          <span className="item-name">
            {searchTerm && node.isSearchMatch ? (
              <span dangerouslySetInnerHTML={{
                __html: node.label.replace(
                  new RegExp(`(${searchTerm})`, 'gi'),
                  '<mark class="search-highlight">$1</mark>'
                )
              }} />
            ) : (
              node.label
            )}
          </span>

          {!isAllowed && isFile && <span className="file-type-badge not-allowed">Unsupported type</span>}
        </div>

        {/* Children */}
        {isExpanded && node.children && node.children.length > 0 && <div className="tree-children">{node.children.map((child) => renderTreeNode(child, level + 1))}</div>}
      </div>
    );
  };

  // Handle file selection/deselection
  const handleFileSelect = (file) => {
    if (file.type?.toLowerCase() !== "file") return;

    setSelectedFiles((prev) => {
      const newMap = new Map(prev);
      if (newMap.has(file.id)) {
        newMap.delete(file.id);
      } else {
        newMap.set(file.id, {
          id: file.id,
          site_id: file.site_id,
          label: file.label,
        });
      }
      return newMap;
    });
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
    if (selectedFiles.size === 0) return;
    setShowUploadConfirm(true);
  };

  // Perform the actual SharePoint upload
  const performUpload = async () => {
    if (selectedFiles.size === 0) return;

    setUploadState((prev) => ({
      ...prev,
      isUploading: true,
      progress: 0,
      totalFiles: selectedFiles.size,
      completedFiles: 0,
    }));

    try {
      const filesToUpload = Array.from(selectedFiles.values());
      const config = verifyEnvironmentUrls();
      const sharepointUploadUrl = `${config.apiUrl}/sharepoint/upload-files`;
      const token = await getAccessToken();

      const response = await fetch(sharepointUploadUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          files: filesToUpload,
        }),
      });

      const result = await response.json();

      if (result.success) {
        const successCount = result.results.filter((r) => r.status === "success").length;
        const failCount = result.results.filter((r) => r.status === "error").length;

        if (failCount === 0) {
          showSuccess(`Successfully uploaded ${successCount} file${successCount > 1 ? "s" : ""}`, "Upload Complete");
        } else {
          showWarning(`Uploaded ${successCount} files successfully, ${failCount} failed`, "Upload Partially Complete");
        }

        setSelectedFiles(new Map());
        if (onUploadSuccess && successCount > 0) {
          onUploadSuccess();
        }
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      showError(error.message || "Failed to upload files. Please try again.", "Upload Failed");
    } finally {
      setUploadState((prev) => ({
        ...prev,
        isUploading: false,
      }));
    }
  };

  // ==================== AI AGENT HANDLERS ====================
  // Handle Transcript Agent - Single file only
  const handleTranscriptAgent = async () => {
    if (selectedFiles.size === 0) {
      showWarning("Please select a file to process", "No File Selected");
      return;
    }

    if (selectedFiles.size > 1) {
      showWarning("Transcript Agent can only process one file at a time. Please select only one file.", "Multiple Files Selected");
      return;
    }

    setAiAgentProcessing((prev) => ({ ...prev, transcriptAgent: true }));

    try {
      const selectedFile = Array.from(selectedFiles.values())[0];
      
      // Prepare payload for N8N workflow
      const payload = {
        agentType: "transcript_agent",
        fileId: selectedFile.id,
        siteId: selectedFile.site_id,
        fileName: selectedFile.label,
        timestamp: new Date().toISOString(),
        source: "SmartDocs-SharePoint",
      };

      console.log("=".repeat(60));
      console.log("🤖 TRANSCRIPT AGENT - N8N Workflow Payload");
      console.log("=".repeat(60));
      console.log("Agent Type:", payload.agentType);
      console.log("File ID:", payload.fileId);
      console.log("Site ID:", payload.siteId);
      console.log("File Name:", payload.fileName);
      console.log("Timestamp:", payload.timestamp);
      console.log("\n📦 Complete Payload:");
      console.log(JSON.stringify(payload, null, 2));
      console.log("=".repeat(60));

      // TODO: Uncomment when N8N webhook is ready
      // const response = await fetch('YOUR_N8N_TRANSCRIPT_WEBHOOK_URL', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(payload)
      // });
      // const result = await response.json();

      showSuccess("Transcript Agent workflow initiated successfully", "Agent Processing Started");
      
      // Optionally clear selection after processing
      // setSelectedFiles(new Map());

    } catch (error) {
      console.error("Transcript Agent Error:", error);
      showError(error.message || "Failed to initiate Transcript Agent workflow", "Agent Processing Failed");
    } finally {
      setAiAgentProcessing((prev) => ({ ...prev, transcriptAgent: false }));
    }
  };

  // Handle CV Screening Agent - Multiple files supported
  const handleCVScreeningAgent = async () => {
    if (selectedFiles.size === 0) {
      showWarning("Please select at least one file to process", "No Files Selected");
      return;
    }

    setAiAgentProcessing((prev) => ({ ...prev, cvScreeningAgent: true }));

    try {
      const selectedFilesArray = Array.from(selectedFiles.values());
      
      // Prepare payload for N8N workflow with multiple file IDs
      const payload = {
        agentType: "cv_screening_agent",
        fileIds: selectedFilesArray.map(file => file.id),
        siteIds: selectedFilesArray.map(file => file.site_id),
        fileNames: selectedFilesArray.map(file => file.label),
        fileCount: selectedFilesArray.length,
        timestamp: new Date().toISOString(),
        source: "SmartDocs-SharePoint",
        files: selectedFilesArray.map(file => ({
          id: file.id,
          siteId: file.site_id,
          name: file.label,
        })),
      };

      console.log("=".repeat(60));
      console.log("🎯 CV SCREENING AGENT - N8N Workflow Payload");
      console.log("=".repeat(60));
      console.log("Agent Type:", payload.agentType);
      console.log("File Count:", payload.fileCount);
      console.log("File IDs:", payload.fileIds);
      console.log("Site IDs:", payload.siteIds);
      console.log("File Names:", payload.fileNames);
      console.log("Timestamp:", payload.timestamp);
      console.log("\n📦 Complete Payload:");
      console.log(JSON.stringify(payload, null, 2));
      console.log("=".repeat(60));

      // TODO: Uncomment when N8N webhook is ready
      // const response = await fetch('YOUR_N8N_CV_SCREENING_WEBHOOK_URL', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(payload)
      // });
      // const result = await response.json();

      showSuccess(`CV Screening Agent workflow initiated for ${payload.fileCount} file${payload.fileCount > 1 ? 's' : ''}`, "Agent Processing Started");
      
      // Optionally clear selection after processing
      // setSelectedFiles(new Map());

    } catch (error) {
      console.error("CV Screening Agent Error:", error);
      showError(error.message || "Failed to initiate CV Screening Agent workflow", "Agent Processing Failed");
    } finally {
      setAiAgentProcessing((prev) => ({ ...prev, cvScreeningAgent: false }));
    }
  };
  // ==================== END AI AGENT HANDLERS ====================

  const handleNodeExpand = (nodeId) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const handleNodeClick = async (node) => {
    if (node.type === "file") {
      onFileSelect(node);
      return;
    }

    handleNodeExpand(node.id);

    if (!node.children?.length) {
      setLoadingNodes((prev) => new Set(prev).add(node.id));
      try {
        const token = await getAccessToken();
        if (!token) {
          console.error("Unable to get SharePoint access token", "Authentication Error");
          return;
        }

        const config = verifyEnvironmentUrls();
        const sharepointFoldersUrl = `${config.apiUrl}/sharepoint/sharepoint-folders`;
        const response = await fetch(sharepointFoldersUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            site_id: node.site_id || node.id,
            item_id: node.type === "site" ? null : node.id,
          }),
        });

        const data = await response.json();
        if (data.success) {
          updateTreeData(node.id, data.spDetails.folder_level || []);
        }
      } catch (error) {
        console.error("Error loading contents:", error);
      } finally {
        setLoadingNodes((prev) => {
          const newSet = new Set(prev);
          newSet.delete(node.id);
          return newSet;
        });
      }
    }
  };

  const updateTreeData = (nodeId, children) => {
    setTreeData((prev) => {
      const updateNode = (nodes) => {
        return nodes.map((node) => {
          if (node.id === nodeId) {
            // No need to filter - backend already filters unsupported files
            const filteredChildren = children.map((child) => ({
              id: child.item_id || child.id,
              label: child.label,
              type: child.type?.toLowerCase() || "folder",
              site_id: node.site_id,
              parent_id: nodeId,
            }));

            return {
              ...node,
              children: filteredChildren,
            };
          }
          if (node.children?.length > 0) {
            return {
              ...node,
              children: updateNode(node.children),
            };
          }
          return node;
        });
      };
      const newTreeData = updateNode(prev);
      return newTreeData;
    });
  };

  return (
    <>
      <div className="sharepoint-browser">
        <div className="sharepoint-actions-header">
          <div className="search-container">
            <div className="search-input-wrapper">
              <SearchIcon className="search-icon" />
              <input
                type="text"
                placeholder="Search files and folders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              {searchTerm && (
                <button
                  className="clear-search-button"
                  onClick={() => setSearchTerm("")}
                  title="Clear search"
                >
                  <ClearIcon />
                </button>
              )}
            </div>
          </div>
          <div className="action-buttons">
            {/* AI Agent Buttons */}
            <button 
              className="ai-agent-button transcript-agent-button" 
              onClick={handleTranscriptAgent}
              disabled={
                selectedFiles.size === 0 || 
                uploadState.isUploading || 
                aiAgentProcessing.transcriptAgent ||
                aiAgentProcessing.cvScreeningAgent
              }
              title="Process single transcript file with AI Agent"
            >
              <DescriptionIcon className="button-icon" />
              <span className="button-text">
                {aiAgentProcessing.transcriptAgent ? "Processing..." : "Transcript Agent"}
              </span>
            </button>

            <button 
              className="ai-agent-button cv-screening-button" 
              onClick={handleCVScreeningAgent}
              disabled={
                selectedFiles.size === 0 || 
                uploadState.isUploading || 
                aiAgentProcessing.transcriptAgent ||
                aiAgentProcessing.cvScreeningAgent
              }
              title="Screen multiple CV/Resume files with AI Agent"
            >
              <AssignmentIndIcon className="button-icon" />
              <span className="button-text">
                {aiAgentProcessing.cvScreeningAgent ? "Processing..." : "CV Screening"}
              </span>
            </button>

            {/* Divider */}
            <div className="button-divider"></div>

            {/* Original Upload and Clear buttons */}
            <button 
              className="sharepoint-upload" 
              onClick={showUploadConfirmation} 
              disabled={
                selectedFiles.size === 0 || 
                uploadState.isUploading ||
                aiAgentProcessing.transcriptAgent ||
                aiAgentProcessing.cvScreeningAgent
              }
            >
              {uploadState.isUploading ? "Uploading..." : "Upload"}
            </button>
            <button 
              className="clear-button" 
              onClick={() => setSelectedFiles(new Map())} 
              disabled={
                selectedFiles.size === 0 || 
                uploadState.isUploading ||
                aiAgentProcessing.transcriptAgent ||
                aiAgentProcessing.cvScreeningAgent
              }
            >
              Clear
            </button>
          </div>
        </div>

        <div className="tree-content">{filteredTreeData.map((node) => renderTreeNode(node, 0))}</div>
      </div>

      {/* SharePoint Upload Confirmation Popup */}
      <ConfirmPopup
        isOpen={showUploadConfirm}
        title="Confirm SharePoint Upload"
        message={`Are you sure you want to upload ${selectedFiles.size} selected file${selectedFiles.size > 1 ? "s" : ""} from SharePoint? This action cannot be undone.`}
        confirmText="Upload Files"
        cancelText="Cancel"
        confirmButtonClass="confirm-button"
        cancelButtonClass="cancel-button"
        onConfirm={handleUploadConfirm}
        onCancel={handleUploadCancel}
        showIcon={true}
        icon={<CloudUploadIcon />}
        size="medium"
      />

      <ToastNotification toast={toast} onClose={hideToast} />
    </>
  );
};

export default SharePointTreeView;
