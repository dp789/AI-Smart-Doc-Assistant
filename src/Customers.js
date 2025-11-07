import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMsal } from '@azure/msal-react';
import { 
  FaFile, 
  FaTag, 
  FaChevronRight, 
  FaFolderOpen, 
  FaChartLine, 
  FaTasks, 
  FaCalendar, 
  FaUser, 
  FaFileAlt,
  FaRobot,
  FaBrain,
  FaSearch,
  FaCloudUploadAlt,
  FaDownload,
  FaEye,
  FaCog,
  FaStar,
  FaLightbulb,
  FaNetworkWired,
  FaMicrochip,
  FaAtom,
  FaInfinity,
  FaLayerGroup,
  FaChartArea,
  FaLightning,
  FaSparkles
} from 'react-icons/fa';
import { 
  HiSparkles, 
  HiLightningBolt, 
  HiChip, 
  HiCube,
  HiColorSwatch,
  HiTrendingUp,
  HiAcademicCap,
  HiBeaker,
  HiChatAlt2,
  HiDocumentSearch,
  HiUpload,
  HiViewGrid
} from 'react-icons/hi';
import { 
  MdAutoAwesome, 
  MdPsychology, 
  MdScience, 
  MdAnalytics,
  MdCloudUpload,
  MdSmartToy,
  MdInsights,
  MdTrendingUp,
  MdMemory,
  MdDeveloperBoard
} from 'react-icons/md';
import { 
  BiAtom, 
  BiNetworkChart, 
  BiChart, 
  BiData,
  BiMicrochip,
  BiLayerPlus
} from 'react-icons/bi';
import { Link } from 'react-router-dom';
import DocumentDetails from './DocumentDetails';
import './Customers.css';
import useUserProfile from './hooks/useUserProfile';
import EnhancedAvatar from './components/EnhancedAvatar';
import axios from 'axios';
import envConfig from './envConfig';
import { transformDocumentData } from './utils/helper';
import { getAuthHeaders } from './utils/authUtils';


