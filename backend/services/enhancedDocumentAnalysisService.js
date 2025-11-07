/**
 * Enhanced Document Analysis Service
 * Provides comprehensive AI-powered document analysis with multiple AI models
 */

const azureOpenAIService = require('./azureOpenAIService');

class EnhancedDocumentAnalysisService {
  constructor() {
    this.azureOpenAI = azureOpenAIService;
    
    // Analysis templates for different types of analysis
    this.analysisTemplates = {
      comprehensive: {
        systemPrompt: `You are an expert document analyst specializing in comprehensive document analysis. Your task is to provide thorough, structured analysis of documents across multiple dimensions.

Provide your analysis in the following JSON structure:
{
  "summary": {
    "executive_summary": "Brief executive summary (2-3 sentences)",
    "detailed_summary": "Comprehensive summary (150-300 words)",
    "key_points": ["List of 5-7 key points or findings"]
  },
  "content_analysis": {
    "main_topics": ["Primary topics covered"],
    "themes": ["Underlying themes and concepts"],
    "document_type": "Type of document (report, research, article, etc.)",
    "writing_style": "Professional/Academic/Casual/Technical",
    "complexity_level": "Beginner/Intermediate/Advanced/Expert"
  },
  "entities": {
    "people": ["Names of people mentioned"],
    "organizations": ["Companies, institutions mentioned"],
    "locations": ["Geographic locations"],
    "dates": ["Important dates and timeframes"],
    "technologies": ["Technologies, tools, systems mentioned"],
    "concepts": ["Key concepts and terminology"]
  },
  "keywords": {
    "primary_keywords": ["5-10 most important keywords"],
    "secondary_keywords": ["10-15 supporting keywords"],
    "technical_terms": ["Domain-specific terminology"]
  },
  "sentiment_analysis": {
    "overall_sentiment": "Positive/Negative/Neutral/Mixed",
    "confidence_score": 0.85,
    "emotional_tone": "Professional/Optimistic/Cautious/Analytical",
    "sentiment_details": "Explanation of sentiment analysis"
  },
  "categorization": {
    "primary_category": "Main category",
    "secondary_categories": ["Additional relevant categories"],
    "industry": "Relevant industry/domain",
    "document_purpose": "Purpose and intent of the document"
  },
  "quality_assessment": {
    "readability_score": "Easy/Medium/Difficult",
    "information_density": "Low/Medium/High",
    "structural_quality": "Poor/Good/Excellent",
    "completeness": "Incomplete/Adequate/Comprehensive"
  },
  "actionable_insights": {
    "recommendations": ["3-5 actionable recommendations"],
    "potential_concerns": ["Issues or concerns identified"],
    "follow_up_actions": ["Suggested next steps"],
    "related_topics": ["Topics for further research"]
  }
}

Ensure all analysis is accurate, objective, and based solely on the document content.`,
        userPrompt: `Please analyze the following document comprehensively and provide structured insights:

Document Content:
{DOCUMENT_CONTENT}

Provide a thorough analysis covering all aspects mentioned in the system prompt. Be specific, accurate, and actionable in your analysis.`
      },

      summary: {
        systemPrompt: `You are a professional document summarizer. Create clear, concise, and informative summaries that capture the essence of documents while maintaining key details.

Your summaries should:
- Be accurate and objective
- Capture main points and key findings
- Maintain proper context
- Be structured and easy to read
- Highlight actionable information`,
        userPrompt: `Please create a comprehensive summary of the following document:

Document Content:
{DOCUMENT_CONTENT}

Provide:
1. Executive Summary (2-3 sentences)
2. Detailed Summary (200-400 words)
3. Key Takeaways (5-7 bullet points)
4. Important Details (dates, numbers, names, etc.)
5. Conclusion/Implications`
      },

      keywords: {
        systemPrompt: `You are a keyword extraction specialist. Extract relevant, meaningful keywords and phrases from documents to enable better searchability and categorization.

Focus on:
- Domain-specific terminology
- Important concepts and themes
- Named entities (people, places, organizations)
- Technical terms and jargon
- Actionable items and processes`,
        userPrompt: `Extract comprehensive keywords from the following document:

Document Content:
{DOCUMENT_CONTENT}

Provide keywords in this JSON format:
{
  "primary_keywords": ["5-10 most important keywords"],
  "secondary_keywords": ["10-15 supporting keywords"],
  "technical_terms": ["Domain-specific terminology"],
  "named_entities": {
    "people": ["Names mentioned"],
    "organizations": ["Companies, institutions"],
    "locations": ["Places, countries, regions"],
    "products": ["Products, services, tools"]
  },
  "concepts": ["Abstract concepts and themes"],
  "action_items": ["Verbs and action-oriented terms"]
}`
      },

      categorization: {
        systemPrompt: `You are a document classification expert. Categorize documents into appropriate categories and subcategories based on content, purpose, and domain.

Consider multiple classification dimensions:
- Document type (report, manual, research, etc.)
- Industry/domain (technology, healthcare, finance, etc.)
- Purpose (informational, instructional, analytical, etc.)
- Audience (technical, general, executive, etc.)
- Complexity level (basic, intermediate, advanced)`,
        userPrompt: `Categorize the following document:

Document Content:
{DOCUMENT_CONTENT}

Provide categorization in this JSON format:
{
  "primary_category": "Main category",
  "secondary_categories": ["Additional relevant categories"],
  "document_type": "Type of document",
  "industry_domain": "Relevant industry or field",
  "purpose": "Primary purpose of the document",
  "target_audience": "Intended audience",
  "complexity_level": "Complexity rating",
  "confidence_score": 0.95,
  "explanation": "Brief explanation of categorization reasoning"
}`
      },

      sentiment: {
        systemPrompt: `You are a sentiment analysis expert. Analyze the emotional tone, sentiment, and subjective elements in documents.

Analyze:
- Overall sentiment (positive, negative, neutral, mixed)
- Emotional tone and mood
- Confidence and certainty levels
- Objectivity vs subjectivity
- Persuasive elements
- Areas of concern or optimism`,
        userPrompt: `Analyze the sentiment and emotional tone of the following document:

Document Content:
{DOCUMENT_CONTENT}

Provide analysis in this JSON format:
{
  "overall_sentiment": "Positive/Negative/Neutral/Mixed",
  "confidence_score": 0.85,
  "emotional_tone": "Description of emotional tone",
  "subjectivity_score": 0.7,
  "key_emotions": ["List of emotions detected"],
  "sentiment_distribution": {
    "positive": 0.6,
    "negative": 0.1,
    "neutral": 0.3
  },
  "concerns_identified": ["Areas of concern or negativity"],
  "positive_aspects": ["Positive elements identified"],
  "overall_mood": "Description of document mood",
  "persuasive_elements": ["Persuasive techniques used"]
}`
      }
    };
  }

