import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Button,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Chip,
  TextField,
  Tab,
  Tabs,
  Badge,
  Tooltip,
  Card,
  CardContent,
  Divider,
  Grid,
  Switch,
  FormControlLabel,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  LinearProgress,
  Alert,
  Snackbar,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  AutoAwesome,
  PlayArrow,
  Stop,
  Save,
  FileDownload,
  FileUpload,
  Settings,
  Add,
  Delete,
  Edit,
  Visibility,
  Share,
  History,
  Analytics,
  Speed,
  Memory,
  Cloud,
  Security,
  Psychology,
  SmartToy,
  DataObject,
  Api,
  Language,
  Code,
  SearchRounded,
  FilterList,
  MoreVert,
  ContentCopy,
  DashboardCustomize,
  AccountTree,
  Extension,
  Timeline,
  TrendingUp,
  ConnectWithoutContact,
  Transform,
  LocalLibrary,
  Science,
  Webhook,
  Storage,
  CorporateFare,
  SwapHoriz,
  Functions,
  Schema,
  SyncAlt,
  CallMade,
  Close,
  CheckCircle,
  Error as ErrorIcon,
  Warning,
  Info
} from '@mui/icons-material';
import ReactFlow, {
  useNodesState,
  useEdgesState,
  addEdge,
  MiniMap,
  Controls,
  Background,
  ReactFlowProvider,
  ConnectionLineType,
  MarkerType,
  Position,
  getSmoothStepPath,
  EdgeLabelRenderer,
  BaseEdge,
  Handle
} from 'reactflow';
import 'reactflow/dist/style.css';
import './AIWorkflowBuilder.css';
import WorkflowTemplateGallery from './WorkflowTemplateGallery';
import WorkflowAnalyticsDashboard from './WorkflowAnalyticsDashboard';
import NodeConfigurationPanel from './NodeConfigurationPanel';
import WorkflowResultsPanel from './WorkflowResultsPanel';
import BeautifulEnhancedResultsPanel from './BeautifulEnhancedResultsPanel';
import azureOpenAIService from '../../services/azureOpenAIService';
import workflowDocumentService from '../../services/workflowDocumentService';

// Custom Edge Component for better arrow display
const CustomEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}) => {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: '#667eea',
          strokeWidth: 3,
          filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
          ...style
        }}
      />
    </>
  );
};

// Custom Node Components
const AIAgentNode = ({ data, selected }) => {
  const theme = useTheme();
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`ai-node ${selected ? 'selected' : ''}`}
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '12px',
        padding: '16px',
        minWidth: '180px',
        boxShadow: selected 
          ? '0 8px 32px rgba(102, 126, 234, 0.3)' 
          : '0 4px 16px rgba(0, 0, 0, 0.1)',
        border: selected ? '2px solid #667eea' : '1px solid rgba(255, 255, 255, 0.2)',
        color: 'white',
        position: 'relative'
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: '#667eea',
          width: 12,
          height: 12,
          border: '2px solid white',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}
      />
      <div className="flex items-center gap-2 mb-2">
        {React.createElement(data.icon || Psychology, { style: { fontSize: '20px' } })}
        <Typography variant="subtitle2" fontWeight="600">
          {data.label}
        </Typography>
      </div>
      <Typography variant="caption" style={{ opacity: 0.8 }}>
        {data.description}
      </Typography>
      {data.status && (
        <Chip
          size="small"
          label={data.status}
          style={{
            marginTop: '8px',
            backgroundColor: data.status === 'running' ? '#4caf50' : 
                           data.status === 'error' ? '#f44336' : 
                           data.status === 'completed' ? '#4caf50' : '#ffc107',
            color: 'white',
            fontSize: '10px'
          }}
        />
      )}
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: '#667eea',
          width: 12,
          height: 12,
          border: '2px solid white',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}
      />
    </motion.div>
  );
};

const TriggerNode = ({ data, selected }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className={`trigger-node ${selected ? 'selected' : ''}`}
    style={{
      background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
      borderRadius: '12px',
      padding: '16px',
      minWidth: '160px',
      boxShadow: selected 
        ? '0 8px 32px rgba(76, 175, 80, 0.3)' 
        : '0 4px 16px rgba(0, 0, 0, 0.1)',
      border: selected ? '2px solid #4caf50' : '1px solid rgba(255, 255, 255, 0.2)',
      color: 'white',
      position: 'relative'
    }}
  >
    <div className="flex items-center gap-2 mb-2">
      {React.createElement(data.icon || Schedule, { style: { fontSize: '20px' } })}
      <Typography variant="subtitle2" fontWeight="600">
        {data.label}
      </Typography>
    </div>
    <Typography variant="caption" style={{ opacity: 0.8 }}>
      {data.description}
    </Typography>
    {data.status && (
      <Chip
        size="small"
        label={data.status}
        style={{
          marginTop: '8px',
          backgroundColor: data.status === 'running' ? '#4caf50' : 
                         data.status === 'error' ? '#f44336' : 
                         data.status === 'completed' ? '#4caf50' : '#ffc107',
          color: 'white',
          fontSize: '10px'
        }}
      />
    )}
    <Handle
      type="source"
      position={Position.Right}
      style={{
        background: '#4caf50',
        width: 12,
        height: 12,
        border: '2px solid white',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
      }}
    />
  </motion.div>
);

const ActionNode = ({ data, selected }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className={`action-node ${selected ? 'selected' : ''}`}
    style={{
      background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
      borderRadius: '12px',
      padding: '16px',
      minWidth: '160px',
      boxShadow: selected 
        ? '0 8px 32px rgba(33, 150, 243, 0.3)' 
        : '0 4px 16px rgba(0, 0, 0, 0.1)',
      border: selected ? '2px solid #2196f3' : '1px solid rgba(255, 255, 255, 0.2)',
      color: 'white',
      position: 'relative'
    }}
  >
    <Handle
      type="target"
      position={Position.Left}
      style={{
        background: '#2196f3',
        width: 12,
        height: 12,
        border: '2px solid white',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
      }}
    />
    <div className="flex items-center gap-2 mb-2">
      {React.createElement(data.icon || Api, { style: { fontSize: '20px' } })}
      <Typography variant="subtitle2" fontWeight="600">
        {data.label}
      </Typography>
    </div>
    <Typography variant="caption" style={{ opacity: 0.8 }}>
      {data.description}
    </Typography>
    {data.status && (
      <Chip
        size="small"
        label={data.status}
        style={{
          marginTop: '8px',
          backgroundColor: data.status === 'running' ? '#4caf50' : 
                         data.status === 'error' ? '#f44336' : 
                         data.status === 'completed' ? '#4caf50' : '#ffc107',
          color: 'white',
          fontSize: '10px'
        }}
      />
    )}
    <Handle
      type="source"
      position={Position.Right}
      style={{
        background: '#2196f3',
        width: 12,
        height: 12,
        border: '2px solid white',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
      }}
    />
  </motion.div>
);

