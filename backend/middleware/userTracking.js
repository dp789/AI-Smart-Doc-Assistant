const UserSession = require('../models/UserSession');
const MicrosoftGraphService = require('../services/microsoftGraphService');

class UserTrackingMiddleware {
    /**
     * Middleware to track user login after successful Microsoft SSO authentication
     */
    static async trackUserLogin(req, res, next) {
        try {
            console.log('🔍 User tracking middleware started');
            
            // Extract user data from request (set by previous auth middleware)
            const userData = req.user || req.body.user;
            const accessToken = req.headers.authorization?.replace('Bearer ', '') || req.body.accessToken;
            
            if (!userData) {
                console.warn('⚠️  No user data found for tracking');
                return next();
            }
            
            // Create request metadata
            const requestData = UserTrackingMiddleware._extractRequestMetadata(req);
            
            // Initialize services
            const userSession = new UserSession();
            const graphService = new MicrosoftGraphService();
            
            // Enrich user data with Microsoft Graph if access token is available
            let enrichedUserData = userData;
            if (accessToken) {
                try {
                    console.log('📊 Fetching enhanced user profile from Microsoft Graph...');
                    const graphProfile = await graphService.getUserProfile(accessToken);
                    
                    if (!graphProfile.error) {
                        enrichedUserData = {
                            ...userData,
                            ...graphProfile,
                            // Keep original token claims as fallback
                            originalClaims: userData
                        };
                        console.log('✅ User profile enhanced with Graph data');
                    } else {
                        console.warn('⚠️  Graph API failed, using token claims only:', graphProfile.message);
                    }
                } catch (graphError) {
                    console.warn('⚠️  Failed to enhance user data with Graph API:', graphError.message);
                }
            }
            
            // Track the user login
            const trackingResult = await userSession.trackUserLogin(enrichedUserData, requestData);
            
            if (trackingResult.success) {
                console.log('✅ User login tracked successfully');
                
                // Add tracking information to request for downstream use
                req.userSession = trackingResult;
                req.userTracking = {
                    sessionId: trackingResult.sessionId,
                    loginCount: trackingResult.loginCount,
                    isFirstTimeUser: trackingResult.isFirstTimeUser,
                    userId: trackingResult.userId
                };
                
                // Add tracking info to response headers (optional)
                res.set({
                    'X-User-Session-Id': trackingResult.sessionId,
                    'X-Login-Count': trackingResult.loginCount.toString(),
                    'X-First-Time-User': trackingResult.isFirstTimeUser.toString()
                });
                
                next();
            } else {
                console.error('❌ User tracking failed, blocking access');
                return res.status(500).json({
                    error: 'USER_TRACKING_FAILED',
                    message: 'Failed to track user login. Access denied for security.',
                    details: 'User tracking is required for application access'
                });
            }
            
        } catch (error) {
            console.error('❌ Error in user tracking middleware:', error);
            
            // Decide whether to block access or allow with warning
            if (process.env.STRICT_USER_TRACKING === 'true') {
                return res.status(500).json({
                    error: 'USER_TRACKING_ERROR',
                    message: 'User tracking system error. Access denied.',
                    details: error.message
                });
            } else {
                console.warn('⚠️  User tracking failed but STRICT_USER_TRACKING is disabled, allowing access');
                next();
            }
        }
    }

    /**
     * Middleware to validate user access before allowing application entry
     */
    static async validateUserAccess(req, res, next) {
        try {
            console.log('🔒 Validating user access...');
            
            const userData = req.user || req.body.user;
            if (!userData) {
                return res.status(401).json({
                    error: 'NO_USER_DATA',
                    message: 'User data not found'
                });
            }
            
            const userSession = new UserSession();
            const userId = userData.id || userData.oid || userData.userPrincipalName;
            
            const validationResult = await userSession.validateUserAccess(userId);
            
            if (!validationResult.isValid) {
                console.warn('⚠️  User access validation failed:', validationResult.reason);
                return res.status(403).json({
                    error: validationResult.reason,
                    message: validationResult.message,
                    requiresTracking: validationResult.reason === 'USER_NOT_FOUND'
                });
            }
            
            console.log('✅ User access validated successfully');
            req.userSession = validationResult.userData;
            next();
            
        } catch (error) {
            console.error('❌ Error validating user access:', error);
            return res.status(500).json({
                error: 'VALIDATION_ERROR',
                message: 'Failed to validate user access',
                details: error.message
            });
        }
    }

