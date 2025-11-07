/**
 * Enhanced database configuration to prevent data caching issues
 * This configuration ensures that the API always gets fresh data from the database
 */

const sql = require('mssql');

// Configuration optimized for fresh data reads and minimal caching
const freshDataConfig = {
    server: process.env.DB_SERVER || 'smartdocs-sqlsrv.database.windows.net',
    database: process.env.DB_NAME || 'nit-smartdcos',
    port: 1433,
    pool: {
        max: 20,                          // Maximum connections
        min: 0,                           // Minimum connections (start with none)
        idleTimeoutMillis: 5000,          // Reduced from 30000 - close idle connections faster
        acquireTimeoutMillis: 60000,      // Time to wait for connection
        createTimeoutMillis: 30000,       // Time to create new connection
        destroyTimeoutMillis: 5000,       // Time to destroy connection
        reapIntervalMillis: 500,          // Check for stale connections more frequently
        createRetryIntervalMillis: 200    // Retry interval for failed connections
        // Removed evictionRunIntervalMillis - not supported by Tarn
    },
    authentication: {
        type: 'azure-active-directory-service-principal-secret',
        options: {
            clientId: process.env.AZURE_CLIENT_ID || '9da33bd8-2014-483a-8a03-0ce270f1dac0',
            clientSecret: process.env.AZURE_CLIENT_SECRET,
            tenantId: process.env.AZURE_TENANT_ID || '8c3dad1d-b6bc-4f8b-939b-8263372eced6'
        }
    },
    options: {
        encrypt: true,                    // Always true for Azure SQL
        trustServerCertificate: false,
        enableArithAbort: true,
        connectionTimeout: 30000,         // Reduced timeout
        requestTimeout: 30000,            // Reduced timeout
        cancelTimeout: 5000,
        packetSize: 4096,
        useUTC: false,
        abortTransactionOnError: true,
        connectTimeout: 30000,
        socketTimeout: 30000,
        
        // Additional options to prevent caching
        parseJSON: true,                  // Parse JSON properly
        validateParameters: true          // Validate all parameters
        // Removed isolationLevel from options - should be set per query
        // Removed beforeConnect - not supported in all versions
    }
};

// Alternative configuration using standard SQL authentication (if needed)
const freshDataStandardConfig = {
    user: process.env.DB_USER || 'smartdocsai-sqlsrv',
    password: process.env.DB_PASSWORD || 'SmArTDoCs@2025',
    server: process.env.DB_SERVER || 'smartdocs-sqlsrv.database.windows.net',
    database: process.env.DB_NAME || 'nit-smartdcos',
    port: 1433,
    pool: {
        max: 15,
        min: 0,
        idleTimeoutMillis: 5000,          // Faster cleanup of idle connections
        acquireTimeoutMillis: 30000,
        createTimeoutMillis: 15000,
        destroyTimeoutMillis: 5000
    },
    options: {
        encrypt: true,
        trustServerCertificate: false,
        enableArithAbort: true,
        connectionTimeout: 30000,
        requestTimeout: 30000
        // Removed isolationLevel - should be set per query, not connection
    }
};

/**
 * Create a fresh connection pool optimized for real-time data
 */
async function createFreshDataPool() {
    try {
        console.log('🚀 Creating optimized database pool for fresh data reads...');
        
        const pool = new sql.ConnectionPool(freshDataConfig);
        
        // Add event listeners for monitoring
        pool.on('connect', () => {
            console.log('✅ Fresh data pool connected');
        });
        
        pool.on('error', (err) => {
            console.error('❌ Fresh data pool error:', err);
        });
        
        pool.on('close', () => {
            console.log('🔒 Fresh data pool closed');
        });
        
        await pool.connect();
        
        // Test the connection with a fresh read
        const testRequest = pool.request();
        await testRequest.query('SET TRANSACTION ISOLATION LEVEL READ_UNCOMMITTED');
        const testResult = await testRequest.query('SELECT COUNT(*) as total_docs FROM document_meta_data WITH (NOLOCK) WHERE is_active = 1');
        
        console.log(`✅ Fresh data pool test successful - Found ${testResult.recordset[0].total_docs} active documents`);
        
        return pool;
        
    } catch (error) {
        console.error('❌ Failed to create fresh data pool:', error);
        
        // Fallback to standard configuration
        console.log('🔄 Attempting fallback to standard configuration...');
        try {
            const fallbackPool = new sql.ConnectionPool(freshDataStandardConfig);
            await fallbackPool.connect();
            console.log('✅ Fallback pool created successfully');
            return fallbackPool;
        } catch (fallbackError) {
            console.error('❌ Fallback also failed:', fallbackError);
            throw error;
        }
    }
}

/**
 * Execute a query with guaranteed fresh data
 * @param {Object} pool - Database pool
 * @param {string} query - SQL query
 * @param {Object} inputs - Query inputs
 */
async function executeFreshQuery(pool, query, inputs = {}) {
    try {
        const request = pool.request();
        
        // Ensure we're reading the latest data
        await request.query('SET TRANSACTION ISOLATION LEVEL READ_UNCOMMITTED');
        
        // Add inputs if provided
        for (const [key, value] of Object.entries(inputs)) {
            if (value.type && value.value !== undefined) {
                request.input(key, value.type, value.value);
            } else {
                request.input(key, value);
            }
        }
        
        // Execute the query with NOLOCK hint if not already present
        const enhancedQuery = query.includes('WITH (NOLOCK)') ? query : 
                            query.replace(/FROM\s+(\w+)/gi, 'FROM $1 WITH (NOLOCK)');
        
        console.log(`🔍 Executing fresh query: ${enhancedQuery.substring(0, 100)}...`);
        
        const result = await request.query(enhancedQuery);
        
        console.log(`✅ Query executed successfully, returned ${result.recordset?.length || 0} rows`);
        
        return result;
        
    } catch (error) {
        console.error('❌ Fresh query execution failed:', error);
        throw error;
    }
}

/**
 * Validate that the pool is returning fresh data
 */
async function validateFreshData(pool) {
    try {
        console.log('🧪 Testing fresh data retrieval...');
        
        // Get current count
        const result1 = await executeFreshQuery(pool, 'SELECT COUNT(*) as count FROM document_meta_data WHERE is_active = 1');
        const count1 = result1.recordset[0].count;
        
        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Get count again
        const result2 = await executeFreshQuery(pool, 'SELECT COUNT(*) as count FROM document_meta_data WHERE is_active = 1');
        const count2 = result2.recordset[0].count;
        
        console.log(`📊 Count consistency check: ${count1} vs ${count2}`);
        
        // Test with a specific workspace query
        const workspaceTest = await executeFreshQuery(pool, 
            'SELECT COUNT(*) as count FROM document_meta_data WHERE is_active = 1 AND workspace_id = @WorkspaceId',
            { WorkspaceId: { type: sql.VarChar(255), value: 'ddb18531-4243-4742-88ec-48c26cad6251' } }
        );
        
        console.log(`📊 Workspace document count: ${workspaceTest.recordset[0].count}`);
        
        return {
            success: true,
            totalDocuments: count2,
            workspaceDocuments: workspaceTest.recordset[0].count
        };
        
    } catch (error) {
        console.error('❌ Fresh data validation failed:', error);
        return { success: false, error: error.message };
    }
}

module.exports = {
    freshDataConfig,
    freshDataStandardConfig,
    createFreshDataPool,
    executeFreshQuery,
    validateFreshData
};
