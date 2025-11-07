import axios from 'axios';

/**
 * N8N RAG Service
 * Handles communication with n8n workflow for RAG-based chatbot
 * Uses Pinecone Vector Store for document retrieval and Azure OpenAI for responses
 */
class N8NRagService {
    constructor() {
        // Your n8n webhook URL from the screenshot
        this.webhookUrl = 'https://n8n.srv810548.hstgr.cloud/webhook/summarize-documents';
        this.timeout = 60000; // 60 seconds for complex queries
    }

    /**
     * Send a chat message to the n8n RAG workflow
     * @param {Object} params - Request parameters
     * @param {string} params.message - User's message
     * @param {string} params.userId - User/Workspace ID for document filtering
     * @param {Array} params.context - Conversation history
     * @param {Array} params.documentIds - Optional specific document IDs to query
     * @param {Object} params.metadata - Optional additional metadata
     * @returns {Promise<Object>} Response from n8n workflow
     */
    async sendMessage({ message, userId, context = [], documentIds = [], metadata = {} }) {
        try {
            console.log('🚀 Sending message to n8n RAG workflow...');
            console.log('📨 Message:', message);
            console.log('👤 User ID (raw):', userId);
            
            // Format userId to match Pinecone namespace format: workspace_<userId>
            // This is critical for Pinecone to find the correct namespace
            const formattedUserId = `workspace_${userId}`;
            console.log('🔖 Formatted User ID for Pinecone namespace:', formattedUserId);
            console.log('💬 Context messages:', context.length);
            console.log('📄 Document IDs:', documentIds.length);

            // Prepare the request payload for n8n
            const requestPayload = {
                // User's current query
                message: message,
                
                // User identification for Pinecone namespace filtering
                // IMPORTANT: Must match Pinecone namespace format: workspace_<userId>
                userId: formattedUserId,
                
                // Conversation history for context
                // Format: [{role: 'user', content: '...'}, {role: 'assistant', content: '...'}]
                context: context,
                
                // CRITICAL: Document IDs for Pinecone metadata filtering
                // These are the ONLY documents the user should see results from
                // Pinecone will filter by metadata.document_id field
                documentIds: documentIds,
                
                // Additional metadata
                metadata: {
                    timestamp: new Date().toISOString(),
                    source: 'SmartDocs-Frontend',
                    rawUserId: userId,  // Keep original for reference
                    documentCount: documentIds.length,
                    hasDocumentFilter: documentIds.length > 0,
                    ...metadata
                }
            };

            console.log('📦 Request payload:', JSON.stringify(requestPayload, null, 2));
            console.log(`🔐 Document filtering: ${documentIds.length > 0 ? 'ENABLED with ' + documentIds.length + ' documents' : 'DISABLED (no documents)'}`);

            // Make the request to n8n webhook
            const response = await axios.post(this.webhookUrl, requestPayload, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: this.timeout
            });

            console.log('✅ Response received from n8n workflow');
            console.log('📥 Response data:', response.data);

            // Process the response
            return this.processResponse(response.data);

        } catch (error) {
            console.error('❌ Error calling n8n RAG workflow:', error);
            throw this.handleError(error);
        }
    }

    /**
     * Process the response from n8n workflow
     * Handles various response formats
     */
    processResponse(data) {
        console.log('🔍 Processing n8n response:', JSON.stringify(data, null, 2));
        
        // Helper function to extract text from nested structures
        const extractText = (value) => {
            if (typeof value === 'string') {
                return value;
            }
            if (typeof value === 'object' && value !== null) {
                // Check common text fields in nested objects
                if (value.text) return extractText(value.text);
                if (value.output) return extractText(value.output);
                if (value.answer) return extractText(value.answer);
                if (value.result) return extractText(value.result);
                if (value.content) return extractText(value.content);
                if (value.message) return extractText(value.message);
                if (value.response) return extractText(value.response);
                // Stringify if no text field found
                return JSON.stringify(value);
            }
            return String(value);
        };
        
        // Handle different response formats from n8n
        
        // Format 1: Direct response with 'reply' field
        if (data.reply) {
            return {
                success: true,
                response: extractText(data.reply),
                sources: data.sources || [],
                metadata: data.metadata || {},
                rawData: data
            };
        }

        // Format 2: Response with 'answer' field (from Question Answer Chain)
        if (data.answer) {
            return {
                success: true,
                response: extractText(data.answer),
                sources: data.sources || data.sourceDocuments || [],
                metadata: data.metadata || {},
                rawData: data
            };
        }

        // Format 3: Response with 'output' field
        if (data.output) {
            return {
                success: true,
                response: extractText(data.output),
                sources: data.sources || [],
                metadata: data.metadata || {},
                rawData: data
            };
        }

        // Format 4: Response with 'text' field
        if (data.text) {
            return {
                success: true,
                response: extractText(data.text),
                sources: data.sources || [],
                metadata: data.metadata || {},
                rawData: data
            };
        }

        // Format 5: Response with 'response' field (from Format Response node)
        if (data.response !== undefined) {
            return {
                success: data.success !== false,
                response: extractText(data.response),
                sources: data.sources || [],
                metadata: data.metadata || {},
                rawData: data
            };
        }

        // Format 6: Direct string response
        if (typeof data === 'string') {
            return {
                success: true,
                response: data,
                sources: [],
                metadata: {},
                rawData: data
            };
        }

        // Format 7: Complex object - try to extract meaningful content
        if (typeof data === 'object' && Object.keys(data).length > 0) {
            // Try to find any text-like field
            const possibleTextFields = ['result', 'message', 'content'];
            for (const field of possibleTextFields) {
                if (data[field]) {
                    return {
                        success: true,
                        response: extractText(data[field]),
                        sources: data.sources || [],
                        metadata: data.metadata || {},
                        rawData: data
                    };
                }
            }

            // Last resort: stringify the entire object
            console.warn('⚠️ Could not find standard response field, stringifying entire response');
            return {
                success: true,
                response: JSON.stringify(data, null, 2),
                sources: [],
                metadata: {},
                rawData: data
            };
        }

        // If nothing matches, return an error
        console.error('❌ Unrecognized response format:', data);
        throw new Error('Unable to parse response from n8n workflow');
    }

    /**
     * Handle errors from n8n workflow
     */
    handleError(error) {
        if (error.response) {
            // Server responded with error status
            console.error('Server error response:', error.response.data);
            console.error('Status code:', error.response.status);
            
            return {
                success: false,
                error: error.response.data?.error || error.response.data?.message || 'Server error',
                status: error.response.status,
                details: error.response.data
            };
        } else if (error.request) {
            // Request was made but no response received
            console.error('No response received:', error.request);
            
            return {
                success: false,
                error: 'No response from n8n workflow. Please check if the workflow is active.',
                status: 0,
                details: {
                    message: 'Network error or workflow not responding',
                    webhookUrl: this.webhookUrl
                }
            };
        } else {
            // Something else happened
            console.error('Request error:', error.message);
            
            return {
                success: false,
                error: error.message || 'Failed to send request to n8n workflow',
                status: 0,
                details: { originalError: error.toString() }
            };
        }
    }

    /**
     * Test the n8n webhook connection
     */
    async testConnection() {
        try {
            console.log('🧪 Testing n8n webhook connection...');
            
            const testPayload = {
                message: 'Hello, this is a test message.',
                userId: 'workspace_test-user',  // Use proper namespace format
                context: [],
                metadata: { test: true }
            };

            const response = await axios.post(this.webhookUrl, testPayload, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000
            });

            console.log('✅ n8n webhook is responding');
            return {
                success: true,
                message: 'n8n webhook is active and responding',
                webhookUrl: this.webhookUrl,
                response: response.data
            };

        } catch (error) {
            console.error('❌ n8n webhook connection test failed:', error.message);
            return {
                success: false,
                message: 'n8n webhook is not responding',
                webhookUrl: this.webhookUrl,
                error: error.message
            };
        }
    }

    /**
     * Get the webhook URL
     */
    getWebhookUrl() {
        return this.webhookUrl;
    }

    /**
     * Update the webhook URL (useful for testing or switching environments)
     */
    setWebhookUrl(url) {
        console.log('🔄 Updating n8n webhook URL to:', url);
        this.webhookUrl = url;
    }
}

// Export singleton instance
export default new N8NRagService();
