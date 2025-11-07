const jwt = require('jsonwebtoken');

/**
 * Middleware to validate that users belong to the nitorinfotech.com organization
 */
class OrganizationalAuthMiddleware {
    
    /**
     * Validate that the user belongs to the authorized organization
     */
    static validateOrganizationalAccess(req, res, next) {
        try {
            console.log('🏢 Validating organizational access...');
            
            // Get user data from Microsoft SSO token
            const authHeader = req.headers.authorization;
            const userFromBody = req.body.user;
            
            let userInfo = null;
            
            // Try to get user info from Authorization header (JWT token)
            if (authHeader && authHeader.startsWith('Bearer ')) {
                try {
                    const token = authHeader.split(' ')[1];
                    // Decode without verification for now (MSAL already validated it)
                    userInfo = jwt.decode(token);
                } catch (jwtError) {
                    console.log('Could not decode JWT, trying body data...');
                }
            }
            
            // Fallback to user data from request body
            if (!userInfo && userFromBody) {
                userInfo = userFromBody;
            }
            
            if (!userInfo) {
                return res.status(401).json({
                    error: 'NO_USER_INFO',
                    message: 'User information not found in request'
                });
            }
            
            // Extract email/UPN for domain validation
            const userEmail = userInfo.email || 
                             userInfo.userPrincipalName || 
                             userInfo.upn || 
                             userInfo.preferred_username;
            
            if (!userEmail) {
                return res.status(401).json({
                    error: 'NO_EMAIL',
                    message: 'User email not found in authentication data'
                });
            }
            
            console.log('👤 Validating user:', userEmail);
            
            // Validate organization domain
            const authorizedDomains = process.env.AUTHORIZED_DOMAINS 
                ? process.env.AUTHORIZED_DOMAINS.split(',').map(d => d.trim().toLowerCase())
                : [
                    'nitorinfotech.com',
                    'nitor.com', // Add other domains if needed
                    // Add more authorized domains here
                ];
            
            const userDomain = userEmail.split('@')[1]?.toLowerCase();
            
            if (!authorizedDomains.includes(userDomain)) {
                console.warn('⚠️  Unauthorized domain access attempt:', userDomain);
                return res.status(403).json({
                    error: 'UNAUTHORIZED_DOMAIN',
                    message: `Access denied. Only users from authorized organizations are allowed.`,
                    authorizedDomains: authorizedDomains,
                    userDomain: userDomain,
                    hint: 'Please contact your administrator to get access to this application'
                });
            }
            
            // Additional organizational validations
            const orgValidation = OrganizationalAuthMiddleware.validateOrganizationalClaims(userInfo);
            if (!orgValidation.isValid) {
                return res.status(403).json({
                    error: 'ORG_VALIDATION_FAILED',
                    message: orgValidation.message,
                    details: orgValidation.details
                });
            }
            
            console.log('✅ Organizational access validated for:', userEmail);
            
            // Add organizational context to request
            req.organizationalUser = {
                email: userEmail,
                domain: userDomain,
                displayName: userInfo.displayName || userInfo.name,
                userId: userInfo.id || userInfo.oid || userInfo.sub,
                tenantId: userInfo.tid || userInfo.tenantId,
                roles: userInfo.roles || [],
                groups: userInfo.groups || [],
                isOrganizationalUser: true,
                organization: userDomain,
                authorizedDomains: authorizedDomains
            };
            
            // Continue to next middleware
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
     * Validate organizational claims in the token
     */
    static validateOrganizationalClaims(userInfo) {
        try {
            // Check tenant ID (should match your organization's tenant)
            const expectedTenantId = process.env.AZURE_TENANT_ID || '8c3dad1d-b6bc-4f8b-939b-8263372eced6';
            const userTenantId = userInfo.tid || userInfo.tenantId;
            
            if (userTenantId && userTenantId !== expectedTenantId) {
                return {
                    isValid: false,
                    message: 'User is not from the authorized tenant',
                    details: { expectedTenant: expectedTenantId, userTenant: userTenantId }
                };
            }
            
            // Check if user account is enabled (if available)
            if (userInfo.hasOwnProperty('accountEnabled') && !userInfo.accountEnabled) {
                return {
                    isValid: false,
                    message: 'User account is disabled',
                    details: { accountEnabled: userInfo.accountEnabled }
                };
            }
            
            // Check user type (avoid guest users if needed)
            if (userInfo.userType === 'Guest' && process.env.ALLOW_GUEST_USERS !== 'true') {
                return {
                    isValid: false,
                    message: 'Guest users are not allowed',
                    details: { userType: userInfo.userType }
                };
            }
            
            return { isValid: true };
            
        } catch (error) {
            return {
                isValid: false,
                message: 'Error validating organizational claims',
                details: error.message
            };
        }
    }
    
    /**
     * Extract user roles and permissions
     */
    static extractUserRoles(req, res, next) {
        try {
            const orgUser = req.organizationalUser;
            if (!orgUser) {
                return next();
            }
            
            // Define organizational roles mapping
            const roleMapping = {
                // Azure AD roles to application roles
                'Global Administrator': 'admin',
                'User Administrator': 'admin',
                'Application Administrator': 'admin',
                'Directory Readers': 'user',
                'Directory Writers': 'moderator',
                // Add more role mappings as needed
            };
            
            // Extract and map roles
            const userRoles = [];
            if (orgUser.roles && Array.isArray(orgUser.roles)) {
                orgUser.roles.forEach(role => {
                    const mappedRole = roleMapping[role];
                    if (mappedRole && !userRoles.includes(mappedRole)) {
                        userRoles.push(mappedRole);
                    }
                });
            }
            
            // Default role for organizational users
            if (userRoles.length === 0) {
                userRoles.push('user');
            }
            
            // Add roles to organizational user context
            req.organizationalUser.applicationRoles = userRoles;
            req.organizationalUser.isAdmin = userRoles.includes('admin');
            req.organizationalUser.isModerator = userRoles.includes('moderator');
            
            console.log(`👤 User ${orgUser.email} has roles:`, userRoles);
            
            next();
            
        } catch (error) {
            console.error('❌ Error extracting user roles:', error);
            next(); // Continue even if role extraction fails
        }
    }
    
    /**
     * Require admin role for certain endpoints
     */
    static requireAdminRole(req, res, next) {
        const orgUser = req.organizationalUser;
        
        if (!orgUser || !orgUser.isAdmin) {
            return res.status(403).json({
                error: 'ADMIN_REQUIRED',
                message: 'This action requires administrator privileges',
                userRoles: orgUser ? orgUser.applicationRoles : []
            });
        }
        
        console.log(`🔑 Admin access granted to: ${orgUser.email}`);
        next();
    }
    
    /**
     * Middleware to log organizational user activities
     */
    static logOrganizationalActivity(req, res, next) {
        const orgUser = req.organizationalUser;
        
        if (orgUser) {
            console.log(`📊 Organizational Activity - User: ${orgUser.email}, Action: ${req.method} ${req.path}, Time: ${new Date().toISOString()}`);
        }
        
        next();
    }
}

module.exports = OrganizationalAuthMiddleware;