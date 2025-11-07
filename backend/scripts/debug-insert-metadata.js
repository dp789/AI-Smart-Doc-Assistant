#!/usr/bin/env node

/**
 * Debug Document Metadata Insert Issue
 * Test the DocumentMetadata.insertDocumentMetadata method
 */

const { DocumentMetadata } = require('../models/DocumentMetadata');

console.log('🔍 Debugging Document Metadata Insert Issue...\n');

async function debugInsertMetadata() {
  try {
    console.log('📋 Testing document metadata insertion...');
    
    // Create minimal test metadata
    const testMetadata = {
      id: 'test-document-' + Date.now(),
      document_guid: 'test-guid-' + Date.now(),
      file_name: 'test-document.pdf',
      ingestion_source_id: 3,
      number_of_pages: 1,
      is_active: 1,
      date_published: new Date(),
      blobUrl: 'https://test-blob-url.com/test.pdf',
      document_category: null,
      workspace_id: 'test-workspace',
      file_type: null,
      ingestion_status: 'pending',
      ingestion_date: new Date()
    };
    
    console.log('📊 Test metadata:');
    console.log('  - id:', testMetadata.id);
    console.log('  - document_guid:', testMetadata.document_guid);
    console.log('  - file_name:', testMetadata.file_name);
    console.log('  - ingestion_source_id:', testMetadata.ingestion_source_id);
    console.log('  - Parameters count:', Object.keys(testMetadata).length);
    
    console.log('\n🔄 Attempting to insert document metadata...');
    
    const result = await DocumentMetadata.insertDocumentMetadata(testMetadata);
    
    if (result.success) {
      console.log('✅ Document metadata inserted successfully!');
      console.log('📊 Result:', result.data);
    } else {
      console.log('❌ Document metadata insertion failed');
      console.log('📊 Result:', result);
    }
    
  } catch (error) {
    console.error('❌ Error during debug test:', error.message);
    console.error('🔍 Full error details:', error);
    
    // Check if it's the "too many arguments" error
    if (error.message.includes('too many arguments')) {
      console.log('\n💡 Analysis: The stored procedure expects fewer parameters than being provided');
      console.log('🔧 Solution: Update the stored procedure or reduce the number of parameters');
    }
    
    // Check if it's a connection error
    if (error.message.includes('connection')) {
      console.log('\n💡 Analysis: Database connection issue');
      console.log('🔧 Solution: Check database connection configuration');
    }
  }
}

// Run the debug test
debugInsertMetadata()
  .then(() => {
    console.log('\n✅ Debug test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Debug test failed:', error);
    process.exit(1);
  });
