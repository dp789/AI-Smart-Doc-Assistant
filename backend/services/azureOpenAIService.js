const axios = require('axios');

/**
 * Backend Azure OpenAI Service for AI Workflow Builder
 * Handles server-side communication with Azure OpenAI models
 */
class AzureOpenAIService {
  constructor() {
    // Azure OpenAI configuration from environment variables
    this.endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    this.apiKey = process.env.AZURE_OPENAI_API_KEY;
    this.apiVersion = process.env.AZURE_OPENAI_API_VERSION;
    
    // Model deployments (these should match your Azure OpenAI deployments)
    this.deployments = {
      'gpt4o-mini': process.env.AZURE_OPENAI_GPT4O_MINI_DEPLOYMENT || 'gpt-4o',
      'gpt4.1': process.env.AZURE_OPENAI_GPT4_1_DEPLOYMENT || 'gpt-4.1', 
      'gpt4': process.env.AZURE_OPENAI_GPT4_DEPLOYMENT || 'gpt-4',
      'gpt35': process.env.AZURE_OPENAI_GPT35_DEPLOYMENT || 'gpt-35-turbo',
      'gpt4-turbo': process.env.AZURE_OPENAI_GPT4_TURBO_DEPLOYMENT || 'gpt-4-turbo',
      'text-embedding': process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT || 'text-embedding-ada-002'
    };
    
    // Rate limiting configuration
    this.maxRetries = parseInt(process.env.AZURE_OPENAI_MAX_RETRIES) || 3;
    this.retryDelay = parseInt(process.env.AZURE_OPENAI_RETRY_DELAY) || 2000;
    this.defaultModel = process.env.AZURE_OPENAI_DEFAULT_MODEL || 'gpt4o-mini';

    // Default configuration
    this.defaultConfig = {
      temperature: 0.7,
      max_tokens: 2000,
      top_p: 0.95,
      frequency_penalty: 0,
      presence_penalty: 0
    };

    console.log('🤖 Azure OpenAI Service initialized with endpoint:', this.endpoint);
    console.log('📋 Available deployments:', Object.keys(this.deployments));
  }

