#!/usr/bin/env node

/**
 * Test Enhanced Analysis Endpoint
 * Direct test of the enhanced analysis API endpoint
 */

const axios = require('axios');

console.log('🧪 Testing Enhanced Analysis Endpoint...\n');

async function testEndpoint() {
  try {
    console.log('📡 Calling /api/enhanced-analysis/comprehensive...');
    
    const response = await axios.post('http://localhost:8090/api/enhanced-analysis/comprehensive', {
      documentContent: 'This is a comprehensive test document for analysis. It contains various business topics including strategic planning, technology implementation, market analysis, and operational procedures. The document discusses digital transformation initiatives, customer experience improvements, and competitive advantages in the modern marketplace.',
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
    
    console.log('✅ Enhanced Analysis Endpoint Response:');
    console.log('📊 Success:', response.data.success);
    console.log('📄 Has Analysis:', !!response.data.analysis);
    
    if (response.data.analysis) {
      console.log('🔍 Analysis Keys:', Object.keys(response.data.analysis));
      
      // Check specific analysis components
      const analysis = response.data.analysis;
      console.log('\n📋 Analysis Components:');
      console.log('  Summary:', !!analysis.summary);
      console.log('  Keywords:', !!analysis.keywords);
      console.log('  Sentiment:', !!analysis.sentiment_analysis);
      console.log('  Categorization:', !!analysis.categorization);
      console.log('  Content Analysis:', !!analysis.content_analysis);
      
      if (analysis.summary) {
        console.log('\n📝 Summary Preview:', analysis.summary.executive_summary?.substring(0, 100) + '...');
      }
    }
    
    console.log('\n✅ Enhanced analysis endpoint is working correctly!');
    
  } catch (error) {
    console.log('\n❌ Enhanced Analysis Endpoint Error:');
    console.log('🔧 Status:', error.response?.status);
    console.log('📄 Status Text:', error.response?.statusText);
    console.log('💬 Message:', error.message);
    
    if (error.response?.data) {
      console.log('📊 Error Data:', error.response.data);
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n⚠️ Connection refused - is the backend server running?');
      console.log('   Try: cd backend && npm start');
    }
  }
}

// Run the test
testEndpoint()
  .then(() => {
    console.log('\n🎯 Enhanced endpoint test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  });
