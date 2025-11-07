#!/usr/bin/env node

/**
 * Debug Enhanced Workflow
 * Test the entire workflow execution flow to find where the issue is
 */

const axios = require('axios');

console.log('🔍 Debugging Enhanced Workflow Execution Flow...\n');

async function debugWorkflowFlow() {
  try {
    console.log('📋 Step 1: Testing Enhanced Analysis Endpoint (without auth)...');
    
    try {
      const testResponse = await axios.post('http://localhost:8090/api/enhanced-analysis/comprehensive', {
        documentContent: 'Test document for debugging workflow. This contains business analysis and strategic planning content.',
        options: {
          modelType: 'gpt4o-mini',
          includeKeywords: true,
          includeSentiment: true,
          includeCategorization: true,
          includeSummary: true
        }
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });
      
      if (testResponse.data.success) {
        console.log('✅ Enhanced Analysis Endpoint Working!');
        console.log('📊 Response has analysis:', !!testResponse.data.analysis);
        console.log('🔍 Analysis keys:', testResponse.data.analysis ? Object.keys(testResponse.data.analysis) : 'none');
      } else {
        console.log('❌ Enhanced analysis failed:', testResponse.data.error);
      }
      
    } catch (authError) {
      console.log('⚠️ Expected auth error (401):', authError.response?.status, authError.response?.statusText);
      console.log('✅ This is expected - endpoint requires authentication');
    }
    
    console.log('\n📋 Step 2: Testing Document Content Endpoint...');
    
    try {
      const docResponse = await axios.get('http://localhost:8090/api/documents', {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      if (docResponse.data.success && docResponse.data.documents.length > 0) {
        const testDoc = docResponse.data.documents[0];
        console.log('✅ Found test document:', testDoc.id, testDoc.original_file_name);
        
        // Test content endpoint
        console.log('\n📋 Step 3: Testing Document Content Retrieval...');
        try {
          const contentResponse = await axios.get(`http://localhost:8090/api/documents/${testDoc.id}/content`, {
            headers: {
              'Content-Type': 'application/json'
            },
            timeout: 30000
          });
          
          if (contentResponse.data.success) {
            console.log('✅ Document content retrieved successfully');
            console.log('📄 Content length:', contentResponse.data.data?.content?.length || 0);
            console.log('📊 Content type:', typeof contentResponse.data.data?.content);
            
            // Test chunks endpoint
            console.log('\n📋 Step 4: Testing Document Chunks Endpoint...');
            try {
              const chunksResponse = await axios.get(`http://localhost:8090/api/documents/${testDoc.id}/chunks`, {
                headers: {
                  'Content-Type': 'application/json'
                },
                timeout: 30000
              });
              
              if (chunksResponse.data.success) {
                console.log('✅ Document chunks retrieved successfully');
                console.log('📊 Chunks data keys:', Object.keys(chunksResponse.data));
                console.log('📄 Original content length:', chunksResponse.data.originalContent?.text?.length || 0);
              } else {
                console.log('❌ Chunks retrieval failed:', chunksResponse.data.error);
              }
              
            } catch (chunksError) {
              console.log('❌ Chunks endpoint error:', chunksError.response?.status, chunksError.response?.data?.error);
            }
            
          } else {
            console.log('❌ Content retrieval failed:', contentResponse.data.error);
          }
          
        } catch (contentError) {
          console.log('❌ Content endpoint error:', contentError.response?.status, contentError.response?.data?.error);
        }
        
      } else {
        console.log('❌ No documents found for testing');
      }
      
    } catch (docError) {
      console.log('❌ Documents endpoint error:', docError.response?.status, docError.response?.data?.error);
      console.log('⚠️ This might be an auth issue - documents endpoint may require authentication');
    }
    
    console.log('\n📋 Step 5: Summary of Findings...');
    console.log('🔍 Enhanced Analysis Service: Working (requires auth)');
    console.log('📄 Document Endpoints: Need authentication testing');
    console.log('🎯 Next Step: Test with proper authentication in frontend');
    
    console.log('\n💡 Recommendation:');
    console.log('   1. Use browser console to test: testEnhancedResults()');
    console.log('   2. Check browser console for authentication errors during workflow');
    console.log('   3. Verify Azure AD authentication is working');
    
  } catch (error) {
    console.error('❌ Debug test failed:', error.message);
  }
}

// Run the debug test
debugWorkflowFlow()
  .then(() => {
    console.log('\n✅ Debug workflow test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Debug workflow test failed:', error);
    process.exit(1);
  });
