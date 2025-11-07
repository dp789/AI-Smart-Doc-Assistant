const express = require('express');
const router = express.Router();
const UserTrackingController = require('../controllers/userTrackingController');
const UserTrackingMiddleware = require('../middleware/userTracking');
const OrganizationalAuthMiddleware = require('../middleware/organizationalAuth');
const auth = require('../middleware/auth');

// Apply CORS middleware to all routes
router.use(UserTrackingMiddleware.handleCORS);

/**
 * Public Routes (no authentication required)
 */

// Health check endpoint
router.get('/health', UserTrackingController.healthCheck);

// SSO Login tracking (primary endpoint for Microsoft SSO) - Organizational users only
router.post('/sso-login', 
    OrganizationalAuthMiddleware.validateOrganizationalAccess,
    OrganizationalAuthMiddleware.extractUserRoles,
    OrganizationalAuthMiddleware.logOrganizationalActivity,
    UserTrackingMiddleware.trackUserLogin,
    UserTrackingController.handleSSOLogin
);

// Validate user access (called by frontend before allowing app access) - Organizational users only
router.get('/validate-access', 
    OrganizationalAuthMiddleware.validateOrganizationalAccess,
    UserTrackingController.validateAccess
);

/**
 * Protected Routes (require authentication)
 */

// Update last access time (called by frontend during app usage) - Organizational users only
router.put('/update-access/:userId', 
    OrganizationalAuthMiddleware.validateOrganizationalAccess,
    OrganizationalAuthMiddleware.logOrganizationalActivity,
    UserTrackingController.updateLastAccess
);

// Get user session information - Organizational users only
router.get('/session/:userId', 
    OrganizationalAuthMiddleware.validateOrganizationalAccess,
    UserTrackingController.getUserSession
);

/**
 * Admin Routes (require authentication + admin privileges)
 * Note: Add admin role check middleware as needed
 */

// Get all active users (paginated) - Admin only
router.get('/users/active', 
    OrganizationalAuthMiddleware.validateOrganizationalAccess,
    OrganizationalAuthMiddleware.extractUserRoles,
    OrganizationalAuthMiddleware.requireAdminRole,
    UserTrackingController.getActiveUsers
);

// Get tracking statistics - Admin only
router.get('/statistics', 
    OrganizationalAuthMiddleware.validateOrganizationalAccess,
    OrganizationalAuthMiddleware.extractUserRoles,
    OrganizationalAuthMiddleware.requireAdminRole,
    UserTrackingController.getTrackingStats
);

// Block/unblock a user - Admin only
router.put('/users/:userId/block-status', 
    OrganizationalAuthMiddleware.validateOrganizationalAccess,
    OrganizationalAuthMiddleware.extractUserRoles,
    OrganizationalAuthMiddleware.requireAdminRole,
    UserTrackingController.setUserBlockStatus
);

/**
 * Middleware Routes (for other parts of the application)
 */

// Middleware endpoint to validate user access (can be called by other backend services)
router.use('/middleware/validate', 
    auth.authenticate,
    UserTrackingMiddleware.validateUserAccess,
    (req, res) => {
        res.status(200).json({
            success: true,
            message: 'User access validated',
            userSession: req.userSession
        });
    }
);

// Middleware endpoint to track user activity (can be called by other backend services)
router.post('/middleware/track', 
    auth.authenticate,
    UserTrackingMiddleware.trackUserLogin,
    (req, res) => {
        res.status(200).json({
            success: true,
            message: 'User activity tracked',
            tracking: req.userTracking
        });
    }
);

// Error handling middleware
router.use(UserTrackingMiddleware.handleTrackingErrors);

module.exports = router;