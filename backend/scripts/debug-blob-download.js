#!/usr/bin/env node

/**
 * Debug Blob Download
 * Debug why the blob download is not returning content
 */

const BlobStorageService = require('../services/blobStorageService');

async function debugBlobDownload() {
  try {
    console.log('🔍 Debugging Blob Download\n');
    
    const blobPath = 'short_chunks/ddb18531-4243-4742-88ec-48c26cad6251_c82b5365-7b82-49f9-add7-47649dd21449_3_chunks.json';
    console.log('📍 Target blob path:', blobPath);
    
    console.log('\n🔍 Step 1: Generate SAS token...');
    const sasUrl = await BlobStorageService.generateSasToken(blobPath);
    console.log('✅ SAS URL generated successfully');
    console.log('📍 SAS URL (truncated):', sasUrl.substring(0, 100) + '...');
    
    console.log('\n🔍 Step 2: Attempt full download...');
    const result = await BlobStorageService.getFileWithSas(blobPath);
    
    console.log('📊 Full result structure:', {
      success: result.success,
      hasData: !!result.data,
      dataType: typeof result.data,
      dataLength: result.data ? result.data.length : 0,
      isBuffer: Buffer.isBuffer(result.data),
      properties: result.properties
    });
    
    if (result.success && result.data) {
      console.log('\n✅ Download successful!');
      
      // Convert buffer to string
      let contentString;
      if (Buffer.isBuffer(result.data)) {
        contentString = result.data.toString('utf8');
      } else {
        contentString = result.data;
      }
      
      console.log('📄 Content preview (first 200 chars):', contentString.substring(0, 200));
      
      // Try to parse as JSON
      try {
        const parsedContent = JSON.parse(contentString);
        console.log('\n🎯 JSON parsing successful!');
        console.log('📊 Parsed structure:', {
          isArray: Array.isArray(parsedContent),
          totalItems: Array.isArray(parsedContent) ? parsedContent.length : 
                     (parsedContent.chunks ? parsedContent.chunks.length : 'Unknown'),
          hasChunks: !!parsedContent.chunks,
          rootKeys: Object.keys(parsedContent).slice(0, 10)
        });
        
        // Get first chunk
        let firstChunk = null;
        if (Array.isArray(parsedContent) && parsedContent.length > 0) {
          firstChunk = parsedContent[0];
        } else if (parsedContent.chunks && parsedContent.chunks.length > 0) {
          firstChunk = parsedContent.chunks[0];
        }
        
        if (firstChunk) {
          console.log('📝 First chunk structure:', {
            keys: Object.keys(firstChunk),
            hasContent: !!firstChunk.content,
            hasText: !!firstChunk.text,
            hasChunkText: !!firstChunk.chunk_text,
            textField: firstChunk.content ? 'content' : 
                      firstChunk.text ? 'text' : 
                      firstChunk.chunk_text ? 'chunk_text' : 'unknown'
          });
          
          const textContent = firstChunk.content || firstChunk.text || firstChunk.chunk_text || '';
          if (textContent) {
            console.log('📄 First chunk text preview:', textContent.substring(0, 150));
            
            // Check if this contains content about the correct document
            const lowerText = textContent.toLowerCase();
            const isAboutRAG = lowerText.includes('generative') || lowerText.includes('rag') || lowerText.includes('pipeline');
            const isWrongContent = lowerText.includes('azure function') || lowerText.includes('func_deploy');
            
            console.log('🎯 Content verification:', {
              isAboutRAG: isAboutRAG,
              isWrongContent: isWrongContent,
              shouldUseThisContent: isAboutRAG && !isWrongContent
            });
          }
        }
        
        console.log('\n🎉 SUCCESS: Found the correct blob content!');
        console.log('This should be returned instead of the local fallback.');
        
      } catch (parseError) {
        console.log('❌ JSON parsing failed:', parseError.message);
        console.log('Content might not be valid JSON');
      }
      
    } else {
      console.log('❌ Download failed or no data returned');
      if (!result.success) {
        console.log('Error details:', result.error || 'Unknown error');
      }
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

debugBlobDownload()
  .then(() => {
    console.log('\n✅ Debug completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Debug script failed:', error);
    process.exit(1);
  });
