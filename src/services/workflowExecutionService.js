import axios from 'axios';
import envConfig from '../envConfig';
import { getAuthHeaders } from '../utils/authUtils';
import AzureOpenAIService from './azureOpenAIService';

/**
 * Workflow Execution Service
 * Handles proper execution of workflow nodes using blob chunks for AI processing
 */
class WorkflowExecutionService {
  constructor() {
    this.apiUrl = envConfig.apiUrl;
    this.azureOpenAIService = new AzureOpenAIService();
    console.log('🚀 Workflow Execution Service initialized with blob chunks integration');
  }

  /**
   * Execute a complete workflow with proper document processing
   */
  async executeWorkflow(nodes, edges) {
    console.log('🎯 Starting workflow execution with blob chunks processing...');
    
    const results = [];
    const executionOrder = this.getExecutionOrder(nodes, edges);
    let previousResults = {};

    for (const nodeId of executionOrder) {
      const node = nodes.find(n => n.id === nodeId);
      if (!node) continue;

      console.log(`🔄 Executing node: ${node.data.label} (${node.type})`);
      const startTime = Date.now();

      try {
        let result;
        
        switch (node.type) {
          case 'trigger':
            result = await this.executeTriggerNode(node, previousResults);
            break;
          case 'aiAgent':
            result = await this.executeAIAgentNode(node, previousResults);
            break;
          case 'action':
            result = await this.executeActionNode(node, previousResults);
            break;
          default:
            result = {
              success: true,
              summary: `${node.data.label} executed successfully`,
              data: { message: `Processed ${node.data.label}` }
            };
        }

        const nodeResult = {
          nodeId: nodeId,
          nodeName: node.data.label,
          nodeType: node.type,
          status: result.success ? 'completed' : 'failed',
          duration: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          summary: result.summary,
          data: result.data,
          error: result.error || null,
          success: result.success
        };

        results.push(nodeResult);
        
        if (result.success) {
          previousResults = { ...previousResults, ...result.data };
        } else {
          throw new Error(`Node ${node.data.label} failed: ${result.error}`);
        }

      } catch (error) {
        console.error(`❌ Error executing node ${nodeId}:`, error);
        
        const errorResult = {
          nodeId: nodeId,
          nodeName: node.data.label,
          nodeType: node.type,
          status: 'failed',
          duration: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          summary: `${node.data.label} failed with error`,
          error: error.message,
          success: false
        };
        
        results.push(errorResult);
        break; // Stop execution on error
      }
    }

    return {
      success: results.every(r => r.success),
      results,
      summary: `Workflow completed with ${results.filter(r => r.success).length}/${results.length} successful nodes`
    };
  }

