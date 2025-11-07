const UserSession = require('../models/UserSession');
const MicrosoftGraphService = require('../services/microsoftGraphService');

class UserTrackingController {
    /**
     * Handle Microsoft SSO login and track user
     */
    static async handleSSOLogin(req, res) {
        try {
            console.log('🔐 Processing SSO login request...');
            
            const { user, accessToken } = req.body;
            
            if (!user) {
                return res.status(400).json({
                    error: 'MISSING_USER_DATA',
                    message: 'User data is required for SSO login'
                });
            }
            
            // Validate required fields
            const requiredFields = ['id', 'userPrincipalName'];
            const missingFields = requiredFields.filter(field => !user[field]);
            
            if (missingFields.length > 0) {
                return res.status(400).json({
                    error: 'INCOMPLETE_USER_DATA',
                    message: `Missing required user fields: ${missingFields.join(', ')}`
                });
            }
            
            // Extract request metadata
            const requestData = UserTrackingController._extractRequestMetadata(req);
            
            // Initialize services
            const userSession = new UserSession();
            const graphService = new MicrosoftGraphService();
            
            // Enrich user data with Microsoft Graph
            let enrichedUserData = user;
            if (accessToken) {
                try {
                    const graphProfile = await graphService.getUserProfile(accessToken);
                    if (!graphProfile.error) {
                        enrichedUserData = { ...user, ...graphProfile };
                        console.log('✅ User profile enriched with Graph data');
                    }
                } catch (graphError) {
                    console.warn('⚠️  Graph API enhancement failed, using basic user data');
                }
            }
            
            // Track the user login
            const trackingResult = await userSession.trackUserLogin(enrichedUserData, requestData);
            
            if (!trackingResult.success) {
                console.error('❌ User tracking failed');
                return res.status(500).json({
                    error: 'TRACKING_FAILED',
                    message: 'Failed to track user login. Access denied for security.',
                    details: 'User tracking is required for application access'
                });
            }
            
            console.log('✅ SSO login processed and tracked successfully');
            
            // Return success response with tracking information
            res.status(200).json({
                success: true,
                message: 'SSO login tracked successfully',
                user: {
                    id: trackingResult.userId,
                    userPrincipalName: trackingResult.userPrincipalName,
                    displayName: trackingResult.displayName,
                    isFirstTimeUser: trackingResult.isFirstTimeUser,
                    loginCount: trackingResult.loginCount
                },
                session: {
                    sessionId: trackingResult.sessionId,
                    firstLoginDate: trackingResult.firstLoginDate,
                    lastAccessDate: trackingResult.lastAccessDate
                },
                tracking: {
                    loginCount: trackingResult.loginCount,
                    isFirstTimeUser: trackingResult.isFirstTimeUser
                }
            });
            
        } catch (error) {
            console.error('❌ Error handling SSO login:', error);
            res.status(500).json({
                error: 'SSO_LOGIN_ERROR',
                message: 'Failed to process SSO login',
                details: error.message
            });
        }
    }

    /**
     * Validate user access
     */
    static async validateAccess(req, res) {
        try {
            const { userId, userPrincipalName } = req.query;
            
            if (!userId && !userPrincipalName) {
                return res.status(400).json({
                    error: 'MISSING_IDENTIFIER',
                    message: 'Either userId or userPrincipalName is required'
                });
            }
            
            const userSession = new UserSession();
            const identifier = userId || userPrincipalName;
            
            const validationResult = await userSession.validateUserAccess(identifier);
            
            res.status(200).json({
                success: true,
                isValid: validationResult.isValid,
                reason: validationResult.reason,
                message: validationResult.message,
                userData: validationResult.userData || null
            });
            
        } catch (error) {
            console.error('❌ Error validating user access:', error);
            res.status(500).json({
                error: 'VALIDATION_ERROR',
                message: 'Failed to validate user access',
                details: error.message
            });
        }
    }

    /**
     * Get user session information
     */
    static async getUserSession(req, res) {
        try {
            const { userId, userPrincipalName } = req.params;
            const identifier = userId || userPrincipalName;
            
            if (!identifier) {
                return res.status(400).json({
                    error: 'MISSING_IDENTIFIER',
                    message: 'User identifier is required'
                });
            }
            
            const userSession = new UserSession();
            const sessionResult = await userSession.getUserSession(identifier);
            
            if (!sessionResult.success) {
                return res.status(404).json({
                    error: 'USER_NOT_FOUND',
                    message: sessionResult.message
                });
            }
            
            res.status(200).json({
                success: true,
                data: sessionResult.data
            });
            
        } catch (error) {
            console.error('❌ Error getting user session:', error);
            res.status(500).json({
                error: 'SESSION_RETRIEVAL_ERROR',
                message: 'Failed to retrieve user session',
                details: error.message
            });
        }
    }

