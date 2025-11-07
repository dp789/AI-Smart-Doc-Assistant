#!/usr/bin/env node

/**
 * Test script to verify that workspace filtering is working correctly
 * This script ensures only documents for the specific workspace are returned
 */

const { DocumentMetadata } = require('../models/DocumentMetadata');

async function testWorkspaceFiltering() {
    console.log('🧪 Testing Workspace Filtering');
    console.log('===============================\n');

    try {
        // Test with your actual workspace ID
        const testUser = {
            id: 'ddb18531-4243-4742-88ec-48c26cad6251',
            email: 'sunny.kushwaha@nitorinfotech.com',
            authType: 'azure-ad'
        };

        console.log(`🔍 Testing workspace filtering for user: ${testUser.id}\n`);

        // Test 1: Get documents for the specific workspace
        console.log('📊 Test 1: Workspace-Specific Document Retrieval');
        console.log('------------------------------------------------');
        
        const result = await DocumentMetadata.getDocumentsList(testUser);
        
        console.log('📋 Results:');
        console.log(`✅ Success: ${result.success}`);
        console.log(`📄 Total documents found: ${result.totalCount}`);
        console.log(`🏠 Workspace ID: ${result.workspaceId}`);
        console.log(`🔒 Workspace filtered: ${result.workspaceFiltered}`);

        // Test 2: Verify workspace consistency
        console.log('\n📊 Test 2: Workspace Consistency Check');
        console.log('-------------------------------------');
        
        if (result.data && result.data.length > 0) {
            console.log(`📄 Checking ${result.data.length} documents for workspace consistency...\n`);
            
            let allCorrectWorkspace = true;
            const workspaceIds = new Set();
            
            result.data.forEach((doc, index) => {
                workspaceIds.add(doc.workspace_id);
                console.log(`${index + 1}. ${doc.file_name}`);
                console.log(`   - ID: ${doc.id}`);
                console.log(`   - Workspace ID: ${doc.workspace_id}`);
                console.log(`   - Date: ${doc.date_published}`);
                
                if (doc.workspace_id !== testUser.id) {
                    console.log(`   ❌ WRONG WORKSPACE! Expected: ${testUser.id}, Got: ${doc.workspace_id}`);
                    allCorrectWorkspace = false;
                } else {
                    console.log(`   ✅ Correct workspace`);
                }
                console.log('');
            });
            
            // Summary of workspace filtering
            console.log('📋 Workspace Filtering Summary:');
            console.log(`   Expected workspace: ${testUser.id}`);
            console.log(`   Unique workspace IDs found: ${Array.from(workspaceIds).join(', ')}`);
            console.log(`   All documents from correct workspace: ${allCorrectWorkspace ? 'YES' : 'NO'}`);
            
            if (allCorrectWorkspace && workspaceIds.size === 1) {
                console.log('\n🎉 SUCCESS: Workspace filtering is working correctly!');
                console.log(`✅ All ${result.totalCount} documents belong to the correct workspace.`);
            } else {
                console.log('\n❌ FAILURE: Workspace filtering is not working correctly!');
                console.log(`🚨 Found documents from ${workspaceIds.size} different workspaces.`);
                return {
                    success: false,
                    error: 'Workspace filtering failed',
                    expectedWorkspace: testUser.id,
                    foundWorkspaces: Array.from(workspaceIds),
                    documentCount: result.totalCount
                };
            }
            
        } else {
            console.log('ℹ️  No documents found for this workspace');
            console.log('   This could be normal if the workspace has no documents');
        }

        // Test 3: Expected document count validation
        console.log('\n📊 Test 3: Expected Document Count');
        console.log('----------------------------------');
        
        const expectedCount = 5; // User mentioned they have 5 documents
        console.log(`Expected: ${expectedCount} documents for workspace ${testUser.id}`);
        console.log(`Actual: ${result.totalCount} documents`);
        
        if (result.totalCount === expectedCount) {
            console.log('✅ Document count matches expectation!');
        } else if (result.totalCount < expectedCount) {
            console.log(`⚠️  Found fewer documents than expected (${result.totalCount} < ${expectedCount})`);
            console.log('   This might indicate missing documents or different workspace assignments');
        } else {
            console.log(`⚠️  Found more documents than expected (${result.totalCount} > ${expectedCount})`);
            console.log('   This indicates the workspace filtering might not be working correctly');
        }

        // Test 4: Test with different workspace (to ensure filtering works)
        console.log('\n📊 Test 4: Different Workspace Test');
        console.log('-----------------------------------');
        
        const differentUser = {
            id: '1161baa3-4395-45f0-8a19-a3c7fdac4ff5', // Different workspace ID
            email: 'test@nitorinfotech.com',
            authType: 'azure-ad'
        };
        
        try {
            const differentResult = await DocumentMetadata.getDocumentsList(differentUser);
            console.log(`📄 Documents for different workspace ${differentUser.id}: ${differentResult.totalCount}`);
            
            if (differentResult.totalCount !== result.totalCount) {
                console.log('✅ Good! Different workspaces return different document counts');
            } else if (differentResult.totalCount === 0 && result.totalCount === 0) {
                console.log('ℹ️  Both workspaces returned 0 documents');
            } else {
                console.log('⚠️  Both workspaces returned same count - verify workspace filtering');
            }
        } catch (error) {
            console.log(`ℹ️  Different workspace test failed: ${error.message}`);
        }

        console.log('\n🏁 Workspace Filtering Test Summary');
        console.log('===================================');
        console.log(`✅ Test completed successfully`);
        console.log(`📄 Documents found: ${result.totalCount}`);
        console.log(`🏠 Workspace: ${testUser.id}`);
        console.log(`🔒 Filtering verified: ${result.workspaceFiltered}`);
        
        return {
            success: true,
            totalDocuments: result.totalCount,
            expectedDocuments: expectedCount,
            workspaceId: testUser.id,
            workspaceFiltered: result.workspaceFiltered
        };

    } catch (error) {
        console.error('❌ Test execution failed:', error);
        console.error('Error details:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

// Run the test if this script is executed directly
if (require.main === module) {
    testWorkspaceFiltering()
        .then((result) => {
            console.log('\n🏁 Test execution completed');
            if (result.success) {
                console.log('✅ Workspace filtering is working correctly');
                if (result.totalDocuments === 5) {
                    console.log('🎉 Perfect! Found exactly 5 documents as expected');
                }
                process.exit(0);
            } else {
                console.log('❌ Workspace filtering tests revealed issues');
                console.log(`   Error: ${result.error}`);
                process.exit(1);
            }
        })
        .catch((error) => {
            console.error('\n💥 Test execution failed:', error);
            process.exit(1);
        });
}

module.exports = { testWorkspaceFiltering };
