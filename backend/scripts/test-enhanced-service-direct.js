#!/usr/bin/env node

/**
 * Test Enhanced Analysis Service Directly
 * Test the service without going through HTTP endpoints
 */

const EnhancedDocumentAnalysisService = require('../services/enhancedDocumentAnalysisService');

console.log('🧪 Testing Enhanced Analysis Service Directly...\n');

async function testServiceDirect() {
  try {
    console.log('📋 Initializing Enhanced Document Analysis Service...');
    const analysisService = new EnhancedDocumentAnalysisService();
    console.log('✅ Service initialized successfully');
    
    const testContent = `
This is a comprehensive test document for analysis. It contains various business topics including strategic planning, technology implementation, market analysis, and operational procedures. 

The document discusses digital transformation initiatives, customer experience improvements, and competitive advantages in the modern marketplace. Key areas of focus include:

1. Strategic Business Planning
2. Technology Integration 
3. Market Expansion Strategies
4. Customer Experience Enhancement
5. Operational Excellence
6. Digital Innovation

The document maintains a professional tone throughout and presents actionable insights for business leaders. It emphasizes the importance of data-driven decision making and agile implementation methodologies.

Financial projections indicate strong growth potential with proper execution of the outlined strategies. The competitive landscape analysis shows opportunities for market leadership through innovative approaches.

Risk mitigation strategies are also discussed to ensure sustainable business growth while maintaining operational stability.
    `.trim();
    
    console.log('\n📊 Testing Comprehensive Analysis...');
    console.log('📄 Content length:', testContent.length, 'characters');
    
    const startTime = Date.now();
    const result = await analysisService.performComprehensiveAnalysis(testContent, {
      modelType: 'gpt4o-mini',
      includeKeywords: true,
      includeSentiment: true,
      includeCategorization: true,
      includeSummary: true
    });
    
    const processingTime = Date.now() - startTime;
    
    console.log('\n✅ Analysis Complete!');
    console.log('⏱️ Processing Time:', processingTime, 'ms');
    console.log('📊 Result Success:', result.success);
    
    if (result.success && result.data) {
      console.log('\n🔍 Analysis Components:');
      const analysis = result.data;
      
      console.log('  📋 Summary:', !!analysis.summary);
      console.log('  🏷️ Keywords:', !!analysis.keywords);
      console.log('  😊 Sentiment:', !!analysis.sentiment_analysis);
      console.log('  📂 Categorization:', !!analysis.categorization);
      console.log('  🔍 Content Analysis:', !!analysis.content_analysis);
      console.log('  👥 Entities:', !!analysis.entities);
      console.log('  ⭐ Quality Assessment:', !!analysis.quality_assessment);
      console.log('  💡 Actionable Insights:', !!analysis.actionable_insights);
      
      if (analysis.summary && analysis.summary.executive_summary) {
        console.log('\n📝 Summary Preview:');
        console.log('   ' + analysis.summary.executive_summary.substring(0, 200) + '...');
      }
      
      if (analysis.keywords && analysis.keywords.primary_keywords) {
        console.log('\n🏷️ Primary Keywords:');
        console.log('   ' + analysis.keywords.primary_keywords.slice(0, 5).join(', '));
      }
      
      if (analysis.sentiment_analysis) {
        console.log('\n😊 Sentiment:');
        console.log('   Overall:', analysis.sentiment_analysis.overall_sentiment);
        console.log('   Confidence:', analysis.sentiment_analysis.confidence_score);
      }
      
      console.log('\n🎉 Enhanced analysis service is working perfectly!');
      
      // Test export functionality
      console.log('\n📤 Testing Export Functionality...');
      const exportResult = await analysisService.exportAnalysisResults({
        analysis: result.data,
        timestamp: new Date().toISOString(),
        documentId: 'test-doc'
      }, 'json');
      
      if (exportResult.success) {
        console.log('✅ Export functionality working');
        console.log('📄 Export content length:', exportResult.data.length);
      }
      
    } else {
      console.log('❌ Analysis failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Service test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testServiceDirect()
  .then(() => {
    console.log('\n✅ Direct service test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Direct service test failed:', error);
    process.exit(1);
  });