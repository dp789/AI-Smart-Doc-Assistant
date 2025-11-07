import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  LinearProgress
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  Assessment as AssessmentIcon,
  Description as DescriptionIcon,
  Category as CategoryIcon,
  Psychology as PsychologyIcon,
  TrendingUp as TrendingUpIcon,
  Share as ShareIcon,
  CheckCircle,
  Error as ErrorIcon
} from '@mui/icons-material';
import axios from 'axios';
import envConfig from '../../envConfig';
import { getAuthHeaders } from '../../utils/authUtils';

/**
 * Enhanced Results Panel for AI Workflow Builder
 * Displays comprehensive analysis results with export capabilities
 */
const EnhancedResultsPanel = ({ results = [], open = false, onClose }) => {
  const [selectedResult, setSelectedResult] = useState(null);
  const [exportDialog, setExportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState('json');
  const [exportFilename, setExportFilename] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');

  const analysisTypeIcons = {
    comprehensive: <AssessmentIcon />,
    summary: <DescriptionIcon />,
    keywords: <CategoryIcon />,
    categorization: <CategoryIcon />,
    sentiment: <PsychologyIcon />,
    custom: <PsychologyIcon />
  };

  const analysisTypeColors = {
    comprehensive: 'primary',
    summary: 'info',
    keywords: 'secondary',
    categorization: 'warning',
    sentiment: 'success',
    custom: 'default'
  };

  const formatDuration = (ms) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const renderResultCard = (result, index) => (
    <Card key={index} sx={{ mb: 2, border: result.success ? '1px solid #4caf50' : '1px solid #f44336' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box>
            <Typography variant="h6" gutterBottom>
              {result.fileName || `Document ${result.documentId}`}
            </Typography>
            <Box display="flex" gap={1} mb={1}>
              <Chip
                icon={result.success ? <CheckCircle /> : <ErrorIcon />}
                label={result.success ? 'Success' : 'Failed'}
                color={result.success ? 'success' : 'error'}
                size="small"
              />
              {result.enhanced && (
                <Chip
                  label="Enhanced Analysis"
                  color="primary"
                  size="small"
                  variant="outlined"
                />
              )}
              {result.exportable && (
                <Chip
                  label="Exportable"
                  color="secondary"
                  size="small"
                  variant="outlined"
                />
              )}
              {result.analysisType && (
                <Chip
                  icon={analysisTypeIcons[result.analysisType]}
                  label={result.analysisType.charAt(0).toUpperCase() + result.analysisType.slice(1)}
                  color={analysisTypeColors[result.analysisType]}
                  size="small"
                />
              )}
            </Box>
          </Box>
          <Typography variant="caption" color="textSecondary">
            {formatDuration(result.processingTime)}
          </Typography>
        </Box>

        {result.success && result.analysis && (
          <Box>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Analysis Preview:
            </Typography>
            <Paper sx={{ p: 2, backgroundColor: '#f5f5f5', maxHeight: 200, overflow: 'auto' }}>
              <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}>
                {typeof result.analysis === 'string' 
                  ? result.analysis.substring(0, 500) + (result.analysis.length > 500 ? '\n...' : '')
                  : JSON.stringify(result.analysis, null, 2).substring(0, 500) + '...'
                }
              </Typography>
            </Paper>
          </Box>
        )}

        {!result.success && result.error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            <Typography variant="body2">{result.error}</Typography>
          </Alert>
        )}

        {result.metadata && (
          <Box mt={2}>
            <Typography variant="caption" color="textSecondary">
              Model: {result.model} | Confidence: {Math.round((result.confidence || 0) * 100)}%
              {result.metadata.chunksUsed && ` | Chunks: ${result.metadata.chunksUsed}/${result.metadata.totalChunks}`}
            </Typography>
          </Box>
        )}
      </CardContent>

      <CardActions>
        <Button
          size="small"
          startIcon={<VisibilityIcon />}
          onClick={() => setSelectedResult(result)}
          disabled={!result.success}
        >
          View Full Result
        </Button>
        {result.exportable && result.rawAnalysisData && (
          <Button
            size="small"
            startIcon={<DownloadIcon />}
            onClick={() => handleExportClick(result)}
            disabled={!result.success}
          >
            Export
          </Button>
        )}
        <Button
          size="small"
          startIcon={<ShareIcon />}
          onClick={() => handleShareResult(result)}
          disabled={!result.success}
        >
          Share
        </Button>
      </CardActions>
    </Card>
  );

  const handleExportClick = (result) => {
    setSelectedResult(result);
    setExportFilename(`analysis_${result.documentId}_${Date.now()}`);
    setExportDialog(true);
    setExportError('');
  };

  const handleExport = async () => {
    if (!selectedResult?.rawAnalysisData) {
      setExportError('No analysis data available for export');
      return;
    }

    setExporting(true);
    setExportError('');

    try {
      const authHeaders = await getAuthHeaders();
      
      const response = await axios.post(
        `${envConfig.apiUrl}/enhanced-analysis/export`,
        {
          analysisData: selectedResult.rawAnalysisData,
          format: exportFormat,
          filename: exportFilename || 'analysis_export'
        },
        {
          headers: {
            ...authHeaders,
            'Accept': '*/*'
          },
          responseType: 'blob'
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const extension = exportFormat === 'json' ? '.json' : 
                      exportFormat === 'csv' ? '.csv' : 
                      exportFormat === 'markdown' ? '.md' : '.txt';
      link.download = `${exportFilename}${extension}`;
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setExportDialog(false);
      
    } catch (error) {
      console.error('Export failed:', error);
      setExportError(error.response?.data?.error || error.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleShareResult = (result) => {
    // Create shareable summary
    const summary = {
      documentId: result.documentId,
      fileName: result.fileName,
      analysisType: result.analysisType,
      model: result.model,
      confidence: result.confidence,
      processingTime: result.processingTime,
      timestamp: new Date().toISOString()
    };

    // Copy to clipboard
    navigator.clipboard.writeText(JSON.stringify(summary, null, 2))
      .then(() => {
        alert('Analysis summary copied to clipboard!');
      })
      .catch(() => {
        alert('Failed to copy to clipboard');
      });
  };

  const renderFullResultDialog = () => (
    <Dialog
      open={!!selectedResult}
      onClose={() => setSelectedResult(null)}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: '80vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          {selectedResult?.analysisType && analysisTypeIcons[selectedResult.analysisType]}
          <Typography variant="h6">
            Analysis Results: {selectedResult?.fileName}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {selectedResult?.analysis && (
          <Paper sx={{ p: 3, backgroundColor: '#fafafa' }}>
            <Typography variant="body1" component="pre" sx={{ 
              whiteSpace: 'pre-wrap', 
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              lineHeight: 1.6
            }}>
              {typeof selectedResult.analysis === 'string' 
                ? selectedResult.analysis
                : JSON.stringify(selectedResult.analysis, null, 2)
              }
            </Typography>
          </Paper>
        )}
      </DialogContent>
      <DialogActions>
        {selectedResult?.exportable && (
          <Button
            startIcon={<DownloadIcon />}
            onClick={() => handleExportClick(selectedResult)}
          >
            Export
          </Button>
        )}
        <Button onClick={() => setSelectedResult(null)}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderExportDialog = () => (
    <Dialog open={exportDialog} onClose={() => setExportDialog(false)} maxWidth="sm" fullWidth>
      <DialogTitle>Export Analysis Results</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="Filename"
            value={exportFilename}
            onChange={(e) => setExportFilename(e.target.value)}
            helperText="Enter filename without extension"
            sx={{ mb: 2 }}
          />
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Export Format</InputLabel>
            <Select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              label="Export Format"
            >
              <MenuItem value="json">JSON - Complete analysis data</MenuItem>
              <MenuItem value="markdown">Markdown - Formatted report</MenuItem>
              <MenuItem value="csv">CSV - Tabular data</MenuItem>
              <MenuItem value="summary">Summary Report - Key findings</MenuItem>
            </Select>
          </FormControl>
          
          {exportError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {exportError}
            </Alert>
          )}
          
          {exporting && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>Exporting...</Typography>
              <LinearProgress />
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setExportDialog(false)} disabled={exporting}>
          Cancel
        </Button>
        <Button
          onClick={handleExport}
          variant="contained"
          startIcon={<DownloadIcon />}
          disabled={exporting || !exportFilename}
        >
          {exporting ? 'Exporting...' : 'Export'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  if (!results || results.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <TrendingUpIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="textSecondary">
          No analysis results yet
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Run your workflow to see comprehensive analysis results here
        </Typography>
      </Box>
    );
  }

  const successfulResults = results.filter(r => r.success);
  const failedResults = results.filter(r => !r.success);
  const enhancedResults = results.filter(r => r.enhanced);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: { height: '90vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" fontWeight="600">
            🤖 Enhanced AI Analysis Results
          </Typography>
          <Button
            onClick={onClose}
            variant="outlined"
            size="small"
            sx={{ minWidth: 'auto', p: 1 }}
          >
            ✕
          </Button>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box>
          {/* Summary Statistics */}
          <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📊 Analysis Summary
              </Typography>
              <Box display="flex" gap={4} flexWrap="wrap">
                <Box>
                  <Typography variant="h4">{results.length}</Typography>
                  <Typography variant="caption">Total Analyses</Typography>
                </Box>
                <Box>
                  <Typography variant="h4" color="lightgreen">{successfulResults.length}</Typography>
                  <Typography variant="caption">Successful</Typography>
                </Box>
                <Box>
                  <Typography variant="h4" color="lightcoral">{failedResults.length}</Typography>
                  <Typography variant="caption">Failed</Typography>
                </Box>
                <Box>
                  <Typography variant="h4" color="lightyellow">{enhancedResults.length}</Typography>
                  <Typography variant="caption">Enhanced</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Results List */}
          <Typography variant="h6" gutterBottom>
            🔍 Analysis Results
          </Typography>
          
          {results.length === 0 ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              No enhanced analysis results available. Try running a workflow with AI Agent nodes configured for enhanced analysis.
            </Alert>
          ) : (
            results.map((result, index) => renderResultCard(result, index))
          )}

          {/* Dialogs */}
          {renderFullResultDialog()}
          {renderExportDialog()}
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
        {results.length > 0 && (
          <Button 
            onClick={() => setExportDialog(true)}
            variant="contained"
            startIcon={<DownloadIcon />}
          >
            Export All Results
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default EnhancedResultsPanel;
