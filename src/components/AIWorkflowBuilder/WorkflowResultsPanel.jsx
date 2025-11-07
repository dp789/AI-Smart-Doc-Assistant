import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  CircularProgress,
  LinearProgress,
  Alert,
  AlertTitle,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Badge
} from '@mui/material';
import {
  Close,
  ExpandMore,
  CheckCircle,
  Error,
  Warning,
  Info,
  PlayArrow,
  Pause,
  Stop,
  Download,
  Share,
  Visibility,
  Code,
  DataObject,
  Analytics,
  Timer,
  Memory,
  Speed,
  TrendingUp,
  Assessment,
  Description,
  Psychology,
  SmartToy,
  Api,
  Storage,
  CloudDownload,
  FileCopy,
  Schedule as TimelineIcon,
  Dashboard,
  BarChart,
  PieChart
} from '@mui/icons-material';

const WorkflowResultsPanel = ({ 
  open, 
  onClose, 
  workflowExecution,
  workflowNodes = [],
  onExportResults,
  onShareResults,
  onViewEnhancedResults
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [expandedStep, setExpandedStep] = useState(null);
  const [showRawData, setShowRawData] = useState(false);

  const execution = workflowExecution || {};
  const results = execution.results || [];
  const metadata = execution.metadata || {};
  const analytics = execution.analytics || {};

  // Get status color and icon
  const getStatusInfo = (status) => {
    switch (status) {
      case 'completed':
        return { color: 'success', icon: <CheckCircle />, label: 'Completed' };
      case 'failed':
        return { color: 'error', icon: <Error />, label: 'Failed' };
      case 'running':
        return { color: 'warning', icon: <PlayArrow />, label: 'Running' };
      case 'paused':
        return { color: 'info', icon: <Pause />, label: 'Paused' };
      default:
        return { color: 'default', icon: <Info />, label: 'Unknown' };
    }
  };

  // Format duration
  const formatDuration = (ms) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  // Get node info by ID
  const getNodeInfo = (nodeId) => {
    return workflowNodes.find(node => node.id === nodeId) || { 
      data: { label: 'Unknown Node', icon: SmartToy } 
    };
  };

  // Render execution timeline using Stepper
  const renderExecutionTimeline = () => (
    <Box sx={{ width: '100%' }}>
      <Stepper orientation="vertical" activeStep={results.length}>
        {results.map((result, index) => {
          const nodeInfo = getNodeInfo(result.nodeId);
          const statusInfo = getStatusInfo(result.status);
          const IconComponent = nodeInfo.data.icon || SmartToy;

          return (
            <Step key={result.nodeId || index} completed={result.status === 'completed'}>
              <StepLabel
                icon={
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: result.status === 'completed' ? 'success.main' : 
                              result.status === 'failed' ? 'error.main' : 'warning.main',
                      color: 'white'
                    }}
                  >
                    <IconComponent sx={{ fontSize: 20 }} />
                  </Box>
                }
              >
                <Box>
                  <Typography variant="h6">
                    {nodeInfo.data.label}
                  </Typography>
                  <Box display="flex" gap={1} mt={1}>
                    <Chip 
                      icon={statusInfo.icon} 
                      label={statusInfo.label}
                      color={statusInfo.color}
                      size="small"
                    />
                    <Chip 
                      label={formatDuration(result.duration)}
                      size="small"
                      variant="outlined"
                    />
                    {result.processed && (
                      <Chip 
                        label={`${result.processed} items`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </Box>
              </StepLabel>
              <StepContent>
                <Card 
                  sx={{ 
                    mt: 2,
                    cursor: 'pointer',
                    border: expandedStep === index ? 2 : 1,
                    borderColor: expandedStep === index ? 'primary.main' : 'divider'
                  }}
                  onClick={() => setExpandedStep(expandedStep === index ? null : index)}
                >
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="subtitle1">
                        Click to view details
                      </Typography>
                      <IconButton size="small">
                        <ExpandMore 
                          sx={{ 
                            transform: expandedStep === index ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.3s'
                          }} 
                        />
                      </IconButton>
                    </Box>
                    
                    {expandedStep === index && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <Divider sx={{ my: 2 }} />
                        
                        {/* Result Summary */}
                        {result.summary && (
                          <Box mb={2}>
                            <Typography variant="subtitle2" gutterBottom>
                              Summary
                            </Typography>
                            <Alert severity="info">
                              <AlertTitle>Execution Summary</AlertTitle>
                              {result.summary}
                            </Alert>
                          </Box>
                        )}

                        {/* AI Analysis Results */}
                        {result.aiResults && result.aiResults.length > 0 && (
                          <Box mb={2}>
                            <Typography variant="subtitle2" gutterBottom>
                              AI Analysis Results
                            </Typography>
                            {result.aiResults.map((aiResult, aiIndex) => (
                              <Card key={aiIndex} variant="outlined" sx={{ mb: 1 }}>
                                <CardContent>
                                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                    <Typography variant="body2" color="primary">
                                      📄 {aiResult.fileName}
                                    </Typography>
                                    <Chip 
                                      label={aiResult.model} 
                                      size="small" 
                                      color="secondary"
                                    />
                                  </Box>
                                  
                                  {/* AI Response */}
                                  <Typography variant="body2" sx={{ mb: 2 }}>
                                    {aiResult.response}
                                  </Typography>

                                  {/* Structured Data */}
                                  {aiResult.structuredData && (
                                    <Box>
                                      <Typography variant="caption" color="textSecondary">
                                        Extracted Data:
                                      </Typography>
                                      <Paper sx={{ p: 1, mt: 1, bgcolor: 'grey.50' }}>
                                        <pre style={{ 
                                          margin: 0, 
                                          fontSize: '12px',
                                          whiteSpace: 'pre-wrap',
                                          maxHeight: '200px',
                                          overflow: 'auto'
                                        }}>
                                          {JSON.stringify(aiResult.structuredData, null, 2)}
                                        </pre>
                                      </Paper>
                                    </Box>
                                  )}

                                  {/* Confidence Score */}
                                  {aiResult.confidence && (
                                    <Box mt={1}>
                                      <Typography variant="caption">
                                        Confidence: {(aiResult.confidence * 100).toFixed(1)}%
                                      </Typography>
                                      <LinearProgress 
                                        variant="determinate" 
                                        value={aiResult.confidence * 100}
                                        sx={{ mt: 0.5 }}
                                      />
                                    </Box>
                                  )}
                                </CardContent>
                              </Card>
                            ))}
                          </Box>
                        )}

                        {/* Processing Details */}
                        {result.details && (
                          <Box mb={2}>
                            <Typography variant="subtitle2" gutterBottom>
                              Processing Details
                            </Typography>
                            <Grid container spacing={2}>
                              <Grid item xs={6}>
                                <Paper sx={{ p: 2 }}>
                                  <Typography variant="body2" color="textSecondary">
                                    Input Size
                                  </Typography>
                                  <Typography variant="h6">
                                    {result.details.inputSize || 'N/A'}
                                  </Typography>
                                </Paper>
                              </Grid>
                              <Grid item xs={6}>
                                <Paper sx={{ p: 2 }}>
                                  <Typography variant="body2" color="textSecondary">
                                    Output Size
                                  </Typography>
                                  <Typography variant="h6">
                                    {result.details.outputSize || 'N/A'}
                                  </Typography>
                                </Paper>
                              </Grid>
                            </Grid>
                          </Box>
                        )}

                        {/* Error Details */}
                        {result.error && (
                          <Alert severity="error">
                            <AlertTitle>Error Details</AlertTitle>
                            {result.error}
                          </Alert>
                        )}
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </StepContent>
            </Step>
          );
        })}
      </Stepper>
    </Box>
  );

  // Render analytics dashboard
  const renderAnalytics = () => (
    <Grid container spacing={3}>
      {/* Performance Metrics */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <Speed sx={{ mr: 1, verticalAlign: 'middle' }} />
              Performance Metrics
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon><Timer /></ListItemIcon>
                <ListItemText 
                  primary="Total Duration" 
                  secondary={formatDuration(analytics.totalDuration)}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><Memory /></ListItemIcon>
                <ListItemText 
                  primary="Memory Usage" 
                  secondary={`${analytics.memoryUsage || 'N/A'} MB`}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><Api /></ListItemIcon>
                <ListItemText 
                  primary="API Calls" 
                  secondary={analytics.apiCalls || 0}
                />
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Grid>

      {/* Success Rate */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <Assessment sx={{ mr: 1, verticalAlign: 'middle' }} />
              Success Rate
            </Typography>
            <Box textAlign="center">
              <CircularProgress 
                variant="determinate" 
                value={analytics.successRate || 0}
                size={100}
                thickness={6}
              />
              <Typography variant="h4" sx={{ mt: 2 }}>
                {(analytics.successRate || 0).toFixed(1)}%
              </Typography>
              <Typography color="textSecondary">
                {analytics.successfulSteps || 0} of {analytics.totalSteps || 0} steps completed
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Document Processing Stats */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <BarChart sx={{ mr: 1, verticalAlign: 'middle' }} />
              Document Processing Statistics
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Document</TableCell>
                    <TableCell>Size</TableCell>
                    <TableCell>Processing Time</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>AI Model</TableCell>
                    <TableCell>Confidence</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(analytics.documentStats || []).map((doc, index) => (
                    <TableRow key={index}>
                      <TableCell>{doc.fileName}</TableCell>
                      <TableCell>{doc.size}</TableCell>
                      <TableCell>{formatDuration(doc.processingTime)}</TableCell>
                      <TableCell>
                        <Chip 
                          label={doc.status} 
                          color={doc.status === 'success' ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{doc.model}</TableCell>
                      <TableCell>{(doc.confidence * 100).toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  // Render export options
  const renderExportOptions = () => (
    <Grid container spacing={2}>
      <Grid item xs={12} md={4}>
        <Card sx={{ textAlign: 'center', p: 2 }}>
          <CloudDownload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Export Results
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            Download workflow results in various formats
          </Typography>
          <Box>
            <Button variant="outlined" sx={{ mr: 1, mb: 1 }} onClick={() => onExportResults?.('json')}>
              JSON
            </Button>
            <Button variant="outlined" sx={{ mr: 1, mb: 1 }} onClick={() => onExportResults?.('csv')}>
              CSV
            </Button>
            <Button variant="outlined" sx={{ mb: 1 }} onClick={() => onExportResults?.('pdf')}>
              PDF
            </Button>
          </Box>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={4}>
        <Card sx={{ textAlign: 'center', p: 2 }}>
          <Share sx={{ fontSize: 48, color: 'secondary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Share Results
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            Share workflow results with team members
          </Typography>
          <Button variant="contained" onClick={() => onShareResults?.()}>
            Generate Share Link
          </Button>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={4}>
        <Card sx={{ textAlign: 'center', p: 2 }}>
          <FileCopy sx={{ fontSize: 48, color: 'info.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Clone Workflow
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            Create a copy of this workflow for reuse
          </Typography>
          <Button variant="outlined">
            Clone Workflow
          </Button>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: '90vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="between" alignItems="center">
          <Box>
            <Typography variant="h5">
              Workflow Execution Results
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {metadata.workflowName || 'Unnamed Workflow'} • Executed {metadata.executedAt ? new Date(metadata.executedAt).toLocaleString() : 'Unknown'}
            </Typography>
          </Box>
          <Box>
            {execution.status && (
              <Chip 
                icon={getStatusInfo(execution.status).icon}
                label={getStatusInfo(execution.status).label}
                color={getStatusInfo(execution.status).color}
                sx={{ mr: 2 }}
              />
            )}
            <IconButton onClick={onClose}>
              <Close />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab 
              icon={<TimelineIcon />} 
              label="Execution Timeline" 
              iconPosition="start"
            />
            <Tab 
              icon={<Analytics />} 
              label="Analytics" 
              iconPosition="start"
            />
            <Tab 
              icon={<Code />} 
              label="Raw Data" 
              iconPosition="start"
            />
            <Tab 
              icon={<Download />} 
              label="Export" 
              iconPosition="start"
            />
          </Tabs>
        </Box>

        {activeTab === 0 && renderExecutionTimeline()}
        {activeTab === 1 && renderAnalytics()}
        {activeTab === 2 && (
          <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
            <pre style={{ 
              margin: 0, 
              fontSize: '12px',
              whiteSpace: 'pre-wrap',
              maxHeight: '500px',
              overflow: 'auto'
            }}>
              {JSON.stringify(workflowExecution, null, 2)}
            </pre>
          </Paper>
        )}
        {activeTab === 3 && renderExportOptions()}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Close
        </Button>
        {onViewEnhancedResults && (
          <Button 
            variant="outlined" 
            onClick={onViewEnhancedResults}
            sx={{ mr: 1 }}
          >
            🤖 View AI Analysis
          </Button>
        )}
        <Button variant="contained" onClick={() => onExportResults?.('json')}>
          <Download sx={{ mr: 1 }} />
          Export Results
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WorkflowResultsPanel;