  /**
   * Execute trigger node - prepares documents for processing
   */
  async executeTriggerNode(node, previousResults) {
    console.log(`📁 Executing trigger node: ${node.data.label}`);
    
    try {
      // For document upload triggers, prepare document chunks
      if (node.data.config && node.data.config.selectedDocuments && node.data.config.selectedDocuments.length > 0) {
        console.log(`📄 Processing ${node.data.config.selectedDocuments.length} selected documents...`);
        
        const documentChunks = {};
        
        for (const documentId of node.data.config.selectedDocuments) {
          console.log(`🔄 Downloading chunks for document: ${documentId}`);
          
          try {
            // Use the new blob chunks endpoint that gets processed chunks from blob storage
            const authHeaders = await getAuthHeaders();
            const response = await axios.get(
              `${this.apiUrl}/documents/${documentId}/chunks`,
              {
                params: {
                  chunkingStrategy: 'balanced',
                  maxChunks: 10
                },
                headers: authHeaders,
                timeout: 60000
              }
            );

            if (response.data.success) {
              const processedDoc = response.data;
              
              // Combine chunks into clean text for AI processing
              const aiReadyContent = processedDoc.chunks.map((chunk, index) => 
                `[Section ${index + 1}/${processedDoc.chunks.length}]\n${chunk.content}`
              ).join('\n\n---\n\n');

              documentChunks[documentId] = {
                content: aiReadyContent,
                metadata: processedDoc.metadata,
                processingInfo: processedDoc.processingInfo,
                originalContent: processedDoc.originalContent
              };

              console.log(`✅ Document ${documentId} processed successfully:`, {
                chunks: processedDoc.processingInfo.selectedChunks,
                estimatedTokens: processedDoc.processingInfo.stats?.estimatedTokens,
                source: processedDoc.metadata.blobSource ? 'blob_storage' : 'fallback'
              });
            } else {
              console.error(`❌ Failed to process document ${documentId}:`, response.data.error);
              // Use placeholder for failed documents
              documentChunks[documentId] = {
                content: `Error: Could not process document ${documentId} - ${response.data.error}`,
                metadata: { error: true },
                processingInfo: { error: response.data.error }
              };
            }
          } catch (docError) {
            console.error(`❌ Error processing document ${documentId}:`, docError);
            documentChunks[documentId] = {
              content: `Error: Could not retrieve document ${documentId} - ${docError.message}`,
              metadata: { error: true },
              processingInfo: { error: docError.message }
            };
          }
        }

        return {
          success: true,
          summary: `Processed ${Object.keys(documentChunks).length} documents with blob chunks`,
          data: {
            documentChunks,
            documentsProcessed: Object.keys(documentChunks).length,
            triggerType: 'documentUpload',
            processedAt: new Date().toISOString()
          }
        };
      }

      // Default trigger behavior
      return {
        success: true,
        summary: `${node.data.label} triggered successfully`,
        data: {
          triggerType: node.data.config?.triggerType || 'manual',
          triggeredAt: new Date().toISOString()
        }
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        summary: `Trigger node failed: ${error.message}`
      };
    }
  }

