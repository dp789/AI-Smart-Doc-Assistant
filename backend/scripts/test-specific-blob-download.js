#!/usr/bin/env node

/**
 * Test Specific Blob Download
 * Test downloading the exact blob file that should contain the correct content
 */

const BlobStorageService = require('../services/blobStorageService');

async function testSpecificBlob() {
  try {
    console.log('🧪 Testing Specific Blob Download\n');
    
    const blobPath = 'short_chunks/ddb18531-4243-4742-88ec-48c26cad6251_c82b5365-7b82-49f9-add7-47649dd21449_3_chunks.json';
    console.log('📍 Target blob path:', blobPath);
    
    console.log('\n🔍 Attempting direct blob download...');
    const result = await BlobStorageService.getFileWithSas(blobPath);
    
    if (result && result.content) {
      console.log('✅ Blob download successful!');
      console.log('📊 Content info:', {
        type: typeof result.content,
        length: result.content.length,
        isBuffer: Buffer.isBuffer(result.content)
      });
      
      // Try to parse as JSON
      let parsedContent;
      if (typeof result.content === 'string') {
        parsedContent = JSON.parse(result.content);
      } else if (Buffer.isBuffer(result.content)) {
        parsedContent = JSON.parse(result.content.toString('utf8'));
      } else {
        parsedContent = result.content;
      }
      
      console.log('📄 Parsed content structure:', {
        isArray: Array.isArray(parsedContent),
        totalItems: Array.isArray(parsedContent) ? parsedContent.length : 
                   (parsedContent.chunks ? parsedContent.chunks.length : 'Unknown'),
        hasChunks: !!parsedContent.chunks,
        keys: Object.keys(parsedContent).slice(0, 10)
      });
      
      // Sample the first chunk to understand structure
      let firstChunk = null;
      if (Array.isArray(parsedContent) && parsedContent.length > 0) {
        firstChunk = parsedContent[0];
      } else if (parsedContent.chunks && parsedContent.chunks.length > 0) {
        firstChunk = parsedContent.chunks[0];
      }
      
      if (firstChunk) {
        console.log('📝 First chunk sample:', {
          keys: Object.keys(firstChunk),
          hasContent: !!firstChunk.content,
          hasText: !!firstChunk.text,
          hasChunkText: !!firstChunk.chunk_text,
          contentPreview: (firstChunk.content || firstChunk.text || firstChunk.chunk_text || '').substring(0, 100)
        });
        
        console.log('🎯 CORRECT CONTENT FOUND!');
        console.log('This is the content that should be returned, not the local fallback.');
      }
      
      // Check if this is about "generative_rag_pipeline.pdf"
      const contentStr = JSON.stringify(parsedContent).toLowerCase();
      const isCorrectDocument = contentStr.includes('generative') || 
                               contentStr.includes('rag') || 
                               contentStr.includes('pipeline');
      
      console.log('\n🔍 Document verification:', {
        isCorrectDocument: isCorrectDocument,
        looksLikeCorrectContent: !contentStr.includes('azure function') && !contentStr.includes('func_deploy')
      });
      
    } else {
      console.log('❌ Blob download failed or returned no content');
      if (result) {
        console.log('🔍 Result structure:', Object.keys(result));
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing blob download:', error.message);
    console.error('Stack:', error.stack);
  }
}

testSpecificBlob()
  .then(() => {
    console.log('\n✅ Specific blob test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