  /**
   * Sleep utility for retries
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Make API call with retry logic for rate limiting
   */
  async makeAPICallWithRetry(url, config, attempt = 1) {
    try {
      const response = await axios(url, config);
      return response;
    } catch (error) {
      // Handle rate limiting (429 status)
      if (error.response?.status === 429 && attempt <= this.maxRetries) {
        const retryAfter = error.response.headers['retry-after'];
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : this.retryDelay * attempt;
        
        console.log(`⚠️ Rate limited. Retrying attempt ${attempt}/${this.maxRetries} after ${delay}ms delay...`);
        await this.sleep(delay);
        return this.makeAPICallWithRetry(url, config, attempt + 1);
      }
      
      // Handle network errors with retry
      if ((error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') && attempt <= this.maxRetries) {
        console.log(`🔄 Network error. Retrying attempt ${attempt}/${this.maxRetries}...`);
        await this.sleep(this.retryDelay * attempt);
        return this.makeAPICallWithRetry(url, config, attempt + 1);
      }
      
      // If we've exhausted retries or it's a different error, throw it
      if (error.response?.status === 429) {
        throw new Error(`Rate limit exceeded after ${this.maxRetries} retries. Please try again later or use a different model.`);
      }
      
      throw error;
    }
  }

  /**
   * Test Azure OpenAI connection
   */
  async testConnection() {
    try {
      const response = await this.chatCompletion({
        model: this.defaultModel, // Use default model (gpt4o-mini)
        messages: [
          { role: 'user', content: 'Hello, this is a connection test. Please respond with "Connection successful!"' }
        ],
        max_tokens: 50
      });

      return {
        success: true,
        message: 'Azure OpenAI connection successful',
        response: response.choices[0].message.content,
        endpoint: this.endpoint,
        apiVersion: this.apiVersion
      };
    } catch (error) {
      console.error('Azure OpenAI connection test failed:', error);
      return {
        success: false,
        message: `Azure OpenAI connection failed: ${error.message}`,
        error: error.response?.data || error.message,
        endpoint: this.endpoint
      };
    }
  }

  /**
   * Get chat completion from Azure OpenAI
   */
  async chatCompletion({
    model = null, // Will use defaultModel if not specified
    messages = [],
    temperature = this.defaultConfig.temperature,
    max_tokens = this.defaultConfig.max_tokens,
    top_p = this.defaultConfig.top_p,
    frequency_penalty = this.defaultConfig.frequency_penalty,
    presence_penalty = this.defaultConfig.presence_penalty,
    stream = false
  }) {
    // Use specified model or default to gpt4o-mini
    const selectedModel = model || this.defaultModel;
    const deployment = this.deployments[selectedModel] || this.deployments[this.defaultModel];
    const url = `${this.endpoint}openai/deployments/${deployment}/chat/completions?api-version=${this.apiVersion}`;

    const payload = {
      messages,
      temperature,
      max_tokens,
      top_p,
      frequency_penalty,
      presence_penalty,
      stream
    };

    console.log(`🔄 Making Azure OpenAI request to deployment: ${deployment}`);
    console.log(`📍 URL: ${url}`);
    console.log(`📊 Payload:`, JSON.stringify(payload, null, 2));

    try {
      const response = await this.makeAPICallWithRetry(url, {
        method: 'POST',
        data: payload,
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey
        },
        timeout: 120000 // 2 minute timeout
      });

      console.log('✅ Azure OpenAI response received:', {
        model: deployment,
        usage: response.data.usage,
        choices: response.data.choices?.length
      });

      return response.data;
    } catch (error) {
      console.error('❌ Azure OpenAI API Error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });

      // Provide more specific error messages
      if (error.response?.status === 401) {
        throw new Error('Azure OpenAI authentication failed. Please check your API key.');
      } else if (error.response?.status === 404) {
        throw new Error(`Azure OpenAI deployment '${deployment}' not found. Please check your deployment name.`);
      } else if (error.response?.status === 429) {
        throw new Error('Azure OpenAI rate limit exceeded. Please try again later.');
      } else if (error.response?.status === 400) {
        const errorMsg = error.response?.data?.error?.message || 'Bad request to Azure OpenAI';
        throw new Error(`Azure OpenAI request error: ${errorMsg}`);
      }

      throw new Error(`Azure OpenAI request failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Process document with AI
   */
  async processDocument({
    documentContent,
    fileName = '',
    systemPrompt = '',
    userPrompt = '',
    model = 'gpt4',
    temperature = 0.7,
    maxTokens = 2000,
    outputFormat = 'json'
  }) {
    try {
      console.log(`🔍 Processing document: ${fileName} with model: ${model}`);
      
      // Replace placeholders in user prompt
      const processedUserPrompt = userPrompt
        .replace(/{DOCUMENT_CONTENT}/g, documentContent)
        .replace(/{FILE_NAME}/g, fileName)
        .replace(/{UPLOAD_DATE}/g, new Date().toISOString())
        .replace(/{CATEGORY}/g, 'Unknown')
        .replace(/{FILE_SIZE}/g, `${documentContent.length} characters`);

      const messages = [
        {
          role: 'system',
          content: systemPrompt || 'You are a helpful AI assistant that analyzes documents and provides structured insights.'
        },
        {
          role: 'user',
          content: processedUserPrompt
        }
      ];

      const response = await this.chatCompletion({
        model,
        messages,
        temperature,
        max_tokens: maxTokens
      });

      const aiResponse = response.choices[0].message.content;

      // Parse response based on output format
      let processedResponse;
      if (outputFormat === 'json') {
        try {
          // Try to extract JSON from the response if it's wrapped in code blocks
          const jsonMatch = aiResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
          const jsonText = jsonMatch ? jsonMatch[1] : aiResponse;
          processedResponse = JSON.parse(jsonText);
        } catch (parseError) {
          console.warn('Failed to parse JSON response, returning structured object:', parseError.message);
          // If JSON parsing fails, return structured object
          processedResponse = {
            analysis: aiResponse,
            metadata: {
              model,
              fileName,
              processedAt: new Date().toISOString(),
              parseError: 'Response was not valid JSON',
              rawResponse: aiResponse
            }
          };
        }
      } else {
        processedResponse = aiResponse;
      }

      return {
        success: true,
        data: processedResponse,
        metadata: {
          model,
          fileName,
          processedAt: new Date().toISOString(),
          usage: response.usage,
          promptTokens: response.usage?.prompt_tokens,
          completionTokens: response.usage?.completion_tokens,
          totalTokens: response.usage?.total_tokens
        }
      };
    } catch (error) {
      console.error('Document processing error:', error);
      throw error;
    }
  }

  /**
   * Process multiple documents in batch
   */
  async processBatchDocuments({
    documents = [],
    systemPrompt = '',
    userPrompt = '',
    model = 'gpt4',
    temperature = 0.7,
    maxTokens = 2000,
    outputFormat = 'json',
    batchMode = 'individual' // 'individual', 'combined', 'summary'
  }) {
    const results = [];
    
    try {
      console.log(`📚 Processing ${documents.length} documents in ${batchMode} mode`);

      if (batchMode === 'individual') {
        // Process each document separately
        for (let i = 0; i < documents.length; i++) {
          const doc = documents[i];
          console.log(`📄 Processing document ${i + 1}/${documents.length}: ${doc.fileName}`);
          
          try {
            const result = await this.processDocument({
              documentContent: doc.content,
              fileName: doc.fileName,
              systemPrompt,
              userPrompt,
              model,
              temperature,
              maxTokens,
              outputFormat
            });
            results.push(result);
          } catch (docError) {
            console.error(`Error processing document ${doc.fileName}:`, docError);
            results.push({
              success: false,
              error: docError.message,
              fileName: doc.fileName
            });
          }
        }
      } else if (batchMode === 'combined') {
        // Combine all documents and process together
        const combinedContent = documents.map((doc, index) => 
          `--- Document ${index + 1}: ${doc.fileName} ---\n${doc.content}\n`
        ).join('\n\n');

        const result = await this.processDocument({
          documentContent: combinedContent,
          fileName: `Batch_${documents.length}_documents`,
          systemPrompt,
          userPrompt,
          model,
          temperature,
          maxTokens,
          outputFormat
        });
        results.push(result);
      } else if (batchMode === 'summary') {
        // Process each document first, then create summary
        const individualResults = [];
        
        for (const doc of documents) {
          try {
            const result = await this.processDocument({
              documentContent: doc.content,
              fileName: doc.fileName,
              systemPrompt,
              userPrompt,
              model,
              temperature,
              maxTokens,
              outputFormat
            });
            individualResults.push(result);
          } catch (docError) {
            console.error(`Error in summary mode for ${doc.fileName}:`, docError);
            individualResults.push({
              success: false,
              error: docError.message,
              fileName: doc.fileName
            });
          }
        }

        // Create summary of all results
        const summaryPrompt = `Please create a comprehensive summary and analysis of the following document processing results:

${individualResults.map((result, index) => 
  `Document ${index + 1}: ${documents[index].fileName}
Analysis: ${JSON.stringify(result.data, null, 2)}
`).join('\n\n')}

Provide:
1. Overall summary of all documents
2. Common themes and patterns
3. Key insights across all documents
4. Recommendations based on collective analysis
5. Document comparison and contrast

Format your response as structured JSON.`;

        const summaryResult = await this.chatCompletion({
          model,
          messages: [
            { role: 'system', content: 'You are an expert analyst creating comprehensive summaries.' },
            { role: 'user', content: summaryPrompt }
          ],
          temperature,
          max_tokens: maxTokens
        });

        results.push({
          success: true,
          data: {
            summary: summaryResult.choices[0].message.content,
            individualResults,
            documentCount: documents.length
          },
          metadata: {
            batchMode: 'summary',
            processedAt: new Date().toISOString(),
            usage: summaryResult.usage
          }
        });
      }

      return {
        success: true,
        results,
        batchMetadata: {
          totalDocuments: documents.length,
          batchMode,
          processedAt: new Date().toISOString(),
          model,
          successfulDocuments: results.filter(r => r.success).length,
          failedDocuments: results.filter(r => !r.success).length
        }
      };
    } catch (error) {
      console.error('Batch processing error:', error);
      throw error;
    }
  }

  /**
   * Generate embeddings for text
   */
  async generateEmbeddings(text) {
    const deployment = this.deployments['text-embedding'];
    const url = `${this.endpoint}openai/deployments/${deployment}/embeddings?api-version=${this.apiVersion}`;

    try {
      console.log(`🔗 Generating embeddings using deployment: ${deployment}`);
      
      const response = await axios.post(url, {
        input: text
      }, {
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey
        },
        timeout: 60000
      });

      console.log('✅ Embeddings generated successfully');
      return response.data;
    } catch (error) {
      console.error('Embeddings generation error:', error);
      throw new Error(`Embeddings generation failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Get available models
   */
  getAvailableModels() {
    return Object.keys(this.deployments).map(key => ({
      id: key,
      name: this.deployments[key],
      displayName: this.getModelDisplayName(key)
    }));
  }

  /**
   * Get model display name
   */
  getModelDisplayName(modelId) {
    const names = {
      'gpt4': 'GPT-4 (Most Capable)',
      'gpt35': 'GPT-3.5 Turbo (Fast & Efficient)',
      'gpt4-turbo': 'GPT-4 Turbo (Latest)',
      'text-embedding': 'Text Embedding (Ada-002)'
    };
    return names[modelId] || modelId;
  }

  /**
   * Estimate token count (rough approximation)
   */
  estimateTokens(text) {
    // Rough approximation: 1 token ≈ 4 characters for English
    return Math.ceil(text.length / 4);
  }

  /**
   * Validate configuration
   */
  validateConfig() {
    const issues = [];

    if (!this.apiKey) {
      issues.push('Azure OpenAI API Key is missing (AZURE_OPENAI_API_KEY)');
    }

    if (!this.endpoint) {
      issues.push('Azure OpenAI Endpoint is missing (AZURE_OPENAI_ENDPOINT)');
    }

    if (!this.endpoint.endsWith('/')) {
      this.endpoint += '/';
    }

    return {
      isValid: issues.length === 0,
      issues,
      config: {
        endpoint: this.endpoint,
        apiVersion: this.apiVersion,
        deployments: this.deployments
      }
    };
  }
}

// Create and export singleton instance
const azureOpenAIService = new AzureOpenAIService();
module.exports = azureOpenAIService;
