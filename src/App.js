import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { MsalProvider, useMsal } from "@azure/msal-react";
import { PublicClientApplication, EventType, InteractionType, BrowserCacheLocation } from "@azure/msal-browser";
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { msalConfig } from './authConfig';
import { theme } from './theme';
import { handleTokenExpiration } from './utils/authUtils';
import './App.css';

// Components
import Header from './components/Header';
import Login from './components/Login';
import Documents from './Customers';
import ChatBot from './components/ChatBot';
import DocumentChat from './components/DocumentChat';
import MCPChat from './components/MCPChat';
import MCPToolsChat from './components/MCPToolsChat';
import MCPAnalyticsChat from './components/MCPAnalyticsChat';
import TestChatBot from './components/TestChatBot';
import ProtectedRoute from './components/ProtectedRoute';
import Upload from './components/Upload/Upload';
import FileListDemo from './components/FileListDemo';
import AIWorkflowBuilder from './components/AIWorkflowBuilder';
import MCQGenerator from './components/MCQGenerator';
import ProductionRedirectHandler from './components/ProductionRedirectHandler';
import { NotificationProvider } from './hooks/useNotifications';

import { Provider } from 'react-redux';
import store from './redux/store';


// Initialize MSAL - ensure it's configured as a Public Client Application for SPA
console.log("Initializing MSAL with config:", {
  clientId: msalConfig.auth.clientId,
  authority: msalConfig.auth.authority,
  redirectUri: msalConfig.auth.redirectUri
});

export const msalInstance = new PublicClientApplication(msalConfig);

// IMPORTANT: Properly sequence the initialization and redirect handling
// This is the correct order for MSAL.js 2.0
// FIXED: Removed redirect logic from MSAL init to prevent conflicts with ProductionRedirectHandler
(async () => {
  try {
    // 1. First initialize MSAL
    await msalInstance.initialize();
    console.log("MSAL initialized successfully");
    
    // 2. After initialization, handle any redirect response
    const response = await msalInstance.handleRedirectPromise();
    
    if (response) {
      console.log("Successfully processed redirect response:", response.uniqueId);
      if (response.account) {
        msalInstance.setActiveAccount(response.account);
        console.log("Active account set during initialization:", response.account.username);
        // Redirect logic removed - handled by ProductionRedirectHandler
      }
    } else {
      console.log("No redirect response detected (normal on initial page load)");
    }
    
    // 3. After redirect handling, check for accounts
    const accounts = msalInstance.getAllAccounts();
    console.log(`Found ${accounts.length} existing accounts`);
    
    if (accounts.length > 0) {
      msalInstance.setActiveAccount(accounts[0]);
      console.log("Active account set from existing accounts:", accounts[0].username);
    }
  } catch (error) {
    console.error("MSAL initialization or redirect handling failed:", error);
  }
})();

// Make MSAL instance available globally
window.msalInstance = msalInstance;

// Add event callbacks to MSAL
msalInstance.addEventCallback((event) => {
  if (event.eventType === EventType.LOGIN_SUCCESS) {
    console.log("Login success");
    if (event.payload.account) {
      msalInstance.setActiveAccount(event.payload.account);
    }
  }
  if (event.eventType === EventType.LOGOUT_SUCCESS) {
    console.log("Logout success");
  }
  if (event.eventType === EventType.LOGIN_FAILURE) {
    console.error("Login failure:", event.error?.message || "Unknown error");
  }
  if (event.eventType === EventType.ACQUIRE_TOKEN_SUCCESS) {
    console.log("Token acquired successfully");
  }
  if (event.eventType === EventType.ACQUIRE_TOKEN_FAILURE) {
    console.error("Token acquisition failed:", event.error?.message || "Unknown error");
    
    // Handle refresh token expiration using utility function
    handleTokenExpiration(event.error, msalInstance);
  }
});

function MainContent() {
  const { instance, accounts, inProgress } = useMsal();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const location = useLocation();
  
  // Check if current route is login page
  const isLoginPage = location.pathname === '/login';
  
  // Removed storage event listener to prevent unexpected reloads
  
  useEffect(() => {
    console.log("MSAL state:", { 
      accountsCount: accounts.length, 
      inProgress, 
      activeAccount: instance.getActiveAccount()?.username || "none",
      bypassMode: sessionStorage.getItem('bypass_auth') === 'true',
      currentPath: window.location.pathname
    });
    
    // Set active account only if needed
    if (accounts.length > 0 && !instance.getActiveAccount()) {
      console.log("Setting active account", accounts[0].username);
      instance.setActiveAccount(accounts[0]);
    }
    
    // Removed conflicting redirect logic to prevent infinite loops
  }, [accounts, inProgress, instance]);

  // Helper function to check if user should be redirected from login
  // SIMPLIFIED: Just check auth status, let ProductionRedirectHandler handle redirects
  const shouldRedirectFromLogin = () => {
    const hasAuth = accounts.length > 0 || sessionStorage.getItem('bypass_auth') === 'true';
    console.log("shouldRedirectFromLogin:", { hasAuth, accountsCount: accounts.length });
    return hasAuth;
  };
  
  return (
    <NotificationProvider>
    <div className="App">
      <ProductionRedirectHandler />
      {/* Only show Header when not on login page */}
      {!isLoginPage && <Header />}
      <div className="app-content">
        <Routes>
          <Route path="/login" element={
            shouldRedirectFromLogin() ? <Navigate to="/documents" replace /> : <Login />
          } />
          <Route path="/documents" element={
            <ProtectedRoute>
              <Documents />
            </ProtectedRoute>
          } />
          <Route path="/chatbot" element={
            <ProtectedRoute>
              <ChatBot />
            </ProtectedRoute>
          } />
          <Route path="/document-chat" element={
            <ProtectedRoute>
              <DocumentChat />
            </ProtectedRoute>
          } />
          <Route path="/mcp-chat" element={
            <ProtectedRoute>
              <MCPChat />
            </ProtectedRoute>
          } />
          <Route path="/mcp-tools" element={
            <ProtectedRoute>
              <MCPToolsChat />
            </ProtectedRoute>
          } />
          <Route path="/mcp-analytics" element={
            <ProtectedRoute>
              <MCPAnalyticsChat />
            </ProtectedRoute>
          } />
          {/* <Route path="/test-chatbot" element={<TestChatBot />} /> */}
          <Route path="/Upload" element={
            <ProtectedRoute>
              <Upload />
            </ProtectedRoute>
          } />
          <Route path="/file-list" element={
            <ProtectedRoute>
              <FileListDemo />
            </ProtectedRoute>
          } />
          <Route path="/ai-workflow" element={
            <ProtectedRoute>
              <AIWorkflowBuilder />
            </ProtectedRoute>
          } />
          <Route path="/mcq-generator" element={
            <ProtectedRoute>
              <MCQGenerator />
            </ProtectedRoute>
          } />


            <Route path="/" element={<Navigate to="/documents" replace />} />
            {/* Add a fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </NotificationProvider>
  );
}

function App() {
  return (
     <Provider store={store}>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <MsalProvider instance={msalInstance}>
        <Router basename={process.env.PUBLIC_URL || '/'}>
          <MainContent />
        </Router>
      </MsalProvider>
    </ThemeProvider>
    </Provider>
  );
}

export default App;