const Documents = () => {
  const { accounts } = useMsal();
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  const [documentsData, setDocumentsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Enhanced user profile with photo support
  const userProfile = useUserProfile();
  
  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Enhanced analytics data for dashboard
  const getAnalyticsData = () => {
    const processedDocuments = documentsData.filter(doc => doc.status === 'processed').length;
    const totalInsights = documentsData.reduce((sum, doc) => sum + (doc.keyInsights || 0), 0);
    const avgConfidence = Math.round(
      documentsData.reduce((sum, doc) => sum + (doc.confidenceScore || 0), 0) / documentsData.length
    );

    return {
      totalDocuments: documentsData.length,
      processedDocuments,
      processedRate: Math.round((processedDocuments / documentsData.length) * 100),
      averageProcessingTime: 2.3,
      monthlyUploads: 12,
      totalInsights,
      avgConfidenceScore: avgConfidence,
      totalCitations: documentsData.reduce((sum, doc) => sum + (doc.citationCount || 0), 0),
      categories: [...new Set(documentsData.map(doc => doc.category))].length
    };
  };

  // Handle view details
  const handleViewDetails = (document) => {
    setSelectedDocument(document);
    setShowDetailsModal(true);
  };

  // Handle close details
  const handleCloseDetails = () => {
    setShowDetailsModal(false);
    setSelectedDocument(null);
  };

  // Get selected document data
  const getSelectedDocumentData = () => {
    if (!selectedDocument) return null;
    return documentsData.find(doc => doc.id === selectedDocument.id) || selectedDocument;
  };

  const getUserId = useCallback(() => {
    if (accounts && accounts.length > 0) {
      const account = accounts[0];
      const userId = account.localAccountId || account.homeAccountId || account.username;
      console.log('🔐 Using MSAL account user ID:', userId);
      return userId;
    }
    return null;
  }, [accounts]);

  // Fetch documents from API
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        setError(null);
        const workspaceId = getUserId();
        const authHeaders = await getAuthHeaders();
        const params = {
          cacheBuster: Date.now().toString()
        };
        console.log("making documents api call")
        const response = await axios.get(`${envConfig.apiUrl}/documents/${workspaceId}`, {
          headers: {
            ...authHeaders,
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          params: params
        });

        if (response.data.success) {
          const transformedData = response.data.data.documents.map(transformDocumentData);
          console.log("transformedData", transformedData);
          setDocumentsData(transformedData);
        } else {
          throw new Error(response.data.message || 'Failed to fetch documents');
        }
      } catch (err) {
        console.error('Error fetching documents:', err);
        setError(err.message);
        // Fallback to static data
        setDocumentsData(documentsData);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  const analyticsData = getAnalyticsData();

  // Filter documents based on category and search
  const filteredDocuments = documentsData.filter(doc => {
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const categories = ['all', 'Research Papers', 'Company Policy', 'Other', 'Training Document', 'Call Transcript'];

  return (
    <div className="modern-dashboard">
      {/* Animated Background Elements */}
      <div className="dashboard-background">
        <motion.div 
          className="ai-particle particle-1"
          animate={{ 
            y: [0, -30, 0],
            rotate: [0, 360, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="ai-particle particle-2"
          animate={{ 
            x: [0, 40, 0],
            y: [0, -20, 0],
            rotate: [0, -180, -360]
          }}
          transition={{ 
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
        <motion.div 
          className="ai-particle particle-3"
          animate={{ 
            x: [0, -25, 0],
            y: [0, 35, 0],
            scale: [1, 0.8, 1]
          }}
          transition={{ 
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 4
          }}
        />
      </div>

      {/* Welcome Header */}
      <motion.div 
        className="welcome-header"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="welcome-content">
          <div className="welcome-text">
            <motion.h1 
              className="welcome-title"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {getGreeting()}, {userProfile.name.split(' ')[0]}!
            </motion.h1>
            <motion.p 
              className="welcome-subtitle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Ready to explore your research documents with AI-powered insights
            </motion.p>
          </div>
          <motion.div 
            className="user-avatar-container"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.7, type: "spring", stiffness: 200 }}
          >
            <EnhancedAvatar
              userProfile={userProfile}
              size="large"
              showStatus={true}
              variant="card"
              animate={true}
              className="welcome-user-avatar"
            />
          </motion.div>
        </div>
      </motion.div>

      {/* AI Analytics Dashboard */}
      <motion.div 
        className="analytics-section"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      >
        <div className="analytics-grid">
          {[
            {
              icon: <HiViewGrid />,
              secondaryIcon: <BiData />,
              value: analyticsData.totalDocuments,
              label: "Total Documents",
              color: "blue",
              trend: `+${analyticsData.monthlyUploads} this month`,
              delay: 0.1,
              description: "Research papers processed"
            },
            {
              icon: <MdAutoAwesome />,
              secondaryIcon: <HiSparkles />,
              value: analyticsData.totalInsights,
              label: "AI Insights Generated",
              color: "purple",
              trend: "AI-powered analysis",
              delay: 0.2,
              description: "Smart insights extracted"
            },
            {
              icon: <HiLightningBolt />,
              secondaryIcon: <MdInsights />,
              value: analyticsData.avgConfidenceScore?`${analyticsData.avgConfidenceScore}%`:'0',
              label: "Avg Confidence Score",
              color: "green",
              trend: "High accuracy",
              delay: 0.3,
              description: "AI analysis reliability"
            },
            {
              icon: <BiNetworkChart />,
              secondaryIcon: <HiAcademicCap />,
              value: analyticsData.totalCitations,
              label: "Total Citations",
              color: "orange",
              trend: "Research impact",
              delay: 0.4,
              description: "Academic references found"
            }
          ].map((stat, index) => (
            <motion.div
              key={index}
              className={`analytics-card ${stat.color}`}
              initial={{ opacity: 0, scale: 0.8, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: stat.delay, type: "spring", stiffness: 100 }}
              whileHover={{ 
                y: -8, 
                scale: 1.02,
                boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)"
              }}
            >
              <div className="analytics-icon-container">
                <motion.div 
                  className="analytics-icon main-icon"
                  animate={{ 
                    rotate: [0, 360],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: stat.delay * 2
                  }}
                >
                  {stat.icon}
                </motion.div>
                <motion.div 
                  className="analytics-icon secondary-icon"
                  animate={{ 
                    scale: [0.8, 1.2, 0.8],
                    opacity: [0.3, 0.8, 0.3]
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: stat.delay * 2 + 0.5
                  }}
                >
                  {stat.secondaryIcon}
                </motion.div>
              </div>
              <div className="analytics-data">
                <motion.div 
                  className="analytics-value"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: stat.delay + 0.3, type: "spring", stiffness: 200 }}
                >
                  {stat.value}
                </motion.div>
                <div className="analytics-label">{stat.label}</div>
                <div className="analytics-description">{stat.description}</div>
                <div className="analytics-trend">{stat.trend}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div 
        className="quick-actions-section"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <motion.h3 
          className="section-title enhanced"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 }}
        >
          <motion.div
            className="section-icon-container"
            animate={{ 
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <HiSparkles className="section-icon" />
          </motion.div>
          Quick Actions
        </motion.h3>
        <div className="quick-actions-grid">
          {[
            {
              icon: <HiUpload />,
              hoverIcon: <MdCloudUpload />,
              title: "Upload Documents",
              description: "Add new research papers with AI processing",
              link: "/upload",
              color: "blue",
              features: ["PDF Support", "Batch Upload", "Auto-Analysis"]
            },
            {
              icon: <HiChatAlt2 />,
              hoverIcon: <MdSmartToy />,
              title: "AI Chat Assistant",
              description: "Get intelligent research insights instantly",
              link: "/document-chat",
              color: "purple",
              features: ["Natural Language", "Context Aware", "Multi-Document"]
            },
            {
              icon: <HiDocumentSearch />,
              hoverIcon: <MdPsychology />,
              title: "Semantic Search",
              description: "Find relevant content using AI understanding",
              link: "/document-chat",
              color: "green",
              features: ["Smart Queries", "Concept Matching", "Deep Analysis"]
            },
            {
              icon: <MdAnalytics />,
              hoverIcon: <HiTrendingUp />,
              title: "Analytics Dashboard",
              description: "View comprehensive research metrics",
              link: "/mcp-analytics",
              color: "orange",
              features: ["Visual Reports", "Trends Analysis", "Export Data"]
            }
          ].map((action, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 + index * 0.1 }}
              whileHover={{ 
                y: -8, 
                scale: 1.03,
                boxShadow: "0 15px 35px rgba(0, 0, 0, 0.1)"
              }}
              className="quick-action-wrapper"
            >
              <Link to={action.link} className="quick-action-card enhanced">
                <div className="action-icon-container">
                  <motion.div 
                    className={`action-icon main-action-icon ${action.color}`}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    {action.icon}
                  </motion.div>
                  <motion.div 
                    className={`action-icon hover-action-icon ${action.color}`}
                    initial={{ scale: 0, opacity: 0 }}
                    whileHover={{ scale: 1.2, opacity: 0.8 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    {action.hoverIcon}
                  </motion.div>
                </div>
                <div className="action-content enhanced">
                  <h4 className="action-title">{action.title}</h4>
                  <p className="action-description">{action.description}</p>
                  <div className="action-features">
                    {action.features.map((feature, i) => (
                      <span key={i} className="feature-tag">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
                <motion.div 
                  className="action-arrow-container"
                  whileHover={{ x: 5, scale: 1.2 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <FaChevronRight className="action-arrow" />
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Document Library */}
      <motion.div 
        className="document-library-section"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.2 }}
      >
        <div className="library-header">
          <div className="library-title-section">
            <motion.h3 
              className="section-title enhanced"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.2 }}
            >
              <motion.div
                className="section-icon-container"
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <MdScience className="section-icon" />
              </motion.div>
              Research Document Library
            </motion.h3>
            <div className="library-stats">
              <span className="stat-item">
                <FaFileAlt /> {filteredDocuments.length} documents
              </span>
              <span className="stat-item">
                <FaCalendar /> {categories.length - 1} categories
              </span>
            </div>
          </div>
          
          {/* Search and Filters */}
          <div className="library-controls">
            <div className="search-container">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            
            <div className="filter-container">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="category-filter"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Documents Grid */}
        <motion.div 
          className="documents-grid"
          layout
        >
          <AnimatePresence>
            {filteredDocuments.map((document, index) => (
              <motion.div
                key={document.id}
                className="document-card-modern"
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -30 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                layout
              >
                <div className="document-header">
                  <div className="document-category">{document.category}</div>
                  <div className={`document-status ${document.status}`}>
                    {document.status}
                  </div>
                </div>
                
                <div className="document-content">
                  <h4 
                    className="document-title document-title-tooltip" 
                    title={document.name}
                    style={{
                      maxWidth: '100%',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {document.name}
                  </h4>
                  <p className="document-summary">{document.summary}</p>
                  
                  <div className="document-meta">
                    <div className="meta-item">
                      <motion.div
                        className="meta-icon-container"
                        whileHover={{ scale: 1.2, rotate: -5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <FaCalendar className="meta-icon" />
                      </motion.div>
                      <span>{new Date(document.uploadDate).toLocaleDateString()}</span>
                    </div>
                    <div className="meta-item">
                      <motion.div
                        className="meta-icon-container"
                        whileHover={{ scale: 1.2 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <HiCube className="meta-icon" />
                      </motion.div>
                      <span>{document.size}</span>
                    </div>
                  </div>

                  <div className="document-insights enhanced">
                    <motion.div 
                      className="insight-item"
                      whileHover={{ scale: 1.05, y: -2 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <motion.div
                        className="insight-icon-container"
                        animate={{ 
                          scale: [1, 1.1, 1],
                          rotate: [0, 10, 0]
                        }}
                        transition={{ 
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <MdAutoAwesome className="insight-icon" />
                      </motion.div>
                      <span>{document.keyInsights} insights</span>
                    </motion.div>
                    <motion.div 
                      className="insight-item"
                      whileHover={{ scale: 1.05, y: -2 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <motion.div
                        className="insight-icon-container"
                        animate={{ 
                          scale: [1, 1.2, 1],
                          opacity: [0.7, 1, 0.7]
                        }}
                        transition={{ 
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: 0.3
                        }}
                      >
                        <HiLightningBolt className="insight-icon confidence" />
                      </motion.div>
                      <span>{document.confidenceScore}% confidence</span>
                    </motion.div>
                    <motion.div 
                      className="insight-item"
                      whileHover={{ scale: 1.05, y: -2 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <motion.div
                        className="insight-icon-container"
                        animate={{ 
                          rotate: [0, 360],
                          scale: [1, 0.9, 1]
                        }}
                        transition={{ 
                          duration: 4,
                          repeat: Infinity,
                          ease: "linear",
                          delay: 0.6
                        }}
                      >
                        <BiNetworkChart className="insight-icon citations" />
                      </motion.div>
                      <span>{document.citationCount} citations</span>
                    </motion.div>
                  </div>

                  <div className="document-tags">
                    {document.tags.map((tag, i) => (
                      <span key={i} className="document-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="document-actions enhanced">
                  <motion.button 
                    className="action-btn primary enhanced"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewDetails(document);
                    }}
                    whileHover={{ 
                      scale: 1.05,
                      boxShadow: "0 8px 25px rgba(59, 130, 246, 0.3)"
                    }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <motion.div
                      className="btn-icon"
                      whileHover={{ rotate: 10, scale: 1.2 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <HiBeaker />
                    </motion.div>
                    Analyze
                  </motion.button>
                  <motion.button 
                    className="action-btn secondary enhanced"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle download functionality
                      console.log('Download document:', document.name);
                    }}
                    whileHover={{ 
                      scale: 1.05,
                      backgroundColor: "#f1f5f9",
                      borderColor: "#cbd5e1"
                    }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <motion.div
                      className="btn-icon"
                      whileHover={{ y: -2, scale: 1.2 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <FaDownload />
                    </motion.div>
                    Download
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {loading ? (
          <div className="customers-container">
            <div className="loading-state" style={{
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              height: '400px', fontSize: '18px'
            }}>
              📄 Loading documents...
            </div>
          </div>
        ) :
          (filteredDocuments.length === 0 && (
            <motion.div
              className="no-documents"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <FaSearch className="no-docs-icon" />
              <h4>No documents found</h4>
              <p>Try adjusting your search terms or category filter</p>
            </motion.div>
          ))
        }
      </motion.div>

      {/* Document Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedDocument && (
          <motion.div
            className="details-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseDetails}
          >
            <motion.div
              className="details-modal-content"
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 50 }}
              onClick={(e) => e.stopPropagation()}
            >
              <DocumentDetailsModal
                document={getSelectedDocumentData()}
                onClose={handleCloseDetails}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Document Details Modal Component
const DocumentDetailsModal = ({ document, onClose }) => {
  if (!document) return null;

  return (
    <div className="document-details-modal">
      {/* Modal Header */}
      <div className="modal-header">
        <div className="modal-title-section">
          <h2 className="modal-title">{document.name}</h2>
          <div className="modal-subtitle">
            <span className="document-category-badge">{document.category}</span>
            <span className={`document-status-badge ${document.status}`}>
              {document.status}
            </span>
          </div>
        </div>
        <button className="modal-close-btn" onClick={onClose}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Modal Content */}
      <div className="modal-body">
        {/* Document Summary */}
        <div className="details-section">
          <h3 className="section-header">
            <FaFileAlt className="section-icon" />
            Document Summary
          </h3>
          <p className="document-description">{document.summary}</p>
        </div>

        {/* Document Info Grid */}
        <div className="details-section">
          <h3 className="section-header">
            <FaUser className="section-icon" />
            Document Information
          </h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Author:</span>
              <span className="info-value">{document.author}</span>
            </div>
            <div className="info-item">
              <span className="info-label">File Name:</span>
              <span 
                className="info-value filename-tooltip" 
                title={document.fileName}
                style={{
                  maxWidth: '200px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  display: 'inline-block',
                  marginLeft: '3rem'
                }}
              >
                {document.fileName}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">File Size:</span>
              <span className="info-value">{document.size}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Upload Date:</span>
              <span className="info-value">{new Date(document.uploadDate).toLocaleDateString()}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Category:</span>
              <span className="info-value">{document.category}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Status:</span>
              <span className="info-value">{document.status}</span>
            </div>
          </div>
        </div>

        {/* AI Insights */}
        <div className="details-section">
          <h3 className="section-header">
            <FaBrain className="section-icon" />
            AI Analysis Results
          </h3>
          <div className="insights-grid">
            <div className="insight-card">
              <div className="insight-icon">
                <FaBrain />
              </div>
              <div className="insight-content">
                <span className="insight-number">{document.keyInsights}</span>
                <span className="insight-label">Key Insights</span>
              </div>
            </div>
            <div className="insight-card">
              <div className="insight-icon">
                <FaStar />
              </div>
              <div className="insight-content">
                <span className="insight-number">{document.confidenceScore}%</span>
                <span className="insight-label">Confidence Score</span>
              </div>
            </div>
            <div className="insight-card">
              <div className="insight-icon">
                <FaNetworkWired />
              </div>
              <div className="insight-content">
                <span className="insight-number">{document.citationCount}</span>
                <span className="insight-label">Citations</span>
              </div>
            </div>
          </div>
        </div>

        {/* Document Tags */}
        <div className="details-section">
          <h3 className="section-header">
            <FaTag className="section-icon" />
            Tags & Keywords
          </h3>
          <div className="tags-container">
            {document.tags.map((tag, index) => (
              <span key={index} className="detail-tag">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Modal Actions */}
      <div className="modal-footer">
        <button className="modal-action-btn secondary" onClick={onClose}>
          Close
        </button>
        <button className="modal-action-btn primary">
          <FaDownload /> Download Document
        </button>
        <button className="modal-action-btn primary">
          <FaSearch /> Analyze with AI
        </button>
      </div>
    </div>
  );
};

export default Documents;
