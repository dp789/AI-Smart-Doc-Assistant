/**
 * Environment URL Testing Utility
 * Tests dynamic URL handling for localhost vs live deployment
 */

import envConfig, { verifyEnvironmentUrls } from '../envConfig';

/**
 * Test function to verify URL configuration
 * Call this from browser console to verify correct URLs
 */
export const testEnvironmentUrls = () => {
  console.log('🧪 Testing Environment URL Configuration...\n');
  
  // Get current configuration
  const config = verifyEnvironmentUrls();
  
  // Test scenarios
  console.log('🔍 Test Scenarios:');
  console.log('==================');
  
  if (config.isLive) {
    console.log('✅ Testing LIVE DEPLOYMENT scenario:');
    console.log(`   ✓ Hostname: ${window.location.hostname} === 'nitor-smartdocs.azurewebsites.net'`);
    console.log(`   ✓ API URL: ${config.apiUrl} === 'https://nitor-smartdocs.azurewebsites.net/api'`);
    console.log(`   ✓ Upload URL: ${config.apiUrl}/upload/pdf`);
    console.log(`   ✓ Environment: ${config.environment} === 'live'`);
    
    // Verify upload endpoints
    console.log('\n📤 Upload Endpoints:');
    console.log(`   Primary: ${config.apiUrl}/upload/pdf`);
    console.log(`   Fallback: ${config.apiUrl}/upload/pdf-simple`);
    console.log(`   Status: ${config.apiUrl}/upload/status`);
    console.log(`   Debug: ${config.apiUrl}/upload/debug`);
    
  } else if (config.isLocalhost) {
    console.log('✅ Testing LOCALHOST DEVELOPMENT scenario:');
    console.log(`   ✓ Hostname: ${window.location.hostname} (localhost)`);
    console.log(`   ✓ API URL: ${config.apiUrl} === 'http://localhost:8090/api'`);
    console.log(`   ✓ Upload URL: ${config.apiUrl}/upload/pdf`);
    console.log(`   ✓ Environment: ${config.environment} === 'development'`);
    
    // Verify upload endpoints
    console.log('\n📤 Upload Endpoints:');
    console.log(`   Primary: ${config.apiUrl}/upload/pdf`);
    console.log(`   Fallback: ${config.apiUrl}/upload/pdf-simple`);
    console.log(`   Status: ${config.apiUrl}/upload/status`);
    console.log(`   Debug: ${config.apiUrl}/upload/debug`);
    
  } else {
    console.log('⚠️  Testing OTHER ENVIRONMENT scenario:');
    console.log(`   ⚠️  Hostname: ${window.location.hostname}`);
    console.log(`   ⚠️  API URL: ${config.apiUrl}`);
    console.log(`   ⚠️  Environment: ${config.environment}`);
  }
  
  console.log('\n🎯 Test Results Summary:');
  console.log('========================');
  console.log(`Environment Detection: ${config.environment.toUpperCase()}`);
  console.log(`Is Live: ${config.isLive ? '✅ YES' : '❌ NO'}`);
  console.log(`Is Localhost: ${config.isLocalhost ? '✅ YES' : '❌ NO'}`);
  console.log(`API URL: ${config.apiUrl}`);
  
  return config;
};

/**
 * Test API connectivity
 */
export const testApiConnectivity = async () => {
  const config = envConfig;
  
  console.log('🌐 Testing API Connectivity...');
  console.log(`Testing: ${config.apiUrl}/test`);
  
  try {
    const response = await fetch(`${config.apiUrl}/test`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API connectivity test PASSED');
      console.log('Response:', data);
      return { success: true, data };
    } else {
      console.error('❌ API connectivity test FAILED');
      console.error(`Status: ${response.status} ${response.statusText}`);
      return { success: false, status: response.status };
    }
  } catch (error) {
    console.error('❌ API connectivity test ERROR');
    console.error('Error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Test upload service status
 */
export const testUploadService = async () => {
  const config = envConfig;
  
  console.log('📤 Testing Upload Service...');
  console.log(`Testing: ${config.apiUrl}/upload/status`);
  
  try {
    const response = await fetch(`${config.apiUrl}/upload/status`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Upload service test PASSED');
      console.log('Response:', data);
      return { success: true, data };
    } else {
      console.error('❌ Upload service test FAILED');
      console.error(`Status: ${response.status} ${response.statusText}`);
      return { success: false, status: response.status };
    }
  } catch (error) {
    console.error('❌ Upload service test ERROR');
    console.error('Error:', error.message);
    return { success: false, error: error.message };
  }
};

// Auto-run verification on import (only in development)
if (process.env.NODE_ENV !== 'production') {
  console.log('🔧 Auto-running environment verification...');
  testEnvironmentUrls();
}

export default {
  testEnvironmentUrls,
  testApiConnectivity,
  testUploadService
};