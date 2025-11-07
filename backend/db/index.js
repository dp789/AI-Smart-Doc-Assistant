const sql = require('mssql');
const dbConfig = require('./config');

// Create connection pool to Azure SQL Server with retry logic
let pool = null;
let connectionAttempts = 0;
const maxRetries = 3;

async function createConnection() {
    while (connectionAttempts < maxRetries) {
        try {
            connectionAttempts++;
            console.log(`🔗 Attempting to connect to Azure SQL (attempt ${connectionAttempts}/${maxRetries})...`);
            
            // Use Azure AD Service Principal connection method
            console.log('📡 Connecting to Azure SQL with Azure AD authentication...');
            const connectionPool = new sql.ConnectionPool(dbConfig);
            
            // Add event listeners for better debugging
            connectionPool.on('connect', () => {
                console.log('✅ Connection pool connected to Azure SQL Database');
            });
            
            connectionPool.on('error', (err) => {
                console.error('❌ Connection pool error:', err);
            });
            
            // Connect to the database
            pool = await connectionPool.connect();
            
            console.log('✅ Successfully connected to Azure SQL Server');
            console.log('📊 Connection details:', {
                server: dbConfig.server,
                database: dbConfig.database,
                user: dbConfig.user,
                connected: pool.connected,
                connecting: pool.connecting
            });
            
            return pool;
            
        } catch (err) {
            console.error(`❌ Connection attempt ${connectionAttempts} failed:`, err.message);
            
            // Enhanced error handling with Azure-specific guidance
            if (err.message.includes('IP address') && err.message.includes('not allowed')) {
                console.error('🚫 IP FIREWALL RESTRICTION DETECTED!');
                console.error('💡 SOLUTION: Use Azure AD authentication instead');
                console.error('   1. ✅ Enable "Allow Azure services" in Azure Portal');
                console.error('   2. ✅ Configure Azure AD authentication');
                console.error('   3. ✅ Use managed identity or service principal');
                console.error('   4. ✅ Set AZURE_CLIENT_SECRET environment variable');
            } else if (err.code === 'ELOGIN') {
                console.error('🔐 Login failed - Check username and password');
                console.error('💡 Troubleshooting tips:');
                console.error('   1. Verify credentials in Azure Portal');
                console.error('   2. Check if user has access to the specific database');
                console.error('   3. Ensure SQL Authentication is enabled');
                console.error('   4. Try connecting with SQL Server Management Studio first');
            } else if (err.code === 'ETIMEOUT' || err.code === 'ECONNRESET') {
                console.error('⏱️  Connection timeout - Check firewall settings');
                console.error('💡 Troubleshooting tips:');
                console.error('   1. Add your IP to Azure SQL firewall rules');
                console.error('   2. Check if "Allow Azure services" is enabled');
                console.error('   3. Verify network connectivity');
            } else if (err.code === 'ENOTFOUND') {
                console.error('🌐 Server not found - Check server name');
                console.error('💡 Check server name format: servername.database.windows.net');
            }
            
            if (connectionAttempts >= maxRetries) {
                console.error('💥 All connection attempts failed.');
                console.error('🔧 FINAL RECOMMENDATION: Set up Azure AD authentication to bypass IP restrictions');
                throw err;
            } else {
                console.log(`⏳ Waiting 2 seconds before retry...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
    }
}

const poolPromise = createConnection();

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down gracefully...');
    if (pool) {
        await pool.close();
        console.log('Database connection closed');
    }
    process.exit(0);
});

module.exports = {
    sql,
    poolPromise,
    getPool: () => pool
}; 