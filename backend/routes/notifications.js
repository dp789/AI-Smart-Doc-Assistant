const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const azureAuth = require('../middleware/azureAuth');

// Cache-busting middleware for all notification routes
router.use((req, res, next) => {
     res.set({
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
     });
     next();
});

// Get user notifications with optional filters
router.get('/', azureAuth.authenticate, (req, res) => notificationController.getUserNotifications(req, res));

// Get unread notification count
router.get('/unread-count', azureAuth.authenticate, (req, res) => notificationController.getUnreadCount(req, res));

// Mark specific notification as read
router.put('/:notificationId/read', azureAuth.authenticate, (req, res) => notificationController.markNotificationAsRead(req, res));

// Mark all notifications as read
router.put('/mark-all-read', azureAuth.authenticate, (req, res) => notificationController.markAllNotificationsAsRead(req, res));

// Delete specific notification
router.delete('/:notificationId', azureAuth.authenticate, (req, res) => notificationController.deleteNotification(req, res));

// Delete all notifications
router.delete('/', azureAuth.authenticate, (req, res) => notificationController.deleteAllNotifications(req, res));

// Create notification (for internal/admin use)
router.post('/', (req, res) => notificationController.createNotification(req, res));

module.exports = router; 