// Azure AD Authentication Configuration
const sql = require('mssql');

const azureADConfig = {
    server: process.env.DB_SERVER || 'smartdocs-sqlsrv.database.windows.net',
    database: process.env.DB_NAME || 'nit-smartdcos',
    port: 1433,
    pool: {
        max: 20,
        min: 0,
        idleTimeoutMillis: 30000
    },
    authentication: {
        type: 'azure-active-directory-default'  // Use Azure AD authentication
    },
    options: {
        encrypt: true,
        trustServerCertificate: false,
        enableArithAbort: true,
        connectionTimeout: 60000,
        requestTimeout: 60000
    }
};

// Alternative: Azure AD with access token
const azureADTokenConfig = {
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
            token: process.env.AZURE_AD_ACCESS_TOKEN  // Would need to be generated
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

// Alternative: Azure AD with username/password
const azureADPasswordConfig = {
    server: process.env.DB_SERVER || 'smartdocs-sqlsrv.database.windows.net',
    database: process.env.DB_NAME || 'nit-smartdcos',
    port: 1433,
    pool: {
        max: 20,
        min: 0,
        idleTimeoutMillis: 30000
    },
    authentication: {
        type: 'azure-active-directory-password',
        options: {
            userName: process.env.AZURE_AD_USERNAME || 'your-email@yourdomain.com',
            password: process.env.AZURE_AD_PASSWORD || 'your-azure-ad-password'
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

module.exports = {
    azureADConfig,
    azureADTokenConfig,
    azureADPasswordConfig
};