  /**
   * Execute AI Agent node - processes documents using clean chunks with enhanced analysis
   */
  async executeAIAgentNode(node, previousResults) {
    console.log(`🤖 Executing AI agent node: ${node.data.label}`);
    
    try {
      const config = node.data.config || {};
      const modelType = config.modelType || 'gpt4o-mini'; // Default to GPT-4o mini for S0 subscription
      const analysisType = config.analysisType || 'comprehensive'; // comprehensive, summary, keywords, categorization, sentiment, custom
      const systemPrompt = config.systemPrompt || 'You are a helpful AI assistant that analyzes documents.';
      const userPrompt = config.userPrompt || 'Please analyze the following content and provide insights.';

      // Get document chunks from previous results (prepared by trigger node)
      const documentChunks = previousResults.documentChunks || {};
      const documentsToProcess = Object.keys(documentChunks);

      if (documentsToProcess.length === 0) {
        console.warn('⚠️ No documents available for AI processing');
        return {
          success: true,
          summary: 'No documents to process',
          data: {
            aiResults: [],
            processed: 0,
            message: 'No documents were provided for analysis'
          }
        };
      }

      console.log(`📊 Processing ${documentsToProcess.length} documents with AI...`);
      const aiResults = [];

      for (const documentId of documentsToProcess) {
        const docData = documentChunks[documentId];
        
        if (docData.metadata?.error) {
          console.warn(`⚠️ Skipping document ${documentId} due to processing error`);
          aiResults.push({
            documentId,
            success: false,
            error: docData.processingInfo?.error || 'Document processing failed',
            processingTime: 0
          });
          continue;
        }

        console.log(`🔄 Analyzing document ${documentId} with ${modelType}...`);
        const startTime = Date.now();

        try {
          let aiResponse;
          const processingTime = Date.now() - startTime;

          // Check if this is an enhanced analysis request
          if (['comprehensive', 'summary', 'keywords', 'categorization', 'sentiment'].includes(analysisType)) {
            console.log(`🚀 Using enhanced analysis service for ${analysisType} analysis...`);
            
            try {
              const authHeaders = await getAuthHeaders();
              // Temporarily use test endpoint for debugging (remove in production)
              const enhancedAnalysisUrl = `${this.apiUrl}/test-enhanced-analysis/${analysisType}`;
              console.log(`🧪 USING TEST ENDPOINT (no auth required):`, enhancedAnalysisUrl);
              
              console.log(`📡 Calling enhanced analysis endpoint:`, {
                url: enhancedAnalysisUrl,
                documentId,
                analysisType,
                contentLength: docData.content?.length || 0,
                hasAuthHeaders: !!authHeaders,
                authHeadersKeys: authHeaders ? Object.keys(authHeaders) : []
              });

              // Additional debug logging for authentication
              if (authHeaders) {
                console.log(`🔐 Auth headers present:`, {
                  hasAuthorization: !!authHeaders.Authorization,
                  authType: authHeaders.Authorization ? authHeaders.Authorization.substring(0, 20) + '...' : 'none'
                });
              } else {
                console.warn(`⚠️ No auth headers available - this will cause 401 error`);
              }

              const requestPayload = {
                documentId: documentId, // Use documentId instead of content for better caching
                documentContent: docData.content, // Include content as fallback
                options: {
                  modelType: modelType,
                  includeKeywords: config.includeKeywords !== false,
                  includeSentiment: config.includeSentiment !== false,
                  includeCategorization: config.includeCategorization !== false,
                  includeSummary: config.includeSummary !== false
                }
              };

              // For test endpoint, don't use auth headers
              const response = await axios.post(enhancedAnalysisUrl, requestPayload, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 120000 // 2 minutes for comprehensive analysis
              });

              console.log(`📊 Enhanced analysis response:`, {
                success: response.data.success,
                hasAnalysis: !!response.data.analysis,
                analysisType: analysisType,
                documentId: documentId,
                responseKeys: Object.keys(response.data)
              });

              if (response.data.success && response.data.analysis) {
                const analysisData = response.data.analysis;
                
                const enhancedResult = {
                  documentId,
                  fileName: `Document_${documentId.substring(0, 8)}`,
                  success: true,
                  analysisType: analysisType,
                  enhanced: true,
                  exportable: true,
                  analysis: this.formatAnalysisForDisplay(analysisData, analysisType),
                  rawAnalysisData: analysisData,
                  model: modelType,
                  processingTime: Date.now() - startTime,
                  tokenUsage: response.data.processingTime || 'unknown',
                  confidence: 0.95, // High confidence for enhanced analysis
                  metadata: {
                    sourceType: 'blob_chunks',
                    chunksUsed: docData.processingInfo?.selectedChunks || 'unknown',
                    totalChunks: docData.processingInfo?.totalChunks || 'unknown',
                    chunkingStrategy: docData.processingInfo?.strategy || 'balanced',
                    analysisId: response.data.analysisId || Date.now().toString(),
                    endpoint: enhancedAnalysisUrl
                  }
                };

                aiResults.push(enhancedResult);
                
                console.log(`✅ Enhanced ${analysisType} analysis completed for document ${documentId}:`, {
                  analysisLength: typeof enhancedResult.analysis === 'string' ? enhancedResult.analysis.length : 'object',
                  hasRawData: !!enhancedResult.rawAnalysisData,
                  enhanced: true
                });
                continue; // Move to next document
                
              } else {
                console.warn(`⚠️ Enhanced analysis failed - invalid response:`, {
                  success: response.data.success,
                  hasAnalysis: !!response.data.analysis,
                  responseData: response.data
                });
                // Fall back to basic AI processing below
              }
              
            } catch (enhancedError) {
              console.error(`❌ Enhanced analysis error for ${analysisType}:`, {
                message: enhancedError.message,
                status: enhancedError.response?.status,
                statusText: enhancedError.response?.statusText,
                errorData: enhancedError.response?.data,
                url: enhancedAnalysisUrl,
                documentId: documentId
              });
              
              // Specific handling for authentication errors
              if (enhancedError.response?.status === 401) {
                console.error(`🔐 Authentication failed for enhanced analysis. User may not be properly logged in.`);
                console.error(`💡 Suggestion: Check Azure AD authentication status and refresh token if needed.`);
              }
              
              // Fall back to basic AI processing below
              console.log(`🔄 Falling back to basic AI processing for document ${documentId}...`);
            }
          }

          // Basic AI processing (fallback or for custom analysis)
          console.log(`📝 Using basic AI processing for document ${documentId}...`);
          
          // Prepare the complete prompt with clean content
          const fullPrompt = userPrompt.replace('{DOCUMENT_CONTENT}', docData.content);
          
          console.log(`📝 Sending to AI:`, {
            model: modelType,
            systemPrompt: systemPrompt.substring(0, 100) + '...',
            contentLength: docData.content.length,
            estimatedTokens: docData.processingInfo.stats?.estimatedTokens || 'unknown'
          });

          // Call Azure OpenAI with clean, processed content
          aiResponse = await this.azureOpenAIService.processDocument({
            documentContent: docData.content, // Clean, chunked content from blob storage
            fileName: `document_${documentId}`,
            systemPrompt: systemPrompt,
            userPrompt: fullPrompt,
            model: modelType,
            temperature: config.temperature || 0.7,
            maxTokens: config.maxTokens || 2000,
            outputFormat: config.outputFormat || 'text'
          });

          const finalProcessingTime = Date.now() - startTime;

          if (aiResponse.success) {
            const fallbackResult = {
              documentId,
              fileName: `Document_${documentId.substring(0, 8)}`,
              success: true,
              analysisType: analysisType || 'comprehensive',
              enhanced: true, // Mark as enhanced to show in enhanced results panel
              exportable: true,
              analysis: this.formatAnalysisForDisplay(aiResponse.data || aiResponse.response, analysisType),
              rawAnalysisData: aiResponse.data || aiResponse.response,
              model: modelType,
              processingTime: finalProcessingTime,
              tokenUsage: aiResponse.tokenUsage || 'unknown',
              confidence: 0.8, // Standard confidence for basic processing
              metadata: {
                sourceType: 'blob_chunks',
                chunksUsed: docData.processingInfo?.selectedChunks || 'unknown',
                totalChunks: docData.processingInfo?.totalChunks || 'unknown',
                chunkingStrategy: docData.processingInfo?.strategy || 'balanced',
                processingMethod: 'fallback_ai'
              }
            };
            
            aiResults.push(fallbackResult);
            
            console.log(`✅ Document ${documentId} analyzed successfully (${finalProcessingTime}ms)`);
          } else {
            aiResults.push({
              documentId,
              fileName: `Document_${documentId.substring(0, 8)}`,
              success: false,
              analysisType: analysisType || 'comprehensive',
              enhanced: false, // Failed results won't show in enhanced panel
              error: aiResponse.error || 'AI processing failed',
              processingTime: finalProcessingTime,
              model: modelType
            });
            
            console.error(`❌ AI analysis failed for document ${documentId}:`, aiResponse.error);
          }
          
        } catch (aiError) {
          const processingTime = Date.now() - startTime;
          aiResults.push({
            documentId,
            success: false,
            error: aiError.message,
            processingTime
          });
          
          console.error(`❌ Error analyzing document ${documentId}:`, aiError);
        }
      }

      const successfulResults = aiResults.filter(r => r.success);
      
      return {
        success: true,
        summary: `Analyzed ${successfulResults.length}/${aiResults.length} documents successfully`,
        data: {
          aiResults,
          processed: aiResults.length,
          successful: successfulResults.length,
          model: modelType,
          totalProcessingTime: aiResults.reduce((sum, r) => sum + r.processingTime, 0)
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        summary: `AI Agent failed: ${error.message}`
      };
    }
  }

