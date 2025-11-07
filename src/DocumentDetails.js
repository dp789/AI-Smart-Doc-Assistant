import React from 'react';
import { motion } from 'framer-motion';
import { 
  FaFile, 
  FaCalendar, 
  FaUser, 
  FaTag, 
  FaBrain, 
  FaStar, 
  FaNetworkWired,
  FaDownload,
  FaShare,
  FaBookmark
} from 'react-icons/fa';

const DocumentDetails = ({ val }) => {
  // This is a placeholder component for document details
  // In a real application, this would fetch and display detailed document information
  
  const documentId = val || 1;
  
  return (
    <motion.div 
      className="document-details-container"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="document-details-card">
        <div className="details-header">
          <h3>Document Details</h3>
          <p>Selected Document ID: {documentId}</p>
        </div>
        
        <div className="details-content">
          <div className="detail-placeholder">
            <FaFile className="placeholder-icon" />
            <div>
              <h4>Document Analysis</h4>
              <p>Detailed document information and AI insights would be displayed here.</p>
            </div>
          </div>
          
          <div className="detail-placeholder">
            <FaBrain className="placeholder-icon" />
            <div>
              <h4>AI Insights</h4>
              <p>Generated insights, summaries, and key findings from the document.</p>
            </div>
          </div>
          
          <div className="detail-placeholder">
            <FaNetworkWired className="placeholder-icon" />
            <div>
              <h4>Research Connections</h4>
              <p>Related documents, citations, and research networks.</p>
            </div>
          </div>
        </div>
        
        <div className="details-actions">
          <button className="detail-action-btn primary">
            <FaDownload /> Download
          </button>
          <button className="detail-action-btn secondary">
            <FaShare /> Share
          </button>
          <button className="detail-action-btn secondary">
            <FaBookmark /> Save
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default DocumentDetails;