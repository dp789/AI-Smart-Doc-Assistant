#!/usr/bin/env node

/**
 * Test Documents API to verify it's working correctly for the workflow builder
 */

require('dotenv').config();
const axios = require('axios');

async function testDocumentsAPI() {
    console.log('🧪 Testing Documents API for Workflow Builder...\n');
    
    const baseURL = process.env.FRONTEND_URL || 'http://localhost:8090';
    const apiURL = `${baseURL}/api`;
    
    console.log(`📡 Testing API at: ${apiURL}`);
    
    try {
        // Test 1: Basic API health check
        console.log('1️⃣ Testing API health...');
        try {
            const healthResponse = await axios.get(`${apiURL}/test`);
            console.log('✅ API is responding:', healthResponse.data);
        } catch (healthError) {
            console.log('⚠️ API health check failed, but continuing with documents test...');
        }
        
        // Test 2: Documents endpoint without auth (to see what happens)
        console.log('\n2️⃣ Testing Documents endpoint...');
        
        try {
            const documentsResponse = await axios.get(`${apiURL}/documents`);
            console.log('✅ Documents endpoint accessible!');
            console.log('📄 Response data:', JSON.stringify(documentsResponse.data, null, 2));
            
            if (documentsResponse.data && documentsResponse.data.data) {
                const documents = documentsResponse.data.data.documents || documentsResponse.data.data || [];
                console.log(`📊 Found ${documents.length} documents`);
                
                if (documents.length > 0) {
                    console.log('\n📋 Sample document structure:');
                    const sampleDoc = documents[0];
                    console.log({
                        id: sampleDoc.id,
                        fileName: sampleDoc.fileName || sampleDoc.file_name,
                        category: sampleDoc.documentCategory || sampleDoc.document_category,
                        status: sampleDoc.uploadStatus || sampleDoc.upload_status,
                        isActive: sampleDoc.isActive || sampleDoc.is_active
                    });
                }
            }
            
        } catch (documentsError) {
            console.log('❌ Documents endpoint error:');
            console.log('   Status:', documentsError.response?.status);
            console.log('   Message:', documentsError.response?.data?.message || documentsError.message);
            
            if (documentsError.response?.status === 401) {
                console.log('\n🔐 Authentication required. This is expected behavior.');
                console.log('   The workflow builder should handle authentication properly.');
            } else if (documentsError.response?.status === 404) {
                console.log('\n❌ Documents endpoint not found. Check your server configuration.');
            }
        }
        
        // Test 3: Check if server is running
        console.log('\n3️⃣ Checking server configuration...');
        
        // Try to connect to the backend server
        try {
            const serverResponse = await axios.get(`${baseURL}/`, { timeout: 5000 });
            console.log('✅ Backend server is running');
        } catch (serverError) {
            if (serverError.code === 'ECONNREFUSED') {
                console.log('❌ Backend server is not running!');
                console.log('   Please start the backend server with: cd backend && npm start');
            } else {
                console.log('⚠️ Server connection issue:', serverError.message);
            }
        }
        
    } catch (error) {
        console.error('💥 Test failed with unexpected error:');
        console.error(error);
    }
    
    console.log('\n📝 Recommendations:');
    console.log('   1. Ensure backend server is running: cd backend && npm start');
    console.log('   2. Check authentication is working in the React app');
    console.log('   3. Verify documents are uploaded in the Documents section');
    console.log('   4. Test the workflow builder document selection');
}

// Run the test
testDocumentsAPI().catch(error => {
    console.error('\n💥 Test failed with unexpected error:');
    console.error(error);
    process.exit(1);
});
