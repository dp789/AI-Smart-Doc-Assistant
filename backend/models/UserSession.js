const { poolPromise, sql } = require('../db');

class UserSession {
    constructor() {
        this.tableName = 'UserSessions';
    }

    /**
     * Track user login with comprehensive information
     * @param {Object} userData - User data from Microsoft SSO
     * @param {Object} requestData - Request metadata (IP, User-Agent, etc.)
     * @returns {Object} Session information
     */
    async trackUserLogin(userData, requestData = {}) {
        try {
            console.log('📊 Tracking user login for:', userData.userPrincipalName || userData.email);
            
            const pool = await poolPromise;
            const request = pool.request();
            
            // Prepare parameters
            request.input('UserId', sql.NVarChar(255), userData.id || userData.oid);
            request.input('UserPrincipalName', sql.NVarChar(255), userData.userPrincipalName || userData.email);
            request.input('DisplayName', sql.NVarChar(255), userData.displayName || userData.name);
            request.input('GivenName', sql.NVarChar(100), userData.givenName || userData.given_name);
            request.input('Surname', sql.NVarChar(100), userData.surname || userData.family_name);
            request.input('TenantId', sql.NVarChar(255), userData.tid || userData.tenantId);
            request.input('AppId', sql.NVarChar(255), userData.aud || process.env.AZURE_CLIENT_ID);
            
            // Request metadata
            request.input('IPAddress', sql.NVarChar(45), requestData.ipAddress);
            request.input('UserAgent', sql.NVarChar(sql.MAX), requestData.userAgent);
            request.input('DeviceType', sql.NVarChar(50), this._detectDeviceType(requestData.userAgent));
            request.input('OperatingSystem', sql.NVarChar(100), this._extractOS(requestData.userAgent));
            request.input('Browser', sql.NVarChar(100), this._extractBrowser(requestData.userAgent));
            request.input('BrowserVersion', sql.NVarChar(50), this._extractBrowserVersion(requestData.userAgent));
            
            // Location data (if available)
            request.input('Country', sql.NVarChar(100), requestData.country);
            request.input('Region', sql.NVarChar(100), requestData.region);
            request.input('City', sql.NVarChar(100), requestData.city);
            request.input('Timezone', sql.NVarChar(50), requestData.timezone);
            
            // Application context
            request.input('ApplicationVersion', sql.NVarChar(50), requestData.applicationVersion || process.env.APP_VERSION);
            request.input('UserRole', sql.NVarChar(100), userData.roles ? userData.roles.join(',') : null);
            request.input('Department', sql.NVarChar(100), userData.department);
            request.input('CompanyName', sql.NVarChar(255), userData.companyName);
            
            // Additional data as JSON
            const additionalData = {
                originalToken: !!requestData.hasToken,
                loginTimestamp: new Date().toISOString(),
                sessionId: requestData.sessionId,
                referrer: requestData.referrer,
                language: requestData.language || requestData.acceptLanguage,
                screenResolution: requestData.screenResolution,
                ...requestData.additional
            };
            request.input('AdditionalData', sql.NVarChar(sql.MAX), JSON.stringify(additionalData));
            
            // Execute the stored procedure
            const result = await request.execute('sp_TrackUserLogin');
            
            if (result.recordset && result.recordset.length > 0) {
                const sessionInfo = result.recordset[0];
                console.log('✅ User login tracked successfully:', {
                    userId: sessionInfo.UserId,
                    email: sessionInfo.UserPrincipalName,
                    loginCount: sessionInfo.LoginCount,
                    isFirstTime: sessionInfo.IsFirstTimeUser
                });
                
                return {
                    success: true,
                    sessionId: sessionInfo.SessionId,
                    userId: sessionInfo.UserId,
                    userPrincipalName: sessionInfo.UserPrincipalName,
                    displayName: sessionInfo.DisplayName,
                    loginCount: sessionInfo.LoginCount,
                    isFirstTimeUser: sessionInfo.IsFirstTimeUser,
                    lastAccessDate: sessionInfo.LastAccessDate,
                    firstLoginDate: sessionInfo.FirstLoginDate
                };
            } else {
                throw new Error('No session data returned from tracking procedure');
            }
            
        } catch (error) {
            console.error('❌ Error tracking user login:', error);
            throw new Error(`Failed to track user login: ${error.message}`);
        }
    }

