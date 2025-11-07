import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Box,
  Chip,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  FormControlLabel,
  Slider,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Divider,
  Paper,
  Grid,
  CircularProgress
} from '@mui/material';
import {
  Close,
  Settings,
  Description,
  Psychology,
  Api,
  Schedule,
  ExpandMore,
  Code,
  DataObject,
  Memory,
  Speed,
  Security,
  Info,
  Warning,
  CheckCircle,
  PlayArrow,
  Save,
  Refresh,
  Tune,
  SmartToy,
  Language,
  Transform,
  Storage,
  Email,
  CloudUpload,
  Search,
  FilterList
} from '@mui/icons-material';
import axios from 'axios';
import envConfig from '../../envConfig';

const NodeConfigurationPanel = ({ 
  open, 
  onClose, 
  node, 
  onSave, 
  documents = [],
  onRefreshDocuments,
  loadingDocuments = false
}) => {
  const [config, setConfig] = useState({});
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [availableDocuments, setAvailableDocuments] = useState(documents);
  const [filteredDocuments, setFilteredDocuments] = useState(documents);
  const [documentSearch, setDocumentSearch] = useState('');

  // Update available documents when documents prop changes
  useEffect(() => {
    console.log('📄 NodeConfigurationPanel received documents:', documents.length);
    setAvailableDocuments(documents);
    setFilteredDocuments(documents);
  }, [documents]);

  // Initialize configuration based on node type
  useEffect(() => {
    if (node) {
      const defaultConfig = getDefaultConfig(node.type, node.data);
      setConfig({ ...defaultConfig, ...node.data.config });
    }
  }, [node]);

  // Filter documents based on search
  useEffect(() => {
    if (documentSearch) {
      const filtered = availableDocuments.filter(doc =>
        doc.fileName?.toLowerCase().includes(documentSearch.toLowerCase()) ||
        doc.category?.toLowerCase().includes(documentSearch.toLowerCase())
      );
      setFilteredDocuments(filtered);
    } else {
      setFilteredDocuments(availableDocuments);
    }
  }, [documentSearch, availableDocuments]);

  const getDefaultConfig = (nodeType, nodeData) => {
    const baseConfig = {
      enabled: true,
      retryAttempts: 3,
      timeout: 30000,
      name: nodeData.label || '',
      description: nodeData.description || ''
    };

    switch (nodeType) {
      case 'trigger':
        return {
          ...baseConfig,
          triggerType: nodeData.id || 'webhook',
          conditions: {},
          schedule: '0 */1 * * *', // Every hour
          watchFolder: '/uploads',
          fileTypes: ['pdf', 'docx', 'txt'],
          batchSize: 10
        };

      case 'aiAgent':
        return {
          ...baseConfig,
          modelType: nodeData.id || 'gpt4o-mini', // Default to GPT-4o mini for S0 subscription
          analysisType: 'comprehensive', // comprehensive, summary, keywords, categorization, sentiment, custom
          temperature: 0.7,
          maxTokens: 2000,
          systemPrompt: getDefaultSystemPrompt(nodeData.id),
          userPrompt: getDefaultUserPrompt(nodeData.id),
          selectedDocuments: [],
          documentProcessingMode: 'individual', // 'individual' or 'batch'
          outputFormat: 'json',
          includeMetadata: true,
          confidenceThreshold: 0.8,
          includeKeywords: true,
          includeSentiment: true,
          includeCategorization: true,
          includeSummary: true,
          enableExport: true
        };

      case 'action':
        return {
          ...baseConfig,
          actionType: nodeData.id || 'apiCall',
          endpoint: '',
          method: 'POST',
          headers: {},
          dataMapping: {},
          successConditions: {},
          errorHandling: 'continue'
        };

      default:
        return baseConfig;
    }
  };

  const getDefaultSystemPrompt = (modelId) => {
    const prompts = {
      gpt4: `You are an advanced document analysis assistant. Your task is to analyze documents and provide structured, comprehensive insights.

Key responsibilities:
- Extract key information, themes, and insights from documents
- Provide accurate summaries and analysis
- Identify important entities, dates, and relationships
- Maintain context and provide relevant recommendations
- Format responses in clear, structured JSON when requested

Always be thorough, accurate, and provide actionable insights.`,

      claude: `You are Claude, an AI assistant specialized in document analysis and content processing.

Your capabilities include:
- Comprehensive document summarization
- Content analysis and insight extraction
- Entity recognition and relationship mapping
- Structured data extraction
- Quality assessment and recommendations

Provide detailed, well-structured responses that help users understand their documents better.`,

      gemini: `You are Gemini, Google's advanced AI model for document processing and analysis.

Focus areas:
- Multi-modal document understanding
- Advanced pattern recognition
- Comprehensive content analysis
- Structured output generation
- Context-aware recommendations

Deliver precise, comprehensive analysis with clear explanations.`
    };

    return prompts[modelId] || prompts.gpt4;
  };

  const getDefaultUserPrompt = (modelId) => {
    const prompts = {
      gpt4: `Please analyze the following document and provide a comprehensive analysis:

Document: {DOCUMENT_CONTENT}

Please provide:
1. Executive Summary (2-3 sentences)
2. Key Themes and Topics
3. Important Entities (people, organizations, dates, locations)
4. Main Insights and Findings
5. Actionable Recommendations
6. Document Classification/Type
7. Sentiment Analysis (if applicable)
8. Quality Score (1-10) with explanation

Format your response as structured JSON with clear sections.`,

      claude: `Analyze this document comprehensively:

{DOCUMENT_CONTENT}

Provide detailed analysis including:
- Summary and key points
- Thematic analysis
- Entity extraction
- Insights and implications
- Recommendations for action
- Document metadata assessment

Structure your response clearly with headings and bullet points.`,

      gemini: `Perform advanced analysis on this document:

{DOCUMENT_CONTENT}

Analysis requirements:
- Comprehensive summary
- Pattern identification
- Entity and relationship mapping
- Content quality assessment
- Strategic insights
- Next steps recommendations

Provide structured, actionable output.`
    };

    return prompts[modelId] || prompts.gpt4;
  };

  const handleConfigChange = (key, value) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = () => {
    const updatedNode = {
      ...node,
      data: {
        ...node.data,
        config: config
      }
    };
    onSave(updatedNode);
    onClose();
  };

  const handleTestConfiguration = async () => {
    setLoading(true);
    setTestResult(null);

    try {
      // Test the configuration based on node type
      let testResponse;

      switch (node.type) {
        case 'aiAgent':
          testResponse = await testAIAgent();
          break;
        case 'trigger':
          testResponse = await testTrigger();
          break;
        case 'action':
          testResponse = await testAction();
          break;
        default:
          testResponse = { success: true, message: 'Configuration looks good!' };
      }

      setTestResult(testResponse);
    } catch (error) {
      setTestResult({
        success: false,
        message: error.message || 'Test failed'
      });
    } finally {
      setLoading(false);
    }
  };

  const testAIAgent = async () => {
    // Test AI agent with a sample document or prompt
    const testPrompt = config.userPrompt?.replace('{DOCUMENT_CONTENT}', 'This is a test document for configuration validation.');
    
    try {
      // Use your existing webhook endpoint or create a new test endpoint
      const response = await axios.post('/api/ai-workflow/test-ai-agent', {
        modelType: config.modelType,
        systemPrompt: config.systemPrompt,
        userPrompt: testPrompt,
        temperature: config.temperature,
        maxTokens: config.maxTokens
      });

      return {
        success: true,
        message: 'AI Agent configuration tested successfully!',
        details: response.data
      };
    } catch (error) {
      throw new Error(`AI Agent test failed: ${error.message}`);
    }
  };

  const testTrigger = async () => {
    // Validate trigger configuration
    const issues = [];

    if (config.triggerType === 'schedule' && !config.schedule) {
      issues.push('Schedule expression is required');
    }

    if (config.triggerType === 'fileWatcher' && !config.watchFolder) {
      issues.push('Watch folder path is required');
    }

    if (issues.length > 0) {
      throw new Error(issues.join(', '));
    }

    return {
      success: true,
      message: 'Trigger configuration is valid!'
    };
  };

  const testAction = async () => {
    // Test action configuration
    if (config.actionType === 'apiCall' && !config.endpoint) {
      throw new Error('API endpoint is required');
    }

    return {
      success: true,
      message: 'Action configuration is valid!'
    };
  };

  const renderTriggerConfig = () => (
    <Box>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Trigger Type</InputLabel>
        <Select
          value={config.triggerType || ''}
          onChange={(e) => handleConfigChange('triggerType', e.target.value)}
          label="Trigger Type"
        >
          <MenuItem value="webhook">Webhook</MenuItem>
          <MenuItem value="schedule">Schedule</MenuItem>
          <MenuItem value="fileWatcher">File Watcher</MenuItem>
          <MenuItem value="documentUpload">Document Upload</MenuItem>
        </Select>
      </FormControl>

      {config.triggerType === 'schedule' && (
        <TextField
          fullWidth
          label="Cron Schedule Expression"
          value={config.schedule || ''}
          onChange={(e) => handleConfigChange('schedule', e.target.value)}
          helperText="Example: 0 */1 * * * (every hour)"
          sx={{ mb: 2 }}
        />
      )}

      {config.triggerType === 'fileWatcher' && (
        <>
          <TextField
            fullWidth
            label="Watch Folder Path"
            value={config.watchFolder || ''}
            onChange={(e) => handleConfigChange('watchFolder', e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="File Types (comma-separated)"
            value={config.fileTypes?.join(', ') || ''}
            onChange={(e) => handleConfigChange('fileTypes', e.target.value.split(',').map(t => t.trim()))}
            helperText="Example: pdf, docx, txt"
            sx={{ mb: 2 }}
          />
        </>
      )}

      <TextField
        fullWidth
        type="number"
        label="Batch Size"
        value={config.batchSize || 10}
        onChange={(e) => handleConfigChange('batchSize', parseInt(e.target.value))}
        helperText="Number of items to process in each batch"
        sx={{ mb: 2 }}
      />
    </Box>
  );

  const renderAIAgentConfig = () => (
    <Box>
      <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 3 }}>
        <Tab label="Model Settings" />
        <Tab label="Prompts" />
        <Tab label="Documents" />
        <Tab label="Output" />
      </Tabs>

      {activeTab === 0 && (
        <Box>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>AI Model</InputLabel>
            <Select
              value={config.modelType || 'gpt4o-mini'}
              onChange={(e) => handleConfigChange('modelType', e.target.value)}
              label="AI Model"
            >
              <MenuItem value="gpt4o-mini">
                <Box>
                  <Typography variant="body1">GPT-4o Mini</Typography>
                  <Typography variant="caption" color="textSecondary">
                    ✅ Best for S0 subscription - Cost effective & rate-limit friendly
                  </Typography>
                </Box>
              </MenuItem>
              <MenuItem value="gpt4.1">
                <Box>
                  <Typography variant="body1">GPT-4.1</Typography>
                  <Typography variant="caption" color="textSecondary">
                    Latest GPT-4 version - Higher performance
                  </Typography>
                </Box>
              </MenuItem>
              <MenuItem value="gpt4">
                <Box>
                  <Typography variant="body1">GPT-4</Typography>
                  <Typography variant="caption" color="warning.main">
                    ⚠️ May hit rate limits with S0 subscription
                  </Typography>
                </Box>
              </MenuItem>
              <MenuItem value="gpt4-turbo">
                <Box>
                  <Typography variant="body1">GPT-4 Turbo</Typography>
                  <Typography variant="caption" color="warning.main">
                    ⚠️ May hit rate limits with S0 subscription
                  </Typography>
                </Box>
              </MenuItem>
              <MenuItem value="gpt35">GPT-3.5 Turbo (Fallback)</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Analysis Type</InputLabel>
            <Select
              value={config.analysisType || 'comprehensive'}
              onChange={(e) => handleConfigChange('analysisType', e.target.value)}
              label="Analysis Type"
            >
              <MenuItem value="comprehensive">
                <Box>
                  <Typography variant="body1">🔍 Comprehensive Analysis</Typography>
                  <Typography variant="caption" color="textSecondary">
                    Complete document analysis with summary, keywords, sentiment, and categorization
                  </Typography>
                </Box>
              </MenuItem>
              <MenuItem value="summary">
                <Box>
                  <Typography variant="body1">📄 Summary Only</Typography>
                  <Typography variant="caption" color="textSecondary">
                    Generate executive and detailed summaries with key points
                  </Typography>
                </Box>
              </MenuItem>
              <MenuItem value="keywords">
                <Box>
                  <Typography variant="body1">🏷️ Keywords Extraction</Typography>
                  <Typography variant="caption" color="textSecondary">
                    Extract primary keywords, technical terms, and entities
                  </Typography>
                </Box>
              </MenuItem>
              <MenuItem value="categorization">
                <Box>
                  <Typography variant="body1">📂 Document Categorization</Typography>
                  <Typography variant="caption" color="textSecondary">
                    Classify document type, industry, and purpose
                  </Typography>
                </Box>
              </MenuItem>
              <MenuItem value="sentiment">
                <Box>
                  <Typography variant="body1">😊 Sentiment Analysis</Typography>
                  <Typography variant="caption" color="textSecondary">
                    Analyze emotional tone, sentiment, and subjective elements
                  </Typography>
                </Box>
              </MenuItem>
              <MenuItem value="custom">
                <Box>
                  <Typography variant="body1">⚙️ Custom Analysis</Typography>
                  <Typography variant="caption" color="textSecondary">
                    Use custom prompts for specialized analysis
                  </Typography>
                </Box>
              </MenuItem>
            </Select>
          </FormControl>

          {config.analysisType === 'comprehensive' && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Analysis Components:
              </Typography>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={config.includeKeywords !== false}
                    onChange={(e) => handleConfigChange('includeKeywords', e.target.checked)}
                  />
                }
                label="Include Keywords Extraction"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={config.includeSentiment !== false}
                    onChange={(e) => handleConfigChange('includeSentiment', e.target.checked)}
                  />
                }
                label="Include Sentiment Analysis"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={config.includeCategorization !== false}
                    onChange={(e) => handleConfigChange('includeCategorization', e.target.checked)}
                  />
                }
                label="Include Categorization"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={config.includeSummary !== false}
                    onChange={(e) => handleConfigChange('includeSummary', e.target.checked)}
                  />
                }
                label="Include Summary"
              />
            </Box>
          )}

          <Typography gutterBottom>Temperature: {config.temperature}</Typography>
          <Slider
            value={config.temperature || 0.7}
            onChange={(e, v) => handleConfigChange('temperature', v)}
            min={0}
            max={2}
            step={0.1}
            marks={[
              { value: 0, label: 'Focused' },
              { value: 1, label: 'Balanced' },
              { value: 2, label: 'Creative' }
            ]}
            sx={{ mb: 3 }}
          />

          <TextField
            fullWidth
            type="number"
            label="Max Tokens"
            value={config.maxTokens || 2000}
            onChange={(e) => handleConfigChange('maxTokens', parseInt(e.target.value))}
            helperText="Maximum number of tokens in the response"
            sx={{ mb: 2 }}
          />

          <Typography gutterBottom>Confidence Threshold: {config.confidenceThreshold}</Typography>
          <Slider
            value={config.confidenceThreshold || 0.8}
            onChange={(e, v) => handleConfigChange('confidenceThreshold', v)}
            min={0}
            max={1}
            step={0.1}
            marks={[
              { value: 0.5, label: 'Low' },
              { value: 0.8, label: 'High' },
              { value: 0.95, label: 'Very High' }
            ]}
            sx={{ mb: 2 }}
          />
        </Box>
      )}

      {activeTab === 1 && (
        <Box>
          <TextField
            fullWidth
            multiline
            rows={6}
            label="System Prompt"
            value={config.systemPrompt || ''}
            onChange={(e) => handleConfigChange('systemPrompt', e.target.value)}
            helperText="Instructions for the AI model's behavior and personality"
            sx={{ mb: 3 }}
          />

          <TextField
            fullWidth
            multiline
            rows={8}
            label="User Prompt Template"
            value={config.userPrompt || ''}
            onChange={(e) => handleConfigChange('userPrompt', e.target.value)}
            helperText="Use {DOCUMENT_CONTENT} placeholder for document content"
            sx={{ mb: 2 }}
          />

          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Available placeholders:</strong><br />
              • {'{DOCUMENT_CONTENT}'} - The full document text<br />
              • {'{FILE_NAME}'} - Original file name<br />
              • {'{UPLOAD_DATE}'} - Document upload date<br />
              • {'{CATEGORY}'} - Document category<br />
              • {'{FILE_SIZE}'} - File size in readable format
            </Typography>
          </Alert>
        </Box>
      )}

      {activeTab === 2 && (
        <Box>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <TextField
              placeholder="Search documents..."
              value={documentSearch}
              onChange={(e) => setDocumentSearch(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
              }}
              sx={{ flex: 1 }}
            />
            <Button
              startIcon={<Refresh />}
              onClick={onRefreshDocuments}
              variant="outlined"
            >
              Refresh
            </Button>
          </Box>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Processing Mode</InputLabel>
            <Select
              value={config.documentProcessingMode || 'individual'}
              onChange={(e) => handleConfigChange('documentProcessingMode', e.target.value)}
              label="Processing Mode"
            >
              <MenuItem value="individual">Process Each Document Separately</MenuItem>
              <MenuItem value="batch">Process All Documents Together</MenuItem>
              <MenuItem value="summary">Create Combined Summary</MenuItem>
            </Select>
          </FormControl>

          <Typography variant="h6" gutterBottom>
            Select Documents ({config.selectedDocuments?.length || 0} selected)
          </Typography>

          <Paper sx={{ maxHeight: 300, overflow: 'auto', border: '1px solid #e0e0e0' }}>
            {loadingDocuments ? (
              <Box display="flex" justifyContent="center" alignItems="center" p={3}>
                <CircularProgress size={24} />
                <Typography variant="body2" sx={{ ml: 2 }}>Loading documents...</Typography>
              </Box>
            ) : filteredDocuments.length === 0 ? (
              <Box p={3} textAlign="center">
                <Info color="info" sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                <Typography variant="h6" gutterBottom>
                  No Documents Found
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  {documentSearch 
                    ? "No documents match your search criteria. Try adjusting your search or clear the search field."
                    : "No documents are available. Please make sure you have uploaded documents and are properly logged in."}
                </Typography>
                <Box mt={2}>
                  <Button
                    variant="contained"
                    onClick={onRefreshDocuments}
                    startIcon={<Refresh />}
                    sx={{ 
                      mr: 1,
                      backgroundColor: '#1976d2',
                      color: '#ffffff',
                      '&:hover': {
                        backgroundColor: '#1565c0'
                      }
                    }}
                  >
                    Refresh Documents
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      // Debug function to test document access
                      console.log('🔍 Testing document access...');
                      import('../../services/workflowDocumentService').then(service => {
                        const serviceInstance = new service.default();
                        serviceInstance.fetchDocuments().then(result => {
                          console.log('📄 Document fetch result:', result);
                          alert(`Found ${result.documents?.length || 0} documents. Check console for details.`);
                        });
                      });
                    }}
                    size="small"
                    sx={{
                      borderColor: '#1976d2',
                      color: '#1976d2',
                      '&:hover': {
                        borderColor: '#1565c0',
                        color: '#1565c0',
                        backgroundColor: '#f5f5f5'
                      }
                    }}
                  >
                    Debug Access
                  </Button>
                </Box>
              </Box>
            ) : (
              <List>
                {filteredDocuments.map((doc) => (
                  <ListItem
                    key={doc.id || doc.documentGuid}
                    button
                    onClick={() => {
                      const docId = doc.id || doc.documentGuid;
                      const selectedDocs = config.selectedDocuments || [];
                      const isSelected = selectedDocs.some(d => d.id === docId);
                      
                      if (isSelected) {
                        handleConfigChange('selectedDocuments', selectedDocs.filter(d => d.id !== docId));
                      } else {
                        handleConfigChange('selectedDocuments', [...selectedDocs, {
                          id: docId,
                          fileName: doc.fileName,
                          category: doc.category,
                          size: doc.size,
                          uploadDate: doc.uploadDate
                        }]);
                      }
                    }}
                  >
                    <ListItemIcon>
                      <Checkbox
                        checked={config.selectedDocuments?.some(d => d.id === (doc.id || doc.documentGuid)) || false}
                      />
                    </ListItemIcon>
                    <ListItemIcon>
                      <Description color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={doc.fileName}
                      secondary={
                        <Box>
                          <Typography variant="caption" display="block">
                            Category: {doc.category || 'Uncategorized'}
                          </Typography>
                          <Typography variant="caption" display="block">
                            Status: {doc.uploadStatus || 'Unknown'} • Size: {doc.size || 'Unknown'}
                          </Typography>
                          <Typography variant="caption" display="block">
                            Uploaded: {doc.uploadDate ? new Date(doc.uploadDate).toLocaleDateString() : 'Unknown'}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Box>
      )}

      {activeTab === 3 && (
        <Box>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Output Format</InputLabel>
            <Select
              value={config.outputFormat || 'json'}
              onChange={(e) => handleConfigChange('outputFormat', e.target.value)}
              label="Output Format"
            >
              <MenuItem value="json">Structured JSON</MenuItem>
              <MenuItem value="markdown">Markdown</MenuItem>
              <MenuItem value="text">Plain Text</MenuItem>
              <MenuItem value="html">HTML</MenuItem>
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Switch
                checked={config.includeMetadata || false}
                onChange={(e) => handleConfigChange('includeMetadata', e.target.checked)}
              />
            }
            label="Include Document Metadata"
            sx={{ mb: 2 }}
          />

          <FormControlLabel
            control={
              <Switch
                checked={config.streamResponse || false}
                onChange={(e) => handleConfigChange('streamResponse', e.target.checked)}
              />
            }
            label="Stream Response (Real-time)"
            sx={{ mb: 2 }}
          />
        </Box>
      )}
    </Box>
  );

  const renderActionConfig = () => (
    <Box>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Action Type</InputLabel>
        <Select
          value={config.actionType || ''}
          onChange={(e) => handleConfigChange('actionType', e.target.value)}
          label="Action Type"
        >
          <MenuItem value="apiCall">API Call</MenuItem>
          <MenuItem value="database">Database Operation</MenuItem>
          <MenuItem value="email">Send Email</MenuItem>
          <MenuItem value="fileOperation">File Operation</MenuItem>
          <MenuItem value="dataTransform">Data Transformation</MenuItem>
        </Select>
      </FormControl>

      {config.actionType === 'apiCall' && (
        <>
          <TextField
            fullWidth
            label="API Endpoint"
            value={config.endpoint || ''}
            onChange={(e) => handleConfigChange('endpoint', e.target.value)}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>HTTP Method</InputLabel>
            <Select
              value={config.method || 'POST'}
              onChange={(e) => handleConfigChange('method', e.target.value)}
              label="HTTP Method"
            >
              <MenuItem value="GET">GET</MenuItem>
              <MenuItem value="POST">POST</MenuItem>
              <MenuItem value="PUT">PUT</MenuItem>
              <MenuItem value="PATCH">PATCH</MenuItem>
              <MenuItem value="DELETE">DELETE</MenuItem>
            </Select>
          </FormControl>
        </>
      )}

      {config.actionType === 'email' && (
        <>
          <TextField
            fullWidth
            label="Recipients (comma-separated)"
            value={config.recipients || ''}
            onChange={(e) => handleConfigChange('recipients', e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Subject Template"
            value={config.subject || ''}
            onChange={(e) => handleConfigChange('subject', e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Email Body Template"
            value={config.body || ''}
            onChange={(e) => handleConfigChange('body', e.target.value)}
            sx={{ mb: 2 }}
          />
        </>
      )}
    </Box>
  );

  const renderGeneralConfig = () => (
    <Box>
      <TextField
        fullWidth
        label="Node Name"
        value={config.name || ''}
        onChange={(e) => handleConfigChange('name', e.target.value)}
        sx={{ mb: 2 }}
      />

      <TextField
        fullWidth
        multiline
        rows={3}
        label="Description"
        value={config.description || ''}
        onChange={(e) => handleConfigChange('description', e.target.value)}
        sx={{ mb: 2 }}
      />

      <TextField
        fullWidth
        type="number"
        label="Retry Attempts"
        value={config.retryAttempts || 3}
        onChange={(e) => handleConfigChange('retryAttempts', parseInt(e.target.value))}
        sx={{ mb: 2 }}
      />

      <TextField
        fullWidth
        type="number"
        label="Timeout (milliseconds)"
        value={config.timeout || 30000}
        onChange={(e) => handleConfigChange('timeout', parseInt(e.target.value))}
        sx={{ mb: 2 }}
      />

      <FormControlLabel
        control={
          <Switch
            checked={config.enabled !== false}
            onChange={(e) => handleConfigChange('enabled', e.target.checked)}
          />
        }
        label="Node Enabled"
        sx={{ mb: 2 }}
      />
    </Box>
  );

  if (!node) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { height: '90vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            {React.createElement(node.data.icon || Settings, { color: 'primary' })}
            <Box>
              <Typography variant="h6">Configure {node.data.label}</Typography>
              <Typography variant="caption" color="textSecondary">
                {node.type} • ID: {node.id}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 3 }}>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box display="flex" alignItems="center" gap={1}>
                <Tune />
                <Typography variant="h6">General Settings</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {renderGeneralConfig()}
            </AccordionDetails>
          </Accordion>

          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box display="flex" alignItems="center" gap={1}>
                {node.type === 'aiAgent' && <Psychology />}
                {node.type === 'trigger' && <Schedule />}
                {node.type === 'action' && <Api />}
                <Typography variant="h6">
                  {node.type === 'aiAgent' && 'AI Model Configuration'}
                  {node.type === 'trigger' && 'Trigger Configuration'}
                  {node.type === 'action' && 'Action Configuration'}
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {node.type === 'aiAgent' && renderAIAgentConfig()}
              {node.type === 'trigger' && renderTriggerConfig()}
              {node.type === 'action' && renderActionConfig()}
            </AccordionDetails>
          </Accordion>

          {testResult && (
            <Alert 
              severity={testResult.success ? 'success' : 'error'} 
              sx={{ mt: 2 }}
            >
              {testResult.message}
              {testResult.details && (
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  {JSON.stringify(testResult.details, null, 2)}
                </Typography>
              )}
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button
          onClick={handleTestConfiguration}
          disabled={loading}
          startIcon={<PlayArrow />}
          variant="outlined"
        >
          {loading ? 'Testing...' : 'Test Config'}
        </Button>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={loading}
          startIcon={<Save />}
        >
          Save Configuration
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NodeConfigurationPanel;
