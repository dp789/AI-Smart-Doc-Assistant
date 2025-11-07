import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  Paper,
  Divider,
  Container,
  Grid,
  LinearProgress,
  Fade,
} from '@mui/material';
import {
  Send as SendIcon,
  Language as LanguageIcon,
  QuestionAnswer as QuestionAnswerIcon,
  NavigateNext as NavigateNextIcon,
  NavigateBefore as NavigateBeforeIcon,
  CheckCircle as CheckCircleIcon,
  AutoAwesome as AutoAwesomeIcon,
  School as SchoolIcon,
  Description as DescriptionIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import './MCQGenerator.css';

const MCQGenerator = () => {
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [noOfMCQs, setNoOfMCQs] = useState(5);
  const [mcqs, setMcqs] = useState([]);
  const [mcqPages, setMcqPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasGenerated, setHasGenerated] = useState(false);
  const resultsRef = useRef(null);

  const webhookUrl = "https://n8n-nitor.eastus.cloudapp.azure.com/webhook/mcq";

  // Parse MCQs from response text
  const parseMCQs = (rawText) => {
    let text = rawText
      .replace(/\*\*Question\s*\d+\s*:[\*]*/g, m => {
        const num = m.match(/\d+/) ? m.match(/\d+/)[0] : '';
        return `\n${num}. `;
      })
      .replace(/\*\*Multiple Choice Questions.*?\*\*/gi, '')
      .replace(/^\s*Important Note:.*?(\n|$)/gmi, '')
      .replace(/\*\*/g, '')
      .replace(/\r\n/g, "\n")
      .replace(/\n{2,}/g, "\n\n");

    let questionBlocks = text.split(/\n(?=\d+\s*[\.\-)])/).map(q => q.trim()).filter(q => q.match(/^\d+\s*[\.\-)]/));
    if (!questionBlocks.length) {
      questionBlocks = text.split(/\n(?=[A-Da-d][\.\)]\s)/).map(q => q.trim());
    }
    if (!questionBlocks.length) {
      return [];
    }

    let mcqObjs = [];
    questionBlocks.forEach((block, idx) => {
      const noExplanation = block.replace(/[\n\r]*Explanation\s*:.*$/i, '')
        .replace(/[\n\r]*Explanation\s*[\.\-\:][\s\S]+?((\n|$))/i, '');
      let answer = '';
      let qText = noExplanation;
      let answerMatch = block.match(/Answer\s*[:\-]?\s*(.*?)\n/i) ||
        block.match(/Answer\s*[:\-]?\s*(.*)$/i);
      if (answerMatch) {
        answer = answerMatch[1].replace(/\*\*/g, '').trim();
        qText = qText.replace(answerMatch[0], '').trim();
      }
      qText = qText.replace(/Answer\s*[:\-].*$/gmi, '').trim();
      const optionSplit = qText.match(/^(.*?)\n?([a-dA-D][\.\)]\s.*)$/s);
      let question = '', options = '';
      if (optionSplit) {
        question = optionSplit[1].replace(/^\d+\s*[\.\-)]\s*/, '').trim();
        options = optionSplit[2].split('\n').filter(o => o.trim());
      } else {
        question = qText.replace(/^\d+\s*[\.\-)]\s*/, '').trim();
        options = [];
      }
      mcqObjs.push({
        num: idx + 1,
        question,
        options: Array.isArray(options) ? options : options.split('\n').filter(o => o.trim()),
        answer
      });
    });
    return mcqObjs;
  };

  // Handle form submission
  const handleGenerate = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    setHasGenerated(false);
    setMcqs([]);
    setMcqPages([]);
    setCurrentPage(1);

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          description,
          noOfMCQs: parseInt(noOfMCQs)
        })
      });

      const rawText = await response.text();
      const parsedMCQs = parseMCQs(rawText);

      if (parsedMCQs.length === 0) {
        throw new Error('Could not parse MCQs from the response. Please try again.');
      }

      setMcqs(parsedMCQs);
      
      // Create pages (5 MCQs per page)
      const pages = [];
      for (let i = 0; i < parsedMCQs.length; i += 5) {
        pages.push(parsedMCQs.slice(i, i + 5));
      }
      setMcqPages(pages);
      setCurrentPage(1);
      setHasGenerated(true);
      
      // Scroll to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);

    } catch (err) {
      console.error('Error generating MCQs:', err);
      setError(err.message || 'Failed to generate MCQs. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle page navigation
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleNextPage = () => {
    if (currentPage < mcqPages.length) {
      setCurrentPage(currentPage + 1);
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Reset form
  const handleReset = () => {
    setUrl('');
    setDescription('');
    setNoOfMCQs(5);
    setMcqs([]);
    setMcqPages([]);
    setCurrentPage(1);
    setError('');
    setHasGenerated(false);
  };

  return (
    <div className="mcq-generator-container">
      <Container maxWidth="lg" className="mcq-generator-wrapper">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mcq-header"
        >
          <Box className="header-content">
            <div className="header-icon-wrapper">
              <SchoolIcon className="header-icon" />
            </div>
            <Typography variant="h3" className="header-title">
              AI MCQ Generator
            </Typography>
            <Typography variant="subtitle1" className="header-subtitle">
              Generate intelligent multiple-choice questions from any web content
            </Typography>
          </Box>
        </motion.div>

        {/* Form Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="form-card" elevation={3}>
            <CardContent className="form-content">
              <form onSubmit={handleGenerate}>
                <Grid container spacing={3}>
                  {/* URL Input */}
                  <Grid item xs={12}>
                    <Box className="input-wrapper">
                      <LanguageIcon className="input-icon" />
                      <TextField
                        fullWidth
                        label="Website URL"
                        placeholder="https://example.com"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        required
                        variant="outlined"
                        className="form-input"
                        helperText="Enter the URL of the webpage you want to generate MCQs from"
                      />
                    </Box>
                  </Grid>

                  {/* Description Input */}
                  <Grid item xs={12} md={8}>
                    <Box className="input-wrapper">
                      <DescriptionIcon className="input-icon" />
                      <TextField
                        fullWidth
                        label="Description/Topic"
                        placeholder="Enter topic or description (optional)"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        variant="outlined"
                        className="form-input"
                        helperText="Provide additional context to focus the MCQ generation"
                      />
                    </Box>
                  </Grid>

                  {/* Number of MCQs */}
                  <Grid item xs={12} md={4}>
                    <Box className="input-wrapper">
                      <QuestionAnswerIcon className="input-icon" />
                      <TextField
                        fullWidth
                        type="number"
                        label="Number of MCQs"
                        value={noOfMCQs}
                        onChange={(e) => setNoOfMCQs(Math.min(Math.max(1, parseInt(e.target.value) || 1), 20))}
                        required
                        variant="outlined"
                        className="form-input"
                        inputProps={{ min: 1, max: 20 }}
                        helperText="Between 1 and 20"
                      />
                    </Box>
                  </Grid>

                  {/* Action Buttons */}
                  <Grid item xs={12}>
                    <Box className="action-buttons">
                      <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        disabled={isLoading || !url}
                        startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <AutoAwesomeIcon />}
                        className="generate-button"
                      >
                        {isLoading ? 'Generating...' : 'Generate MCQs'}
                      </Button>
                      {hasGenerated && (
                        <Button
                          variant="outlined"
                          size="large"
                          startIcon={<RefreshIcon />}
                          onClick={handleReset}
                          className="reset-button"
                        >
                          New Generation
                        </Button>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Loading Progress */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="loading-container"
          >
            <Paper className="loading-paper" elevation={2}>
              <CircularProgress size={48} className="loading-spinner" />
              <Typography variant="h6" className="loading-text">
                Analyzing content and generating MCQs...
              </Typography>
              <Typography variant="body2" color="textSecondary">
                This may take a few moments
              </Typography>
              <LinearProgress className="loading-progress" />
            </Paper>
          </motion.div>
        )}

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Alert severity="error" className="error-alert" onClose={() => setError('')}>
              {error}
            </Alert>
          </motion.div>
        )}

        {/* MCQ Results */}
        {hasGenerated && mcqPages.length > 0 && (
          <motion.div
            ref={resultsRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="results-container"
          >
            {/* Results Header */}
            <Box className="results-header">
              <Typography variant="h5" className="results-title">
                Generated MCQs
              </Typography>
              <Chip
                icon={<CheckCircleIcon />}
                label={`${mcqs.length} Questions`}
                color="primary"
                className="results-chip"
              />
            </Box>

            {/* MCQ Cards */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
              >
                <Grid container spacing={3}>
                  {mcqPages[currentPage - 1]?.map((mcq, index) => (
                    <Grid item xs={12} key={mcq.num}>
                      <Card className="mcq-card" elevation={2}>
                        <CardContent className="mcq-card-content">
                          {/* Question Number Badge */}
                          <Box className="question-badge">
                            <Chip
                              label={`Question ${mcq.num}`}
                              color="primary"
                              size="small"
                              className="question-number-chip"
                            />
                          </Box>

                          {/* Question */}
                          <Typography variant="h6" className="mcq-question">
                            {mcq.question}
                          </Typography>

                          {/* Options */}
                          {mcq.options && mcq.options.length > 0 && (
                            <Box className="mcq-options">
                              {mcq.options.filter(opt => opt.trim().length > 2).map((option, optIndex) => (
                                <Box
                                  key={optIndex}
                                  className="mcq-option"
                                >
                                  <Box className="option-indicator">
                                    {String.fromCharCode(65 + optIndex)}
                                  </Box>
                                  <Typography variant="body1" className="option-text">
                                    {option.trim().replace(/^[a-dA-D][\.\)]\s*/, '')}
                                  </Typography>
                                </Box>
                              ))}
                            </Box>
                          )}

                          <Divider className="mcq-divider" />

                          {/* Answer */}
                          {mcq.answer && (
                            <Box className="mcq-answer-box">
                              <CheckCircleIcon className="answer-icon" />
                              <Typography variant="body1" className="mcq-answer">
                                <strong>Answer:</strong> {mcq.answer}
                              </Typography>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </motion.div>
            </AnimatePresence>

            {/* Pagination */}
            {mcqPages.length > 1 && (
              <Box className="pagination-container">
                <Paper className="pagination-paper" elevation={2}>
                  <Tooltip title="Previous page">
                    <span>
                      <IconButton
                        onClick={handlePrevPage}
                        disabled={currentPage === 1}
                        className="pagination-button"
                      >
                        <NavigateBeforeIcon />
                      </IconButton>
                    </span>
                  </Tooltip>

                  <Typography variant="body1" className="pagination-text">
                    Page <strong>{currentPage}</strong> of <strong>{mcqPages.length}</strong>
                  </Typography>

                  <Tooltip title="Next page">
                    <span>
                      <IconButton
                        onClick={handleNextPage}
                        disabled={currentPage === mcqPages.length}
                        className="pagination-button"
                      >
                        <NavigateNextIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Paper>
              </Box>
            )}
          </motion.div>
        )}

        {/* Empty State */}
        {!hasGenerated && !isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="empty-state"
          >
            <Box className="empty-state-content">
              <div className="empty-state-icon-wrapper">
                <SchoolIcon className="empty-state-icon" />
              </div>
              <Typography variant="h5" className="empty-state-title">
                Ready to Generate MCQs
              </Typography>
              <Typography variant="body1" className="empty-state-subtitle">
                Enter a URL and click "Generate MCQs" to get started
              </Typography>
              <Box className="empty-state-features">
                <Box className="feature-item">
                  <CheckCircleIcon className="feature-icon" />
                  <Typography variant="body2">AI-Powered Generation</Typography>
                </Box>
                <Box className="feature-item">
                  <CheckCircleIcon className="feature-icon" />
                  <Typography variant="body2">Multiple Question Formats</Typography>
                </Box>
                <Box className="feature-item">
                  <CheckCircleIcon className="feature-icon" />
                  <Typography variant="body2">Instant Results</Typography>
                </Box>
              </Box>
            </Box>
          </motion.div>
        )}
      </Container>
    </div>
  );
};

export default MCQGenerator;

