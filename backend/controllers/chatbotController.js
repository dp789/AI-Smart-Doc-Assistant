const azureOpenAIService = require('../services/azureOpenAIService');
const BlobChunksService = require('../services/blobChunksService');
const { DocumentMetadata } = require('../models/DocumentMetadata');

/**
 * Chatbot Controller
 * Handles chat requests with document context and conversation history
 */
class ChatbotController {
  constructor() {
    this.azureOpenAI = azureOpenAIService;
    this.blobChunksService = new BlobChunksService();
  }

  /**
   * Process chat message with document context
   */
  async processChatMessage(req, res) {
    try {
      console.log('🤖 Processing chat message:', req.body);
      
      const {
        message,
        workspace_id,
        document_category,
        conversation_history = [],
        filters = {},
        max_context_chunks = 5,
        temperature = 0.7,
        model = 'gpt-4o',
        include_sources = true,
        enable_global_search = true,
        global_search_requested = false
      } = req.body;

      // Validate required parameters
      if (!message || !workspace_id) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameters: message, workspace_id'
        });
      }

      // Get document context if workspace_id is provided
      let documentContext = '';
      let sources = [];
      
      if (workspace_id) {
        try {
          console.log(`📚 Fetching document context for workspace: ${workspace_id}`);
          console.log(`🔍 Filters applied:`, filters);
          
          let documents = [];
          
          // If specific document_id is provided in filters, get that document
          if (filters.document_id) {
            console.log(`📄 Fetching specific document: ${filters.document_id}`);
            const specificDoc = await DocumentMetadata.getDocumentByGuid(filters.document_id);
            if (specificDoc) {
              documents = [specificDoc];
            }
          } else if (document_category) {
            // Get documents from the workspace and category
            documents = await DocumentMetadata.getDocumentsByWorkspaceAndCategory(
              workspace_id, 
              document_category
            );
          } else {
            // Get all documents from workspace
            documents = await DocumentMetadata.getDocumentsByWorkspace(workspace_id);
          }
          
          if (documents && documents.length > 0) {
            console.log(`📄 Found ${documents.length} documents`);
            
            // Filter by file type if specified
            if (filters.file_type) {
              documents = documents.filter(doc => {
                const fileTypeMap = { 'pdf': 1, 'docx': 3, 'csv': 8 };
                return doc.file_type === fileTypeMap[filters.file_type];
              });
              console.log(`📄 After file type filter (${filters.file_type}): ${documents.length} documents`);
            }
            
            // Get chunks from the most recent documents
            const recentDocuments = documents.slice(0, 3); // Limit to 3 most recent documents
            const allChunks = [];
            
            for (const doc of recentDocuments) {
              const documentMetadata = {
                workspace_id: doc.workspace_id,
                document_id: doc.document_guid,
                ingestion_source_id: doc.ingestion_source_id?.toString()
              };
              
              const chunksResult = await this.blobChunksService.getDocumentChunks(documentMetadata);
              if (chunksResult.success && chunksResult.chunksData) {
                allChunks.push(...chunksResult.chunksData);
              }
            }
            
            if (allChunks.length > 0) {
              // Process chunks for AI context
              const processedResult = await this.blobChunksService.processChunksForAI(
                allChunks, 
                'balanced', 
                max_context_chunks
              );
              
              if (processedResult.success && processedResult.originalContent) {
                documentContext = processedResult.originalContent.text || processedResult.originalContent;
                console.log(`📝 Generated document context (${documentContext.length} characters)`);
                
                // Extract sources
                if (include_sources && processedResult.sources) {
                  sources = processedResult.sources.map(source => ({
                    title: source.title || source.filename || 'Document',
                    content: source.content?.substring(0, 200) + '...' || '',
                    relevance_score: source.relevance_score || 0,
                    document_id: source.document_id || '',
                    chunk_index: source.chunk_index || 0
                  }));
                }
              }
            }
          } else {
            console.log(`⚠️ No documents found for workspace: ${workspace_id}`);
          }
        } catch (contextError) {
          console.error('❌ Error fetching document context:', contextError);
          // Continue without context rather than failing
        }
      }

      // Prepare conversation messages
      const messages = [];
      
      // Add system message with document context
      const systemPrompt = this.buildSystemPrompt(documentContext, document_category);
      messages.push({
        role: 'system',
        content: systemPrompt
      });
      
      // Add conversation history
      if (conversation_history && conversation_history.length > 0) {
        messages.push(...conversation_history);
      }
      
      // Add current user message
      messages.push({
        role: 'user',
        content: message
      });

      console.log(`💬 Sending ${messages.length} messages to Azure OpenAI`);
      console.log(`🔧 Model: ${model}, Temperature: ${temperature}`);

      // Call Azure OpenAI
      const response = await this.azureOpenAI.chatCompletion({
        model: model,
        messages: messages,
        temperature: temperature,
        max_tokens: 2000
      });

      if (!response || !response.choices || !response.choices[0]) {
        throw new Error('Invalid response from Azure OpenAI');
      }

      const botResponse = response.choices[0].message.content;
      
      console.log('✅ Chat response generated successfully');

      // Return response
      res.json({
        success: true,
        response: botResponse,
        sources: include_sources ? sources : [],
        model: model,
        timestamp: new Date().toISOString(),
        context_used: !!documentContext,
        context_length: documentContext.length
      });

    } catch (error) {
      console.error('❌ Chat processing error:', error);
      
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to process chat message',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Build system prompt with document context
   */
  buildSystemPrompt(documentContext, documentCategory) {
    let systemPrompt = `You are a helpful AI assistant that can answer questions based on provided document context. `;
    
    if (documentCategory) {
      systemPrompt += `You are specifically focused on ${documentCategory} documents. `;
    }
    
    systemPrompt += `Please provide accurate, helpful responses based on the available information. `;
    
    if (documentContext) {
      systemPrompt += `\n\nHere is the relevant document context:\n\n${documentContext}\n\n`;
      systemPrompt += `Use this context to answer questions accurately. If the context doesn't contain relevant information, `;
      systemPrompt += `please say so and provide general guidance if appropriate.`;
    } else {
      systemPrompt += `\n\nNote: No specific document context is available, so please provide general assistance.`;
    }
    
    systemPrompt += `\n\nAlways be helpful, accurate, and professional in your responses.`;
    
    return systemPrompt;
  }

  /**
   * Test chatbot connection
   */
  async testConnection(req, res) {
    try {
      console.log('🧪 Testing chatbot connection...');
      
      // Test Azure OpenAI connection
      const testResponse = await this.azureOpenAI.testConnection();
      
      if (testResponse.success) {
        res.json({
          success: true,
          message: 'Chatbot service is ready',
          azure_openai: testResponse,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Azure OpenAI connection failed',
          details: testResponse,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('❌ Chatbot connection test failed:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Connection test failed',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get available models
   */
  async getAvailableModels(req, res) {
    try {
      const models = [
        { id: 'gpt-4o', name: 'GPT-4o Mini', description: 'Fast and efficient' },
        { id: 'gpt-4o', name: 'GPT-4o', description: 'Most capable model' },
        { id: 'gpt-4', name: 'GPT-4', description: 'High quality responses' },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast and cost-effective' }
      ];

      res.json({
        success: true,
        models: models,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Error getting models:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get available models',
        timestamp: new Date().toISOString()
      });
    }
  }
}

module.exports = new ChatbotController();
