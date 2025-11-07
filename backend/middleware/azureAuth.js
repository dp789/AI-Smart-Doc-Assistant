const jwt = require('jsonwebtoken');
const { DefaultAzureCredential } = require('@azure/identity');

/**
 * Authentication middleware that supports both JWT tokens and Azure AD tokens
 */
class AzureAuthMiddleware {
    
    /**
     * Authenticate using either JWT token or Azure AD token
     */
    static async authenticate(req, res, next) {
        try {
            const authHeader = req.headers.authorization;
            
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ 
                    error: 'Access denied. No token provided.' 
                });
            }

            const token = authHeader.split(' ')[1];
            if (!token) {
                return res.status(401).json({ 
                    error: 'Access denied. No token provided.' 
                });
            }

            // Try to authenticate as Azure AD token first
            const azureAuthResult = await AzureAuthMiddleware.authenticateAzureADToken(token);
            if (azureAuthResult.success) {
                req.user = azureAuthResult.user;
                return next();
            }

            // Fallback to JWT token authentication
            const jwtAuthResult = AzureAuthMiddleware.authenticateJWTToken(token);
            if (jwtAuthResult.success) {
                req.user = jwtAuthResult.user;
                return next();
            }

            // If both fail, return error
            return res.status(401).json({ 
                error: 'Invalid token.' 
            });

        } catch (error) {
            console.error('Authentication error:', error);
            res.status(500).json({ 
                error: 'Authentication failed', 
                message: error.message 
            });
        }
    }

    /**
     * Authenticate Azure AD token
     */
    static async authenticateAzureADToken(token) {
        try {
            // Decode the token to get user information
            const decoded = jwt.decode(token);
            
            if (!decoded) {
                return { success: false, error: 'Invalid token format' };
            }

            // Validate token structure (basic validation)
            if (!decoded.aud || !decoded.iss || !decoded.exp) {
                return { success: false, error: 'Invalid token structure' };
            }

            // Check if token is expired
            const currentTime = Math.floor(Date.now() / 1000);
            if (decoded.exp && decoded.exp < currentTime) {
                return { success: false, error: 'Token expired' };
            }

            // Extract user information
            const user = {
                id: decoded.oid || decoded.sub,
                email: decoded.email || decoded.preferred_username || decoded.upn,
                name: decoded.name || decoded.display_name,
                username: decoded.preferred_username || decoded.email || decoded.upn,
                tenantId: decoded.tid,
                roles: decoded.roles || [],
                groups: decoded.groups || [],
                authType: 'azure-ad'
            };

            console.log('🔐 Azure AD authentication successful for user:', user.email);
            console.log('📋 User details:', {
                id: user.id,
                email: user.email,
                name: user.name,
                tenantId: user.tenantId,
                groups: user.groups,
                roles: user.roles
            });

            return { success: true, user };

        } catch (error) {
            console.error('Azure AD token authentication error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Authenticate JWT token
     */
    static authenticateJWTToken(token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
            
            const user = {
                id: decoded.id,
                username: decoded.username,
                authType: 'jwt'
            };

            return { success: true, user };

        } catch (error) {
            if (error.name === 'JsonWebTokenError') {
                return { success: false, error: 'Invalid JWT token' };
            }
            if (error.name === 'TokenExpiredError') {
                return { success: false, error: 'JWT token expired' };
            }
            
            console.error('JWT token authentication error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Generate JWT token from user data
     */
    static generateToken(user) {
        return jwt.sign(
            { 
                id: user.id, 
                username: user.username,
                email: user.email 
            },
            process.env.JWT_SECRET || 'your_jwt_secret',
            { expiresIn: '24h' }
        );
    }

    /**
     * Validate organizational access for Azure AD users with group-based access control
     */
    static validateOrganizationalAccess(req, res, next) {
        try {
            const user = req.user;
            
            console.log('🏢 Validating organizational access for user:', user);
            
            if (!user || user.authType !== 'azure-ad') {
                console.log('⏭️  Skipping organizational validation for non-Azure AD user');
                return next(); // Skip validation for non-Azure AD users
            }

            // For upload endpoints, be more lenient with organizational access
            if (req.path.includes('/upload/')) {
                console.log('📤 Upload endpoint detected - applying lenient organizational validation');
            }

            // Validate organization domain
            const authorizedDomains = process.env.AUTHORIZED_DOMAINS 
                ? process.env.AUTHORIZED_DOMAINS.split(',').map(d => d.trim().toLowerCase())
                : [
                    'nitorinfotech.com',
                    'nitor.com'
                ];
            
            const userEmail = user.email;
            console.log('📧 User email:', userEmail);
            
            if (!userEmail) {
                console.error('❌ No email found in user data:', user);
                return res.status(401).json({
                    error: 'NO_EMAIL',
                    message: 'User email not found in authentication data'
                });
            }

            const userDomain = userEmail.split('@')[1]?.toLowerCase();
            console.log('🌐 User domain:', userDomain);
            console.log('✅ Authorized domains:', authorizedDomains);
            
            if (!authorizedDomains.includes(userDomain)) {
                console.warn('⚠️  Unauthorized domain access attempt:', userDomain);
                return res.status(403).json({
                    error: 'UNAUTHORIZED_DOMAIN',
                    message: `Access denied. Only users from authorized organizations are allowed.`,
                    authorizedDomains: authorizedDomains,
                    userDomain: userDomain
                });
            }

            // Validate user access (simplified approach without API permissions)
            const validationResult = AzureAuthMiddleware.validateUserAccess(user);
            if (!validationResult.isValid) {
                console.warn('⚠️  User access denied:', userEmail);
                return res.status(403).json({
                    error: 'UNAUTHORIZED_USER',
                    message: validationResult.message,
                    userEmail: userEmail
                });
            }

            console.log('✅ Organizational and group access validated for:', userEmail);
            next();

        } catch (error) {
            console.error('❌ Error validating organizational access:', error);
            res.status(500).json({
                error: 'ORG_VALIDATION_ERROR',
                message: 'Failed to validate organizational access',
                details: error.message
            });
        }
    }

    /**
     * Validate user access - No API permissions required
     */
    static validateUserAccess(user) {
        try {
            // Get authorized user emails from environment variables
            const authorizedUsers = process.env.AUTHORIZED_USERS 
                ? process.env.AUTHORIZED_USERS.split(',').map(u => u.trim().toLowerCase())
                : [];

            console.log('📝 Authorized users:', authorizedUsers);
            console.log('👤 Current user:', user.email);

            // If no user restrictions are configured, rely on Enterprise App assignment
            if (authorizedUsers.length === 0) {
                console.log('⏭️  No user restrictions configured - relying on Enterprise App assignment');
                return { isValid: true };
            }

            // Check authorized users list (email-based)
            const userEmail = user.email?.toLowerCase();
            if (authorizedUsers.includes(userEmail)) {
                console.log('✅ User is in authorized users list');
                return { isValid: true };
            }

            return {
                isValid: false,
                message: `Access denied. User email '${userEmail}' is not in the authorized users list: ${authorizedUsers.join(', ')}`
            };

        } catch (error) {
            console.error('❌ Error validating user access:', error);
            return {
                isValid: false,
                message: 'Failed to validate user access'
            };
        }
    }
}

module.exports = AzureAuthMiddleware; 