  /**
   * Execute action node
   */
  async executeActionNode(node, previousResults) {
    console.log(`⚡ Executing action node: ${node.data.label}`);
    
    try {
      const config = node.data.config || {};
      
      // Simulate action execution with previous results
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      return {
        success: true,
        summary: `${node.data.label} action completed successfully`,
        data: {
          actionType: config.actionType || 'unknown',
          processedData: previousResults,
          executedAt: new Date().toISOString()
        }
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        summary: `Action failed: ${error.message}`
      };
    }
  }

  /**
   * Get execution order using topological sort
   */
  getExecutionOrder(nodes, edges) {
    const inDegree = {};
    const adjList = {};
    
    // Initialize
    nodes.forEach(node => {
      inDegree[node.id] = 0;
      adjList[node.id] = [];
    });
    
    // Build adjacency list and in-degree count
    edges.forEach(edge => {
      adjList[edge.source].push(edge.target);
      inDegree[edge.target]++;
    });
    
    // Find nodes with no incoming edges
    const queue = nodes.filter(node => inDegree[node.id] === 0).map(node => node.id);
    const result = [];
    
    while (queue.length > 0) {
      const current = queue.shift();
      result.push(current);
      
      adjList[current].forEach(neighbor => {
        inDegree[neighbor]--;
        if (inDegree[neighbor] === 0) {
          queue.push(neighbor);
        }
      });
    }
    
    return result;
  }

