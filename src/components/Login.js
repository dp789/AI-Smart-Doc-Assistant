import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../authConfig';
import { motion, AnimatePresence } from 'framer-motion';
import { getPublicPath } from '../envConfig';
import AuthToast from './AuthToast';
import { clearAllCaches } from '../registerServiceWorker';
import PresentationViewer from './PresentationViewer';
import './Login.css';

function Login() {
  const { instance, accounts, inProgress } = useMsal();
  const navigate = useNavigate();
  const [loginError, setLoginError] = useState(null);
  const [toastState, setToastState] = useState({
    isVisible: false,
    message: '',
    type: 'info',
    progress: 0
  });
  const publicPath = getPublicPath();

  // Helper function to show toast notifications
  const showToast = (message, type = 'info', progress = 0) => {
    setToastState({
      isVisible: true,
      message,
      type,
      progress
    });
  };

  // Helper function to hide toast
  const hideToast = () => {
    setToastState(prev => ({ ...prev, isVisible: false }));
  };

  useEffect(() => {
    console.log("Login component state:", { 
      accountsCount: accounts.length, 
      inProgress,
      currentUrl: window.location.href
    });

    // SIMPLIFIED: If user is already logged in, just show toast
    // ProductionRedirectHandler will handle the actual redirect
    if (accounts.length > 0) {
      console.log("User already logged in - ProductionRedirectHandler will handle redirect");
      showToast("User authenticated successfully! Redirecting...", "success");
      
      // Only redirect in localhost (production handled by ProductionRedirectHandler)
      const isProduction = window.location.hostname !== 'localhost';
      if (!isProduction) {
        setTimeout(() => {
          navigate('/documents', { replace: true });
        }, 1000);
      }
    }
  }, [accounts, inProgress, navigate]);

  // Clear any stuck interactions on component mount and handle redirect promise
  // SIMPLIFIED: Removed redirect logic to prevent conflicts with ProductionRedirectHandler
  useEffect(() => {
    const clearStuckInteractions = async () => {
      try {
        console.log("Handling redirect promise in Login component...");
        const response = await instance.handleRedirectPromise();
        
        if (response) {
          console.log("Successfully processed redirect response:", response);
          if (response.account) {
            instance.setActiveAccount(response.account);
            console.log("Active account set after redirect:", response.account.username);
            showToast("Authentication completed! Welcome back.", "success");
            // ProductionRedirectHandler will handle navigation
          }
        }
      } catch (error) {
        console.warn("Error handling redirect promise:", error);
      }
    };

    clearStuckInteractions();

    // Set up a timeout to clear login errors after 30 seconds
    let errorTimeout;
    if (loginError) {
      errorTimeout = setTimeout(() => {
        setLoginError(null);
        console.log("Auto-cleared login error after timeout");
      }, 30000);
    }

    return () => {
      if (errorTimeout) {
        clearTimeout(errorTimeout);
      }
    };
  }, [instance, loginError]);

  const handleLogin = async () => {
    setLoginError(null);
    hideToast();
    
    try {
      // Step 1: Initial validation
      showToast("Preparing authentication...", "loading", 10);
      
      // Clear any previous login errors
      sessionStorage.removeItem('msal_login_error');
      
      console.log("Checking for existing interactions...");
      
      // Check if there's already an interaction in progress
      if (inProgress !== 'none') {
        console.log("Interaction already in progress:", inProgress);
        showToast("Authentication is already in progress. Please wait...", "info");
        setLoginError("Authentication is already in progress. Please wait...");
        return;
      }
      
      // Step 2: Clearing previous state
      showToast("Fetching user details...", "loading", 30);
      
      // Handle any existing redirect promises to clear the state
      try {
        const response = await instance.handleRedirectPromise();
        if (response) {
          console.log("Cleared existing redirect response");
        }
      } catch (redirectError) {
        console.warn("Error handling existing redirect:", redirectError);
      }
      
      // Step 3: Initiating authentication
      showToast("Authenticating with Microsoft...", "loading", 60);
      
      // Small delay to show the toast
      await new Promise(resolve => setTimeout(resolve, 800));
      
      showToast("Redirecting to Microsoft login...", "loading", 90);
      
      console.log("Initiating login redirect with PKCE flow...");
      await instance.loginRedirect({
        ...loginRequest,
      });
    } catch (error) {
      console.error("Login redirect failed:", error);
      
      // Show error toast
      const errorMessage = error.errorCode === 'interaction_in_progress' 
        ? "Authentication is already in progress. Please wait for it to complete or refresh the page."
        : error.message || "Failed to initiate login. Please try again.";
      
      showToast(errorMessage, "error");
      setLoginError(errorMessage);
    }
  };



  return (
    <div className="login-page">
      {/* Auth Toast Notifications */}
      <AuthToast 
        message={toastState.message}
        type={toastState.type}
        isVisible={toastState.isVisible}
        onClose={hideToast}
        progress={toastState.progress}
      />

      {/* Animated Background Elements */}
      <div className="background-animation">
        <motion.div 
          className="floating-shape shape-1"
          animate={{ 
            y: [0, -20, 0],
            rotate: [0, 180, 360]
          }}
          transition={{ 
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="floating-shape shape-2"
          animate={{ 
            y: [0, 30, 0],
            x: [0, 20, 0],
            rotate: [0, -180, -360]
          }}
          transition={{ 
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
        <motion.div 
          className="floating-shape shape-3"
          animate={{ 
            y: [0, -30, 0],
            x: [0, -15, 0]
          }}
          transition={{ 
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
      </div>



      {/* Main Content - 70:30 Layout */}
      <div className="login-container">
          {/* Left Column - AI Features with Presentation (70%) */}
          <motion.div 
            className="ai-features-column"
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {/* Floating AI Orbs */}
            <div className="ai-particles">
              <motion.div 
                className="floating-ai-orb ai-orb-1"
                animate={{ 
                  y: [0, -20, 0],
                  rotate: [0, 360]
                }}
                transition={{ 
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <motion.div 
                className="floating-ai-orb ai-orb-2"
                animate={{ 
                  y: [0, 15, 0],
                  x: [0, 10, 0],
                  rotate: [0, -360]
                }}
                transition={{ 
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1
                }}
              />
              <motion.div 
                className="floating-ai-orb ai-orb-3"
                animate={{ 
                  y: [0, -10, 0],
                  rotate: [0, 180, 360]
                }}
                transition={{ 
                  duration: 10,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 2
                }}
              />
            </div>

            {/* Interactive Presentation Viewer */}
            <PresentationViewer />
          </motion.div>

        {/* Right Column - Login Form (30%) */}
        <motion.div 
          className="login-form-column"
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          {/* Professional Header - Full Width */}
          <motion.div 
            className="login-header"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="login-header-content">
              <motion.div 
                className="login-brand"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="login-brand-icon">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              <div className="login-brand-text">
                <h2 className="login-brand-title">Research Hyper Agentic Assistant</h2>
                <p className="login-brand-subtitle">AI-Powered Research Platform</p>
              </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Professional Login Card */}
          <div className="login-card-container">
            <motion.div 
              className="login-card"
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                duration: 0.8,
                delay: 0.6,
                type: "spring",
                stiffness: 100,
                damping: 15
              }}
            >
              {/* Card Header */}
              <motion.div 
                className="card-header"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
              >
                <div className="card-icon">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className="card-title">Welcome Back</h3>
                <p className="card-subtitle">Sign in to access your workspace</p>
              </motion.div>

              {/* Card Divider */}
              <motion.div 
                className="card-divider"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.6, delay: 1.0 }}
              />

              {/* Card Body */}
              <motion.div 
                className="card-body"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.2 }}
              >
                {/* Error Message */}
                <AnimatePresence>
                  {loginError && (
                    <motion.div 
                      className="error-message"
                      initial={{ opacity: 0, scale: 0.9, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: -10 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="error-icon">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <span className="error-text">{loginError}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Login Button */}
                <motion.button
                  className={`login-button ${inProgress !== 'none' ? 'loading' : ''}`}
                  onClick={handleLogin}
                  disabled={inProgress !== 'none'}
                  whileHover={{ scale: 1.01, y: -2 }}
                  whileTap={{ scale: 0.99 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1.4 }}
                >
                  {inProgress !== 'none' ? (
                    <>
                      <div className="loading-spinner"></div>
                      <span className="button-text">Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <div className="microsoft-icon">
                        <svg viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M1 1h10v10H1V1z" fill="#f25022"/>
                          <path d="M12 1h10v10H12V1z" fill="#00a4ef"/>
                          <path d="M1 12h10v10H1V12z" fill="#ffb900"/>
                          <path d="M12 12h10v10H12V12z" fill="#7fba00"/>
                        </svg>
                      </div>
                      <span className="button-text">Sign in with Microsoft</span>
                      <svg className="button-arrow" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </>
                  )}
                </motion.button>

                {/* Additional Info */}
                <motion.div 
                  className="card-info"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 1.6 }}
                >
                  <p className="info-text">By signing in, you agree to our Terms of Service</p>
                </motion.div>
              </motion.div>

              {/* Card Footer - Security Badge */}
              <motion.div 
                className="card-footer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 1.8 }}
              >
                <div className="security-badge">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <div className="badge-text">
                    <span className="badge-title">Secured by Azure AD</span>
                    <span className="badge-subtitle">Enterprise-grade authentication</span>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Login; 