    /**
     * Middleware to update last access time for existing users
     */
    static async updateLastAccess(req, res, next) {
        try {
            const userData = req.user || req.body.user;
            if (userData) {
                const userSession = new UserSession();
                const userId = userData.id || userData.oid || userData.userPrincipalName;
                
                // Update asynchronously, don't block the request
                userSession.updateLastAccess(userId).catch(error => {
                    console.warn('⚠️  Failed to update last access time:', error.message);
                });
            }
            
            next();
        } catch (error) {
            console.warn('⚠️  Error in updateLastAccess middleware:', error.message);
            next(); // Don't block the request
        }
    }

    /**
     * Extract comprehensive request metadata
     * @private
     */
    static _extractRequestMetadata(req) {
        const forwardedFor = req.headers['x-forwarded-for'];
        const realIP = req.headers['x-real-ip'];
        const clientIP = req.connection?.remoteAddress || req.socket?.remoteAddress;
        
        // Get the most accurate IP address
        let ipAddress = 'Unknown';
        if (forwardedFor) {
            ipAddress = forwardedFor.split(',')[0].trim();
        } else if (realIP) {
            ipAddress = realIP;
        } else if (clientIP) {
            ipAddress = clientIP.replace('::ffff:', ''); // Remove IPv6 prefix for IPv4
        }
        
        const userAgent = req.headers['user-agent'] || '';
        
        return {
            ipAddress,
            userAgent,
            referrer: req.headers.referer || req.headers.referrer,
            acceptLanguage: req.headers['accept-language'],
            origin: req.headers.origin,
            host: req.headers.host,
            protocol: req.protocol,
            method: req.method,
            url: req.originalUrl,
            timestamp: new Date().toISOString(),
            
            // Additional headers that might be useful
            xForwardedFor: req.headers['x-forwarded-for'],
            xRealIP: req.headers['x-real-ip'],
            xForwardedProto: req.headers['x-forwarded-proto'],
            xRequestedWith: req.headers['x-requested-with'],
            
            // Session information
            sessionId: req.sessionID || req.headers['x-session-id'],
            
            // Application version from headers or environment
            applicationVersion: req.headers['x-app-version'] || process.env.APP_VERSION || '1.0.0',
            
            // Additional metadata
            additional: {
                cookies: Object.keys(req.cookies || {}).length > 0 ? Object.keys(req.cookies) : [],
                hasAuthHeader: !!req.headers.authorization,
                contentType: req.headers['content-type'],
                contentLength: req.headers['content-length']
            }
        };
    }

    /**
     * Middleware to handle CORS and pre-flight requests for user tracking endpoints
     */
    static handleCORS(req, res, next) {
        // Set CORS headers
        res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-App-Version, X-Session-Id');
        res.header('Access-Control-Expose-Headers', 'X-User-Session-Id, X-Login-Count, X-First-Time-User');
        res.header('Access-Control-Allow-Credentials', 'true');
        
        // Handle preflight requests
        if (req.method === 'OPTIONS') {
            return res.status(200).end();
        }
        
        next();
    }

    /**
     * Error handling middleware for user tracking
     */
    static handleTrackingErrors(error, req, res, next) {
        console.error('❌ User tracking error:', error);
        
        if (error.name === 'ConnectionError' || error.name === 'RequestError') {
            return res.status(503).json({
                error: 'DATABASE_UNAVAILABLE',
                message: 'User tracking system temporarily unavailable',
                retryAfter: 30
            });
        }
        
        if (error.message?.includes('ECONNREFUSED')) {
            return res.status(503).json({
                error: 'DATABASE_CONNECTION_FAILED',
                message: 'Cannot connect to user tracking database'
            });
        }
        
        // Generic error response
        res.status(500).json({
            error: 'TRACKING_SYSTEM_ERROR',
            message: 'User tracking system encountered an error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

module.exports = UserTrackingMiddleware;