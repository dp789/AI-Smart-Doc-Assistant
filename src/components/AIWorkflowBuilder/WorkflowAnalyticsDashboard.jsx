import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  useTheme
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Speed,
  CheckCircle,
  Error,
  Warning,
  Timer,
  Storage,
  Psychology,
  Api,
  Schedule,
  PlayArrow,
  Stop,
  Refresh,
  Download,
  Share,
  Timeline,
  Analytics,
  MonetizationOn,
  Insights
} from '@mui/icons-material';

// Mock analytics data
const generateMockData = () => ({
  overview: {
    total_workflows: 15,
    active_workflows: 12,
    total_executions: 1247,
    success_rate: 94.2,
    avg_execution_time: 2.3, // seconds
    data_processed: 45.2, // GB
    cost_saved: 2450, // USD
    error_rate: 5.8
  },
  execution_trends: [
    { date: '2024-01-15', executions: 45, success_rate: 92.1, avg_time: 2.1 },
    { date: '2024-01-16', executions: 52, success_rate: 94.3, avg_time: 2.3 },
    { date: '2024-01-17', executions: 61, success_rate: 96.7, avg_time: 1.9 },
    { date: '2024-01-18', executions: 48, success_rate: 93.8, avg_time: 2.5 },
    { date: '2024-01-19', executions: 55, success_rate: 95.2, avg_time: 2.2 },
    { date: '2024-01-20', executions: 67, success_rate: 97.1, avg_time: 2.0 },
    { date: '2024-01-21', executions: 59, success_rate: 94.5, avg_time: 2.4 }
  ],
  popular_nodes: [
    { name: 'GPT-4 Agent', usage_count: 234, success_rate: 97.1, avg_time: 3.2, category: 'AI' },
    { name: 'Document Parser', usage_count: 189, success_rate: 94.7, avg_time: 1.1, category: 'Action' },
    { name: 'Data Transformer', usage_count: 156, success_rate: 98.2, avg_time: 0.8, category: 'Action' },
    { name: 'Email Sender', usage_count: 143, success_rate: 99.1, avg_time: 0.5, category: 'Action' },
    { name: 'Claude Agent', usage_count: 98, success_rate: 95.8, avg_time: 2.8, category: 'AI' },
    { name: 'Webhook Trigger', usage_count: 87, success_rate: 99.5, avg_time: 0.1, category: 'Trigger' },
    { name: 'Schedule Trigger', usage_count: 76, success_rate: 98.7, avg_time: 0.1, category: 'Trigger' }
  ],
  workflow_performance: [
    {
      id: 'wf-001',
      name: 'Document Analysis Pipeline',
      executions: 156,
      success_rate: 96.8,
      avg_time: 2.1,
      last_run: '2024-01-21T14:30:00Z',
      status: 'active',
      cost_per_run: 0.12,
      nodes: 7
    },
    {
      id: 'wf-002',
      name: 'Customer Support Bot',
      executions: 234,
      success_rate: 94.2,
      avg_time: 1.8,
      last_run: '2024-01-21T15:45:00Z',
      status: 'active',
      cost_per_run: 0.08,
      nodes: 8
    },
    {
      id: 'wf-003',
      name: 'Data Enrichment Flow',
      executions: 89,
      success_rate: 98.9,
      avg_time: 3.4,
      last_run: '2024-01-21T13:20:00Z',
      status: 'active',
      cost_per_run: 0.15,
      nodes: 12
    }
  ],
  recent_executions: [
    {
      id: 'exec-001',
      workflow_name: 'Document Analysis Pipeline',
      status: 'completed',
      duration: 2.1,
      timestamp: '2024-01-21T15:30:00Z',
      input_size: '2.1 MB',
      output_size: '450 KB',
      cost: 0.12
    },
    {
      id: 'exec-002',
      workflow_name: 'Customer Support Bot',
      status: 'completed',
      duration: 1.7,
      timestamp: '2024-01-21T15:28:00Z',
      input_size: '150 KB',
      output_size: '45 KB',
      cost: 0.08
    },
    {
      id: 'exec-003',
      workflow_name: 'Data Enrichment Flow',
      status: 'failed',
      duration: 0.8,
      timestamp: '2024-01-21T15:25:00Z',
      input_size: '5.2 MB',
      output_size: '0 KB',
      cost: 0.04,
      error: 'API rate limit exceeded'
    }
  ],
  resource_usage: {
    cpu_usage: 45.2,
    memory_usage: 62.8,
    storage_usage: 78.1,
    api_calls: 12456,
    bandwidth_used: 15.7 // GB
  }
});

