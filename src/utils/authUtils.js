import { useMsal } from '@azure/msal-react';
import { InteractionRequiredAuthError } from '@azure/msal-browser';

/**
 * Get the current Azure AD access token from MSAL
 * @returns {Promise<string|null>} The access token or null if not available
 */
export const getAccessToken = async () => {
    try {
        // Method 1: Try to get from MSAL instance if available
        if (window.msalInstance) {
            try {
                const account = window.msalInstance.getActiveAccount();
                if (account) {
                    const request = {
                        scopes: ['User.Read'],
                        account: account
                    };
                    const response = await window.msalInstance.acquireTokenSilent(request);
                    return response.accessToken;
                }
            } catch (msalError) {
                console.warn('MSAL instance method failed:', msalError);
            }
        }

        // Method 2: Try to extract from localStorage
        const msalKeys = Object.keys(localStorage).filter(key => key.startsWith('msal.token.keys'));
        
        if (msalKeys.length === 0) {
            console.warn('No MSAL token keys found');
            return null;
        }

        // Get the first available token key
        const tokenKey = msalKeys[0];
        const tokenData = localStorage.getItem(tokenKey);
        
        if (!tokenData) {
            console.warn('No token data found in localStorage');
            return null;
        }

        // Parse the token data
        const tokens = JSON.parse(tokenData);
        
        // Look for access token
        if (tokens.accessToken && tokens.accessToken.length > 0) {
            const accessTokenKey = tokens.accessToken[0];
            const accessToken = localStorage.getItem(accessTokenKey);
            
            if (accessToken) {
                return accessToken;
            }
        }

        console.warn('No access token found in MSAL storage');
        return null;

    } catch (error) {
        console.error('Error getting access token:', error);
        return null;
    }
};

/**
 * Get access token using MSAL instance (alternative method)
 * @param {Object} msalInstance - MSAL instance
 * @returns {Promise<string|null>} The access token or null if not available
 */
export const getAccessTokenFromMsal = async (msalInstance) => {
    try {
        if (!msalInstance || !msalInstance.getActiveAccount()) {
            console.warn('No active MSAL account');
            return null;
        }

        const account = msalInstance.getActiveAccount();
        const request = {
            scopes: ['User.Read'],
            account: account
        };

        const response = await msalInstance.acquireTokenSilent(request);
        return response.accessToken;

    } catch (error) {
        console.error('Error getting access token from MSAL:', error);
        return null;
    }
};

/**
 * Create authorization header with access token
 * @returns {Promise<Object>} Headers object with Authorization
 */
export const getAuthHeaders = async () => {
    const token = await getAccessToken();
    
    if (token) {
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }
    
    return {
        'Content-Type': 'application/json'
    };
};

/**
 * Create authorization header for file uploads
 * @returns {Promise<Object>} Headers object with Authorization (no Content-Type for FormData)
 */
export const getUploadAuthHeaders = async () => {
    const token = await getAccessToken();
    
    if (token) {
        return {
            'Authorization': `Bearer ${token}`
        };
    }
    
    return {};
};

/**
 * Check if an error indicates token expiration and handle logout
 * @param {Error} error - The error to check
 * @param {Object} msalInstance - MSAL instance for logout
 * @returns {boolean} True if token expiration was detected and handled
 */
export const handleTokenExpiration = (error, msalInstance) => {
    if (!error) return false;
    
    const errorMessage = error.message || "";
    const errorCode = error.errorCode || "";
    
    // Check for various token expiration indicators
    const isTokenExpired = errorMessage.includes("refresh_token_expired") || 
                          errorMessage.includes("AADSTS160021") ||
                          errorMessage.includes("interaction_required") ||
                          errorCode.includes("refresh_token_expired") ||
                          errorCode.includes("interaction_required") ||
                          (error instanceof InteractionRequiredAuthError && 
                           (errorMessage.includes("refresh_token_expired") || 
                            errorMessage.includes("AADSTS160021")));
    
    if (isTokenExpired) {
        console.log("Token expiration detected - initiating automatic logout");
        console.log("Error details:", { message: errorMessage, code: errorCode, type: error.constructor.name });
        
        // Clear any bypass mode
        sessionStorage.removeItem('bypass_auth');
        
        // Perform logout and redirect to login
        if (msalInstance && typeof msalInstance.logoutRedirect === 'function') {
            msalInstance.logoutRedirect({
                postLogoutRedirectUri: window.location.origin + "/login"
            }).catch(logoutError => {
                console.error("Logout redirect failed:", logoutError);
                // Fallback: clear local storage and redirect manually
                performFallbackLogout();
            });
        } else {
            // Fallback if no MSAL instance available
            performFallbackLogout();
        }
        
        return true;
    }
    
    return false;
};

/**
 * Fallback logout function that clears storage and redirects
 */
const performFallbackLogout = () => {
    try {
        // Clear all authentication-related storage
        localStorage.clear();
        sessionStorage.clear();
        
        // Clear MSAL-specific storage
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('msal.')) {
                localStorage.removeItem(key);
            }
        });
        
        // Redirect to login page
        window.location.href = "/login";
    } catch (fallbackError) {
        console.error("Fallback logout failed:", fallbackError);
        // Last resort: force page reload to login
        window.location.reload();
    }
}; 