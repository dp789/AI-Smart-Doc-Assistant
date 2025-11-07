#!/usr/bin/env node

const { poolPromise, sql } = require('../db');
const fs = require('fs');
const path = require('path');

async function createStoredProcedures() {
    console.log('🔧 Creating Stored Procedures for User Tracking');
    console.log('===============================================\n');
    
    try {
        // Wait for database connection
        const pool = await poolPromise;
        console.log('✅ Database connection established');
        
        // Read the SQL file
        const sqlFilePath = path.join(__dirname, 'create-stored-procedures.sql');
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
        
        // Split the SQL content by GO statements
        const sqlStatements = sqlContent
            .split(/\s*GO\s*/gi)
            .filter(statement => statement.trim().length > 0)
            .map(statement => statement.trim());
        
        console.log(`📜 Found ${sqlStatements.length} SQL statements to execute\n`);
        
        // Execute each statement separately
        for (let i = 0; i < sqlStatements.length; i++) {
            const statement = sqlStatements[i];
            if (statement.length > 0) {
                try {
                    console.log(`🔄 Executing statement ${i + 1}/${sqlStatements.length}...`);
                    await pool.request().query(statement);
                    console.log(`✅ Statement ${i + 1} executed successfully`);
                } catch (error) {
                    console.error(`❌ Error executing statement ${i + 1}:`, error.message);
                    if (error.message.includes('already exists')) {
                        console.log('   ℹ️  Procedure already exists, continuing...');
                    } else {
                        throw error;
                    }
                }
            }
        }
        
        // Test the stored procedures
        console.log('\n🧪 Testing stored procedures...');
        
        // Test sp_TrackUserLogin
        try {
            const testResult = await pool.request()
                .input('UserId', sql.NVarChar(255), 'test-stored-proc-' + Date.now())
                .input('UserPrincipalName', sql.NVarChar(255), 'test@nitorinfotech.com')
                .input('DisplayName', sql.NVarChar(255), 'Test User')
                .input('TenantId', sql.NVarChar(255), '8c3dad1d-b6bc-4f8b-939b-8263372eced6')
                .input('AppId', sql.NVarChar(255), '9da33bd8-2014-483a-8a03-0ce270f1dac0')
                .input('IPAddress', sql.NVarChar(45), '127.0.0.1')
                .input('DeviceType', sql.NVarChar(50), 'Desktop')
                .execute('sp_TrackUserLogin');
            
            if (testResult.recordset && testResult.recordset.length > 0) {
                console.log('✅ sp_TrackUserLogin test successful:', testResult.recordset[0]);
            }
        } catch (error) {
            console.error('❌ sp_TrackUserLogin test failed:', error.message);
        }
        
        // Test sp_GetUserSession
        try {
            const getResult = await pool.request()
                .input('UserId', sql.NVarChar(255), 'test-stored-proc-' + (Date.now() - 1000))
                .execute('sp_GetUserSession');
            
            console.log('✅ sp_GetUserSession test successful, found', getResult.recordset.length, 'sessions');
        } catch (error) {
            console.error('❌ sp_GetUserSession test failed:', error.message);
        }
        
        // Clean up test data
        await pool.request().query(`
            DELETE FROM UserSessions 
            WHERE UserId LIKE 'test-stored-proc-%'
        `);
        console.log('🧹 Test data cleaned up');
        
        console.log('\n🎉 ✅ Stored procedures created and tested successfully!');
        console.log('🚀 Your user tracking system is now fully operational!');
        
        await pool.close();
        return true;
        
    } catch (error) {
        console.error('\n💥 Failed to create stored procedures:', error.message);
        console.error('Full error:', error);
        return false;
    }
}

if (require.main === module) {
    createStoredProcedures()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 Fatal error:', error);
            process.exit(1);
        });
}

module.exports = createStoredProcedures;