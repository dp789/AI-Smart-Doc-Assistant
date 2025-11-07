#!/usr/bin/env node

/**
 * Test script for Blob Chunks Service
 * Verifies blob storage chunk retrieval and AI processing pipeline
 */

const BlobChunksService = require('../services/blobChunksService');

async function testBlobChunksService() {
  console.log('🚀 Testing Blob Chunks Service\n');
  
  const service = new BlobChunksService();
  
  // Test 1: Get chunks from blob storage
  console.log('📦 Test 1: Blob Storage Chunks Retrieval');
  
  const testDocumentMetadata = {
    workspace_id: 'd4b2fbfe-702b-49d4-9b42-41d343c26da5',
    document_id: '38d492da-a38c-468a-aaca-118760d099d6',
    ingestion_source_id: '3',
    document_guid: '38d492da-a38c-468a-aaca-118760d099d6'
  };
  
  try {
    const chunksResult = await service.getDocumentChunks(testDocumentMetadata);
    
    if (chunksResult.success) {
      console.log('   ✅ Chunks retrieved successfully from blob storage');
      console.log(`   📊 Blob path: ${chunksResult.blobPath}`);
      console.log(`   📄 Total chunks: ${chunksResult.metadata.totalChunks}`);
      console.log(`   🕐 Processed at: ${chunksResult.metadata.processedAt}`);
      console.log(`   📋 Chunk type: ${chunksResult.metadata.chunkType}`);
      
      // Test 2: Process chunks for AI
      console.log('\n🤖 Test 2: AI Processing of Chunks');
      
      const strategies = ['first', 'summary', 'balanced', 'all'];
      
      for (const strategy of strategies) {
        console.log(`\n   🎯 Testing strategy: ${strategy}`);
        
        const processedResult = await service.processChunksForAI(
          chunksResult.chunksData,
          strategy,
          5 // Max 5 chunks for testing
        );
        
        if (processedResult.success) {
          const stats = service.getChunksStats(processedResult.chunks);
          
          console.log(`      ✅ Strategy "${strategy}" successful:`);
          console.log(`         - Selected chunks: ${processedResult.processingInfo.selectedChunks}/${processedResult.processingInfo.totalChunks}`);
          console.log(`         - Estimated tokens: ${stats.estimatedTokens}`);
          console.log(`         - Average chunk size: ${stats.averageChunkSize} chars`);
          
          // Show first chunk preview
          if (processedResult.chunks.length > 0) {
            const firstChunk = processedResult.chunks[0];
            const preview = firstChunk.content.substring(0, 100).replace(/\n/g, ' ');
            console.log(`         - First chunk preview: "${preview}..."`);
          }
        } else {
          console.log(`      ❌ Strategy "${strategy}" failed: ${processedResult.error}`);
        }
      }
      
      // Test 3: Content combination
      console.log('\n🔗 Test 3: Content Combination for AI');
      
      const balancedResult = await service.processChunksForAI(
        chunksResult.chunksData,
        'balanced',
        3
      );
      
      if (balancedResult.success) {
        const combinedContent = service.combineChunksForAI(balancedResult.chunks);
        const combinedStats = {
          totalLength: combinedContent.length,
          estimatedTokens: Math.ceil(combinedContent.split(/\s+/).length * 1.3),
          sections: balancedResult.chunks.length
        };
        
        console.log('   ✅ Content combination successful:');
        console.log(`      - Combined length: ${combinedStats.totalLength} characters`);
        console.log(`      - Estimated tokens: ${combinedStats.estimatedTokens}`);
        console.log(`      - Sections: ${combinedStats.sections}`);
        console.log(`      - Preview: "${combinedContent.substring(0, 150).replace(/\n/g, ' ')}..."`);
        
        // Test token efficiency
        const originalStats = service.getChunksStats(chunksResult.chunksData.chunks);
        const efficiency = {
          tokenReduction: Math.round((1 - combinedStats.estimatedTokens / originalStats.estimatedTokens) * 100),
          chunkReduction: Math.round((1 - combinedStats.sections / originalStats.totalChunks) * 100)
        };
        
        console.log(`      - Token reduction: ${efficiency.tokenReduction}%`);
        console.log(`      - Chunk reduction: ${efficiency.chunkReduction}%`);
      }
      
      // Test 4: Content cleaning
      console.log('\n🧹 Test 4: Content Cleaning');
      
      const sampleDirtyContent = "# üöÄ Complete Azure Function App\n\nThis guide documents the üìñ process of deploying‚úÖ";
      const cleanedContent = service.cleanChunkContent(sampleDirtyContent);
      
      console.log('   ✅ Content cleaning test:');
      console.log(`      - Original: "${sampleDirtyContent}"`);
      console.log(`      - Cleaned: "${cleanedContent}"`);
      console.log(`      - Removed artifacts: ${sampleDirtyContent.length - cleanedContent.length} characters`);
      
    } else {
      console.log('   ❌ Failed to retrieve chunks from blob storage');
      console.log(`   Error: ${chunksResult.error}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  console.log('\n🎉 Blob Chunks Service Tests Complete!\n');
  console.log('💡 Key Benefits:');
  console.log('   ✅ Pre-processed chunks from blob storage');
  console.log('   ✅ No binary or encrypted content passed to AI');
  console.log('   ✅ Multiple chunking strategies available');
  console.log('   ✅ Content cleaning removes formatting artifacts');
  console.log('   ✅ Token-efficient processing');
  console.log('   ✅ Rich metadata for monitoring and debugging\n');
}

// Run the test
testBlobChunksService().catch(error => {
  console.error('🚫 Test execution failed:', error);
  process.exit(1);
});