    /**
     * Get all active user sessions (admin endpoint)
     */
    static async getActiveUsers(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const pageSize = Math.min(parseInt(req.query.pageSize) || 50, 100); // Max 100 per page
            
            const userSession = new UserSession();
            const result = await userSession.getActiveUserSessions(page, pageSize);
            
            res.status(200).json({
                success: true,
                data: result.data,
                pagination: result.pagination
            });
            
        } catch (error) {
            console.error('❌ Error getting active users:', error);
            res.status(500).json({
                error: 'ACTIVE_USERS_ERROR',
                message: 'Failed to retrieve active users',
                details: error.message
            });
        }
    }

    /**
     * Block or unblock a user
     */
    static async setUserBlockStatus(req, res) {
        try {
            const { userId } = req.params;
            const { isBlocked } = req.body;
            
            if (!userId) {
                return res.status(400).json({
                    error: 'MISSING_USER_ID',
                    message: 'User ID is required'
                });
            }
            
            if (typeof isBlocked !== 'boolean') {
                return res.status(400).json({
                    error: 'INVALID_BLOCK_STATUS',
                    message: 'isBlocked must be a boolean value'
                });
            }
            
            const userSession = new UserSession();
            const success = await userSession.setUserBlockStatus(userId, isBlocked);
            
            if (!success) {
                return res.status(404).json({
                    error: 'USER_NOT_FOUND',
                    message: 'User not found or update failed'
                });
            }
            
            res.status(200).json({
                success: true,
                message: `User ${isBlocked ? 'blocked' : 'unblocked'} successfully`,
                userId: userId,
                isBlocked: isBlocked
            });
            
        } catch (error) {
            console.error('❌ Error setting user block status:', error);
            res.status(500).json({
                error: 'BLOCK_STATUS_ERROR',
                message: 'Failed to update user block status',
                details: error.message
            });
        }
    }

    /**
     * Update last access time (for API calls)
     */
    static async updateLastAccess(req, res) {
        try {
            const { userId } = req.params;
            
            if (!userId) {
                return res.status(400).json({
                    error: 'MISSING_USER_ID',
                    message: 'User ID is required'
                });
            }
            
            const userSession = new UserSession();
            const success = await userSession.updateLastAccess(userId);
            
            res.status(200).json({
                success: success,
                message: success ? 'Last access updated' : 'User not found or update failed',
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ Error updating last access:', error);
            res.status(500).json({
                error: 'UPDATE_ACCESS_ERROR',
                message: 'Failed to update last access time',
                details: error.message
            });
        }
    }

    /**
     * Get user tracking statistics
     */
    static async getTrackingStats(req, res) {
        try {
            const { poolPromise } = require('../db');
            const pool = await poolPromise;
            
            // Get various statistics
            const queries = {
                totalUsers: "SELECT COUNT(*) as count FROM UserSessions WHERE IsActive = 1",
                newUsersToday: `
                    SELECT COUNT(*) as count FROM UserSessions 
                    WHERE IsActive = 1 AND CAST(FirstLoginDate as DATE) = CAST(GETUTCDATE() as DATE)
                `,
                activeUsersLast24h: `
                    SELECT COUNT(*) as count FROM UserSessions 
                    WHERE IsActive = 1 AND LastAccessDate >= DATEADD(HOUR, -24, GETUTCDATE())
                `,
                blockedUsers: "SELECT COUNT(*) as count FROM UserSessions WHERE IsBlocked = 1",
                topCountries: `
                    SELECT TOP 10 Country, COUNT(*) as count 
                    FROM UserSessions 
                    WHERE IsActive = 1 AND Country IS NOT NULL AND Country != 'Unknown'
                    GROUP BY Country 
                    ORDER BY count DESC
                `,
                topDeviceTypes: `
                    SELECT DeviceType, COUNT(*) as count 
                    FROM UserSessions 
                    WHERE IsActive = 1 AND DeviceType IS NOT NULL
                    GROUP BY DeviceType 
                    ORDER BY count DESC
                `
            };
            
            const results = {};
            
            for (const [key, query] of Object.entries(queries)) {
                try {
                    const result = await pool.request().query(query);
                    results[key] = result.recordset;
                } catch (queryError) {
                    console.error(`❌ Error executing ${key} query:`, queryError);
                    results[key] = [];
                }
            }
            
            res.status(200).json({
                success: true,
                statistics: {
                    totalUsers: results.totalUsers[0]?.count || 0,
                    newUsersToday: results.newUsersToday[0]?.count || 0,
                    activeUsersLast24h: results.activeUsersLast24h[0]?.count || 0,
                    blockedUsers: results.blockedUsers[0]?.count || 0,
                    topCountries: results.topCountries || [],
                    topDeviceTypes: results.topDeviceTypes || []
                },
                generatedAt: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ Error getting tracking statistics:', error);
            res.status(500).json({
                error: 'STATS_ERROR',
                message: 'Failed to retrieve tracking statistics',
                details: error.message
            });
        }
    }

    /**
     * Health check for user tracking system
     */
    static async healthCheck(req, res) {
        try {
            const { poolPromise } = require('../db');
            const pool = await poolPromise;
            
            // Simple database connectivity test
            const result = await pool.request().query('SELECT 1 as status');
            
            res.status(200).json({
                success: true,
                status: 'healthy',
                database: 'connected',
                timestamp: new Date().toISOString(),
                uptime: process.uptime()
            });
            
        } catch (error) {
            console.error('❌ Health check failed:', error);
            res.status(503).json({
                success: false,
                status: 'unhealthy',
                database: 'disconnected',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Extract request metadata helper
     * @private
     */
    static _extractRequestMetadata(req) {
        const forwardedFor = req.headers['x-forwarded-for'];
        const realIP = req.headers['x-real-ip'];
        const clientIP = req.connection?.remoteAddress || req.socket?.remoteAddress;
        
        let ipAddress = 'Unknown';
        if (forwardedFor) {
            ipAddress = forwardedFor.split(',')[0].trim();
        } else if (realIP) {
            ipAddress = realIP;
        } else if (clientIP) {
            ipAddress = clientIP.replace('::ffff:', '');
        }
        
        return {
            ipAddress,
            userAgent: req.headers['user-agent'] || '',
            referrer: req.headers.referer || req.headers.referrer,
            acceptLanguage: req.headers['accept-language'],
            origin: req.headers.origin,
            applicationVersion: req.headers['x-app-version'] || process.env.APP_VERSION || '1.0.0',
            sessionId: req.sessionID || req.headers['x-session-id'],
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = UserTrackingController;