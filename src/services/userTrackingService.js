import envConfig from '../envConfig';

class UserTrackingService {
    constructor() {
        this.baseUrl = envConfig.apiUrl || 'http://localhost:8090/api';
        this.trackingEndpoint = `${this.baseUrl}/user-tracking`;
        console.log('🔗 UserTrackingService initialized with endpoint:', this.trackingEndpoint);
    }

    /**
     * Track user login after successful Microsoft SSO authentication
     * @param {Object} userInfo - User information from MSAL
     * @param {string} accessToken - Access token from Microsoft
     * @returns {Promise<Object>} Tracking result
     */
    async trackUserLogin(userInfo, accessToken) {
        try {
            console.log('📊 Tracking user login...', userInfo.userPrincipalName || userInfo.email);
            
            const requestData = {
                user: this._normalizeUserData(userInfo),
                accessToken: accessToken,
                metadata: this._getClientMetadata()
            };
            
            const response = await fetch(`${this.trackingEndpoint}/sso-login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-App-Version': process.env.REACT_APP_VERSION || '1.0.0',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify(requestData)
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || 'User tracking failed');
            }
            
            if (!result.success) {
                throw new Error('User tracking returned failure status');
            }
            
            console.log('✅ User login tracked successfully:', {
                loginCount: result.tracking.loginCount,
                isFirstTime: result.tracking.isFirstTimeUser
            });
            
            // Store tracking information in session storage for later use
            this._storeTrackingInfo(result);
            
            return {
                success: true,
                data: result,
                sessionId: result.session.sessionId,
                loginCount: result.tracking.loginCount,
                isFirstTimeUser: result.tracking.isFirstTimeUser
            };
            
        } catch (error) {
            console.error('❌ Failed to track user login:', error);
            
            // Return failure result - this will prevent app access
            return {
                success: false,
                error: error.message,
                requiresTracking: true
            };
        }
    }

    /**
     * Validate user access before allowing app entry
     * @param {string} userId - User ID or email
     * @returns {Promise<Object>} Validation result
     */
    async validateUserAccess(userId) {
        try {
            console.log('🔒 Validating user access...', userId);
            
            const response = await fetch(`${this.trackingEndpoint}/validate-access?userId=${encodeURIComponent(userId)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-App-Version': process.env.REACT_APP_VERSION || '1.0.0'
                }
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || 'Access validation failed');
            }
            
            console.log('✅ User access validation completed:', {
                isValid: result.isValid,
                reason: result.reason
            });
            
            return {
                success: true,
                isValid: result.isValid,
                reason: result.reason,
                message: result.message,
                userData: result.userData
            };
            
        } catch (error) {
            console.error('❌ Failed to validate user access:', error);
            return {
                success: false,
                isValid: false,
                error: error.message
            };
        }
    }

    /**
     * Update last access time (called during app usage)
     * @param {string} userId - User ID
     * @param {string} accessToken - Access token for authentication
     * @returns {Promise<Object>} Update result
     */
    async updateLastAccess(userId, accessToken) {
        try {
            const response = await fetch(`${this.trackingEndpoint}/update-access/${encodeURIComponent(userId)}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                    'X-App-Version': process.env.REACT_APP_VERSION || '1.0.0'
                }
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                console.log('✅ Last access time updated');
                return { success: true };
            } else {
                console.warn('⚠️  Failed to update last access time:', result.message);
                return { success: false, message: result.message };
            }
            
        } catch (error) {
            console.warn('⚠️  Error updating last access time:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get user session information
     * @param {string} userId - User ID
     * @param {string} accessToken - Access token for authentication
     * @returns {Promise<Object>} Session information
     */
    async getUserSession(userId, accessToken) {
        try {
            const response = await fetch(`${this.trackingEndpoint}/session/${encodeURIComponent(userId)}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                return { success: true, data: result.data };
            } else {
                return { success: false, message: result.message };
            }
            
        } catch (error) {
            console.error('❌ Error getting user session:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Check system health
     * @returns {Promise<Object>} Health status
     */
    async checkHealth() {
        try {
            const response = await fetch(`${this.trackingEndpoint}/health`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const result = await response.json();
            return { success: response.ok, data: result };
            
        } catch (error) {
            console.error('❌ Health check failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Normalize user data from different sources (MSAL, Graph API)
     * @private
     */
    _normalizeUserData(userInfo) {
        return {
            // Primary identifiers
            id: userInfo.id || userInfo.oid || userInfo.localAccountId,
            userPrincipalName: userInfo.userPrincipalName || userInfo.username || userInfo.email,
            
            // Display information
            displayName: userInfo.displayName || userInfo.name,
            givenName: userInfo.givenName || userInfo.given_name,
            surname: userInfo.surname || userInfo.family_name,
            
            // Contact information
            mail: userInfo.mail || userInfo.email,
            mobilePhone: userInfo.mobilePhone,
            businessPhones: userInfo.businessPhones,
            
            // Tenant information
            tid: userInfo.tid || userInfo.tenantId,
            aud: userInfo.aud || userInfo.audience,
            
            // Professional information
            jobTitle: userInfo.jobTitle,
            department: userInfo.department,
            companyName: userInfo.companyName,
            officeLocation: userInfo.officeLocation,
            
            // Location information
            country: userInfo.country,
            city: userInfo.city,
            state: userInfo.state,
            usageLocation: userInfo.usageLocation,
            
            // System information
            userType: userInfo.userType,
            accountEnabled: userInfo.accountEnabled,
            preferredLanguage: userInfo.preferredLanguage,
            
            // Timestamps from token
            iat: userInfo.iat, // issued at
            exp: userInfo.exp, // expires
            nbf: userInfo.nbf, // not before
            
            // Additional data
            roles: userInfo.roles || [],
            groups: userInfo.groups || [],
            
            // Original claims for reference
            originalClaims: userInfo
        };
    }

    /**
     * Get client-side metadata
     * @private
     */
    _getClientMetadata() {
        return {
            // Browser information
            userAgent: navigator.userAgent,
            language: navigator.language,
            languages: navigator.languages,
            platform: navigator.platform,
            
            // Screen information
            screenResolution: `${screen.width}x${screen.height}`,
            colorDepth: screen.colorDepth,
            pixelRatio: window.devicePixelRatio,
            
            // Viewport information
            viewportSize: `${window.innerWidth}x${window.innerHeight}`,
            
            // Time information
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            timezoneOffset: new Date().getTimezoneOffset(),
            
            // Connection information (if available)
            connectionType: navigator.connection?.effectiveType,
            
            // Page information
            referrer: document.referrer,
            url: window.location.href,
            
            // Application information
            appVersion: process.env.REACT_APP_VERSION || '1.0.0',
            buildDate: process.env.REACT_APP_BUILD_DATE,
            environment: process.env.NODE_ENV,
            
            // Capabilities
            cookieEnabled: navigator.cookieEnabled,
            onLine: navigator.onLine,
            
            // Touch support
            touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
            
            // Local storage availability
            localStorageAvailable: this._isStorageAvailable('localStorage'),
            sessionStorageAvailable: this._isStorageAvailable('sessionStorage')
        };
    }

    /**
     * Check if storage is available
     * @private
     */
    _isStorageAvailable(type) {
        try {
            const storage = window[type];
            const x = '__storage_test__';
            storage.setItem(x, x);
            storage.removeItem(x);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Store tracking information in session storage
     * @private
     */
    _storeTrackingInfo(trackingResult) {
        try {
            const trackingData = {
                sessionId: trackingResult.session.sessionId,
                userId: trackingResult.user.id,
                userPrincipalName: trackingResult.user.userPrincipalName,
                loginCount: trackingResult.tracking.loginCount,
                isFirstTimeUser: trackingResult.tracking.isFirstTimeUser,
                lastAccessDate: trackingResult.session.lastAccessDate,
                trackedAt: new Date().toISOString()
            };
            
            sessionStorage.setItem('userTracking', JSON.stringify(trackingData));
            console.log('📄 Tracking information stored in session storage');
        } catch (error) {
            console.warn('⚠️  Failed to store tracking information:', error.message);
        }
    }

    /**
     * Get stored tracking information
     */
    getStoredTrackingInfo() {
        try {
            const stored = sessionStorage.getItem('userTracking');
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            console.warn('⚠️  Failed to retrieve tracking information:', error.message);
            return null;
        }
    }

    /**
     * Clear stored tracking information
     */
    clearStoredTrackingInfo() {
        try {
            sessionStorage.removeItem('userTracking');
            console.log('🗑️  Tracking information cleared');
        } catch (error) {
            console.warn('⚠️  Failed to clear tracking information:', error.message);
        }
    }
}

// Create singleton instance
const userTrackingService = new UserTrackingService();

export default userTrackingService;