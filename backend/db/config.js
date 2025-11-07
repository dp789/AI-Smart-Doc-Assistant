// Load environment variables first
require('dotenv').config();

// Database configuration - Azure AD for nitorinfotech.com organization
const config = {
    server: process.env.DB_SERVER || 'smartdocs-sqlsrv.database.windows.net',
    database: process.env.DB_NAME || 'nit-smartdcos',
    port: 1433,
    pool: {
        max: 20,
        min: 0,
        idleTimeoutMillis: 5000,          // Reduced from 30000 to prevent stale connections
        acquireTimeoutMillis: 60000,
        createTimeoutMillis: 30000,
        destroyTimeoutMillis: 5000,
        reapIntervalMillis: 500,          // More frequent cleanup
        createRetryIntervalMillis: 200
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
        encrypt: true, // Always true for Azure SQL
        trustServerCertificate: false,
        enableArithAbort: true,
        connectionTimeout: 60000,
        requestTimeout: 60000,
        cancelTimeout: 5000,
        packetSize: 4096,
        useUTC: false,
        abortTransactionOnError: true,
        connectTimeout: 60000,
        socketTimeout: 60000
    }
};

// Fallback configuration for development/testing
const fallbackConfig = {
    server: process.env.DB_SERVER || 'smartdocs-sqlsrv.database.windows.net',
    database: process.env.DB_NAME || 'nit-smartdcos',
    port: 1433,
    pool: {
        max: 20,
        min: 0,
        idleTimeoutMillis: 5000           // Reduced for fresh data
    },
    authentication: {
        type: 'azure-active-directory-default'  // Uses default Azure credential chain
    },
    options: {
        encrypt: true,
        trustServerCertificate: false,
        enableArithAbort: true,
        connectionTimeout: 60000,
        requestTimeout: 60000
    }
};

// Function to get the appropriate configuration with error handling
function getConfig() {
    try {
        // Priority order for authentication methods:
        // 1. Service Principal (production) - when client secret is available
        // 2. Default Azure Credential (managed identity, Azure CLI, etc.)
        
        if (process.env.AZURE_CLIENT_SECRET) {
            console.log('✅ Using Azure AD Service Principal authentication');
            console.log('📋 This method bypasses IP firewall restrictions');
            
            // Validate configuration to avoid Tarn errors
            const validatedConfig = validatePoolConfig(config);
            return validatedConfig;
        } else {
            console.log('⚠️  No client secret found, using default Azure credentials');
            console.log('📋 Will try managed identity, Azure CLI, or environment credentials');
            
            // Validate fallback configuration
            const validatedFallback = validatePoolConfig(fallbackConfig);
            return validatedFallback;
        }
    } catch (error) {
        console.error('❌ Error in configuration selection:', error);
        console.log('🔄 Using minimal safe configuration...');
        return getMinimalConfig();
    }
}

// Validate and clean pool configuration to avoid Tarn errors
function validatePoolConfig(config) {
    const cleanConfig = JSON.parse(JSON.stringify(config)); // Deep clone
    
    // Remove any options that might not be supported by Tarn
    if (cleanConfig.pool) {
        // Keep only the well-supported options
        const supportedPoolOptions = {
            max: cleanConfig.pool.max || 10,
            min: cleanConfig.pool.min || 0,
            idleTimeoutMillis: cleanConfig.pool.idleTimeoutMillis || 10000,
            acquireTimeoutMillis: cleanConfig.pool.acquireTimeoutMillis || 60000,
            createTimeoutMillis: cleanConfig.pool.createTimeoutMillis || 30000,
            destroyTimeoutMillis: cleanConfig.pool.destroyTimeoutMillis || 5000,
            reapIntervalMillis: cleanConfig.pool.reapIntervalMillis || 1000,
            createRetryIntervalMillis: cleanConfig.pool.createRetryIntervalMillis || 200
        };
        
        cleanConfig.pool = supportedPoolOptions;
        console.log('🔧 Pool configuration validated and cleaned');
    }
    
    return cleanConfig;
}

// Minimal configuration that should work in all environments
function getMinimalConfig() {
    return {
        server: process.env.DB_SERVER || 'smartdocs-sqlsrv.database.windows.net',
        database: process.env.DB_NAME || 'nit-smartdcos',
        port: 1433,
        pool: {
            max: 10,
            min: 0,
            idleTimeoutMillis: 10000
        },
        authentication: {
            type: process.env.AZURE_CLIENT_SECRET ? 
                'azure-active-directory-service-principal-secret' : 
                'azure-active-directory-default',
            options: process.env.AZURE_CLIENT_SECRET ? {
                clientId: process.env.AZURE_CLIENT_ID || '9da33bd8-2014-483a-8a03-0ce270f1dac0',
                clientSecret: process.env.AZURE_CLIENT_SECRET,
                tenantId: process.env.AZURE_TENANT_ID || '8c3dad1d-b6bc-4f8b-939b-8263372eced6'
            } : {}
        },
        options: {
            encrypt: true,
            trustServerCertificate: false,
            enableArithAbort: true,
            connectionTimeout: 30000,
            requestTimeout: 30000
        }
    };
}

const selectedConfig = getConfig();

console.log('Database config loaded - Azure AD organizational access enabled');
console.log('Server:', selectedConfig.server);
console.log('Database:', selectedConfig.database);
console.log('Authentication:', selectedConfig.authentication.type);
console.log('Organization: nitorinfotech.com');

module.exports = selectedConfig; 