/**
 * Safe database configuration compatible with all environments
 * This configuration avoids any unsupported pool options that might cause errors
 */

// Load environment variables first
require('dotenv').config();

// Safe database configuration - tested and compatible
const safeConfig = {
    server: process.env.DB_SERVER || 'smartdocs-sqlsrv.database.windows.net',
    database: process.env.DB_NAME || 'nit-smartdcos',
    port: 1433,
    pool: {
        max: 20,                        // Maximum connections in pool
        min: 0,                         // Minimum connections (start with 0)
        idleTimeoutMillis: 5000,        // Close idle connections after 5 seconds
        acquireTimeoutMillis: 60000,    // Wait up to 60 seconds for connection
        createTimeoutMillis: 30000,     // Allow 30 seconds to create connection
        destroyTimeoutMillis: 5000,     // Allow 5 seconds to destroy connection
        reapIntervalMillis: 1000,       // Check for stale connections every second
        createRetryIntervalMillis: 200  // Retry every 200ms on connection failure
        // NOTE: evictionRunIntervalMillis is NOT supported by Tarn - removed
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
        encrypt: true,                  // Always true for Azure SQL
        trustServerCertificate: false,
        enableArithAbort: true,
        connectionTimeout: 60000,       // Connection timeout
        requestTimeout: 60000,          // Request timeout
        cancelTimeout: 5000,
        packetSize: 4096,
        useUTC: false,
        abortTransactionOnError: true,
        connectTimeout: 60000,
        socketTimeout: 60000
    }
};

// Fallback configuration with minimal options (most compatible)
const minimalConfig = {
    server: process.env.DB_SERVER || 'smartdocs-sqlsrv.database.windows.net',
    database: process.env.DB_NAME || 'nit-smartdcos',
    port: 1433,
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 10000        // Conservative timeout
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
        encrypt: true,
        trustServerCertificate: false,
        enableArithAbort: true,
        connectionTimeout: 30000,
        requestTimeout: 30000
    }
};

// Standard SQL authentication fallback (if Azure AD fails)
const sqlAuthConfig = {
    user: process.env.DB_USER || 'smartdocsai-sqlsrv',
    password: process.env.DB_PASSWORD || 'SmArTDoCs@2025',
    server: process.env.DB_SERVER || 'smartdocs-sqlsrv.database.windows.net',
    database: process.env.DB_NAME || 'nit-smartdcos',
    port: 1433,
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 10000
    },
    options: {
        encrypt: true,
        trustServerCertificate: false,
        enableArithAbort: true,
        connectionTimeout: 30000,
        requestTimeout: 30000
    }
};

/**
 * Get the most appropriate configuration based on environment
 */
function getOptimalConfig() {
    // Check if we're in production
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (isProduction) {
        console.log('🏭 Using production-optimized configuration');
        return safeConfig;
    } else {
        console.log('🧪 Using development configuration');
        return minimalConfig;
    }
}

/**
 * Validate configuration before use
 */
function validateConfig(config) {
    const issues = [];
    
    // Check for unsupported Tarn options
    if (config.pool && config.pool.evictionRunIntervalMillis) {
        issues.push('evictionRunIntervalMillis is not supported by Tarn');
    }
    
    // Check required authentication
    if (!config.authentication && !config.user) {
        issues.push('Authentication configuration missing');
    }
    
    // Check Azure-specific requirements
    if (!config.options || !config.options.encrypt) {
        issues.push('encrypt option must be true for Azure SQL');
    }
    
    return {
        isValid: issues.length === 0,
        issues: issues
    };
}

module.exports = {
    safeConfig,
    minimalConfig,
    sqlAuthConfig,
    getOptimalConfig,
    validateConfig
};
