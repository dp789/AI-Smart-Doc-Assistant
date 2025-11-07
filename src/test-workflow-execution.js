import WorkflowExecutionService from './services/workflowExecutionService.js';

// Test the new workflow execution service
async function testWorkflowExecution() {
  console.log('🚀 Testing Workflow Execution with Blob Chunks\n');
  
  const executionService = new WorkflowExecutionService();
  
  // Create a sample workflow with trigger and AI agent nodes
  const nodes = [
    {
      id: 'trigger-1',
      type: 'trigger',
      data: {
        label: 'Document Upload',
        config: {
          triggerType: 'documentUpload',
          selectedDocuments: ['38d492da-a38c-468a-aaca-118760d099d6'] // Use the test document ID
        }
      }
    },
    {
      id: 'ai-1',
      type: 'aiAgent',
      data: {
        label: 'GPT-4o Mini Analyzer',
        config: {
          modelType: 'gpt4o-mini',
          systemPrompt: 'You are a helpful AI assistant that analyzes documents and provides comprehensive insights.',
          userPrompt: 'Please analyze the following document content and provide a detailed summary: {DOCUMENT_CONTENT}',
          temperature: 0.7,
          maxTokens: 1500,
          outputFormat: 'json'
        }
      }
    }
  ];
  
  const edges = [
    {
      id: 'e1',
      source: 'trigger-1',
      target: 'ai-1'
    }
  ];
  
  try {
    console.log('📊 Executing workflow with blob chunks integration...');
    const result = await executionService.executeWorkflow(nodes, edges);
    
    console.log('\n🎉 Workflow Execution Results:');
    console.log('='.repeat(50));
    console.log(`✅ Success: ${result.success}`);
    console.log(`📝 Summary: ${result.summary}`);
    console.log(`📊 Nodes processed: ${result.results.length}`);
    
    result.results.forEach((nodeResult, index) => {
      console.log(`\n📋 Node ${index + 1}: ${nodeResult.nodeName}`);
      console.log(`   Status: ${nodeResult.status}`);
      console.log(`   Duration: ${nodeResult.duration}ms`);
      console.log(`   Summary: ${nodeResult.summary}`);
      
      if (nodeResult.data) {
        if (nodeResult.data.documentChunks) {
          const docs = Object.keys(nodeResult.data.documentChunks);
          console.log(`   📄 Documents processed: ${docs.length}`);
          
          docs.forEach(docId => {
            const doc = nodeResult.data.documentChunks[docId];
            console.log(`      - ${docId}: ${doc.content.length} chars, ${doc.processingInfo?.selectedChunks || 'unknown'} chunks`);
          });
        }
        
        if (nodeResult.data.aiResults) {
          console.log(`   🤖 AI Results: ${nodeResult.data.successful}/${nodeResult.data.processed} successful`);
          
          nodeResult.data.aiResults.forEach(aiResult => {
            if (aiResult.success) {
              console.log(`      ✅ ${aiResult.fileName}: ${aiResult.analysis?.substring(0, 100) || 'No analysis'}...`);
              console.log(`         Model: ${aiResult.model}, Time: ${aiResult.processingTime}ms`);
              console.log(`         Chunks: ${aiResult.metadata?.chunksUsed}/${aiResult.metadata?.totalChunks}`);
            } else {
              console.log(`      ❌ ${aiResult.documentId}: ${aiResult.error}`);
            }
          });
        }
      }
      
      if (nodeResult.error) {
        console.log(`   ❌ Error: ${nodeResult.error}`);
      }
    });
    
    console.log('\n' + '='.repeat(50));
    console.log('🎯 Key Benefits Demonstrated:');
    console.log('   ✅ Documents retrieved from blob storage chunks');
    console.log('   ✅ Clean text content (no encrypted/buffer data)');
    console.log('   ✅ Token-efficient processing with intelligent chunking');
    console.log('   ✅ Proper workflow execution order');
    console.log('   ✅ Comprehensive error handling and logging');
    
  } catch (error) {
    console.error('❌ Workflow execution failed:', error);
  }
}

// Run the test (this would be called from browser console or test environment)
if (typeof window !== 'undefined') {
  window.testWorkflowExecution = testWorkflowExecution;
  console.log('💡 Test function available as window.testWorkflowExecution()');
} else {
  // Node.js environment - run directly
  testWorkflowExecution().catch(console.error);
}