const WorkflowAnalyticsDashboard = () => {
  const theme = useTheme();
  const [timeRange, setTimeRange] = useState('7d');
  const [analyticsData, setAnalyticsData] = useState(generateMockData());
  const [refreshing, setRefreshing] = useState(false);

  // Simulate data refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setAnalyticsData(generateMockData());
    setRefreshing(false);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle sx={{ color: '#4caf50', fontSize: 20 }} />;
      case 'failed':
        return <Error sx={{ color: '#f44336', fontSize: 20 }} />;
      case 'running':
        return <Timer sx={{ color: '#ff9800', fontSize: 20 }} />;
      default:
        return <Warning sx={{ color: '#757575', fontSize: 20 }} />;
    }
  };

  const getNodeIcon = (category) => {
    switch (category) {
      case 'AI':
        return <Psychology sx={{ color: '#9c27b0', fontSize: 20 }} />;
      case 'Action':
        return <Api sx={{ color: '#2196f3', fontSize: 20 }} />;
      case 'Trigger':
        return <Schedule sx={{ color: '#4caf50', fontSize: 20 }} />;
      default:
        return <Analytics sx={{ color: '#757575', fontSize: 20 }} />;
    }
  };

  const formatDuration = (seconds) => {
    return `${seconds.toFixed(1)}s`;
  };

  const formatCurrency = (amount) => {
    return `$${amount.toLocaleString()}`;
  };

  const formatPercentage = (value) => {
    return `${value.toFixed(1)}%`;
  };

  const formatFileSize = (bytes, unit = 'MB') => {
    return `${bytes} ${unit}`;
  };

  return (
    <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="700" color="primary" gutterBottom>
            Workflow Analytics
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Monitor performance, track costs, and optimize your AI workflows
          </Typography>
        </Box>
        
        <Box display="flex" gap={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              label="Time Range"
            >
              <MenuItem value="24h">Last 24 Hours</MenuItem>
              <MenuItem value="7d">Last 7 Days</MenuItem>
              <MenuItem value="30d">Last 30 Days</MenuItem>
              <MenuItem value="90d">Last 90 Days</MenuItem>
            </Select>
          </FormControl>
          
          <Tooltip title="Refresh Data">
            <IconButton 
              onClick={handleRefresh} 
              disabled={refreshing}
              sx={{ 
                backgroundColor: 'primary.main', 
                color: 'white',
                '&:hover': { backgroundColor: 'primary.dark' }
              }}
            >
              <Refresh sx={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            </IconButton>
          </Tooltip>

          <Button startIcon={<Download />} variant="outlined">
            Export
          </Button>
        </Box>
      </Box>

      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h4" fontWeight="700">
                      {analyticsData.overview.total_workflows}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Total Workflows
                    </Typography>
                  </Box>
                  <Timeline sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
                <Box display="flex" alignItems="center" mt={1}>
                  <TrendingUp sx={{ fontSize: 16, mr: 0.5 }} />
                  <Typography variant="caption">
                    {analyticsData.overview.active_workflows} active
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card sx={{ background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)', color: 'white' }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h4" fontWeight="700">
                      {formatPercentage(analyticsData.overview.success_rate)}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Success Rate
                    </Typography>
                  </Box>
                  <CheckCircle sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
                <Box display="flex" alignItems="center" mt={1}>
                  <TrendingUp sx={{ fontSize: 16, mr: 0.5 }} />
                  <Typography variant="caption">
                    +2.3% from last week
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card sx={{ background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)', color: 'white' }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h4" fontWeight="700">
                      {formatDuration(analyticsData.overview.avg_execution_time)}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Avg. Execution Time
                    </Typography>
                  </Box>
                  <Speed sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
                <Box display="flex" alignItems="center" mt={1}>
                  <TrendingDown sx={{ fontSize: 16, mr: 0.5 }} />
                  <Typography variant="caption">
                    -0.4s improved
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card sx={{ background: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)', color: 'white' }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h4" fontWeight="700">
                      {formatCurrency(analyticsData.overview.cost_saved)}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Cost Saved
                    </Typography>
                  </Box>
                  <MonetizationOn sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
                <Box display="flex" alignItems="center" mt={1}>
                  <TrendingUp sx={{ fontSize: 16, mr: 0.5 }} />
                  <Typography variant="caption">
                    vs manual processes
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Workflow Performance Table */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="600" gutterBottom>
                Workflow Performance
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Workflow</TableCell>
                      <TableCell>Executions</TableCell>
                      <TableCell>Success Rate</TableCell>
                      <TableCell>Avg. Time</TableCell>
                      <TableCell>Cost/Run</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analyticsData.workflow_performance.map((workflow) => (
                      <TableRow key={workflow.id} hover>
                        <TableCell>
                          <Box>
                            <Typography variant="subtitle2" fontWeight="600">
                              {workflow.name}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {workflow.nodes} nodes
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="600">
                            {workflow.executions}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <LinearProgress
                              variant="determinate"
                              value={workflow.success_rate}
                              sx={{ 
                                width: 60, 
                                height: 6, 
                                borderRadius: 3,
                                backgroundColor: '#e0e0e0',
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: workflow.success_rate > 95 ? '#4caf50' : workflow.success_rate > 85 ? '#ff9800' : '#f44336'
                                }
                              }}
                            />
                            <Typography variant="body2">
                              {formatPercentage(workflow.success_rate)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDuration(workflow.avg_time)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatCurrency(workflow.cost_per_run)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={workflow.status}
                            color={workflow.status === 'active' ? 'success' : 'default'}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Popular Nodes */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight="600" gutterBottom>
                Popular Nodes
              </Typography>
              <List>
                {analyticsData.popular_nodes.slice(0, 6).map((node, index) => (
                  <React.Fragment key={node.name}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon>
                        {getNodeIcon(node.category)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="subtitle2" fontWeight="600">
                            {node.name}
                          </Typography>
                        }
                        secondary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="caption">
                              {node.usage_count} uses
                            </Typography>
                            <Typography variant="caption">•</Typography>
                            <Typography variant="caption">
                              {formatPercentage(node.success_rate)} success
                            </Typography>
                          </Box>
                        }
                      />
                      <Box textAlign="right">
                        <Typography variant="caption" color="textSecondary">
                          {formatDuration(node.avg_time)}
                        </Typography>
                      </Box>
                    </ListItem>
                    {index < analyticsData.popular_nodes.slice(0, 6).length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Executions */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="600" gutterBottom>
                Recent Executions
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Status</TableCell>
                      <TableCell>Workflow</TableCell>
                      <TableCell>Duration</TableCell>
                      <TableCell>Input Size</TableCell>
                      <TableCell>Output Size</TableCell>
                      <TableCell>Cost</TableCell>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analyticsData.recent_executions.map((execution) => (
                      <TableRow key={execution.id} hover>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            {getStatusIcon(execution.status)}
                            <Typography variant="body2" textTransform="capitalize">
                              {execution.status}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2">
                            {execution.workflow_name}
                          </Typography>
                          {execution.error && (
                            <Typography variant="caption" color="error">
                              {execution.error}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDuration(execution.duration)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {execution.input_size}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {execution.output_size}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatCurrency(execution.cost)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(execution.timestamp).toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Tooltip title="View Details">
                            <IconButton size="small">
                              <Insights />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Box>
  );
};

export default WorkflowAnalyticsDashboard;
