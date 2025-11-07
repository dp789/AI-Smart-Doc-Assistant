// Alternative Azure SQL configuration for troubleshooting
const sql = require('mssql');

// Method 1: Standard SQL Authentication (current approach)
const standardConfig = {
    user: process.env.DB_USER || 'smartdocsai-sqlsrv',
    password: process.env.DB_PASSWORD || 'SmArTDoCs@2025',
    server: process.env.DB_SERVER || 'smartdocs-sqlsrv.database.windows.net',
    database: process.env.DB_NAME || 'nit-smartdcos',
    port: 1433,
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    },
    options: {
        encrypt: true,
        trustServerCertificate: false,
        enableArithAbort: true,
        connectionTimeout: 60000,
        requestTimeout: 60000
    }
};

// Method 2: Connection string approach (often works better with Azure SQL)
const getConnectionString = () => {
    const server = process.env.DB_SERVER || 'smartdocs-sqlsrv.database.windows.net';
    const database = process.env.DB_NAME || 'nit-smartdcos';
    const user = process.env.DB_USER || 'smartdocsai-sqlsrv';
    const password = process.env.DB_PASSWORD || 'SmArTDoCs@2025';
    
    return `Server=${server};Database=${database};User Id=${user};Password=${password};Encrypt=true;TrustServerCertificate=false;Connection Timeout=60;`;
};

// Method 3: Tedious driver specific configuration
const tediousConfig = {
    server: process.env.DB_SERVER || 'smartdocs-sqlsrv.database.windows.net',
    authentication: {
        type: 'default',
        options: {
            userName: process.env.DB_USER || 'smartdocsai-sqlsrv',
            password: process.env.DB_PASSWORD || 'SmArTDoCs@2025'
        }
    },
    options: {
        database: process.env.DB_NAME || 'nit-smartdcos',
        encrypt: true,
        trustServerCertificate: false,
        enableArithAbort: true,
        connectTimeout: 60000,
        requestTimeout: 60000,
        rowCollectionOnRequestCompletion: true,
        rowCollectionOnDone: true,
        validateParameters: true,
        port: 1433
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

// Function to try different connection methods //
async function tryConnectionMethods() {
    const methods = [
        { name: 'Standard Config', config: standardConfig },
        { name: 'Connection String', config: { connectionString: getConnectionString() } },
        { name: 'Tedious Config', config: tediousConfig }
    ];
    
    for (const method of methods) {
        try {
            console.log(`\n🔍 Trying ${method.name}...`);
            console.log('Config:', JSON.stringify(method.config, (key, value) => {
                if (key.toLowerCase().includes('password')) return '[HIDDEN]';
                return value;
            }, 2));
            
            const pool = new sql.ConnectionPool(method.config);
            await pool.connect();
            
            console.log(`✅ ${method.name} successful!`);
            
            // Test a simple query
            const result = await pool.request().query('SELECT 1 as test');
            console.log('✅ Test query successful:', result.recordset);
            
            return { success: true, method: method.name, pool, config: method.config };
            
        } catch (error) {
            console.error(`❌ ${method.name} failed:`, error.message);
            
            // Log specific error codes
            if (error.code) {
                console.error(`   Error Code: ${error.code}`);
            }
            if (error.originalError) {
                console.error(`   Original Error: ${error.originalError.message}`);
            }
        }
    }
    
    return { success: false };
}

// Function to diagnose connection issues
async function diagnoseConnection() {
    console.log('\n🔍 Starting Azure SQL Connection Diagnosis...\n');
    
    // Check environment variables
    console.log('📋 Environment Variables:');
    console.log(`   DB_SERVER: ${process.env.DB_SERVER || 'NOT SET (using default)'}`);
    console.log(`   DB_NAME: ${process.env.DB_NAME || 'NOT SET (using default)'}`);
    console.log(`   DB_USER: ${process.env.DB_USER || 'NOT SET (using default)'}`);
    console.log(`   DB_PASSWORD: ${process.env.DB_PASSWORD ? '[SET]' : 'NOT SET (using default)'}`);
    
    // Check basic connectivity
    console.log('\n🌐 Testing server connectivity...');
    const server = process.env.DB_SERVER || 'smartdocs-sqlsrv.database.windows.net';
    
    try {
        const { promises: dns } = require('dns');
        const addresses = await dns.lookup(server);
        console.log(`✅ DNS resolution successful: ${addresses.address}`);
    } catch (dnsError) {
        console.error(`❌ DNS resolution failed: ${dnsError.message}`);
        return false;
    }
    
    // Try different connection methods
    console.log('\n🔄 Trying different connection methods...');
    const result = await tryConnectionMethods();
    
    if (result.success) {
        console.log(`\n🎉 Connection successful with ${result.method}!`);
        console.log('✅ Use this configuration in your main application.');
        return result;
    } else {
        console.log('\n❌ All connection methods failed.');
        console.log('\n💡 Troubleshooting suggestions:');
        console.log('1. Verify credentials in Azure Portal');
        console.log('2. Check Azure SQL firewall rules');
        console.log('3. Ensure SQL Authentication is enabled');
        console.log('4. Verify the database name is correct');
        console.log('5. Try connecting from Azure Cloud Shell');
        console.log('6. Check if your IP is allowed in Azure SQL firewall');
        return false;
    }
}

module.exports = {
    standardConfig,
    tediousConfig,
    getConnectionString,
    tryConnectionMethods,
    diagnoseConnection
};