const nodeTypes = {
  aiAgent: AIAgentNode,
  trigger: TriggerNode,
  action: ActionNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

// Node Library Data
const nodeLibrary = {
  triggers: [
    {
      id: 'webhook',
      type: 'trigger',
      label: 'Webhook',
      description: 'Trigger on HTTP requests',
      icon: Webhook,
      category: 'triggers'
    },
    {
      id: 'schedule',
      type: 'trigger',
      label: 'Schedule',
      description: 'Time-based triggers',
      icon: Timeline,
      category: 'triggers'
    },
    {
      id: 'fileWatcher',
      type: 'trigger',
      label: 'File Watcher',
      description: 'Monitor file changes',
      icon: Visibility,
      category: 'triggers'
    }
  ],
  aiAgents: [
    {
      id: 'gpt4',
      type: 'aiAgent',
      label: 'GPT-4 Agent',
      description: 'Advanced language model',
      icon: Psychology,
      category: 'ai'
    },
    {
      id: 'claude',
      type: 'aiAgent',
      label: 'Claude Agent',
      description: 'Anthropic AI assistant',
      icon: SmartToy,
      category: 'ai'
    },
    {
      id: 'gemini',
      type: 'aiAgent',
      label: 'Gemini Agent',
      description: 'Google AI model',
      icon: AutoAwesome,
      category: 'ai'
    },
    {
      id: 'customAgent',
      type: 'aiAgent',
      label: 'Custom Agent',
      description: 'Build your own AI agent',
      icon: Extension,
      category: 'ai'
    }
  ],
  actions: [
    {
      id: 'apiCall',
      type: 'action',
      label: 'API Call',
      description: 'Make HTTP requests',
      icon: Api,
      category: 'actions'
    },
    {
      id: 'dataTransform',
      type: 'action',
      label: 'Transform Data',
      description: 'Process and transform data',
      icon: Transform,
      category: 'actions'
    },
    {
      id: 'saveToDb',
      type: 'action',
      label: 'Save to Database',
      description: 'Store data in database',
      icon: Storage,
      category: 'actions'
    },
    {
      id: 'sendEmail',
      type: 'action',
      label: 'Send Email',
      description: 'Email notifications',
      icon: CallMade,
      category: 'actions'
    }
  ],
  integrations: [
    {
      id: 'slack',
      type: 'action',
      label: 'Slack',
      description: 'Slack integration',
      icon: CorporateFare,
      category: 'integrations'
    },
    {
      id: 'googleSheets',
      type: 'action',
      label: 'Google Sheets',
      description: 'Spreadsheet operations',
      icon: DataObject,
      category: 'integrations'
    },
    {
      id: 'notion',
      type: 'action',
      label: 'Notion',
      description: 'Notion workspace',
      icon: LocalLibrary,
      category: 'integrations'
    }
  ]
};

// Workflow Templates
const workflowTemplates = [
  {
    id: 'document-analysis',
    name: 'Document Analysis Pipeline',
    description: 'Automated document processing and analysis',
    category: 'AI Analysis',
    nodes: 5,
    difficulty: 'Beginner',
    useCase: 'Content Processing'
  },
  {
    id: 'customer-support',
    name: 'AI Customer Support',
    description: 'Intelligent customer query resolution',
    category: 'Customer Service',
    nodes: 8,
    difficulty: 'Intermediate',
    useCase: 'Support Automation'
  },
  {
    id: 'data-enrichment',
    name: 'Data Enrichment Flow',
    description: 'Enhance data with AI insights',
    category: 'Data Processing',
    nodes: 6,
    difficulty: 'Advanced',
    useCase: 'Data Analytics'
  }
];

const AIWorkflowBuilder = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // React Flow states
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  // UI States
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedNode, setSelectedNode] = useState(null);
  const [workflowName, setWorkflowName] = useState('Untitled Workflow');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionProgress, setExecutionProgress] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [templateDialog, setTemplateDialog] = useState(false);
  const [analyticsDialog, setAnalyticsDialog] = useState(false);

  // Workflow execution state
  const [executionLogs, setExecutionLogs] = useState([]);
  const [enhancedResults, setEnhancedResults] = useState([]);
  const [showEnhancedResults, setShowEnhancedResults] = useState(false);
  const [workflowStats, setWorkflowStats] = useState({
    totalRuns: 0,
    successRate: 95,
    avgExecutionTime: '2.3s',
    lastRun: new Date().toISOString()
  });

  // Node configuration state
  const [configDialog, setConfigDialog] = useState(false);
  const [configuringNode, setConfiguringNode] = useState(null);
  const [availableDocuments, setAvailableDocuments] = useState([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [actualExecution, setActualExecution] = useState(false);
  
  // Workflow results and execution tracking
  const [workflowExecution, setWorkflowExecution] = useState(null);
  const [resultsDialog, setResultsDialog] = useState(false);
  const [executionHistory, setExecutionHistory] = useState([]);

  const canvasRef = useRef(null);

  // Fetch available documents
  useEffect(() => {
    fetchDocuments();
    
    // Make test functions available in console for debugging
    window.testEnhancedResults = () => {
      console.log('🧪 Testing Beautiful Enhanced Results Panel...');
      const mockResults = [
        {
          id: 'test-1',
          nodeId: 'ai-agent-1',
          nodeName: 'GPT-4 Analyzer',
          documentId: 'test-doc-1',
          fileName: 'Strategic_Business_Plan_2024.pdf',
          analysisType: 'comprehensive',
          success: true,
          model: 'gpt4o-mini',
          processingTime: 3250,
          confidence: 0.96,
          enhanced: true,
          exportable: true,
          timestamp: new Date().toISOString(),
          metadata: {
            sourceType: 'blob_chunks',
            chunksUsed: 8,
            totalChunks: 12,
            chunkingStrategy: 'semantic'
          },
          rawAnalysisData: {
            summary: {
              executive_summary: "This comprehensive business plan outlines a strategic approach for expanding digital transformation initiatives across multiple market segments in 2024.",
              detailed_summary: "The document presents a detailed roadmap for organizational growth, focusing on technology adoption, market expansion, and operational efficiency. Key areas include digital infrastructure modernization, customer experience enhancement, and sustainable business practices. The plan addresses both short-term tactical objectives and long-term strategic goals, with emphasis on data-driven decision making and agile implementation methodologies.",
              key_points: [
                "Digital transformation budget increased by 40% for 2024",
                "Target market expansion into 3 new geographical regions",
                "Implementation of AI-driven customer service platform",
                "Sustainability goals aligned with industry best practices",
                "Employee training program for digital skills development",
                "Partnership strategy with emerging technology vendors",
                "Risk mitigation framework for cybersecurity threats"
              ]
            },
            content_analysis: {
              main_topics: ["Digital Transformation", "Market Expansion", "Operational Excellence", "Technology Strategy"],
              themes: ["Innovation", "Growth", "Efficiency", "Sustainability", "Customer Focus"],
              document_type: "Strategic Business Plan",
              writing_style: "Professional",
              complexity_level: "Advanced"
            },
            keywords: {
              primary_keywords: ["digital transformation", "business strategy", "market expansion", "technology adoption", "operational efficiency"],
              secondary_keywords: ["AI implementation", "customer experience", "data analytics", "cybersecurity", "sustainability", "agile methodology"],
              technical_terms: ["API integration", "cloud infrastructure", "machine learning", "data governance", "digital ecosystem"]
            },
            entities: {
              people: ["Sarah Johnson (CEO)", "Michael Chen (CTO)", "Dr. Amanda Rodriguez (Strategy Director)"],
              organizations: ["TechCorp Solutions", "Global Industries Inc", "Innovation Partners LLC"],
              locations: ["North America", "European Union", "Asia-Pacific Region"],
              dates: ["Q1 2024", "Q3 2024", "December 2024"],
              technologies: ["Artificial Intelligence", "Cloud Computing", "Internet of Things", "Blockchain", "Machine Learning"],
              concepts: ["Digital Ecosystem", "Agile Transformation", "Customer Journey Mapping", "Data-Driven Insights"]
            },
            sentiment_analysis: {
              overall_sentiment: "Positive",
              confidence_score: 0.92,
              emotional_tone: "Optimistic and Strategic",
              sentiment_details: "The document conveys strong confidence in the proposed strategy with realistic acknowledgment of challenges and opportunities."
            },
            categorization: {
              primary_category: "Strategic Business Planning",
              secondary_categories: ["Digital Transformation", "Technology Strategy", "Market Analysis"],
              industry: "Technology & Business Consulting",
              document_purpose: "Strategic planning and organizational direction setting"
            },
            quality_assessment: {
              readability_score: "Good",
              information_density: "High",
              structural_quality: "Excellent",
              completeness: "Comprehensive"
            },
            actionable_insights: {
              recommendations: [
                "Prioritize AI implementation in customer service for immediate ROI",
                "Establish cross-functional teams for digital transformation initiatives",
                "Implement phased approach for market expansion to minimize risk",
                "Develop comprehensive training programs for technology adoption",
                "Create metrics dashboard for tracking transformation progress"
              ],
              potential_concerns: [
                "Resource allocation conflicts between multiple initiatives",
                "Change management challenges during digital transformation",
                "Cybersecurity risks with increased digital footprint"
              ],
              follow_up_actions: [
                "Schedule quarterly strategy review meetings",
                "Establish technology vendor selection criteria",
                "Create detailed implementation timeline with milestones"
              ],
              related_topics: [
                "Change Management Best Practices",
                "Technology Vendor Evaluation",
                "Digital Security Frameworks",
                "Customer Experience Optimization"
              ]
            }
          }
        }
      ];
      setEnhancedResults(mockResults);
      setShowEnhancedResults(true);
      console.log('✅ Beautiful Enhanced Results Panel opened with comprehensive mock data');
    };
    
    window.clearEnhancedResults = () => {
      setEnhancedResults([]);
      setShowEnhancedResults(false);
      console.log('🧹 Enhanced Results cleared');
    };

    window.debugWorkflowResults = () => {
      console.log('🔍 Debug Workflow Results:', {
        workflowExecution,
        enhancedResults,
        showEnhancedResults,
        resultsDialog
      });
    };

    window.forceEnhancedResults = () => {
      console.log('🔧 Forcing Enhanced Results Panel...');
      setResultsDialog(false);
      setShowEnhancedResults(true);
      console.log('✅ Enhanced Results Panel should now be visible');
    };
    
  }, []);

  const fetchDocuments = async () => {
    setLoadingDocuments(true);
    try {
      console.log('🔄 Fetching documents for workflow builder...');
      const result = await workflowDocumentService.fetchDocuments();
      
      console.log('📄 Documents fetch result:', result);
      
      if (result.success && Array.isArray(result.documents)) {
        setAvailableDocuments(result.documents);
        console.log(`✅ Loaded ${result.documents.length} documents`);
        
        if (result.documents.length === 0) {
          setSnackbar({
            open: true,
            message: 'No documents found. Please upload documents first.',
            severity: 'info'
          });
        } else {
          setSnackbar({
            open: true,
            message: `Successfully loaded ${result.documents.length} documents`,
            severity: 'success'
          });
        }
      } else {
        console.warn('⚠️ Documents fetch was not successful:', result);
        setAvailableDocuments([]);
        setSnackbar({
          open: true,
          message: result.error || `Failed to load documents (Status: ${result.statusCode || 'Unknown'}). Please check your authentication.`,
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('❌ Error fetching documents:', error);
      setAvailableDocuments([]);
      setSnackbar({
        open: true,
        message: `Failed to load documents: ${error.message}. Please check your authentication.`,
        severity: 'error'
      });
    } finally {
      setLoadingDocuments(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Ctrl/Cmd + S to save
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        saveWorkflow();
      }
      
      // Ctrl/Cmd + Enter to execute
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        if (!isExecuting) {
          executeWorkflow();
        }
      }
      
      // Delete key to remove selected nodes
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedNode) {
        setNodes(nds => nds.filter(node => node.id !== selectedNode.id));
        setEdges(eds => eds.filter(edge => 
          edge.source !== selectedNode.id && edge.target !== selectedNode.id
        ));
        setSelectedNode(null);
        setSnackbar({ open: true, message: 'Node deleted', severity: 'info' });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isExecuting, selectedNode, workflowName, nodes, edges]);

  // Auto-save functionality
  useEffect(() => {
    if (nodes.length > 0 && workflowName.trim()) {
      const autoSaveTimer = setTimeout(() => {
        const workflow = {
          name: workflowName,
          nodes,
          edges,
          autoSaved: true,
          timestamp: new Date().toISOString()
        };
        localStorage.setItem('workflow-autosave', JSON.stringify(workflow));
      }, 5000); // Auto-save after 5 seconds of inactivity

      return () => clearTimeout(autoSaveTimer);
    }
  }, [nodes, edges, workflowName]);

  // Handle connection between nodes
  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({
      ...params,
      type: 'smoothstep',
      markerEnd: { 
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
        color: '#667eea'
      },
      style: { 
        stroke: '#667eea', 
        strokeWidth: 3,
        strokeDasharray: '0'
      },
      animated: false
    }, eds)),
    [setEdges],
  );

  // Add node to canvas
  const addNodeToCanvas = useCallback((nodeData) => {
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    const centerX = canvasRect ? canvasRect.width / 2 - 100 : 300;
    const centerY = canvasRect ? canvasRect.height / 2 - 50 : 200;
    
    const newNode = {
      id: `${nodeData.id}-${Date.now()}`,
      type: nodeData.type,
      position: { 
        x: centerX + Math.random() * 100 - 50, 
        y: centerY + Math.random() * 100 - 50 
      },
      data: {
        ...nodeData,
        status: 'idle'
      },
    };
    setNodes((nds) => [...nds, newNode]);
    setSnackbar({ open: true, message: `Added ${nodeData.label}`, severity: 'success' });
  }, [setNodes]);

  // Execute workflow with comprehensive results tracking
  const executeWorkflow = async () => {
    if (nodes.length === 0) {
      setSnackbar({ open: true, message: 'Add nodes to execute workflow', severity: 'warning' });
      return;
    }

    const executionId = `exec_${Date.now()}`;
    const startTime = Date.now();

    setIsExecuting(true);
    setExecutionProgress(0);
    setEnhancedResults([]); // Clear previous enhanced results

    // Initialize comprehensive execution tracking
    const execution = {
      id: executionId,
      status: 'running',
      startTime,
      results: [],
      metadata: {
        workflowName: workflowName || 'Unnamed Workflow',
        executedAt: new Date().toISOString(),
        nodeCount: nodes.length,
        edgeCount: edges.length
      },
      analytics: {
        totalSteps: nodes.length,
        successfulSteps: 0,
        failedSteps: 0,
        apiCalls: 0,
        documentStats: [],
        memoryUsage: Math.random() * 100 // Simulated for now
      }
    };

    setWorkflowExecution(execution);

    try {
      // Get execution order using topological sort
      const executionOrder = getExecutionOrder(nodes, edges);
      
      if (executionOrder.length === 0) {
        // If no execution order, just execute all nodes in sequence
        executionOrder.push(...nodes.map(n => n.id));
      }

      setSnackbar({
        open: true,
        message: `Starting workflow execution with ${executionOrder.length} steps...`,
        severity: 'info'
      });

      let previousResults = null;

      // Execute nodes in order with detailed tracking
      for (let i = 0; i < executionOrder.length; i++) {
        const nodeId = executionOrder[i];
        const node = nodes.find(n => n.id === nodeId);
        
        if (!node) continue;

        const nodeStartTime = Date.now();
        const progress = ((i + 1) / executionOrder.length) * 100;

        setExecutionProgress(progress);

        // Animate current processing
        const incomingEdges = edges.filter(edge => edge.target === nodeId);
        setEdges(currentEdges => 
          currentEdges.map(edge => ({
            ...edge,
            animated: incomingEdges.some(e => e.id === edge.id)
          }))
        );

        // Update node to show it's processing
        setNodes(currentNodes =>
          currentNodes.map(n => ({
            ...n,
            data: {
              ...n.data,
              status: n.id === nodeId ? 'running' : n.data.status,
              isProcessing: n.id === nodeId
            }
          }))
        );

        try {
          let result;
          
          switch (node.type) {
            case 'trigger':
            case 'triggerNode':
              result = await executeTriggerNode(node, previousResults);
              break;
            case 'aiAgent':
            case 'aiAgentNode':
              result = await executeAIAgentNode(node, previousResults);
              execution.analytics.apiCalls += result.apiCalls || 0;
              break;
            case 'action':
            case 'actionNode':
              result = await executeActionNode(node, previousResults);
              break;
            default:
              result = { 
                success: true, 
                summary: `${node.data.label} executed successfully`,
                aiResults: [],
                processed: 1,
                data: { message: `Processed ${node.data.label}` }
              };
          }

          const nodeDuration = Date.now() - nodeStartTime;

          // Create comprehensive result object
          const nodeResult = {
            nodeId: nodeId,
            nodeName: node.data.label,
            nodeType: node.type,
            status: result.success ? 'completed' : 'failed',
            duration: nodeDuration,
            timestamp: new Date().toISOString(),
            summary: result.summary || `${node.data.label} ${result.success ? 'completed successfully' : 'failed'}`,
            aiResults: result.aiResults || [],
            details: {
              inputSize: result.inputSize || 'N/A',
              outputSize: result.outputSize || 'N/A',
              processed: result.processed || 0
            },
            error: result.error || null,
            success: result.success
          };

          // Track document processing stats and capture enhanced results
          if (result.aiResults && Array.isArray(result.aiResults)) {
            result.aiResults.forEach(aiResult => {
              execution.analytics.documentStats.push({
                fileName: aiResult.fileName,
                size: aiResult.fileSize || 'Unknown',
                processingTime: aiResult.processingTime || nodeDuration,
                status: aiResult.success ? 'success' : 'error',
                model: aiResult.model || 'Unknown',
                confidence: aiResult.confidence || 0
              });
              
              // Capture enhanced analysis results for display
              if (aiResult.enhanced && aiResult.analysis) {
                setEnhancedResults(prev => [...prev, {
                  id: `${nodeId}-${aiResult.documentId}-${Date.now()}`,
                  nodeId: nodeId,
                  nodeName: node.data.label,
                  documentId: aiResult.documentId,
                  fileName: aiResult.fileName,
                  analysisType: aiResult.analysisType || 'custom',
                  analysis: aiResult.analysis,
                  rawData: aiResult.rawAnalysisData,
                  metadata: aiResult.metadata,
                  timestamp: new Date().toISOString(),
                  success: aiResult.success,
                  model: aiResult.model,
                  processingTime: aiResult.processingTime,
                  exportable: aiResult.exportable || true
                }]);
              }
            });
          }

          execution.results.push(nodeResult);
          
          if (result.success) {
            execution.analytics.successfulSteps++;
            previousResults = result.data;
          } else {
            execution.analytics.failedSteps++;
            throw new Error(`Node ${node.data.label} failed: ${result.error}`);
          }

          // Update node to show completion
          setNodes(currentNodes =>
            currentNodes.map(n => ({
              ...n,
              data: {
                ...n.data,
                status: n.id === nodeId ? 'completed' : n.data.status,
                isProcessing: false,
                result: result.success ? 'success' : 'error'
              }
            }))
          );

          // Update execution state
          setWorkflowExecution(prev => ({
            ...prev,
            results: [...prev.results, nodeResult],
            analytics: {
              ...prev.analytics,
              successfulSteps: execution.analytics.successfulSteps,
              failedSteps: execution.analytics.failedSteps,
              apiCalls: execution.analytics.apiCalls,
              documentStats: execution.analytics.documentStats
            }
          }));

        } catch (nodeError) {
          console.error(`Error executing node ${nodeId}:`, nodeError);
          
          const errorResult = {
            nodeId: nodeId,
            nodeName: node.data.label,
            nodeType: node.type,
            status: 'failed',
            duration: Date.now() - nodeStartTime,
            timestamp: new Date().toISOString(),
            summary: `${node.data.label} failed with error`,
            error: nodeError.message,
            success: false
          };
          
          execution.results.push(errorResult);
          execution.analytics.failedSteps++;
          
          // Update node to show error
          setNodes(currentNodes =>
            currentNodes.map(n => ({
              ...n,
              data: {
                ...n.data,
                status: n.id === nodeId ? 'failed' : n.data.status,
                isProcessing: false,
                result: 'error'
              }
            }))
          );
          
          // Don't stop execution, continue with next node
        }

        // Small delay between nodes for visual feedback
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      // Calculate final analytics
      const totalDuration = Date.now() - startTime;
      execution.status = 'completed';
      execution.endTime = Date.now();
      execution.analytics.totalDuration = totalDuration;
      execution.analytics.successRate = (execution.analytics.successfulSteps / execution.analytics.totalSteps) * 100;

      // Reset edge animations
      setEdges(currentEdges => 
        currentEdges.map(edge => ({
          ...edge,
          animated: false,
          style: {
            ...edge.style,
            stroke: '#4caf50'
          }
        }))
      );

      // Save workflow execution results (simulated)
      try {
        // await axios.post(`${envConfig.apiUrl}/ai-workflow/results`, execution);
        console.log('Workflow execution results:', execution);
      } catch (saveError) {
        console.warn('Failed to save execution results:', saveError);
      }

      // Update execution history
      setExecutionHistory(prev => [execution, ...prev].slice(0, 10));

      // Update final execution state
      setWorkflowExecution(execution);

      // Add to execution logs
      const newLog = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        status: 'success',
        message: `Workflow "${workflowName}" executed successfully`,
        duration: `${(totalDuration / 1000).toFixed(1)}s`,
        nodesProcessed: execution.analytics.successfulSteps
      };
      setExecutionLogs(prev => [newLog, ...prev.slice(0, 9)]);

      setSnackbar({
        open: true,
        message: `Workflow completed! ${execution.analytics.successfulSteps}/${execution.analytics.totalSteps} steps successful. Click 'View Results' for details.`,
        severity: 'success'
      });

      // Check if we have enhanced results in the execution results
      const hasEnhancedAIResults = execution.results.some(nodeResult => 
        nodeResult.aiResults && 
        nodeResult.aiResults.some(aiResult => aiResult.enhanced && aiResult.analysis)
      );

      // Also check if we have any AI agent nodes that completed (force enhanced view for AI workflows)
      const hasAIAgentNodes = execution.results.some(nodeResult => 
        nodeResult.nodeType === 'aiAgent' && nodeResult.status === 'completed'
      );
      
      console.log('🔍 Enhanced results check:', {
        executionResults: execution.results.length,
        hasEnhancedAIResults,
        hasAIAgentNodes,
        enhancedResultsState: enhancedResults.length,
        allResults: execution.results.map(r => ({
          nodeType: r.nodeType,
          aiResults: r.aiResults?.length || 0,
          enhanced: r.aiResults?.some(ai => ai.enhanced) || false
        }))
      });
      
      // Force enhanced results view for any AI workflow, and populate results if needed
      const shouldShowEnhanced = hasEnhancedAIResults || hasAIAgentNodes;
      
      if (shouldShowEnhanced && enhancedResults.length === 0) {
        // Populate enhanced results from execution data
        const allEnhancedResults = [];
        execution.results.forEach(nodeResult => {
          if (nodeResult.aiResults && nodeResult.aiResults.length > 0) {
            nodeResult.aiResults.forEach(aiResult => {
              allEnhancedResults.push({
                id: `${nodeResult.nodeId}-${aiResult.documentId || Date.now()}`,
                nodeId: nodeResult.nodeId,
                nodeName: nodeResult.nodeName,
                documentId: aiResult.documentId || 'unknown',
                fileName: aiResult.fileName || `Document Analysis`,
                analysisType: aiResult.analysisType || 'comprehensive',
                analysis: aiResult.analysis,
                rawAnalysisData: aiResult.rawAnalysisData || aiResult.analysis,
                metadata: aiResult.metadata || {},
                timestamp: new Date().toISOString(),
                success: aiResult.success !== false,
                model: aiResult.model || 'gpt4o-mini',
                processingTime: aiResult.processingTime || nodeResult.duration,
                confidence: aiResult.confidence || 0.95,
                enhanced: true, // Force enhanced flag
                exportable: true
              });
            });
          }
        });
        
        if (allEnhancedResults.length > 0) {
          setEnhancedResults(allEnhancedResults);
          console.log('📊 Populated enhanced results from execution data:', allEnhancedResults.length);
        }
      }
      
      // Auto-open appropriate results panel after 1 second
      setTimeout(() => {
        if (shouldShowEnhanced) {
          setShowEnhancedResults(true);
          console.log('🎉 Opening Enhanced Results Panel - AI workflow detected');
        } else {
          setResultsDialog(true);
          console.log('📊 Opening Standard Results Dialog - no AI analysis found');
        }
      }, 1500);

    } catch (error) {
      console.error('Workflow execution failed:', error);
      
      // Update execution with failure
      const finalExecution = {
        ...execution,
        status: 'failed',
        endTime: Date.now(),
        analytics: {
          ...execution.analytics,
          totalDuration: Date.now() - startTime,
          successRate: execution.analytics.totalSteps > 0 ? 
            (execution.analytics.successfulSteps / execution.analytics.totalSteps) * 100 : 0
        },
        error: error.message
      };

      setWorkflowExecution(finalExecution);
      setExecutionHistory(prev => [finalExecution, ...prev].slice(0, 10));

      setSnackbar({
        open: true,
        message: `Workflow execution failed: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setIsExecuting(false);
      setExecutionProgress(0);
      
      // Reset all node processing states
      setNodes(currentNodes =>
        currentNodes.map(n => ({
          ...n,
          data: {
            ...n.data,
            isProcessing: false
          }
        }))
      );
    }
  };

  // Save workflow
  const saveWorkflow = async () => {
    if (!workflowName.trim()) {
      setSnackbar({ open: true, message: 'Please enter a workflow name', severity: 'warning' });
      return;
    }

    if (nodes.length === 0) {
      setSnackbar({ open: true, message: 'Cannot save empty workflow', severity: 'warning' });
      return;
    }

    try {
      const workflow = {
        name: workflowName.trim(),
        description: `Workflow with ${nodes.length} nodes`,
        nodes,
        edges,
        category: 'custom',
        tags: ['user-created'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Save to localStorage as backup
      localStorage.setItem(`workflow-${Date.now()}`, JSON.stringify(workflow));

      // In a real implementation, this would save to the backend
      // await fetch('/api/ai-workflow/workflows', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(workflow)
      // });

      setSnackbar({ 
        open: true, 
        message: `Workflow "${workflowName}" saved successfully!`, 
        severity: 'success' 
      });
    } catch (error) {
      console.error('Error saving workflow:', error);
      setSnackbar({ 
        open: true, 
        message: 'Failed to save workflow. Please try again.', 
        severity: 'error' 
      });
    }
  };

  // Filter nodes based on search
  const filteredNodes = Object.entries(nodeLibrary).reduce((acc, [category, categoryNodes]) => {
    const filtered = categoryNodes.filter(node => 
      node.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[category] = filtered;
    }
    return acc;
  }, {});

  const tabLabels = ['Nodes', 'Templates', 'Settings'];

  // Handle template selection
  const handleTemplateSelect = (template) => {
    // Clear existing workflow
    setNodes([]);
    setEdges([]);
    
    // Set workflow name from template
    setWorkflowName(template.name);
    
    // Load template nodes and edges if available
    if (template.template_data && template.template_data.nodes) {
      setNodes(template.template_data.nodes);
      setEdges(template.template_data.edges || []);
    }
    
    setSnackbar({ 
      open: true, 
      message: `Template "${template.name}" loaded successfully!`, 
      severity: 'success' 
    });
  };

  // Handle node click for configuration
  const handleNodeClick = (event, node) => {
    event.stopPropagation();
    setSelectedNode(node);
    setConfiguringNode(node);
    setConfigDialog(true);
  };

  // Handle node configuration save
  const handleNodeConfigSave = (updatedNode) => {
    setNodes(nds => nds.map(n => n.id === updatedNode.id ? updatedNode : n));
    setSnackbar({
      open: true,
      message: `${updatedNode.data.label} configuration saved!`,
      severity: 'success'
    });
  };

  // Execution order calculation (simple topological sort)
  const getExecutionOrder = (nodes, edges) => {
    const visited = new Set();
    const visiting = new Set();
    const order = [];

    const visit = (nodeId) => {
      if (visiting.has(nodeId)) return; // Circular dependency
      if (visited.has(nodeId)) return;

      visiting.add(nodeId);
      
      // Visit dependencies first
      const dependencies = edges.filter(edge => edge.target === nodeId);
      dependencies.forEach(edge => visit(edge.source));
      
      visiting.delete(nodeId);
      visited.add(nodeId);
      order.push(nodeId);
    };

    // Start with trigger nodes
    const triggerNodes = nodes.filter(node => node.type === 'trigger');
    triggerNodes.forEach(node => visit(node.id));

    // Visit remaining nodes
    nodes.forEach(node => visit(node.id));

    return order;
  };

  // Execute trigger node
  const executeTriggerNode = async (node) => {
    const config = node.data.config || {};
    
    // Simulate trigger execution
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      type: 'trigger',
      data: {
        triggeredAt: new Date().toISOString(),
        triggerType: config.triggerType || 'manual',
        message: `Trigger "${node.data.label}" activated`
      }
    };
  };

  // Execute AI Agent node with actual AI processing
  const executeAIAgentNode = async (node, previousResults) => {
    const config = node.data.config || {};
    
    try {
      // Get selected documents
      const selectedDocuments = config.selectedDocuments || [];
      
      if (selectedDocuments.length === 0) {
        throw new Error('No documents selected for AI processing');
      }

      // Prepare documents for processing
      const documentsResult = await workflowDocumentService.prepareDocumentsForBatch(
        selectedDocuments.map(doc => doc.id)
      );

      if (!documentsResult.success || documentsResult.documents.length === 0) {
        throw new Error('Failed to prepare documents for AI processing');
      }

      // Process documents with Azure OpenAI
      const aiResult = await azureOpenAIService.processBatchDocuments({
        documents: documentsResult.documents,
        systemPrompt: config.systemPrompt || '',
        userPrompt: config.userPrompt || 'Please analyze this document.',
        model: config.modelType || 'gpt4',
        temperature: config.temperature || 0.7,
        maxTokens: config.maxTokens || 2000,
        outputFormat: config.outputFormat || 'json',
        batchMode: config.documentProcessingMode || 'individual'
      });

      return {
        success: true,
        type: 'aiAgent',
        data: aiResult,
        metadata: {
          documentsProcessed: documentsResult.documents.length,
          model: config.modelType || 'gpt4',
          processedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('AI Agent execution error:', error);
      throw error;
    }
  };

  // Execute action node
  const executeActionNode = async (node, previousResults) => {
    const config = node.data.config || {};
    
    try {
      // Simulate action execution based on type
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      let actionResult;
      
      switch (config.actionType) {
        case 'apiCall':
          actionResult = await executeApiCall(config, previousResults);
          break;
        case 'email':
          actionResult = await sendEmail(config, previousResults);
          break;
        case 'database':
          actionResult = await databaseOperation(config, previousResults);
          break;
        case 'fileOperation':
          actionResult = await fileOperation(config, previousResults);
          break;
        default:
          actionResult = {
            message: `Action "${node.data.label}" executed successfully`,
            data: previousResults
          };
      }

      return {
        success: true,
        type: 'action',
        data: actionResult,
        metadata: {
          actionType: config.actionType,
          executedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('Action execution error:', error);
      throw error;
    }
  };

  // Helper functions for different action types
  const executeApiCall = async (config, previousResults) => {
    // Simulate API call
    return {
      message: `API call to ${config.endpoint || 'unknown endpoint'} completed`,
      response: { status: 'success', data: previousResults }
    };
  };

  const sendEmail = async (config, previousResults) => {
    // Simulate email sending
    return {
      message: `Email sent to ${config.recipients || 'unknown recipients'}`,
      emailsSent: 1
    };
  };

  const databaseOperation = async (config, previousResults) => {
    // Simulate database operation
    return {
      message: 'Database operation completed',
      rowsAffected: 1
    };
  };

  const fileOperation = async (config, previousResults) => {
    // Simulate file operation
    return {
      message: 'File operation completed',
      filesProcessed: 1
    };
  };

  // Handle export results in different formats
  const handleExportResults = (format) => {
    if (!workflowExecution) {
      setSnackbar({
        open: true,
        message: 'No execution results to export',
        severity: 'warning'
      });
      return;
    }

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `workflow-results-${timestamp}`;

      switch (format) {
        case 'json':
          const jsonBlob = new Blob([JSON.stringify(workflowExecution, null, 2)], {
            type: 'application/json'
          });
          downloadFile(jsonBlob, `${filename}.json`);
          break;

        case 'csv':
          const csvData = convertToCsv(workflowExecution);
          const csvBlob = new Blob([csvData], { type: 'text/csv' });
          downloadFile(csvBlob, `${filename}.csv`);
          break;

        case 'pdf':
          const pdfJsonBlob = new Blob([JSON.stringify(workflowExecution, null, 2)], {
            type: 'application/json'
          });
          downloadFile(pdfJsonBlob, `${filename}.json`);
          setSnackbar({
            open: true,
            message: 'PDF export coming soon. Downloaded as JSON for now.',
            severity: 'info'
          });
          break;

        default:
          throw new Error(`Unsupported export format: ${format}`);
      }

      setSnackbar({
        open: true,
        message: `Results exported as ${format.toUpperCase()}`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Export error:', error);
      setSnackbar({
        open: true,
        message: `Export failed: ${error.message}`,
        severity: 'error'
      });
    }
  };

  // Helper function to download files
  const downloadFile = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Convert execution results to CSV format
  const convertToCsv = (execution) => {
    const headers = ['Node Name', 'Type', 'Status', 'Duration (ms)', 'Summary', 'Error'];
    const rows = execution.results.map(result => [
      result.nodeName || 'Unknown',
      result.nodeType || 'Unknown',
      result.status || 'Unknown',
      result.duration || 0,
      (result.summary || '').replace(/,/g, ';'),
      (result.error || '').replace(/,/g, ';')
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  // Handle share results
  const handleShareResults = () => {
    if (!workflowExecution) {
      setSnackbar({
        open: true,
        message: 'No execution results to share',
        severity: 'warning'
      });
      return;
    }

    const shareData = {
      title: `Workflow Results: ${workflowExecution.metadata.workflowName}`,
      text: `Executed ${workflowExecution.analytics.successfulSteps}/${workflowExecution.analytics.totalSteps} steps successfully`,
      url: window.location.href
    };

    if (navigator.share) {
      navigator.share(shareData).then(() => {
        setSnackbar({
          open: true,
          message: 'Results shared successfully',
          severity: 'success'
        });
      }).catch(() => fallbackShare(shareData));
    } else {
      fallbackShare(shareData);
    }
  };

  // Fallback share method
  const fallbackShare = (shareData) => {
    navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`)
      .then(() => {
        setSnackbar({
          open: true,
          message: 'Share link copied to clipboard',
          severity: 'success'
        });
      })
      .catch(() => {
        setSnackbar({
          open: true,
          message: 'Failed to copy share link',
          severity: 'error'
        });
      });
  };

  return (
    <ReactFlowProvider>
      <Box className="workflow-builder" sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Top Toolbar */}
        <Paper elevation={1} sx={{ p: 2, borderRadius: 0, zIndex: 1000 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={2}>
              <Box display="flex" alignItems="center" gap={1}>
                <AutoAwesome sx={{ color: '#667eea', fontSize: '28px' }} />
                <Typography variant="h5" fontWeight="700" color="#667eea">
                  AI Workflow Builder
                </Typography>
              </Box>
              <Chip 
                label="Beta" 
                size="small" 
                sx={{ 
                  backgroundColor: '#667eea', 
                  color: 'white',
                  fontWeight: '600'
                }} 
              />
            </Box>

            <Box display="flex" alignItems="center" gap={1}>
              <TextField
                size="small"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                sx={{ width: 200 }}
                placeholder="Workflow name"
              />
              
              <Tooltip title="Execute Workflow (Ctrl+Enter)">
                <span>
                  <Button
                    variant="contained"
                    startIcon={isExecuting ? <Stop /> : <PlayArrow />}
                    onClick={executeWorkflow}
                    disabled={isExecuting}
                    sx={{
                      background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #45a049 0%, #3d8b40 100%)',
                      }
                    }}
                  >
                    {isExecuting ? 'Stop' : 'Execute'}
                  </Button>
                </span>
              </Tooltip>

              <Tooltip title="Save Workflow (Ctrl+S)">
                <IconButton onClick={saveWorkflow} sx={{ color: '#667eea' }}>
                  <Save />
                </IconButton>
              </Tooltip>

              <Tooltip title="Analytics Dashboard">
                <IconButton onClick={() => setAnalyticsDialog(true)} sx={{ color: '#667eea' }}>
                  <Analytics />
                </IconButton>
              </Tooltip>

              <Tooltip title="Execution Logs">
                <IconButton onClick={() => setRightPanelOpen(!rightPanelOpen)} sx={{ color: '#667eea' }}>
                  <Timeline />
                </IconButton>
              </Tooltip>

              <Tooltip title="Templates">
                <IconButton onClick={() => setTemplateDialog(true)} sx={{ color: '#667eea' }}>
                  <DashboardCustomize />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Execution Progress */}
          {isExecuting && (
            <Box mt={2}>
              <LinearProgress 
                variant="determinate" 
                value={executionProgress}
                sx={{ 
                  height: 6, 
                  borderRadius: 3,
                  backgroundColor: '#e0e0e0',
                  '& .MuiLinearProgress-bar': {
                    background: 'linear-gradient(90deg, #4caf50 0%, #8bc34a 100%)',
                    borderRadius: 3
                  }
                }}
              />
              <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5 }}>
                Executing workflow... {executionProgress}%
              </Typography>
            </Box>
          )}
        </Paper>

        <Box display="flex" flex={1} overflow="hidden">
          {/* Left Panel - Node Library */}
          <Drawer
            variant="persistent"
            anchor="left"
            open={leftPanelOpen}
            sx={{
              width: leftPanelOpen ? 320 : 0,
              flexShrink: 0,
              '& .MuiDrawer-paper': {
                width: 320,
                position: 'relative',
                border: 'none',
                backgroundColor: '#fafafa'
              },
            }}
          >
            <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h6" fontWeight="600">
                  Node Library
                </Typography>
                <IconButton 
                  size="small" 
                  onClick={() => setLeftPanelOpen(false)}
                  sx={{ color: '#666' }}
                >
                  <Close />
                </IconButton>
              </Box>

              <TextField
                size="small"
                placeholder="Search nodes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchRounded sx={{ color: '#666', mr: 1 }} />
                }}
                sx={{ mb: 2 }}
              />

              <Tabs
                value={selectedTab}
                onChange={(e, newValue) => setSelectedTab(newValue)}
                variant="fullWidth"
                sx={{ mb: 2 }}
              >
                {tabLabels.map((label, index) => (
                  <Tab key={index} label={label} />
                ))}
              </Tabs>

              {selectedTab === 0 && (
                <Box flex={1} overflow="auto">
                  {Object.entries(filteredNodes).map(([category, categoryNodes]) => (
                    <Box key={category} mb={3}>
                      <Typography 
                        variant="subtitle2" 
                        fontWeight="600" 
                        color="textSecondary"
                        sx={{ mb: 1, textTransform: 'uppercase', letterSpacing: '0.5px' }}
                      >
                        {category}
                      </Typography>
                      <Grid container spacing={1}>
                        {categoryNodes.map((node) => (
                          <Grid item xs={12} key={node.id}>
                            <motion.div
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <Card
                                sx={{
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  '&:hover': {
                                    boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                                    transform: 'translateY(-2px)'
                                  }
                                }}
                                onClick={() => addNodeToCanvas(node)}
                              >
                                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                  <Box display="flex" alignItems="center" gap={2}>
                                    <Box
                                      sx={{
                                        p: 1,
                                        borderRadius: 2,
                                        backgroundColor: 
                                          node.type === 'aiAgent' ? '#667eea20' :
                                          node.type === 'trigger' ? '#4caf5020' : '#2196f320',
                                        color:
                                          node.type === 'aiAgent' ? '#667eea' :
                                          node.type === 'trigger' ? '#4caf50' : '#2196f3'
                                      }}
                                    >
                                      <node.icon sx={{ fontSize: '20px' }} />
                                    </Box>
                                    <Box flex={1}>
                                      <Typography variant="subtitle2" fontWeight="600">
                                        {node.label}
                                      </Typography>
                                      <Typography variant="caption" color="textSecondary">
                                        {node.description}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </CardContent>
                              </Card>
                            </motion.div>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  ))}
                </Box>
              )}

              {selectedTab === 1 && (
                <Box flex={1} overflow="auto">
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    Quick start with pre-built workflow templates
                  </Typography>
                  {workflowTemplates.map((template) => (
                    <Card key={template.id} sx={{ mb: 2, cursor: 'pointer' }}>
                      <CardContent>
                        <Typography variant="subtitle2" fontWeight="600">
                          {template.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {template.description}
                        </Typography>
                        <Box display="flex" gap={1} mt={1}>
                          <Chip size="small" label={template.difficulty} />
                          <Chip size="small" label={`${template.nodes} nodes`} />
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}

              {selectedTab === 2 && (
                <Box flex={1} overflow="auto">
                  <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 2 }}>
                    Workflow Settings
                  </Typography>
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Auto-save workflow"
                    sx={{ mb: 1 }}
                  />
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Real-time execution"
                    sx={{ mb: 1 }}
                  />
                  <FormControlLabel
                    control={<Switch />}
                    label="Debug mode"
                    sx={{ mb: 1 }}
                  />
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 2 }}>
                    Keyboard Shortcuts
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText 
                        primary="Ctrl+S / Cmd+S"
                        secondary="Save workflow"
                        primaryTypographyProps={{ fontSize: '0.875rem' }}
                        secondaryTypographyProps={{ fontSize: '0.75rem' }}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Ctrl+Enter / Cmd+Enter"
                        secondary="Execute workflow"
                        primaryTypographyProps={{ fontSize: '0.875rem' }}
                        secondaryTypographyProps={{ fontSize: '0.75rem' }}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Delete / Backspace"
                        secondary="Delete selected node"
                        primaryTypographyProps={{ fontSize: '0.875rem' }}
                        secondaryTypographyProps={{ fontSize: '0.75rem' }}
                      />
                    </ListItem>
                  </List>
                </Box>
              )}
            </Box>
          </Drawer>

          {/* Main Canvas */}
          <Box flex={1} position="relative" overflow="hidden">
            {!leftPanelOpen && (
              <Fab
                size="medium"
                onClick={() => setLeftPanelOpen(true)}
                sx={{
                  position: 'absolute',
                  top: 16,
                  left: 16,
                  zIndex: 1000,
                  backgroundColor: '#667eea',
                  color: 'white',
                  '&:hover': { backgroundColor: '#5a67d8' }
                }}
              >
                <Extension />
              </Fab>
            )}

            <div ref={canvasRef} style={{ width: '100%', height: '100%' }}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onInit={setReactFlowInstance}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                connectionLineType={ConnectionLineType.SmoothStep}
                defaultMarkerColor="#667eea"
                fitView
                attributionPosition="bottom-right"
                style={{ backgroundColor: '#f8fafc' }}
                onNodeClick={handleNodeClick}
                onPaneClick={() => setSelectedNode(null)}
                deleteKeyCode={['Backspace', 'Delete']}
                multiSelectionKeyCode={['Meta', 'Ctrl']}
                panOnDrag={[1, 2]}
                selectNodesOnDrag={false}
                connectionMode="loose"
                snapToGrid={true}
                snapGrid={[15, 15]}
              >
              <Background color="#e2e8f0" gap={20} />
              <Controls 
                style={{ 
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }} 
              />
              <MiniMap 
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}
                nodeColor="#667eea"
              />
              </ReactFlow>
            </div>

            {/* Empty State */}
            {nodes.length === 0 && (
              <Box
                position="absolute"
                top="50%"
                left="50%"
                transform="translate(-50%, -50%)"
                textAlign="center"
                sx={{ pointerEvents: 'none' }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <AccountTree sx={{ fontSize: 80, color: '#e2e8f0', mb: 2 }} />
                  <Typography variant="h5" fontWeight="600" color="textSecondary" gutterBottom>
                    Start Building Your AI Workflow
                  </Typography>
                  <Typography variant="body1" color="textSecondary">
                    Drag and drop nodes from the left panel to create your workflow
                  </Typography>
                </motion.div>
              </Box>
            )}
          </Box>

          {/* Right Panel - Analytics */}
          <Drawer
            variant="persistent"
            anchor="right"
            open={rightPanelOpen}
            sx={{
              width: rightPanelOpen ? 320 : 0,
              flexShrink: 0,
              '& .MuiDrawer-paper': {
                width: 320,
                position: 'relative',
                border: 'none',
                backgroundColor: '#fafafa'
              },
            }}
          >
            <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h6" fontWeight="600">
                  Analytics
                </Typography>
                <IconButton 
                  size="small" 
                  onClick={() => setRightPanelOpen(false)}
                  sx={{ color: '#666' }}
                >
                  <Close />
                </IconButton>
              </Box>

              {/* Workflow Stats */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="h4" fontWeight="600" color="primary">
                        {workflowStats.totalRuns}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Total Runs
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="h4" fontWeight="600" color="success.main">
                        {workflowStats.successRate}%
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Success Rate
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Execution Logs */}
              <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 1 }}>
                Execution Logs
              </Typography>
              <Box flex={1} overflow="auto">
                {executionLogs.length > 0 ? (
                  executionLogs.map((log) => (
                    <Card key={log.id} sx={{ mb: 1 }}>
                      <CardContent sx={{ p: 2 }}>
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
                          <Typography variant="caption" color="textSecondary">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          {log.message}
                        </Typography>
                        <Chip size="small" label={log.duration} />
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Box textAlign="center" py={4}>
                    <Timeline sx={{ fontSize: 40, color: '#e2e8f0', mb: 1 }} />
                    <Typography variant="body2" color="textSecondary">
                      No execution logs yet
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Drawer>
        </Box>

        {/* Template Gallery Dialog */}
        <Dialog
          open={templateDialog}
          onClose={() => setTemplateDialog(false)}
          maxWidth="xl"
          fullWidth
          PaperProps={{
            sx: { height: '90vh' }
          }}
        >
          <WorkflowTemplateGallery
            onSelectTemplate={handleTemplateSelect}
            onClose={() => setTemplateDialog(false)}
          />
        </Dialog>

        {/* Analytics Dashboard Dialog */}
        <Dialog
          open={analyticsDialog}
          onClose={() => setAnalyticsDialog(false)}
          maxWidth="xl"
          fullWidth
          PaperProps={{
            sx: { height: '90vh' }
          }}
        >
          <DialogTitle>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="h5" fontWeight="600">
                Workflow Analytics Dashboard
              </Typography>
              <IconButton onClick={() => setAnalyticsDialog(false)}>
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ p: 0 }}>
            <WorkflowAnalyticsDashboard />
          </DialogContent>
        </Dialog>

        {/* Node Configuration Panel */}
        <NodeConfigurationPanel
          open={configDialog}
          onClose={() => {
            setConfigDialog(false);
            setConfiguringNode(null);
          }}
          node={configuringNode}
          onSave={handleNodeConfigSave}
          documents={availableDocuments}
          onRefreshDocuments={fetchDocuments}
          loadingDocuments={loadingDocuments}
        />

        {/* Workflow Results Panel */}
        <WorkflowResultsPanel
          open={resultsDialog}
          onClose={() => setResultsDialog(false)}
          workflowExecution={workflowExecution}
          workflowNodes={nodes}
          onExportResults={handleExportResults}
          onShareResults={handleShareResults}
          onViewEnhancedResults={() => {
            // Force populate enhanced results from execution data if not already present
            if (workflowExecution && enhancedResults.length === 0) {
              const allEnhancedResults = [];
              workflowExecution.results?.forEach(nodeResult => {
                if (nodeResult.aiResults && nodeResult.aiResults.length > 0) {
                  nodeResult.aiResults.forEach(aiResult => {
                    allEnhancedResults.push({
                      id: `${nodeResult.nodeId}-${aiResult.documentId || Date.now()}`,
                      nodeId: nodeResult.nodeId,
                      nodeName: nodeResult.nodeName,
                      documentId: aiResult.documentId || 'unknown',
                      fileName: aiResult.fileName || `Document Analysis`,
                      analysisType: aiResult.analysisType || 'comprehensive',
                      analysis: aiResult.analysis,
                      rawAnalysisData: aiResult.rawAnalysisData || aiResult.analysis,
                      metadata: aiResult.metadata || {},
                      timestamp: new Date().toISOString(),
                      success: aiResult.success !== false,
                      model: aiResult.model || 'gpt4o-mini',
                      processingTime: aiResult.processingTime || nodeResult.duration,
                      confidence: aiResult.confidence || 0.95,
                      enhanced: true,
                      exportable: true
                    });
                  });
                }
              });
              setEnhancedResults(allEnhancedResults);
            }
            // Close standard results and open enhanced results
            setResultsDialog(false);
            setShowEnhancedResults(true);
          }}
        />

        {/* Enhanced Results Panel */}
        <BeautifulEnhancedResultsPanel
          results={enhancedResults}
          open={showEnhancedResults}
          onClose={() => {
            setShowEnhancedResults(false);
            setEnhancedResults([]); // Clear results when closed
          }}
        />

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ReactFlowProvider>
  );
};

export default AIWorkflowBuilder;
