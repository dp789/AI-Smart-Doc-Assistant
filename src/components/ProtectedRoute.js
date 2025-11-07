import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { InteractionRequiredAuthError } from '@azure/msal-browser';
import { loginRequest } from '../authConfig';
import { handleTokenExpiration } from '../utils/authUtils';
import userTrackingService from '../services/userTrackingService';

const ProtectedRoute = ({ children }) => {
    const { instance, accounts, inProgress } = useMsal();
    const [isValidatingToken, setIsValidatingToken] = useState(true);
    const [isTokenValid, setIsTokenValid] = useState(false);
    
    useEffect(() => {
        const validateAccess = async () => {
            try {
                // Check for bypass mode first
                const bypassMode = sessionStorage.getItem('bypass_auth');
                if (bypassMode === 'true') {
                    console.log("Bypass mode detected - allowing access without authentication");
                    setIsTokenValid(true);
                    setIsValidatingToken(false);
                    return;
                }

                // If MSAL is still initializing or performing another operation, wait
                if (inProgress !== "none") {
                    console.log("MSAL operation in progress:", inProgress);
                    return;
                }
                
                if (accounts.length === 0) {
                    console.log("No accounts found, authentication required");
                    setIsTokenValid(false);
                    setIsValidatingToken(false);
                    return;
                }
                
                // Simple token validation - only if needed
                try {
                    console.log("Validating token for account:", accounts[0].username);
                    const tokenResponse = await instance.acquireTokenSilent({
                        ...loginRequest,
                        account: accounts[0]
                    });
                    
                    setIsTokenValid(true);
                    console.log("✅ Token validation successful");
                    
                    // Track user login in background (non-blocking)
                    trackUserInBackground(accounts[0], tokenResponse.accessToken);
                    
                } catch (error) {
                    console.error("❌ Token validation failed:", error);
                    setIsTokenValid(false);
                    
                    if (error instanceof InteractionRequiredAuthError) {
                        console.log("Interactive authentication required");
                        
                        // Handle token expiration using utility function
                        handleTokenExpiration(error, instance);
                    }
                }
                
            } finally {
                setIsValidatingToken(false);
            }
        };
        
        validateAccess();
    }, [accounts, instance, inProgress]);

    // Background user tracking (non-blocking)
    const trackUserInBackground = async (account, accessToken) => {
        try {
            console.log("📊 Background user tracking started...");
            const trackingResult = await userTrackingService.trackUserLogin(account, accessToken);
            
            if (trackingResult.success) {
                console.log("✅ Background user tracking successful");
                // Set up periodic last access updates
                startLastAccessUpdater(account.localAccountId, accessToken);
            } else {
                console.warn("⚠️  Background user tracking failed:", trackingResult.error);
            }
        } catch (error) {
            console.warn("⚠️  Background user tracking error:", error.message);
        }
    };

    // Function to periodically update last access time
    const startLastAccessUpdater = (userId, accessToken) => {
        // Update last access every 5 minutes
        const interval = setInterval(() => {
            userTrackingService.updateLastAccess(userId, accessToken)
                .catch(error => console.warn('⚠️  Failed to update last access:', error));
        }, 5 * 60 * 1000); // 5 minutes
        
        // Clean up on component unmount
        return () => clearInterval(interval);
    };
    
    // Show loading state while validating token or if MSAL is busy
    if (isValidatingToken || inProgress !== "none") {
        return (
            <div className="auth-loading" style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100vh',
                fontFamily: 'Arial, sans-serif' 
            }}>
                <div style={{ marginBottom: '20px', fontSize: '18px' }}>
                    Verifying authentication...
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>
                    Please wait while we prepare your session...
                </div>
            </div>
        );
    }

    // Check bypass mode for final decision
    const bypassMode = sessionStorage.getItem('bypass_auth');
    
    // Allow access if:
    // 1. In bypass mode, OR
    // 2. User is authenticated (user tracking happens in background)
    if (bypassMode === 'true' || (accounts.length > 0 && isTokenValid)) {
        if (bypassMode === 'true') {
            console.log("ProtectedRoute - Bypass mode active, rendering protected content");
        } else {
            console.log("ProtectedRoute - User authenticated, rendering protected content");
        }
        return children;
    }
    
    // Redirect to login if no accounts or token is invalid AND not in bypass mode
    console.log("ProtectedRoute - Authentication required, redirecting to login");
    return <Navigate to="/login" replace />;
};

export default ProtectedRoute; 