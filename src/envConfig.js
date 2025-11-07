/**
 * Environment configuration that handles different environments
 * Automatically detects and configures URLs for localhost vs live deployment
 * Live URL: https://nitor-smartdocs.azurewebsites.net/
 * Localhost: http://localhost:3000 (frontend) + http://localhost:8090 (backend)
 */

// Determine environment based on both NODE_ENV and hostname
const isLiveDeployment = () => {
  // Check if we're running on the live Azure website
  if (typeof window !== 'undefined') {
    return window.location.hostname === 'nitor-smartdocs.azurewebsites.net';
  }
  return false;
};

const isProd = process.env.NODE_ENV === 'production' || isLiveDeployment();

// Base URL for the application - this must match what's configured in Azure AD
// In production, this should be your actual domain
// In development, it uses localhost with the specified port
const getBaseUrl = () => {
  if (isProd) {
    // For production: Use the REACT_APP_BASE_URL environment variable if set,
    // otherwise fallback to window.location.origin
    return process.env.REACT_APP_BASE_URL || window.location.origin;
  } else {
    // For local development
    return 'http://localhost:3000';
  }
};

// Helper function to dynamically build API URL based on environment
const buildApiUrl = () => {
  // Priority 1: Use explicit environment variable if set
  if (process.env.REACT_APP_API_URL) {
    console.log('🔧 Using explicit REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
    return process.env.REACT_APP_API_URL;
  }
  
  // Priority 2: Detect live deployment
  if (isLiveDeployment()) {
    const liveApiUrl = 'https://nitor-smartdocs.azurewebsites.net/api';
    console.log('🌐 Live deployment detected - Using live API URL:', liveApiUrl);
    return liveApiUrl;
  }
  
  // Priority 3: Production mode but not live deployment (e.g., other domains)
  if (isProd && typeof window !== 'undefined') {
    const baseUrl = getBaseUrl();
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const prodApiUrl = `${cleanBaseUrl}/api`;
    console.log('🏭 Production mode - Constructing API URL from base:', prodApiUrl);
    return prodApiUrl;
  }
  
  // Priority 4: Local development
  const localApiUrl = 'http://localhost:8090/api';
  console.log('💻 Local development - Using localhost API URL:', localApiUrl);
  return localApiUrl;
};

// Ingest API configuration
const getIngestApiUrl = () => {
  // Use environment variable if set, otherwise use backend proxy
  return process.env.REACT_APP_INGEST_API_URL || buildApiUrl();
};

// Get log level from environment or use defaults based on environment
const getLogLevel = () => {
  // If explicitly set in environment, use that
  if (process.env.REACT_APP_LOG_LEVEL) {
    return parseInt(process.env.REACT_APP_LOG_LEVEL, 10);
  }
  
  // Otherwise, use sensible defaults
  return isProd ? 1 : 3; // 1=Warning in prod, 3=Verbose in dev
};

// Build configuration object with environment detection
const buildEnvConfig = () => {
  const isLive = isLiveDeployment();
  const baseUrl = getBaseUrl();
  const apiUrl = buildApiUrl();
  const ingestApiUrl = getIngestApiUrl();
  
  const config = {
    // Environment detection
    isProd: isProd,
    isLive: isLive,
    isLocalhost: !isProd && !isLive,
    
    // URLs
    baseUrl: baseUrl,
    apiUrl: apiUrl,
    ingestApiUrl: ingestApiUrl,
    
    // Environment info
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'unknown',
    environment: isLive ? 'live' : (isProd ? 'production' : 'development'),
    
    // Configuration
    logLevel: isProd ? 1 : 3, // Error in prod, Verbose in dev
    version: process.env.REACT_APP_VERSION || '1.0.0'
  };
  
  // Log configuration for debugging (only in development)
  if (!isProd || isLive) {
    console.log('🔧 Environment Configuration:');
    console.log(`   Environment: ${config.environment}`);
    console.log(`   Hostname: ${config.hostname}`);
    console.log(`   Is Live: ${config.isLive}`);
    console.log(`   Is Production: ${config.isProd}`);
    console.log(`   Base URL: ${config.baseUrl}`);
    console.log(`   API URL: ${config.apiUrl}`);
    console.log(`   Ingest API URL: ${config.ingestApiUrl}`);
  }
  
  return config;
};

const envConfig = buildEnvConfig();

// Helper to get public path - useful for routing
export const getPublicPath = () => {
  return process.env.PUBLIC_URL || '/';
};

// Runtime verification function to confirm correct URL configuration
export const verifyEnvironmentUrls = () => {
  console.log('🔍 Environment URL Verification:');
  console.log('=====================================');
  
  if (envConfig.isLive) {
    console.log('✅ LIVE DEPLOYMENT DETECTED');
    console.log(`   Frontend URL: https://nitor-smartdocs.azurewebsites.net/`);
    console.log(`   Backend API: https://nitor-smartdocs.azurewebsites.net/api`);
    console.log(`   Upload API: https://nitor-smartdocs.azurewebsites.net/api/upload`);
    
    // Verify the URLs are correct
    if (envConfig.apiUrl !== 'https://nitor-smartdocs.azurewebsites.net/api') {
      console.error('❌ ERROR: API URL mismatch!');
      console.error(`   Expected: https://nitor-smartdocs.azurewebsites.net/api`);
      console.error(`   Actual: ${envConfig.apiUrl}`);
    } else {
      console.log('✅ API URL correctly configured for live deployment');
    }
    
  } else if (envConfig.isLocalhost) {
    console.log('💻 LOCALHOST DEVELOPMENT DETECTED');
    console.log(`   Frontend URL: http://localhost:3000/`);
    console.log(`   Backend API: http://localhost:8090/api`);
    console.log(`   Upload API: http://localhost:8090/api/upload`);
    
    // Verify the URLs are correct
    if (envConfig.apiUrl !== 'http://localhost:8090/api') {
      console.warn('⚠️  WARNING: API URL may be incorrect for localhost');
      console.warn(`   Expected: http://localhost:8090/api`);
      console.warn(`   Actual: ${envConfig.apiUrl}`);
    } else {
      console.log('✅ API URL correctly configured for localhost development');
    }
    
  } else {
    console.log('🏭 OTHER PRODUCTION ENVIRONMENT');
    console.log(`   Current hostname: ${envConfig.hostname}`);
    console.log(`   Base URL: ${envConfig.baseUrl}`);
    console.log(`   API URL: ${envConfig.apiUrl}`);
  }
  
  console.log('=====================================');
  return envConfig;
};

export default envConfig; 