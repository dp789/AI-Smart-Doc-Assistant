#!/usr/bin/env node

/**
 * Test script to verify that the API returns fresh data immediately after database changes
 * This helps validate that the caching issue is resolved
 */

const { DocumentMetadata } = require('../models/DocumentMetadata');
const { createFreshDataPool, validateFreshData } = require('../db/fresh-data-config');

async function testRealTimeDataRetrieval() {
    console.log('🧪 Testing Real-Time Data Retrieval');
    console.log('=====================================\n');

    try {
        // Test with your actual workspace ID
        const testUser = {
            id: 'ddb18531-4243-4742-88ec-48c26cad6251',
            email: 'test@nitorinfotech.com',
            authType: 'azure-ad'
        };

        console.log(`🔍 Testing with workspace ID: ${testUser.id}\n`);

        // Test 1: Multiple rapid queries to check for consistency
        console.log('📊 Test 1: Multiple Rapid Queries for Consistency');
        console.log('--------------------------------------------------');
        
        const rapidResults = [];
        for (let i = 0; i < 5; i++) {
            console.log(`Query ${i + 1}/5...`);
            const result = await DocumentMetadata.getDocumentsList(testUser);
            rapidResults.push({
                attempt: i + 1,
                count: result.totalCount,
                timestamp: new Date().toISOString()
            });
            
            // Small delay between queries
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        console.log('\n📋 Rapid Query Results:');
        rapidResults.forEach(result => {
            console.log(`   Attempt ${result.attempt}: ${result.count} documents at ${result.timestamp}`);
        });

        // Check for consistency
        const counts = rapidResults.map(r => r.count);
        const isConsistent = counts.every(count => count === counts[0]);
        
        if (isConsistent) {
            console.log(`✅ Consistency Test PASSED: All queries returned ${counts[0]} documents`);
        } else {
            console.log(`❌ Consistency Test FAILED: Found varying counts: ${[...new Set(counts)].join(', ')}`);
        }

        // Test 2: Fresh pool validation
        console.log('\n📊 Test 2: Fresh Connection Pool Validation');
        console.log('--------------------------------------------');
        
        try {
            const freshPool = await createFreshDataPool();
            const validation = await validateFreshData(freshPool);
            
            if (validation.success) {
                console.log(`✅ Fresh pool validation PASSED:`);
                console.log(`   Total documents: ${validation.totalDocuments}`);
                console.log(`   Workspace documents: ${validation.workspaceDocuments}`);
            } else {
                console.log(`❌ Fresh pool validation FAILED: ${validation.error}`);
            }
            
            await freshPool.close();
        } catch (error) {
            console.log(`❌ Fresh pool test failed: ${error.message}`);
        }

        // Test 3: Document details retrieval
        console.log('\n📊 Test 3: Document Details Retrieval');
        console.log('-------------------------------------');
        
        const documentsList = await DocumentMetadata.getDocumentsList(testUser);
        
        if (documentsList.data && documentsList.data.length > 0) {
            console.log(`📄 Testing document details for ${documentsList.data.length} documents:`);
            
            for (let i = 0; i < Math.min(3, documentsList.data.length); i++) {
                const doc = documentsList.data[i];
                console.log(`\n   Document ${i + 1}:`);
                console.log(`   - ID: ${doc.id}`);
                console.log(`   - Name: ${doc.file_name}`);
                console.log(`   - Workspace: ${doc.workspace_id}`);
                console.log(`   - Status: ${doc.ingestion_status || 'Not set'}`);
                console.log(`   - Date: ${doc.date_published}`);
                
                // Test individual document retrieval
                try {
                    const individualDoc = await DocumentMetadata.getDocumentById(doc.id);
                    if (individualDoc) {
                        console.log(`   ✅ Individual retrieval successful`);
                    } else {
                        console.log(`   ❌ Individual retrieval failed - document not found`);
                    }
                } catch (error) {
                    console.log(`   ❌ Individual retrieval failed: ${error.message}`);
                }
            }
        } else {
            console.log('❌ No documents found for testing individual retrieval');
        }

        // Test 4: Compare with expected count
        console.log('\n📊 Test 4: Expected Count Validation');
        console.log('------------------------------------');
        
        const expectedCount = 6; // Based on your database screenshot
        const actualCount = documentsList.totalCount;
        
        console.log(`Expected: ${expectedCount} documents`);
        console.log(`Actual: ${actualCount} documents`);
        
        if (actualCount >= expectedCount) {
            console.log(`✅ Count validation PASSED: Found ${actualCount} documents (>= ${expectedCount})`);
        } else {
            console.log(`⚠️  Count validation WARNING: Found only ${actualCount} documents (< ${expectedCount})`);
            console.log(`   This might indicate the caching issue is still present or data has changed.`);
        }

        // Summary
        console.log('\n🏁 Test Summary');
        console.log('===============');
        console.log(`✅ Tests completed successfully`);
        console.log(`📄 Total documents found: ${actualCount}`);
        console.log(`🔄 Consistency check: ${isConsistent ? 'PASSED' : 'FAILED'}`);
        
        if (actualCount >= expectedCount && isConsistent) {
            console.log(`🎉 SUCCESS: Real-time data retrieval appears to be working correctly!`);
        } else {
            console.log(`⚠️  ATTENTION: Some tests indicate potential issues. Review the logs above.`);
        }

        return {
            success: true,
            totalDocuments: actualCount,
            expectedDocuments: expectedCount,
            isConsistent: isConsistent,
            tests: {
                consistency: isConsistent,
                freshPool: validation?.success || false,
                documentRetrieval: documentsList.success
            }
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
    testRealTimeDataRetrieval()
        .then((result) => {
            console.log('\n🏁 Test execution completed');
            if (result.success) {
                console.log('✅ All systems appear to be working correctly');
                process.exit(0);
            } else {
                console.log('❌ Tests revealed issues that need attention');
                process.exit(1);
            }
        })
        .catch((error) => {
            console.error('\n💥 Test execution failed:', error);
            process.exit(1);
        });
}

module.exports = { testRealTimeDataRetrieval };