  /**
   * Perform comprehensive document analysis
   */
  async performComprehensiveAnalysis(documentContent, options = {}) {
    try {
      console.log('🔍 Starting comprehensive document analysis...');
      
      const {
        modelType = 'gpt4o-mini',
        includeKeywords = true,
        includeSentiment = true,
        includeCategorization = true,
        includeSummary = true,
        customPrompts = {}
      } = options;

      const results = {
        timestamp: new Date().toISOString(),
        documentLength: documentContent.length,
        analysisType: 'comprehensive',
        modelUsed: modelType,
        results: {}
      };

      // Comprehensive analysis (main analysis)
      console.log('📊 Performing comprehensive analysis...');
      try {
        const comprehensiveResult = await this.azureOpenAI.chatCompletion({
          model: modelType,
          messages: [
            {
              role: 'system',
              content: this.analysisTemplates.comprehensive.systemPrompt
            },
            {
              role: 'user',
              content: this.analysisTemplates.comprehensive.userPrompt.replace('{DOCUMENT_CONTENT}', documentContent)
            }
          ],
          temperature: 0.3,
          max_tokens: 4000
        });

        if (comprehensiveResult && comprehensiveResult.choices && comprehensiveResult.choices[0]) {
          const content = comprehensiveResult.choices[0].message.content;
          try {
            results.results.comprehensive = JSON.parse(content);
          } catch (parseError) {
            console.log('⚠️ Failed to parse comprehensive analysis as JSON, using text format');
            results.results.comprehensive = { raw_analysis: content };
          }
        }
      } catch (error) {
        console.error('❌ Comprehensive analysis failed:', error.message);
        results.results.comprehensive = { error: error.message };
      }

      // Additional specialized analyses
      const specializedAnalyses = [];

      if (includeSummary) {
        specializedAnalyses.push(this.performSummaryAnalysis(documentContent, modelType));
      }

      if (includeKeywords) {
        specializedAnalyses.push(this.performKeywordExtraction(documentContent, modelType));
      }

      if (includeCategorization) {
        specializedAnalyses.push(this.performCategorization(documentContent, modelType));
      }

      if (includeSentiment) {
        specializedAnalyses.push(this.performSentimentAnalysis(documentContent, modelType));
      }

      // Execute all specialized analyses in parallel
      console.log('🔄 Performing specialized analyses...');
      const specializedResults = await Promise.allSettled(specializedAnalyses);

      // Process specialized results
      const analysisTypes = [];
      if (includeSummary) analysisTypes.push('summary');
      if (includeKeywords) analysisTypes.push('keywords');
      if (includeCategorization) analysisTypes.push('categorization');
      if (includeSentiment) analysisTypes.push('sentiment');

      specializedResults.forEach((result, index) => {
        const analysisType = analysisTypes[index];
        if (result.status === 'fulfilled') {
          results.results[analysisType] = result.value;
        } else {
          console.error(`❌ ${analysisType} analysis failed:`, result.reason);
          results.results[analysisType] = { error: result.reason.message };
        }
      });

      // Generate analysis summary
      results.summary = this.generateAnalysisSummary(results.results);
      
      console.log('✅ Comprehensive analysis completed successfully');
      return {
        success: true,
        data: results,
        analysisId: `analysis_${Date.now()}`,
        processingTime: Date.now() - new Date(results.timestamp).getTime()
      };

    } catch (error) {
      console.error('❌ Comprehensive analysis failed:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Perform summary analysis
   */
  async performSummaryAnalysis(documentContent, modelType = 'gpt4o-mini') {
    const result = await this.azureOpenAI.chatCompletion({
      model: modelType,
      messages: [
        {
          role: 'system',
          content: this.analysisTemplates.summary.systemPrompt
        },
        {
          role: 'user',
          content: this.analysisTemplates.summary.userPrompt.replace('{DOCUMENT_CONTENT}', documentContent)
        }
      ],
      temperature: 0.2,
      max_tokens: 1500
    });

    if (result && result.choices && result.choices[0]) {
      const content = result.choices[0].message.content;
      return {
        summary: content,
        wordCount: content.split(' ').length,
        generatedAt: new Date().toISOString()
      };
    } else {
      throw new Error('Invalid response from Azure OpenAI');
    }
  }

  /**
   * Perform keyword extraction
   */
  async performKeywordExtraction(documentContent, modelType = 'gpt4o-mini') {
    const result = await this.azureOpenAI.chatCompletion({
      model: modelType,
      messages: [
        {
          role: 'system',
          content: this.analysisTemplates.keywords.systemPrompt
        },
        {
          role: 'user',
          content: this.analysisTemplates.keywords.userPrompt.replace('{DOCUMENT_CONTENT}', documentContent)
        }
      ],
      temperature: 0.1,
      max_tokens: 1000
    });

    if (result && result.choices && result.choices[0]) {
      const content = result.choices[0].message.content;
      try {
        return JSON.parse(content);
      } catch (parseError) {
        // Fallback to text processing if JSON parsing fails
        return this.extractKeywordsFromText(content);
      }
    } else {
      throw new Error('Invalid response from Azure OpenAI');
    }
  }

  /**
   * Perform categorization
   */
  async performCategorization(documentContent, modelType = 'gpt4o-mini') {
    const result = await this.azureOpenAI.chatCompletion({
      model: modelType,
      messages: [
        {
          role: 'system',
          content: this.analysisTemplates.categorization.systemPrompt
        },
        {
          role: 'user',
          content: this.analysisTemplates.categorization.userPrompt.replace('{DOCUMENT_CONTENT}', documentContent)
        }
      ],
      temperature: 0.1,
      max_tokens: 800
    });

    if (result && result.choices && result.choices[0]) {
      const content = result.choices[0].message.content;
      try {
        return JSON.parse(content);
      } catch (parseError) {
        return {
          primary_category: 'General Document',
          confidence_score: 0.5,
          raw_response: content
        };
      }
    } else {
      throw new Error('Invalid response from Azure OpenAI');
    }
  }

  /**
   * Perform sentiment analysis
   */
  async performSentimentAnalysis(documentContent, modelType = 'gpt4o-mini') {
    const result = await this.azureOpenAI.chatCompletion({
      model: modelType,
      messages: [
        {
          role: 'system',
          content: this.analysisTemplates.sentiment.systemPrompt
        },
        {
          role: 'user',
          content: this.analysisTemplates.sentiment.userPrompt.replace('{DOCUMENT_CONTENT}', documentContent)
        }
      ],
      temperature: 0.1,
      max_tokens: 800
    });

    if (result && result.choices && result.choices[0]) {
      const content = result.choices[0].message.content;
      try {
        return JSON.parse(content);
      } catch (parseError) {
        return {
          overall_sentiment: 'Neutral',
          confidence_score: 0.5,
          raw_response: content
        };
      }
    } else {
      throw new Error('Invalid response from Azure OpenAI');
    }
  }

  /**
   * Generate analysis summary
   */
  generateAnalysisSummary(results) {
    const summary = {
      analysisComplete: true,
      componentsAnalyzed: Object.keys(results).length,
      mainFindings: {},
      recommendations: []
    };

    // Extract key findings from comprehensive analysis
    if (results.comprehensive && !results.comprehensive.error) {
      const comp = results.comprehensive;
      if (comp.summary) {
        summary.mainFindings.executiveSummary = comp.summary.executive_summary;
        summary.mainFindings.keyPoints = comp.summary.key_points;
      }
      if (comp.categorization) {
        summary.mainFindings.category = comp.categorization.primary_category;
      }
      if (comp.sentiment_analysis) {
        summary.mainFindings.sentiment = comp.sentiment_analysis.overall_sentiment;
      }
      if (comp.actionable_insights) {
        summary.recommendations = comp.actionable_insights.recommendations || [];
      }
    }

    return summary;
  }

  /**
   * Extract keywords from text (fallback method)
   */
  extractKeywordsFromText(text) {
    // Simple keyword extraction fallback
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    const frequency = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    const sortedWords = Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .map(([word]) => word);

    return {
      primary_keywords: sortedWords.slice(0, 8),
      secondary_keywords: sortedWords.slice(8, 15),
      technical_terms: [],
      extraction_method: 'fallback_frequency'
    };
  }

  /**
   * Export analysis results in different formats
   */
  async exportAnalysisResults(analysisData, format = 'json') {
    try {
      switch (format.toLowerCase()) {
        case 'json':
          return {
            success: true,
            data: JSON.stringify(analysisData, null, 2),
            contentType: 'application/json',
            filename: `analysis_${Date.now()}.json`
          };

        case 'csv':
          return this.exportToCSV(analysisData);

        case 'pdf':
          return this.exportToPDF(analysisData);

        case 'markdown':
          return this.exportToMarkdown(analysisData);

        case 'summary':
          return this.exportSummaryReport(analysisData);

        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Export to CSV format
   */
  exportToCSV(analysisData) {
    let csvContent = 'Analysis Component,Key,Value\n';
    
    const flattenObject = (obj, prefix = '') => {
      Object.entries(obj).forEach(([key, value]) => {
        const newKey = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          flattenObject(value, newKey);
        } else {
          const valueStr = Array.isArray(value) ? value.join('; ') : String(value);
          csvContent += `"${prefix || 'root'}","${key}","${valueStr.replace(/"/g, '""')}"\n`;
        }
      });
    };

    if (analysisData.results) {
      Object.entries(analysisData.results).forEach(([component, data]) => {
        if (typeof data === 'object' && !data.error) {
          flattenObject(data, component);
        }
      });
    }

    return {
      success: true,
      data: csvContent,
      contentType: 'text/csv',
      filename: `analysis_${Date.now()}.csv`
    };
  }

  /**
   * Export to Markdown format
   */
  exportToMarkdown(analysisData) {
    let markdown = `# Document Analysis Report\n\n`;
    markdown += `**Generated:** ${new Date(analysisData.timestamp).toLocaleString()}\n`;
    markdown += `**Analysis Type:** ${analysisData.analysisType}\n`;
    markdown += `**Model Used:** ${analysisData.modelUsed}\n\n`;

    if (analysisData.summary) {
      markdown += `## Executive Summary\n\n`;
      if (analysisData.summary.mainFindings?.executiveSummary) {
        markdown += `${analysisData.summary.mainFindings.executiveSummary}\n\n`;
      }
    }

    if (analysisData.results) {
      Object.entries(analysisData.results).forEach(([component, data]) => {
        if (data.error) return;
        
        markdown += `## ${component.charAt(0).toUpperCase() + component.slice(1)} Analysis\n\n`;
        
        if (typeof data === 'object') {
          Object.entries(data).forEach(([key, value]) => {
            markdown += `**${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:** `;
            if (Array.isArray(value)) {
              markdown += `\n${value.map(item => `- ${item}`).join('\n')}\n\n`;
            } else if (typeof value === 'object') {
              markdown += `\n${JSON.stringify(value, null, 2)}\n\n`;
            } else {
              markdown += `${value}\n\n`;
            }
          });
        }
      });
    }

    return {
      success: true,
      data: markdown,
      contentType: 'text/markdown',
      filename: `analysis_${Date.now()}.md`
    };
  }

  /**
   * Export summary report
   */
  exportSummaryReport(analysisData) {
    const report = {
      title: 'Document Analysis Summary Report',
      generatedAt: new Date().toISOString(),
      analysisOverview: {
        analysisType: analysisData.analysisType,
        modelUsed: analysisData.modelUsed,
        documentLength: analysisData.documentLength,
        processingTime: analysisData.processingTime
      },
      keyFindings: {},
      recommendations: [],
      fullAnalysis: analysisData
    };

    // Extract key findings
    if (analysisData.results?.comprehensive) {
      const comp = analysisData.results.comprehensive;
      if (comp.summary) {
        report.keyFindings.summary = comp.summary.executive_summary;
        report.keyFindings.keyPoints = comp.summary.key_points;
      }
      if (comp.categorization) {
        report.keyFindings.category = comp.categorization.primary_category;
        report.keyFindings.industry = comp.categorization.industry;
      }
      if (comp.sentiment_analysis) {
        report.keyFindings.sentiment = comp.sentiment_analysis.overall_sentiment;
        report.keyFindings.emotionalTone = comp.sentiment_analysis.emotional_tone;
      }
      if (comp.actionable_insights) {
        report.recommendations = comp.actionable_insights.recommendations || [];
      }
    }

    return {
      success: true,
      data: JSON.stringify(report, null, 2),
      contentType: 'application/json',
      filename: `summary_report_${Date.now()}.json`
    };
  }
}

module.exports = EnhancedDocumentAnalysisService;
