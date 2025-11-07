import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Chip,
  Grid,
  TextField,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Rating,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Badge,
  Tooltip,
  Avatar,
  Stack
} from '@mui/material';
import {
  Search,
  FilterList,
  Category,
  TrendingUp,
  Star,
  PlayArrow,
  Visibility,
  Download,
  Share,
  AccessTime,
  People,
  CheckCircle,
  Code,
  Psychology,
  Analytics,
  Language,
  Transform,
  Storage,
  Api,
  Email,
  Schedule,
  Webhook,
  AutoAwesome,
  Science,
  SmartToy,
  Close
} from '@mui/icons-material';

// Mock template data with more sophisticated examples
const templateCategories = [
  { id: 'all', name: 'All Templates', count: 24 },
  { id: 'document-processing', name: 'Document Processing', count: 8 },
  { id: 'customer-service', name: 'Customer Service', count: 6 },
  { id: 'data-analytics', name: 'Data Analytics', count: 5 },
  { id: 'marketing', name: 'Marketing', count: 3 },
  { id: 'hr', name: 'Human Resources', count: 2 }
];

const workflowTemplates = [
  {
    id: 'template-001',
    name: 'Smart Document Analyzer',
    description: 'AI-powered document analysis with multi-model processing, sentiment analysis, and intelligent categorization',
    category: 'document-processing',
    difficulty: 'Beginner',
    rating: 4.8,
    downloads: 1247,
    nodes: 7,
    estimated_time: '3-5 minutes',
    tags: ['AI Analysis', 'NLP', 'Document Processing', 'GPT-4'],
    author: {
      name: 'SmartDocs Team',
      avatar: '/api/avatars/smartdocs.png'
    },
    preview_image: '/api/templates/smart-document-analyzer/preview.jpg',
    features: [
      'Multi-format document support (PDF, DOCX, TXT)',
      'GPT-4 powered content analysis',
      'Automatic sentiment detection',
      'Smart categorization and tagging',
      'Export results to multiple formats'
    ],
    use_cases: [
      'Legal document review',
      'Research paper analysis',
      'Contract processing',
      'Content moderation'
    ],
    components: [
      { type: 'trigger', name: 'Document Upload Trigger' },
      { type: 'ai', name: 'GPT-4 Content Analyzer' },
      { type: 'ai', name: 'Sentiment Analysis Agent' },
      { type: 'action', name: 'Category Classifier' },
      { type: 'action', name: 'Results Aggregator' },
      { type: 'action', name: 'Database Storage' },
      { type: 'action', name: 'Email Notification' }
    ],
    created_at: '2024-01-15',
    updated_at: '2024-01-20',
    template_data: {
      nodes: [
        {
          id: 'trigger-1',
          type: 'trigger',
          position: { x: 100, y: 150 },
          data: {
            label: 'Document Upload',
            description: 'Triggers when document is uploaded',
            icon: Webhook,
            category: 'triggers'
          }
        },
        {
          id: 'ai-1',
          type: 'aiAgent',
          position: { x: 350, y: 100 },
          data: {
            label: 'GPT-4 Analyzer',
            description: 'Analyze document content',
            icon: Psychology,
            category: 'ai'
          }
        },
        {
          id: 'ai-2',
          type: 'aiAgent',
          position: { x: 350, y: 200 },
          data: {
            label: 'Sentiment Analysis',
            description: 'Detect sentiment in content',
            icon: SmartToy,
            category: 'ai'
          }
        },
        {
          id: 'action-1',
          type: 'action',
          position: { x: 600, y: 125 },
          data: {
            label: 'Category Classifier',
            description: 'Classify document type',
            icon: Transform,
            category: 'actions'
          }
        },
        {
          id: 'action-2',
          type: 'action',
          position: { x: 850, y: 150 },
          data: {
            label: 'Save Results',
            description: 'Store analysis results',
            icon: Storage,
            category: 'actions'
          }
        }
      ],
      edges: [
        {
          id: 'e1-2',
          source: 'trigger-1',
          target: 'ai-1',
          type: 'smoothstep',
          markerEnd: { 
            type: 'arrowclosed',
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
        },
        {
          id: 'e1-3',
          source: 'trigger-1',
          target: 'ai-2',
          type: 'smoothstep',
          markerEnd: { 
            type: 'arrowclosed',
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
        },
        {
          id: 'e2-4',
          source: 'ai-1',
          target: 'action-1',
          type: 'smoothstep',
          markerEnd: { 
            type: 'arrowclosed',
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
        },
        {
          id: 'e3-4',
          source: 'ai-2',
          target: 'action-1',
          type: 'smoothstep',
          markerEnd: { 
            type: 'arrowclosed',
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
        },
        {
          id: 'e4-5',
          source: 'action-1',
          target: 'action-2',
          type: 'smoothstep',
          markerEnd: { 
            type: 'arrowclosed',
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
        }
      ]
    }
  },
  {
    id: 'template-002',
    name: 'Intelligent Customer Support',
    description: 'Advanced AI customer support system with query classification, automated responses, and escalation management',
    category: 'customer-service',
    difficulty: 'Intermediate',
    rating: 4.9,
    downloads: 892,
    nodes: 12,
    estimated_time: '8-12 minutes',
    tags: ['Customer Support', 'AI Chatbot', 'Query Classification', 'Escalation'],
    author: {
      name: 'Support AI Labs',
      avatar: '/api/avatars/support-labs.png'
    },
    preview_image: '/api/templates/intelligent-customer-support/preview.jpg',
    features: [
      'Intelligent query classification',
      'Multi-language support',
      'Automated response generation',
      'Human escalation triggers',
      'Customer satisfaction tracking',
      'Knowledge base integration'
    ],
    use_cases: [
      'E-commerce support automation',
      'SaaS customer service',
      'Technical help desk',
      'Multi-channel support'
    ],
    components: [
      { type: 'trigger', name: 'Support Ticket Trigger' },
      { type: 'ai', name: 'Query Classifier' },
      { type: 'ai', name: 'Language Detector' },
      { type: 'ai', name: 'Response Generator' },
      { type: 'action', name: 'Knowledge Base Search' },
      { type: 'action', name: 'Escalation Router' },
      { type: 'action', name: 'Customer Notification' },
      { type: 'action', name: 'Analytics Tracker' }
    ],
    created_at: '2024-01-10',
    updated_at: '2024-01-18'
  },
  {
    id: 'template-003',
    name: 'Data Enrichment Pipeline',
    description: 'Comprehensive data processing pipeline with AI-powered enrichment, validation, and insight generation',
    category: 'data-analytics',
    difficulty: 'Advanced',
    rating: 4.7,
    downloads: 567,
    nodes: 15,
    estimated_time: '15-20 minutes',
    tags: ['Data Processing', 'AI Enrichment', 'Analytics', 'Machine Learning'],
    author: {
      name: 'Data Science Pro',
      avatar: '/api/avatars/data-science.png'
    },
    preview_image: '/api/templates/data-enrichment-pipeline/preview.jpg',
    features: [
      'Automated data validation',
      'AI-powered data enrichment',
      'Duplicate detection and merging',
      'Real-time quality scoring',
      'Predictive analytics integration',
      'Multi-source data aggregation'
    ],
    use_cases: [
      'Customer data enrichment',
      'Lead scoring automation',
      'Market research analysis',
      'Business intelligence pipelines'
    ],
    components: [
      { type: 'trigger', name: 'Data Input Trigger' },
      { type: 'action', name: 'Data Validator' },
      { type: 'ai', name: 'Entity Recognition' },
      { type: 'ai', name: 'Sentiment Analyzer' },
      { type: 'action', name: 'Duplicate Detector' },
      { type: 'action', name: 'External API Enricher' },
      { type: 'ai', name: 'Predictive Scorer' },
      { type: 'action', name: 'Quality Assessor' },
      { type: 'action', name: 'Data Aggregator' },
      { type: 'action', name: 'Warehouse Storage' }
    ],
    created_at: '2024-01-05',
    updated_at: '2024-01-22'
  },
  {
    id: 'template-004',
    name: 'Social Media Analytics Bot',
    description: 'Monitor and analyze social media mentions with AI-powered sentiment analysis and trend detection',
    category: 'marketing',
    difficulty: 'Intermediate',
    rating: 4.6,
    downloads: 743,
    nodes: 10,
    estimated_time: '10-15 minutes',
    tags: ['Social Media', 'Analytics', 'Sentiment Analysis', 'Trend Detection'],
    author: {
      name: 'Marketing AI Hub',
      avatar: '/api/avatars/marketing-hub.png'
    },
    preview_image: '/api/templates/social-media-analytics/preview.jpg',
    features: [
      'Multi-platform monitoring',
      'Real-time sentiment analysis',
      'Trend detection and alerts',
      'Influencer identification',
      'Automated reporting',
      'Crisis detection alerts'
    ],
    use_cases: [
      'Brand monitoring',
      'Campaign performance tracking',
      'Competitor analysis',
      'Crisis management'
    ],
    components: [
      { type: 'trigger', name: 'Social Media Monitor' },
      { type: 'action', name: 'Content Collector' },
      { type: 'ai', name: 'Sentiment Analyzer' },
      { type: 'ai', name: 'Trend Detector' },
      { type: 'action', name: 'Influencer Scorer' },
      { type: 'action', name: 'Alert Manager' },
      { type: 'action', name: 'Report Generator' },
      { type: 'action', name: 'Dashboard Updater' }
    ],
    created_at: '2024-01-12',
    updated_at: '2024-01-19'
  },
  {
    id: 'template-005',
    name: 'Resume Screening Assistant',
    description: 'AI-powered resume analysis and candidate ranking system with bias detection and skill matching',
    category: 'hr',
    difficulty: 'Intermediate',
    rating: 4.5,
    downloads: 324,
    nodes: 9,
    estimated_time: '6-10 minutes',
    tags: ['HR', 'Resume Analysis', 'AI Screening', 'Candidate Ranking'],
    author: {
      name: 'HR Tech Solutions',
      avatar: '/api/avatars/hr-tech.png'
    },
    preview_image: '/api/templates/resume-screening/preview.jpg',
    features: [
      'Automated resume parsing',
      'Skill extraction and matching',
      'Experience level assessment',
      'Bias detection and mitigation',
      'Candidate ranking system',
      'Interview scheduling integration'
    ],
    use_cases: [
      'Bulk resume screening',
      'Skill-based candidate matching',
      'Diversity hiring initiatives',
      'Recruitment automation'
    ],
    components: [
      { type: 'trigger', name: 'Resume Upload' },
      { type: 'action', name: 'Document Parser' },
      { type: 'ai', name: 'Skill Extractor' },
      { type: 'ai', name: 'Experience Analyzer' },
      { type: 'ai', name: 'Bias Detector' },
      { type: 'action', name: 'Job Matcher' },
      { type: 'action', name: 'Candidate Ranker' },
      { type: 'action', name: 'ATS Integration' }
    ],
    created_at: '2024-01-08',
    updated_at: '2024-01-16',
    template_data: {
      nodes: [
        {
          id: 'trigger-hr',
          type: 'trigger',
          position: { x: 100, y: 200 },
          data: {
            label: 'Resume Upload',
            description: 'Triggers when resume is uploaded',
            icon: Webhook,
            category: 'triggers'
          }
        },
        {
          id: 'ai-hr-1',
          type: 'aiAgent',
          position: { x: 350, y: 150 },
          data: {
            label: 'Resume Parser',
            description: 'Extract information from resume',
            icon: Psychology,
            category: 'ai'
          }
        },
        {
          id: 'ai-hr-2',
          type: 'aiAgent',
          position: { x: 350, y: 250 },
          data: {
            label: 'Skill Matcher',
            description: 'Match skills to job requirements',
            icon: SmartToy,
            category: 'ai'
          }
        },
        {
          id: 'action-hr',
          type: 'action',
          position: { x: 600, y: 200 },
          data: {
            label: 'Candidate Ranking',
            description: 'Rank candidates by fit',
            icon: Transform,
            category: 'actions'
          }
        }
      ],
      edges: [
        {
          id: 'e-hr-1',
          source: 'trigger-hr',
          target: 'ai-hr-1',
          type: 'smoothstep',
          markerEnd: { 
            type: 'arrowclosed',
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
        },
        {
          id: 'e-hr-2',
          source: 'trigger-hr',
          target: 'ai-hr-2',
          type: 'smoothstep',
          markerEnd: { 
            type: 'arrowclosed',
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
        },
        {
          id: 'e-hr-3',
          source: 'ai-hr-1',
          target: 'action-hr',
          type: 'smoothstep',
          markerEnd: { 
            type: 'arrowclosed',
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
        },
        {
          id: 'e-hr-4',
          source: 'ai-hr-2',
          target: 'action-hr',
          type: 'smoothstep',
          markerEnd: { 
            type: 'arrowclosed',
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
        }
      ]
    }
  }
];

const WorkflowTemplateGallery = ({ onSelectTemplate, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [previewDialog, setPreviewDialog] = useState(false);

  // Filter templates based on category and search
  const filteredTemplates = workflowTemplates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Sort templates
  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return b.downloads - a.downloads;
      case 'rating':
        return b.rating - a.rating;
      case 'newest':
        return new Date(b.created_at) - new Date(a.created_at);
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  const handleTemplatePreview = (template) => {
    setSelectedTemplate(template);
    setPreviewDialog(true);
  };

  const handleUseTemplate = (template) => {
    onSelectTemplate(template);
    onClose();
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Beginner': return '#4caf50';
      case 'Intermediate': return '#ff9800';
      case 'Advanced': return '#f44336';
      default: return '#757575';
    }
  };

  const getComponentIcon = (type) => {
    switch (type) {
      case 'trigger': return <Schedule sx={{ fontSize: 16 }} />;
      case 'ai': return <Psychology sx={{ fontSize: 16 }} />;
      case 'action': return <Api sx={{ fontSize: 16 }} />;
      default: return <Code sx={{ fontSize: 16 }} />;
    }
  };

  return (
    <Box sx={{ height: '80vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 3, borderBottom: '1px solid #e0e0e0' }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h4" fontWeight="700" color="primary">
            Workflow Template Gallery
          </Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
        
        <Typography variant="body1" color="textSecondary" paragraph>
          Discover and use professionally designed AI workflow templates. Get started quickly with pre-built solutions.
        </Typography>

        {/* Search and Filters */}
        <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
          <TextField
            size="small"
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              )
            }}
            sx={{ minWidth: 300 }}
          />

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Sort by</InputLabel>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              label="Sort by"
            >
              <MenuItem value="popular">Most Popular</MenuItem>
              <MenuItem value="rating">Highest Rated</MenuItem>
              <MenuItem value="newest">Newest</MenuItem>
              <MenuItem value="name">Name</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      <Box display="flex" flex={1} overflow="hidden">
        {/* Categories Sidebar */}
        <Paper sx={{ width: 280, borderRadius: 0, borderRight: '1px solid #e0e0e0' }}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" fontWeight="600" gutterBottom>
              Categories
            </Typography>
            <List>
              {templateCategories.map((category) => (
                <ListItem
                  key={category.id}
                  button
                  selected={selectedCategory === category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  sx={{
                    borderRadius: 2,
                    mb: 0.5,
                    '&.Mui-selected': {
                      backgroundColor: '#e3f2fd',
                      color: '#1976d2'
                    }
                  }}
                >
                  <ListItemIcon>
                    <Category sx={{ color: selectedCategory === category.id ? '#1976d2' : 'inherit' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary={category.name}
                    secondary={`${category.count} templates`}
                  />
                  <Badge 
                    badgeContent={category.count} 
                    color="primary" 
                    sx={{ '& .MuiBadge-badge': { fontSize: '0.7rem' } }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        </Paper>

        {/* Templates Grid */}
        <Box flex={1} sx={{ p: 3, overflow: 'auto' }}>
          <Typography variant="h6" gutterBottom>
            {sortedTemplates.length} templates found
          </Typography>

          <Grid container spacing={3}>
            {sortedTemplates.map((template) => (
              <Grid item xs={12} md={6} lg={4} key={template.id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  whileHover={{ y: -4 }}
                >
                  <Card sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: '0 12px 24px rgba(0,0,0,0.15)'
                    }
                  }}>
                    <CardMedia
                      component="div"
                      sx={{
                        height: 160,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                      }}
                    >
                      <Box textAlign="center">
                        <AutoAwesome sx={{ fontSize: 40, mb: 1 }} />
                        <Typography variant="subtitle2">
                          {template.nodes} Nodes
                        </Typography>
                      </Box>
                    </CardMedia>

                    <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                        <Typography variant="h6" fontWeight="600" noWrap>
                          {template.name}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <Star sx={{ fontSize: 16, color: '#ffc107' }} />
                          <Typography variant="caption" fontWeight="600">
                            {template.rating}
                          </Typography>
                        </Box>
                      </Box>

                      <Typography variant="body2" color="textSecondary" paragraph sx={{ flex: 1 }}>
                        {template.description}
                      </Typography>

                      <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <Chip 
                          size="small" 
                          label={template.difficulty}
                          sx={{ 
                            backgroundColor: getDifficultyColor(template.difficulty),
                            color: 'white',
                            fontWeight: 600
                          }}
                        />
                        <Chip size="small" label={template.estimated_time} />
                        <Chip size="small" label={`${template.downloads} downloads`} />
                      </Box>

                      <Box display="flex" flexWrap="wrap" gap={0.5} mb={2}>
                        {template.tags.slice(0, 3).map((tag) => (
                          <Chip
                            key={tag}
                            size="small"
                            label={tag}
                            variant="outlined"
                            sx={{ fontSize: '0.7rem' }}
                          />
                        ))}
                        {template.tags.length > 3 && (
                          <Typography variant="caption" color="textSecondary">
                            +{template.tags.length - 3} more
                          </Typography>
                        )}
                      </Box>

                      <Divider sx={{ mb: 2 }} />

                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Button
                          size="small"
                          startIcon={<Visibility />}
                          onClick={() => handleTemplatePreview(template)}
                        >
                          Preview
                        </Button>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<PlayArrow />}
                          onClick={() => handleUseTemplate(template)}
                          sx={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            '&:hover': {
                              background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)'
                            }
                          }}
                        >
                          Use Template
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>

          {sortedTemplates.length === 0 && (
            <Box textAlign="center" py={8}>
              <Search sx={{ fontSize: 64, color: '#e0e0e0', mb: 2 }} />
              <Typography variant="h6" color="textSecondary" gutterBottom>
                No templates found
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Try adjusting your search criteria or browse different categories
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Template Preview Dialog */}
      <Dialog
        open={previewDialog}
        onClose={() => setPreviewDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        {selectedTemplate && (
          <>
            <DialogTitle>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h5" fontWeight="600">
                    {selectedTemplate.name}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1} mt={1}>
                    <Avatar src={selectedTemplate.author.avatar} sx={{ width: 24, height: 24 }} />
                    <Typography variant="body2" color="textSecondary">
                      by {selectedTemplate.author.name}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <Star sx={{ fontSize: 16, color: '#ffc107' }} />
                      <Typography variant="body2">
                        {selectedTemplate.rating} ({selectedTemplate.downloads} downloads)
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                <IconButton onClick={() => setPreviewDialog(false)}>
                  <Close />
                </IconButton>
              </Box>
            </DialogTitle>

            <DialogContent>
              <Typography variant="body1" paragraph>
                {selectedTemplate.description}
              </Typography>

              <Box display="flex" gap={2} mb={3}>
                <Chip 
                  label={selectedTemplate.difficulty}
                  sx={{ 
                    backgroundColor: getDifficultyColor(selectedTemplate.difficulty),
                    color: 'white'
                  }}
                />
                <Chip label={`${selectedTemplate.nodes} nodes`} />
                <Chip label={selectedTemplate.estimated_time} />
              </Box>

              <Tabs value={0}>
                <Tab label="Features" />
                <Tab label="Components" />
                <Tab label="Use Cases" />
              </Tabs>

              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Key Features
                </Typography>
                <List>
                  {selectedTemplate.features.map((feature, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <CheckCircle sx={{ color: '#4caf50' }} />
                      </ListItemIcon>
                      <ListItemText primary={feature} />
                    </ListItem>
                  ))}
                </List>

                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                  Workflow Components
                </Typography>
                <Grid container spacing={1}>
                  {selectedTemplate.components.map((component, index) => (
                    <Grid item xs={12} sm={6} key={index}>
                      <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                        {getComponentIcon(component.type)}
                        <Typography variant="body2">
                          {component.name}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>

                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                  Common Use Cases
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {selectedTemplate.use_cases.map((useCase, index) => (
                    <Chip key={index} label={useCase} variant="outlined" />
                  ))}
                </Box>
              </Box>
            </DialogContent>

            <DialogActions sx={{ p: 3 }}>
              <Button
                startIcon={<Share />}
                onClick={() => {
                  navigator.clipboard.writeText(`Check out this AI workflow template: ${selectedTemplate.name}`);
                }}
              >
                Share
              </Button>
              <Button
                startIcon={<Download />}
                onClick={() => {
                  // Download template as JSON
                  const dataStr = JSON.stringify(selectedTemplate, null, 2);
                  const dataBlob = new Blob([dataStr], { type: 'application/json' });
                  const url = URL.createObjectURL(dataBlob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `${selectedTemplate.name.replace(/\s+/g, '-').toLowerCase()}.json`;
                  link.click();
                }}
              >
                Download
              </Button>
              <Button
                variant="contained"
                startIcon={<PlayArrow />}
                onClick={() => handleUseTemplate(selectedTemplate)}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)'
                  }
                }}
              >
                Use This Template
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default WorkflowTemplateGallery;