    /**
     * Get user session information
     * @param {string} userId - User ID or email
     * @returns {Object} User session data
     */
    async getUserSession(userId) {
        try {
            const pool = await poolPromise;
            const request = pool.request();
            
            // Try to find by userId first, then by email
            request.input('UserId', sql.NVarChar(255), userId);
            request.input('UserPrincipalName', sql.NVarChar(255), userId);
            
            const result = await request.execute('sp_GetUserSession');
            
            if (result.recordset && result.recordset.length > 0) {
                return {
                    success: true,
                    data: result.recordset[0]
                };
            } else {
                return {
                    success: false,
                    message: 'User session not found'
                };
            }
            
        } catch (error) {
            console.error('❌ Error getting user session:', error);
            throw new Error(`Failed to get user session: ${error.message}`);
        }
    }

    /**
     * Update last access time for a user
     * @param {string} userId - User ID
     * @returns {boolean} Success status
     */
    async updateLastAccess(userId) {
        try {
            const pool = await poolPromise;
            const request = pool.request();
            
            request.input('UserId', sql.NVarChar(255), userId);
            
            const result = await request.query(`
                UPDATE UserSessions 
                SET LastAccessDate = GETUTCDATE(), 
                    ModifiedDate = GETUTCDATE() 
                WHERE UserId = @UserId AND IsActive = 1
            `);
            
            return result.rowsAffected[0] > 0;
            
        } catch (error) {
            console.error('❌ Error updating last access:', error);
            return false;
        }
    }

    /**
     * Block or unblock a user
     * @param {string} userId - User ID
     * @param {boolean} isBlocked - Block status
     * @returns {boolean} Success status
     */
    async setUserBlockStatus(userId, isBlocked = true) {
        try {
            const pool = await poolPromise;
            const request = pool.request();
            
            request.input('UserId', sql.NVarChar(255), userId);
            request.input('IsBlocked', sql.Bit, isBlocked);
            
            const result = await request.query(`
                UPDATE UserSessions 
                SET IsBlocked = @IsBlocked, 
                    ModifiedDate = GETUTCDATE(),
                    ModifiedBy = 'ADMIN'
                WHERE UserId = @UserId
            `);
            
            console.log(`🔒 User ${userId} ${isBlocked ? 'blocked' : 'unblocked'} successfully`);
            return result.rowsAffected[0] > 0;
            
        } catch (error) {
            console.error('❌ Error setting user block status:', error);
            return false;
        }
    }

    /**
     * Get all active user sessions with pagination
     * @param {number} page - Page number (1-based)
     * @param {number} pageSize - Number of records per page
     * @returns {Object} Paginated session data
     */
    async getActiveUserSessions(page = 1, pageSize = 50) {
        try {
            const pool = await poolPromise;
            const request = pool.request();
            
            const offset = (page - 1) * pageSize;
            request.input('Offset', sql.Int, offset);
            request.input('PageSize', sql.Int, pageSize);
            
            // Get total count
            const countResult = await request.query(`
                SELECT COUNT(*) as TotalCount 
                FROM UserSessions 
                WHERE IsActive = 1
            `);
            
            // Get paginated data
            const dataResult = await request.query(`
                SELECT 
                    SessionId, UserId, UserPrincipalName, DisplayName,
                    FirstLoginDate, LastAccessDate, LoginCount,
                    IPAddress, DeviceType, OperatingSystem, Browser,
                    Country, UserRole, Department, IsBlocked
                FROM UserSessions 
                WHERE IsActive = 1
                ORDER BY LastAccessDate DESC
                OFFSET @Offset ROWS
                FETCH NEXT @PageSize ROWS ONLY
            `);
            
            const totalCount = countResult.recordset[0].TotalCount;
            const totalPages = Math.ceil(totalCount / pageSize);
            
            return {
                success: true,
                data: dataResult.recordset,
                pagination: {
                    currentPage: page,
                    pageSize: pageSize,
                    totalCount: totalCount,
                    totalPages: totalPages,
                    hasNext: page < totalPages,
                    hasPrevious: page > 1
                }
            };
            
        } catch (error) {
            console.error('❌ Error getting active user sessions:', error);
            throw new Error(`Failed to get active user sessions: ${error.message}`);
        }
    }

