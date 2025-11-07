const fs = require('fs');
const path = require('path');
const { poolPromise } = require('../db');

async function runIngestionMigration() {
    try {
        console.log('🚀 Starting ingestion tracking migration...');
        
        // Read the SQL migration file
        const sqlFilePath = path.join(__dirname, 'add-ingestion-tracking-columns.sql');
        const migrationSQL = fs.readFileSync(sqlFilePath, 'utf8');
        
        // Get database connection
        const pool = await poolPromise;
        
        // Split SQL commands by GO statements and execute them one by one
        const commands = migrationSQL.split(/\s*GO\s*\n/i);
        
        for (let i = 0; i < commands.length; i++) {
            const command = commands[i].trim();
            if (command && !command.startsWith('--')) {
                console.log(`📋 Executing command ${i + 1}/${commands.length}...`);
                try {
                    await pool.request().query(command);
                    console.log(`✅ Command ${i + 1} executed successfully`);
                } catch (error) {
                    console.error(`❌ Error in command ${i + 1}:`, error.message);
                    // Continue with other commands unless it's a critical error
                    if (error.message.includes('already exists')) {
                        console.log('ℹ️ Resource already exists, continuing...');
                    } else {
                        throw error;
                    }
                }
            }
        }
        
        console.log('✅ Ingestion tracking migration completed successfully!');
        
        // Test the new functionality
        console.log('\n🧪 Testing new ingestion tracking functionality...');
        
        const testResult = await pool.request().query(`
            SELECT TOP 3 
                id,
                file_name,
                ingestion_status,
                ingestion_date
            FROM document_meta_data
            ORDER BY date_published DESC
        `);
        
        console.log('📋 Sample documents with ingestion status:');
        testResult.recordset.forEach(doc => {
            console.log(`   - ${doc.file_name}: ${doc.ingestion_status || 'Not processed'} ${doc.ingestion_date ? `(${doc.ingestion_date})` : ''}`);
        });
        
        console.log('\n🎉 Migration and testing completed successfully!');
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

// Run the migration if this file is executed directly
if (require.main === module) {
    runIngestionMigration()
        .then(() => {
            console.log('✅ Migration script completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Migration script failed:', error);
            process.exit(1);
        });
}

module.exports = { runIngestionMigration };
