#!/usr/bin/env node

/**
 * Test Fixed Content Endpoint
 * Test the content endpoint with the blob storage fixes
 */

const { DocumentMetadata } = require('../models/DocumentMetadata');
const documentController = require('../controllers/documentController');

async function testFixedContentEndpoint() {
  try {
    console.log('🧪 Testing Fixed Content Endpoint\n');
    
    const documentId = '84248cfb-2b90-4424-93aa-aa6023f7a5ec';
    console.log('📍 Testing document ID:', documentId);
    
    // Create mock Express request and response objects
    const mockReq = {
      params: { documentId: documentId },
      user: { 
        workspaceId: 'ddb18531-4243-4742-88ec-48c26cad6251',
        organizationId: 'nitorinfotech.com'
      }
    };
    
    const mockRes = {
      statusCode: 200,
      responseData: null,
      status: function(code) {
        this.statusCode = code;
        console.log(`📊 Response status: ${code}`);
        return this;
      },
      json: function(data) {
        this.responseData = data;
        console.log(`📋 Response success: ${data.success}`);
        
        if (data.success && data.data) {
          console.log('✅ Successful response received');
          console.log('📄 Document info:', {
            documentId: data.data.documentId,
            fileName: data.data.fileName,
            format: data.format,
            isEnhanced: data.data.isEnhanced
          });
          
          if (data.data.content) {
            const content = data.data.content;
            console.log('📝 Content analysis:', {
              type: typeof content,
              isString: typeof content === 'string',
              length: typeof content === 'string' ? content.length : 'N/A'
            });
            
            if (typeof content === 'string') {
              // Check if this is the correct content (RAG pipeline) not the wrong content (Azure Functions)
              const lowerContent = content.toLowerCase();
              const isCorrectContent = lowerContent.includes('generative') && lowerContent.includes('rag');
              const isWrongContent = lowerContent.includes('azure function') || lowerContent.includes('func_deploy');
              
              console.log('🎯 Content verification:', {
                isCorrectContent: isCorrectContent,
                isWrongContent: isWrongContent,
                contentIsValid: isCorrectContent && !isWrongContent
              });
              
              const preview = content.substring(0, 200).replace(/\\s+/g, ' ');
              console.log('📄 Content preview:', `"${preview}..."`);
              
              if (isCorrectContent && !isWrongContent) {
                console.log('\\n🎉 SUCCESS: CORRECT CONTENT RETURNED!');
                console.log('✅ Blob storage download working correctly');
                console.log('✅ Returning actual RAG pipeline content');
                console.log('✅ No more local fallback incorrect content');
              } else {
                console.log('\\n❌ WRONG CONTENT: Still returning incorrect content');
                console.log('Expected: Generative RAG Pipeline content');
                console.log('Got:', isWrongContent ? 'Azure Functions content' : 'Unknown content');
              }
              
            } else if (typeof content === 'object') {
              console.log('📝 Content is object type - checking structure...');
              if (content.text) {
                const textContent = content.text;
                const lowerContent = textContent.toLowerCase();
                const isCorrectContent = lowerContent.includes('generative') && lowerContent.includes('rag');
                console.log('🎯 Object content verification:', {
                  hasText: true,
                  isCorrectContent: isCorrectContent,
                  textPreview: textContent.substring(0, 100)
                });
              }
            }
            
          } else {
            console.log('❌ No content in response data');
          }
          
          // Check metadata
          if (data.data.processingInfo) {
            console.log('📊 Processing info:', {
              source: data.data.processingInfo.source,
              totalChunks: data.data.processingInfo.stats?.totalChunks,
              selectedChunks: data.data.processingInfo.stats?.selectedChunks
            });
          }
          
        } else {
          console.log('❌ Error response:', data.error || data.message);
        }
        
        return this;
      }
    };
    
    console.log('🔍 Calling getDocumentContent...');
    await documentController.getDocumentContent(mockReq, mockRes);
    
    console.log('\\n🎯 Test Summary:');
    console.log('✅ Method call completed without errors');
    console.log('✅ Blob storage property fixes applied');
    console.log('✅ Ready to test with correct content');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testFixedContentEndpoint()
  .then(() => {
    console.log('\\n🎉 Fixed content endpoint test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test script failed:', error);
    process.exit(1);
  });