    /**
     * Check if user exists and is not blocked
     * @param {string} userId - User ID or email
     * @returns {Object} User validation result
     */
    async validateUserAccess(userId) {
        try {
            const sessionResult = await this.getUserSession(userId);
            
            if (!sessionResult.success) {
                return {
                    isValid: false,
                    reason: 'USER_NOT_FOUND',
                    message: 'User not found in tracking system'
                };
            }
            
            const userData = sessionResult.data;
            
            if (userData.IsBlocked) {
                return {
                    isValid: false,
                    reason: 'USER_BLOCKED',
                    message: 'User access is blocked'
                };
            }
            
            if (!userData.IsActive) {
                return {
                    isValid: false,
                    reason: 'USER_INACTIVE',
                    message: 'User session is inactive'
                };
            }
            
            return {
                isValid: true,
                userData: userData
            };
            
        } catch (error) {
            console.error('❌ Error validating user access:', error);
            return {
                isValid: false,
                reason: 'VALIDATION_ERROR',
                message: error.message
            };
        }
    }

    // Utility methods for parsing user agent data
    _detectDeviceType(userAgent = '') {
        if (!userAgent) return 'Unknown';
        
        const ua = userAgent.toLowerCase();
        if (/mobile|android|iphone|ipad|phone|tablet/.test(ua)) {
            if (/tablet|ipad/.test(ua)) return 'Tablet';
            return 'Mobile';
        }
        return 'Desktop';
    }

    _extractOS(userAgent = '') {
        if (!userAgent) return 'Unknown';
        
        const ua = userAgent.toLowerCase();
        if (/windows nt 10/.test(ua)) return 'Windows 10';
        if (/windows nt 6.3/.test(ua)) return 'Windows 8.1';
        if (/windows nt 6.2/.test(ua)) return 'Windows 8';
        if (/windows nt 6.1/.test(ua)) return 'Windows 7';
        if (/windows/.test(ua)) return 'Windows';
        if (/macintosh|mac os x/.test(ua)) return 'macOS';
        if (/linux/.test(ua)) return 'Linux';
        if (/android/.test(ua)) return 'Android';
        if (/iphone|ipad|ipod/.test(ua)) return 'iOS';
        return 'Unknown';
    }

    _extractBrowser(userAgent = '') {
        if (!userAgent) return 'Unknown';
        
        const ua = userAgent.toLowerCase();
        if (/edg\//.test(ua)) return 'Microsoft Edge';
        if (/chrome\//.test(ua) && !/edg\//.test(ua)) return 'Google Chrome';
        if (/firefox\//.test(ua)) return 'Mozilla Firefox';
        if (/safari\//.test(ua) && !/chrome\//.test(ua)) return 'Safari';
        if (/opera|opr\//.test(ua)) return 'Opera';
        if (/trident\//.test(ua) || /msie/.test(ua)) return 'Internet Explorer';
        return 'Unknown';
    }

    _extractBrowserVersion(userAgent = '') {
        if (!userAgent) return 'Unknown';
        
        const ua = userAgent.toLowerCase();
        const patterns = {
            'edg': /edg\/([0-9.]+)/,
            'chrome': /chrome\/([0-9.]+)/,
            'firefox': /firefox\/([0-9.]+)/,
            'safari': /version\/([0-9.]+)/,
            'opera': /(?:opera|opr)\/([0-9.]+)/
        };
        
        for (const [browser, pattern] of Object.entries(patterns)) {
            const match = ua.match(pattern);
            if (match) return match[1];
        }
        
        return 'Unknown';
    }
}

module.exports = UserSession;