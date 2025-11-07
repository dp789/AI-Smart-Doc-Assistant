const fs = require('fs');
const path = require('path');
const { poolPromise } = require('../db');

async function updateDocumentMetaDataTable() {
    try {
        console.log('🚀 Updating document_meta_data table...');
        
        // Read the SQL script
        const sqlScriptPath = path.join(__dirname, 'update-document-meta-data-table.sql');
        const sqlScript = fs.readFileSync(sqlScriptPath, 'utf8');
        
        // Connect to database
        const pool = await poolPromise;
        console.log('✅ Connected to database');
        
        // Execute the SQL script
        console.log('📝 Executing SQL update script...');
        const result = await pool.request().query(sqlScript);
        
        console.log('✅ Document meta data table update completed successfully!');
        console.log('📊 Result:', result);
        
        // Test the updated API endpoint
        console.log('\n🧪 Testing the updated API endpoint...');
        console.log('You can now test the endpoint at: /api/document-categories');
        console.log('And upload files with categories will now store the category ID in the database');
        
    } catch (error) {
        console.error('❌ Error updating document meta data table:', error);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

// Run the update
updateDocumentMetaDataTable(); 