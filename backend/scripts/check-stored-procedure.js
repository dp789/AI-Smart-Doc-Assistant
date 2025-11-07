#!/usr/bin/env node

/**
 * Check Stored Procedure Parameters
 * Query the database to see what parameters the stored procedure actually expects
 */

const { poolPromise, sql } = require('../db/config');

console.log('🔍 Checking Stored Procedure Parameters...\n');

async function checkStoredProcedure() {
  try {
    console.log('📋 Connecting to database...');
    
    // Wait a moment for the connection to be established
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const pool = await poolPromise;
    
    if (!pool || !pool.request) {
      throw new Error('Database connection not established');
    }
    
    console.log('🔍 Querying stored procedure parameters...');
    
    // Check if the stored procedure exists
    const procedureExists = await pool.request()
      .query(`
        SELECT COUNT(*) as count 
        FROM sys.objects 
        WHERE object_id = OBJECT_ID(N'[dbo].[sp_InsertDocumentMetadata]') 
        AND type in (N'P', N'PC')
      `);
    
    if (procedureExists.recordset[0].count === 0) {
      console.log('❌ Stored procedure sp_InsertDocumentMetadata does not exist!');
      console.log('💡 Solution: Create the stored procedure using the fix script');
      return;
    }
    
    console.log('✅ Stored procedure sp_InsertDocumentMetadata exists');
    
    // Get the parameters of the stored procedure
    const parameters = await pool.request()
      .query(`
        SELECT 
          p.name as parameter_name,
          t.name as data_type,
          p.max_length,
          p.is_output,
          p.parameter_id
        FROM sys.parameters p
        INNER JOIN sys.types t ON p.user_type_id = t.user_type_id
        WHERE p.object_id = OBJECT_ID('sp_InsertDocumentMetadata')
        ORDER BY p.parameter_id
      `);
    
    console.log('📊 Current stored procedure parameters:');
    console.log('Total parameters:', parameters.recordset.length);
    
    parameters.recordset.forEach((param, index) => {
      console.log(`  ${index + 1}. ${param.parameter_name} (${param.data_type}${param.max_length > 0 ? `(${param.max_length})` : ''})`);
    });
    
    // List the parameters that the Node.js code is trying to pass
    const nodeJsParameters = [
      'Id',
      'DocumentGuid', 
      'FileName',
      'IngestionSourceId',
      'NumberOfPages',
      'IsActive',
      'DatePublished',
      'rawContent',
      'DocumentCategory',
      'WorkspaceId',
      'FileType',
      'IngestionStatus',
      'IngestionDate'
    ];
    
    console.log('\n📋 Node.js code is trying to pass:');
    console.log('Total parameters:', nodeJsParameters.length);
    nodeJsParameters.forEach((param, index) => {
      console.log(`  ${index + 1}. ${param}`);
    });
    
    console.log('\n🔍 Analysis:');
    const dbParamCount = parameters.recordset.length;
    const nodeParamCount = nodeJsParameters.length;
    
    if (dbParamCount < nodeParamCount) {
      console.log(`❌ Database procedure expects ${dbParamCount} parameters, but Node.js is passing ${nodeParamCount}`);
      console.log('💡 Solution: Update the stored procedure to accept all required parameters');
    } else if (dbParamCount > nodeParamCount) {
      console.log(`❌ Database procedure expects ${dbParamCount} parameters, but Node.js is only passing ${nodeParamCount}`);
      console.log('💡 Solution: Update the Node.js code to pass all required parameters');
    } else {
      console.log(`✅ Parameter count matches (${dbParamCount}), but there might be a name/type mismatch`);
    }
    
    // Check for parameter name mismatches
    console.log('\n🔍 Parameter mapping:');
    const dbParams = parameters.recordset.map(p => p.parameter_name.replace('@', ''));
    
    nodeJsParameters.forEach((nodeParam, index) => {
      const dbParam = dbParams[index];
      if (dbParam) {
        const match = dbParam.toLowerCase() === nodeParam.toLowerCase();
        console.log(`  ${nodeParam} → ${dbParam} ${match ? '✅' : '❌'}`);
      } else {
        console.log(`  ${nodeParam} → (missing) ❌`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error checking stored procedure:', error.message);
  }
}

// Run the check
checkStoredProcedure()
  .then(() => {
    console.log('\n✅ Stored procedure check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Check failed:', error);
    process.exit(1);
  });