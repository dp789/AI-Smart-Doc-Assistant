#!/usr/bin/env node

/**
 * Test Azure OpenAI Configuration Script
 * Run this script to verify your Azure OpenAI setup is working correctly
 */

require('dotenv').config();
const azureOpenAIService = require('../services/azureOpenAIService');

async function testAzureOpenAI() {
    console.log('🧪 Testing Azure OpenAI Configuration...\n');
    
    // Validate configuration
    console.log('1️⃣ Validating Configuration...');
    const configValidation = azureOpenAIService.validateConfig();
    
    if (!configValidation.isValid) {
        console.error('❌ Configuration validation failed:');
        configValidation.issues.forEach(issue => console.error(`   - ${issue}`));
        process.exit(1);
    }
    
    console.log('✅ Configuration is valid');
    console.log('📋 Configuration details:');
    console.log(`   Endpoint: ${configValidation.config.endpoint}`);
    console.log(`   API Version: ${configValidation.config.apiVersion}`);
    console.log(`   Deployments: ${Object.keys(configValidation.config.deployments).join(', ')}\n`);
    
    // Test connection
    console.log('2️⃣ Testing Connection...');
    try {
        const connectionTest = await azureOpenAIService.testConnection();
        
        if (connectionTest.success) {
            console.log('✅ Connection successful!');
            console.log(`   Response: ${connectionTest.response}`);
            console.log(`   Endpoint: ${connectionTest.endpoint}`);
            console.log(`   API Version: ${connectionTest.apiVersion}\n`);
        } else {
            console.error('❌ Connection failed:');
            console.error(`   Error: ${connectionTest.message}`);
            if (connectionTest.error) {
                console.error(`   Details: ${JSON.stringify(connectionTest.error, null, 2)}`);
            }
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ Connection test failed with exception:');
        console.error(`   ${error.message}`);
        if (error.response?.data) {
            console.error(`   API Response: ${JSON.stringify(error.response.data, null, 2)}`);
        }
        process.exit(1);
    }
    
    // Test document processing
    console.log('3️⃣ Testing Document Processing...');
    try {
        const processingTest = await azureOpenAIService.processDocument({
            documentContent: 'This is a test document about artificial intelligence and machine learning. It discusses the benefits of AI in modern applications.',
            fileName: 'test-document.txt',
            systemPrompt: 'You are an expert document analyst. Analyze documents and provide structured insights.',
            userPrompt: 'Please analyze the following document and provide a brief summary:\n\n{DOCUMENT_CONTENT}',
            model: 'gpt4',
            temperature: 0.3,
            maxTokens: 150,
            outputFormat: 'text'
        });
        
        if (processingTest.success) {
            console.log('✅ Document processing successful!');
            console.log('📄 Analysis Result:');
            console.log(`   ${processingTest.data}`);
            console.log('\n📊 Usage Statistics:');
            console.log(`   Prompt Tokens: ${processingTest.metadata.promptTokens}`);
            console.log(`   Completion Tokens: ${processingTest.metadata.completionTokens}`);
            console.log(`   Total Tokens: ${processingTest.metadata.totalTokens}\n`);
        } else {
            console.error('❌ Document processing failed');
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ Document processing failed with exception:');
        console.error(`   ${error.message}`);
        process.exit(1);
    }
    
    // Test available models
    console.log('4️⃣ Available Models:');
    const availableModels = azureOpenAIService.getAvailableModels();
    availableModels.forEach(model => {
        console.log(`   - ${model.displayName} (${model.id} → ${model.name})`);
    });
    
    console.log('\n🎉 All tests passed! Your Azure OpenAI configuration is working correctly.');
    console.log('\n📝 Next Steps:');
    console.log('   1. Start your backend server: npm start');
    console.log('   2. Test the AI Workflow Builder in your React app');
    console.log('   3. Configure nodes with your custom prompts');
    console.log('   4. Upload documents and run workflows!');
}

// Run the test
testAzureOpenAI().catch(error => {
    console.error('\n💥 Test failed with unexpected error:');
    console.error(error);
    process.exit(1);
});
