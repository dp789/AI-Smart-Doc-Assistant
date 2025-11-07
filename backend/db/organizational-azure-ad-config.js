// Organizational Azure AD Configuration for nitorinfotech.com
const sql = require('mssql');
const { DefaultAzureCredential } = require('@azure/identity');

// Configuration for organizational Azure AD access
const organizationalConfig = {
    server: process.env.DB_SERVER || 'smartdocs-sqlsrv.database.windows.net',
    database: process.env.DB_NAME || 'nit-smartdcos',
    port: 1433,
    pool: {
        max: 20,
        min: 0,
        idleTimeoutMillis: 30000,
        acquireTimeoutMillis: 60000,
        createTimeoutMillis: 30000
    },
    authentication: {
        type: 'azure-active-directory-default',
        options: {
            // This will use the default Azure credential chain
            // Works with managed identity, Azure CLI, environment variables, etc.
        }
    },
    options: {
        encrypt: true,
        trustServerCertificate: false,
        enableArithAbort: true,
        connectionTimeout: 60000,
        requestTimeout: 60000
    }
};

// Alternative configuration using service principal (for production)
const servicePrincipalConfig = {
    server: process.env.DB_SERVER || 'smartdocs-sqlsrv.database.windows.net',
    database: process.env.DB_NAME || 'nit-smartdcos',
    port: 1433,
    pool: {
        max: 20,
        min: 0,
        idleTimeoutMillis: 30000
    },
    authentication: {
        type: 'azure-active-directory-service-principal-secret',
        options: {
            clientId: process.env.AZURE_CLIENT_ID,
            clientSecret: process.env.AZURE_CLIENT_SECRET,
            tenantId: process.env.AZURE_TENANT_ID || '8c3dad1d-b6bc-4f8b-939b-8263372eced6'
        }
    },
    options: {
        encrypt: true,
        trustServerCertificate: false,
        enableArithAbort: true,
        connectionTimeout: 60000,
        requestTimeout: 60000
    }
};

// Function to get access token for database
async function getAzureAccessToken() {
    try {
        const credential = new DefaultAzureCredential();
        const tokenResponse = await credential.getToken('https://database.windows.net/');
        return tokenResponse.token;
    } catch (error) {
        console.error('Failed to get Azure access token:', error);
        throw error;
    }
}

// Configuration using access token
async function getTokenBasedConfig() {
    const accessToken = await getAzureAccessToken();
    
    return {
        server: process.env.DB_SERVER || 'smartdocs-sqlsrv.database.windows.net',
        database: process.env.DB_NAME || 'nit-smartdcos',
        port: 1433,
        pool: {
            max: 20,
            min: 0,
            idleTimeoutMillis: 30000
        },
        authentication: {
            type: 'azure-active-directory-access-token',
            options: {
                token: accessToken
            }
        },
        options: {
            encrypt: true,
            trustServerCertificate: false,
            enableArithAbort: true,
            connectionTimeout: 60000,
            requestTimeout: 60000
        }
    };
}

// Test organizational access
async function testOrganizationalAccess() {
    try {
        console.log('🔍 Testing organizational Azure AD access...');
        
        // Try different methods
        const methods = [
            { name: 'Default Credential', config: organizationalConfig },
            { name: 'Service Principal', config: servicePrincipalConfig }
        ];
        
        for (const method of methods) {
            try {
                console.log(`\n🔍 Testing ${method.name}...`);
                
                const pool = new sql.ConnectionPool(method.config);
                await pool.connect();
                
                // Test query to verify organizational access
                const result = await pool.request().query(`
                    SELECT 
                        CURRENT_USER as currentUser,
                        USER_NAME() as userName,
                        DB_NAME() as databaseName,
                        SYSTEM_USER as systemUser,
                        GETDATE() as currentTime
                `);
                
                console.log('✅ Connection successful!');
                console.log('User info:', result.recordset[0]);
                
                await pool.close();
                return { success: true, method: method.name, config: method.config };
                
            } catch (error) {
                console.error(`❌ ${method.name} failed:`, error.message);
            }
        }
        
        // Try token-based approach
        try {
            console.log('\n🔍 Testing Token-based authentication...');
            const tokenConfig = await getTokenBasedConfig();
            
            const pool = new sql.ConnectionPool(tokenConfig);
            await pool.connect();
            
            const result = await pool.request().query('SELECT CURRENT_USER as user, DB_NAME() as databaseName');
            console.log('✅ Token-based authentication successful!');
            console.log('Connected as:', result.recordset[0]);
            
            await pool.close();
            return { success: true, method: 'Token-based', config: tokenConfig };
            
        } catch (tokenError) {
            console.error('❌ Token-based authentication failed:', tokenError.message);
        }
        
        return { success: false };
        
    } catch (error) {
        console.error('❌ Organizational access test failed:', error);
        return { success: false, error: error.message };
    }
}

module.exports = {
    organizationalConfig,
    servicePrincipalConfig,
    getTokenBasedConfig,
    getAzureAccessToken,
    testOrganizationalAccess
};