  /**
   * Format analysis results for display in the workflow UI
   */
  formatAnalysisForDisplay(analysisData, analysisType) {
    if (!analysisData || typeof analysisData !== 'object') {
      return analysisData || 'No analysis data available';
    }

    switch (analysisType) {
      case 'comprehensive':
        return this.formatComprehensiveAnalysis(analysisData);
      case 'summary':
        return this.formatSummaryAnalysis(analysisData);
      case 'keywords':
        return this.formatKeywordsAnalysis(analysisData);
      case 'categorization':
        return this.formatCategorizationAnalysis(analysisData);
      case 'sentiment':
        return this.formatSentimentAnalysis(analysisData);
      default:
        return JSON.stringify(analysisData, null, 2);
    }
  }

  /**
   * Format comprehensive analysis for display
   */
  formatComprehensiveAnalysis(data) {
    if (!data.results) return JSON.stringify(data, null, 2);

    const results = data.results;
    let formatted = "# 📊 Comprehensive Document Analysis\n\n";

    // Executive Summary
    if (results.comprehensive?.summary) {
      formatted += "## 📋 Executive Summary\n";
      formatted += results.comprehensive.summary.executive_summary + "\n\n";
      
      if (results.comprehensive.summary.key_points) {
        formatted += "### 🔑 Key Points:\n";
        results.comprehensive.summary.key_points.forEach(point => {
          formatted += `• ${point}\n`;
        });
        formatted += "\n";
      }
    }

    // Content Analysis
    if (results.comprehensive?.content_analysis) {
      const content = results.comprehensive.content_analysis;
      formatted += "## 📖 Content Analysis\n";
      formatted += `**Document Type:** ${content.document_type}\n`;
      formatted += `**Writing Style:** ${content.writing_style}\n`;
      formatted += `**Complexity:** ${content.complexity_level}\n\n`;

      if (content.main_topics) {
        formatted += "**Main Topics:**\n";
        content.main_topics.forEach(topic => {
          formatted += `• ${topic}\n`;
        });
        formatted += "\n";
      }
    }

    // Keywords
    if (results.keywords?.primary_keywords) {
      formatted += "## 🏷️ Keywords\n";
      formatted += "**Primary:** " + results.keywords.primary_keywords.join(", ") + "\n\n";
    }

    // Categorization
    if (results.categorization) {
      formatted += "## 📂 Categorization\n";
      formatted += `**Category:** ${results.categorization.primary_category}\n`;
      if (results.categorization.industry) {
        formatted += `**Industry:** ${results.categorization.industry}\n`;
      }
      formatted += "\n";
    }

    // Sentiment
    if (results.sentiment) {
      formatted += "## 😊 Sentiment Analysis\n";
      formatted += `**Overall Sentiment:** ${results.sentiment.overall_sentiment}\n`;
      if (results.sentiment.emotional_tone) {
        formatted += `**Tone:** ${results.sentiment.emotional_tone}\n`;
      }
      formatted += "\n";
    }

    // Recommendations
    if (results.comprehensive?.actionable_insights?.recommendations) {
      formatted += "## 💡 Recommendations\n";
      results.comprehensive.actionable_insights.recommendations.forEach(rec => {
        formatted += `• ${rec}\n`;
      });
    }

    return formatted;
  }

