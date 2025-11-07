#!/usr/bin/env node

/**
 * Test script to verify the documents API fix
 * This script will help verify that all 6 documents are now returned by the API
 */

const { DocumentMetadata } = require('../models/DocumentMetadata');

async function testDocumentsFix() {
    console.log('🧪 Testing Documents API Fix');
    console.log('=============================\n');

    try {
        // Test with a mock user that has the workspace_id from your database
        const mockUser = {
            id: 'ddb18531-4243-4742-88ec-48c26cad6251', // Your workspace_id from the screenshot
            email: 'test@nitorinfotech.com',
            authType: 'azure-ad'
        };

        console.log(`🔍 Testing document retrieval for user: ${mockUser.id}`);
        
        const result = await DocumentMetadata.getDocumentsList(mockUser);
        
        console.log('\n📊 Results:');
        console.log(`✅ Success: ${result.success}`);
        console.log(`📄 Total documents found: ${result.totalCount}`);
        
        if (result.primaryWorkspaceCount !== undefined) {
            console.log(`🏠 Primary workspace documents: ${result.primaryWorkspaceCount}`);
        }
        
        if (result.additionalDocumentsCount) {
            console.log(`➕ Additional documents found: ${result.additionalDocumentsCount}`);
        }
        
        if (result.globalFallback) {
            console.log(`🌐 Global fallback used: ${result.globalFallback}`);
        }
        
        if (result.warning) {
            console.log(`⚠️  Warning: ${result.warning}`);
        }

        console.log('\n📋 Document Details:');
        result.data.forEach((doc, index) => {
            console.log(`${index + 1}. ${doc.file_name}`);
            console.log(`   ID: ${doc.id}`);
            console.log(`   Workspace ID: ${doc.workspace_id || 'NULL'}`);
            console.log(`   Ingestion Status: ${doc.ingestion_status || 'Not set'}`);
            console.log(`   Date: ${doc.date_published}`);
            console.log('');
        });

        // Test with another potential workspace_id from your data
        console.log('\n🔍 Testing with another workspace ID...');
        const mockUser2 = {
            id: '1161baa3-4395-45f0-8a19-a3c7fdac4ff5', // Another workspace_id from your screenshot
            email: 'test2@nitorinfotech.com',
            authType: 'azure-ad'
        };

        const result2 = await DocumentMetadata.getDocumentsList(mockUser2);
        console.log(`📄 Documents for workspace ${mockUser2.id}: ${result2.totalCount}`);

        console.log('\n✅ Test completed successfully!');
        
        if (result.totalCount >= 6) {
            console.log('🎉 SUCCESS: Found 6 or more documents - issue appears to be fixed!');
        } else {
            console.log(`⚠️  Still only finding ${result.totalCount} documents - may need additional investigation`);
        }

    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error('Error details:', error.message);
    }
}

// Run the test if this script is executed directly
if (require.main === module) {
    testDocumentsFix()
        .then(() => {
            console.log('\n🏁 Test execution completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Test execution failed:', error);
            process.exit(1);
        });
}

module.exports = { testDocumentsFix };
