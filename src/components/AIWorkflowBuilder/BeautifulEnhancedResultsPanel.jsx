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
  Alert,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Grid,
  Stepper,
  Step,
  StepLabel,
  StepContent
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
  Error as ErrorIcon,
  Star as StarIcon,
  Timeline as TimelineIcon,
  AutoAwesome as AutoAwesomeIcon,
  Insights as InsightsIcon
} from '@mui/icons-material';

/**
 * Beautiful Enhanced Results Panel for AI Workflow Builder
 * Modern, user-friendly display of comprehensive AI analysis results
 */
const BeautifulEnhancedResultsPanel = ({ results = [], open = false, onClose }) => {
  const [selectedResult, setSelectedResult] = useState(null);
  const [activeStep, setActiveStep] = useState(0);

  const analysisTypeIcons = {
    comprehensive: <AssessmentIcon />,
    summary: <DescriptionIcon />,
    keywords: <CategoryIcon />,
    categorization: <CategoryIcon />,
    sentiment: <PsychologyIcon />,
    custom: <AutoAwesomeIcon />
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

  const renderAnalysisSection = (title, icon, content, color = 'primary', bgColor = '#f8f9fa') => {
    if (!content) return null;
    
    return (
      <Card sx={{ mb: 3, overflow: 'hidden', boxShadow: 3 }}>
        <Box sx={{ 
          background: `linear-gradient(135deg, ${getColorGradient(color)})`,
          color: 'white',
          p: 2
        }}>
          <Box display="flex" alignItems="center" gap={1}>
            {React.cloneElement(icon, { sx: { fontSize: 24 } })}
            <Typography variant="h6" fontWeight="700">{title}</Typography>
          </Box>
        </Box>
        <CardContent sx={{ p: 3 }}>
          {renderContent(content)}
        </CardContent>
      </Card>
    );
  };

  const getColorGradient = (color) => {
    const gradients = {
      primary: '#1976d2 0%, #1565c0 100%',
      info: '#0288d1 0%, #0277bd 100%',
      secondary: '#7b1fa2 0%, #6a1b9a 100%',
      warning: '#ed6c02 0%, #e65100 100%',
      success: '#2e7d32 0%, #1b5e20 100%',
      default: '#424242 0%, #212121 100%'
    };
    return gradients[color] || gradients.default;
  };

  const renderContent = (content) => {
    if (typeof content === 'string') {
      return (
        <Typography variant="body1" sx={{ 
          whiteSpace: 'pre-wrap', 
          lineHeight: 1.7,
          fontSize: '1rem'
        }}>
          {content}
        </Typography>
      );
    }
    
    if (Array.isArray(content)) {
      return (
        <List sx={{ py: 0 }}>
          {content.map((item, idx) => (
            <ListItem key={idx} sx={{ py: 1, px: 0 }}>
              <ListItemIcon>
                <StarIcon color="primary" fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary={item} 
                primaryTypographyProps={{ 
                  variant: 'body1',
                  sx: { lineHeight: 1.6 }
                }}
              />
            </ListItem>
          ))}
        </List>
      );
    }
    
    if (typeof content === 'object') {
      return (
        <Grid container spacing={2}>
          {Object.entries(content).map(([key, value]) => (
            <Grid item xs={12} sm={6} key={key}>
              <Paper sx={{ p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                <Typography variant="subtitle1" color="primary" fontWeight="600" gutterBottom>
                  {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Typography>
                <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                  {Array.isArray(value) ? value.join(', ') : value?.toString() || 'N/A'}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      );
    }

    return (
      <Typography variant="body2" color="textSecondary">
        No content available
      </Typography>
    );
  };

  const renderBeautifulResultCard = (result, index) => {
    let analysisData = {};
    
    // Parse analysis data
    if (typeof result.analysis === 'string') {
      try {
        analysisData = JSON.parse(result.analysis);
      } catch (e) {
        analysisData = { content: result.analysis };
      }
    } else {
      analysisData = result.analysis || {};
    }

    // Get raw data for detailed view
    let rawData = result.rawAnalysisData || analysisData;
    if (typeof rawData === 'string') {
      try {
        rawData = JSON.parse(rawData);
      } catch (e) {
        rawData = analysisData;
      }
    }

    return (
      <Box key={index} sx={{ mb: 4 }}>
        {/* Document Header */}
        <Card sx={{ 
          mb: 2,
          background: result.success 
            ? 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)' 
            : 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
          color: 'white',
          boxShadow: 4
        }}>
          <CardContent sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h4" fontWeight="700" gutterBottom>
                  📄 {result.fileName || `Document Analysis ${index + 1}`}
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                  <Chip
                    icon={result.success ? <CheckCircle /> : <ErrorIcon />}
                    label={result.success ? 'Analysis Complete' : 'Analysis Failed'}
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }}
                  />
                  {result.analysisType && (
                    <Chip
                      icon={analysisTypeIcons[result.analysisType]}
                      label={`${result.analysisType.charAt(0).toUpperCase() + result.analysisType.slice(1)} Analysis`}
                      sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }}
                    />
                  )}
                  <Chip
                    label={`Model: ${result.model || 'GPT-4o Mini'}`}
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }}
                  />
                </Box>
              </Box>
              <Box textAlign="right">
                <Typography variant="h5" fontWeight="700">
                  ⚡ {formatDuration(result.processingTime)}
                </Typography>
                <Typography variant="h6" fontWeight="600">
                  🎯 {Math.round((result.confidence || 0.95) * 100)}% Confidence
                </Typography>
                {result.metadata?.chunksUsed && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    📝 {result.metadata.chunksUsed}/{result.metadata.totalChunks} chunks processed
                  </Typography>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Analysis Results */}
        {result.success && rawData ? (
          <Box>
            {/* Executive Summary */}
            {rawData.summary && renderAnalysisSection(
              '📋 Executive Summary', 
              <DescriptionIcon />, 
              rawData.summary,
              'primary'
            )}
            
            {/* Content Analysis */}
            {rawData.content_analysis && renderAnalysisSection(
              '🔍 Content Analysis', 
              <AssessmentIcon />, 
              rawData.content_analysis,
              'info'
            )}
            
            {/* Keywords & Terminology */}
            {rawData.keywords && renderAnalysisSection(
              '🏷️ Keywords & Terminology', 
              <CategoryIcon />, 
              rawData.keywords,
              'secondary'
            )}
            
            {/* Named Entities */}
            {rawData.entities && renderAnalysisSection(
              '👥 Named Entities', 
              <PsychologyIcon />, 
              rawData.entities,
              'warning'
            )}
            
            {/* Sentiment Analysis */}
            {rawData.sentiment_analysis && renderAnalysisSection(
              '😊 Sentiment Analysis', 
              <PsychologyIcon />, 
              rawData.sentiment_analysis,
              'success'
            )}
            
            {/* Document Categorization */}
            {rawData.categorization && renderAnalysisSection(
              '📂 Document Categorization', 
              <CategoryIcon />, 
              rawData.categorization,
              'warning'
            )}
            
            {/* Quality Assessment */}
            {rawData.quality_assessment && renderAnalysisSection(
              '⭐ Quality Assessment', 
              <TrendingUpIcon />, 
              rawData.quality_assessment,
              'info'
            )}
            
            {/* Actionable Insights */}
            {rawData.actionable_insights && renderAnalysisSection(
              '💡 Actionable Insights & Recommendations', 
              <InsightsIcon />, 
              rawData.actionable_insights,
              'success'
            )}
            
            {/* Fallback for simple content */}
            {!rawData.summary && !rawData.content_analysis && rawData.content && renderAnalysisSection(
              '📄 Analysis Result', 
              <DescriptionIcon />, 
              rawData.content,
              'primary'
            )}

            {/* Action Buttons */}
            <Card sx={{ p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<VisibilityIcon />}
                    onClick={() => setSelectedResult(result)}
                    sx={{ mr: 2, fontWeight: 600 }}
                  >
                    View Raw Data
                  </Button>
                  {result.exportable && (
                    <Button
                      variant="outlined"
                      size="large"
                      startIcon={<DownloadIcon />}
                      sx={{ mr: 2, fontWeight: 600 }}
                    >
                      Export Analysis
                    </Button>
                  )}
                </Box>
                <Typography variant="caption" color="textSecondary">
                  🕒 Analyzed: {new Date(result.timestamp).toLocaleString()}
                </Typography>
              </Box>
            </Card>
          </Box>
        ) : !result.success && result.error ? (
          <Alert severity="error" sx={{ mb: 2, p: 3 }}>
            <Typography variant="h6" gutterBottom>❌ Analysis Failed</Typography>
            <Typography variant="body1">{result.error}</Typography>
          </Alert>
        ) : (
          <Alert severity="warning" sx={{ p: 3 }}>
            <Typography variant="h6">⚠️ No Analysis Data Available</Typography>
            <Typography variant="body1">The analysis did not return any processable results.</Typography>
          </Alert>
        )}
      </Box>
    );
  };

  const successfulResults = results.filter(r => r.success);
  const failedResults = results.filter(r => !r.success);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: { height: '95vh', borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ p: 0 }}>
        <Box sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          p: 3
        }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h4" fontWeight="700" gutterBottom>
                🤖 AI Analysis Results
              </Typography>
              <Typography variant="h6">
                Comprehensive Document Intelligence & Insights
              </Typography>
            </Box>
            <Button
              onClick={onClose}
              variant="contained"
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                color: 'white',
                fontWeight: 600,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
              }}
            >
              ✕ Close
            </Button>
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0 }}>
        {/* Summary Statistics */}
        <Box sx={{ p: 3, bgcolor: '#f8f9fa' }}>
          <Grid container spacing={3}>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.main', color: 'white' }}>
                <Typography variant="h3" fontWeight="700">{results.length}</Typography>
                <Typography variant="subtitle1">Total Analyses</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.main', color: 'white' }}>
                <Typography variant="h3" fontWeight="700">{successfulResults.length}</Typography>
                <Typography variant="subtitle1">Successful</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'error.main', color: 'white' }}>
                <Typography variant="h3" fontWeight="700">{failedResults.length}</Typography>
                <Typography variant="subtitle1">Failed</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.main', color: 'white' }}>
                <Typography variant="h3" fontWeight="700">{results.filter(r => r.enhanced).length}</Typography>
                <Typography variant="subtitle1">Enhanced</Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>

        <Box sx={{ p: 3 }}>
          {results.length === 0 ? (
            <Alert severity="info" sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>📭 No Analysis Results Available</Typography>
              <Typography variant="body1">
                Try running a workflow with AI Agent nodes configured for enhanced analysis to see comprehensive results here.
              </Typography>
            </Alert>
          ) : (
            <Box>
              <Typography variant="h5" fontWeight="700" gutterBottom sx={{ mb: 3 }}>
                🔍 Detailed Analysis Results
              </Typography>
              {results.map((result, index) => renderBeautifulResultCard(result, index))}
            </Box>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 3, bgcolor: '#f8f9fa' }}>
        <Button onClick={onClose} variant="outlined" size="large">
          Close
        </Button>
        {results.length > 0 && (
          <Button 
            variant="contained"
            startIcon={<DownloadIcon />}
            size="large"
            sx={{ fontWeight: 600 }}
          >
            Export All Results
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default BeautifulEnhancedResultsPanel;