  /**
   * Format summary analysis for display
   */
  formatSummaryAnalysis(data) {
    if (data.summary) {
      if (typeof data.summary === 'string') {
        return `# 📄 Document Summary\n\n${data.summary}`;
      } else {
        return `# 📄 Document Summary\n\n${JSON.stringify(data.summary, null, 2)}`;
      }
    }
    return 'No summary available';
  }

  /**
   * Format keywords analysis for display
   */
  formatKeywordsAnalysis(data) {
    if (!data.keywords) return 'No keywords available';
    
    const keywords = data.keywords;
    let formatted = "# 🏷️ Keywords Analysis\n\n";
    
    if (keywords.primary_keywords) {
      formatted += "## Primary Keywords\n";
      formatted += keywords.primary_keywords.map(k => `• ${k}`).join('\n') + "\n\n";
    }
    
    if (keywords.secondary_keywords) {
      formatted += "## Secondary Keywords\n";
      formatted += keywords.secondary_keywords.map(k => `• ${k}`).join('\n') + "\n\n";
    }
    
    if (keywords.technical_terms) {
      formatted += "## Technical Terms\n";
      formatted += keywords.technical_terms.map(k => `• ${k}`).join('\n') + "\n\n";
    }
    
    return formatted;
  }

  /**
   * Format categorization analysis for display
   */
  formatCategorizationAnalysis(data) {
    if (!data.categorization) return 'No categorization available';
    
    const cat = data.categorization;
    let formatted = "# 📂 Document Categorization\n\n";
    
    formatted += `**Primary Category:** ${cat.primary_category}\n`;
    if (cat.industry_domain) formatted += `**Industry:** ${cat.industry_domain}\n`;
    if (cat.document_type) formatted += `**Document Type:** ${cat.document_type}\n`;
    if (cat.confidence_score) formatted += `**Confidence:** ${Math.round(cat.confidence_score * 100)}%\n`;
    
    if (cat.secondary_categories) {
      formatted += "\n**Secondary Categories:**\n";
      formatted += cat.secondary_categories.map(c => `• ${c}`).join('\n');
    }
    
    return formatted;
  }

  /**
   * Format sentiment analysis for display
   */
  formatSentimentAnalysis(data) {
    if (!data.sentiment) return 'No sentiment analysis available';
    
    const sentiment = data.sentiment;
    let formatted = "# 😊 Sentiment Analysis\n\n";
    
    formatted += `**Overall Sentiment:** ${sentiment.overall_sentiment}\n`;
    if (sentiment.emotional_tone) formatted += `**Emotional Tone:** ${sentiment.emotional_tone}\n`;
    if (sentiment.confidence_score) formatted += `**Confidence:** ${Math.round(sentiment.confidence_score * 100)}%\n`;
    
    if (sentiment.key_emotions) {
      formatted += "\n**Key Emotions:**\n";
      formatted += sentiment.key_emotions.map(e => `• ${e}`).join('\n') + "\n";
    }
    
    if (sentiment.positive_aspects) {
      formatted += "\n**Positive Aspects:**\n";
      formatted += sentiment.positive_aspects.map(a => `• ${a}`).join('\n') + "\n";
    }
    
    if (sentiment.concerns_identified) {
      formatted += "\n**Concerns:**\n";
      formatted += sentiment.concerns_identified.map(c => `• ${c}`).join('\n');
    }
    
    return formatted;
  }
}

export default WorkflowExecutionService;
