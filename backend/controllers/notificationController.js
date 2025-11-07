const Notification = require('../models/Notification');

class NotificationController {
     constructor() {
          try {
               this.notificationModel = new Notification();
          } catch (error) {
               console.error('Error creating notificationModel:', error);
               this.notificationModel = null;
          }
     }
     /**
      * Get notifications for the authenticated user
      */
     async getUserNotifications(req, res) {
          try {
               const userId = req.query.user_id;
               if (!userId) {
                    return res.status(401).json({
                         success: false,
                         message: 'User id not found. Please ensure you are properly authenticated.',
                         code: 'NO_USER_ID'
                    });
               }

               const {
                    limit = 50,
                    offset = 0,
                    is_read,
                    notification_type
               } = req.query;

               const options = {
                    limit: parseInt(limit),
                    offset: parseInt(offset)
               };

               if (is_read !== undefined) {
                    options.isRead = is_read === 'true';
               }

               if (notification_type) {
                    options.notificationType = notification_type;
               }
               if (!this.notificationModel) {
                    return res.status(500).json({
                         success: false,
                         message: 'Notification service not initialized',
                         code: 'SERVICE_UNAVAILABLE'
                    });
               }

               const result = await this.notificationModel.getUserNotifications(userId, options);

               res.status(200).json({
                    success: true,
                    data: result.notifications,
                    count: result.count,
                    pagination: {
                         limit: options.limit,
                         offset: options.offset
                    }
               });

          } catch (error) {
               console.error('Error fetching user notifications:', error);
               res.status(500).json({
                    success: false,
                    message: 'Failed to fetch notifications',
                    error: error.message
               });
          }
     }



     /**
      * Mark a notification as read
      */
     async markNotificationAsRead(req, res) {
          try {
               const userId = req.user.id;
               const { notificationId } = req.params;

               if (!userId) {
                    return res.status(401).json({
                         success: false,
                         message: 'User id not found. Please ensure you are properly authenticated.',
                         code: 'NO_USER_ID'
                    });
               }

               if (!notificationId) {
                    return res.status(400).json({
                         success: false,
                         message: 'Notification ID is required'
                    });
               }

               const result = await this.notificationModel.markAsRead(notificationId, userId);

               if (result.rowsAffected === 0) {
                    return res.status(404).json({
                         success: false,
                         message: 'Notification not found or already read'
                    });
               }

               res.status(200).json({
                    success: true,
                    message: 'Notification marked as read'
               });

          } catch (error) {
               console.error('Error marking notification as read:', error);
               res.status(500).json({
                    success: false,
                    message: 'Failed to mark notification as read',
                    error: error.message
               });
          }
     }

     /**
      * Mark all notifications as read for the authenticated user
      */
     async markAllNotificationsAsRead(req, res) {
          try {
               const userId = req.user.id;

               if (!userId) {
                    return res.status(401).json({
                         success: false,
                         message: 'User id not found. Please ensure you are properly authenticated.',
                         code: 'NO_USER_ID'
                    });
               }

               const result = await this.notificationModel.markAllAsRead(userId);

               res.status(200).json({
                    success: true,
                    message: `${result.rowsAffected} notifications marked as read`
               });

          } catch (error) {
               console.error('Error marking all notifications as read:', error);
               res.status(500).json({
                    success: false,
                    message: 'Failed to mark all notifications as read',
                    error: error.message
               });
          }
     }

     /**
      * Delete a notification
      */
     async deleteNotification(req, res) {
          try {
               const userId = req.user.id;
               const { notificationId } = req.params;

               if (!userId) {
                    return res.status(401).json({
                         success: false,
                         message: 'User id not found. Please ensure you are properly authenticated.',
                         code: 'NO_USER_ID'
                    });
               }

               if (!notificationId) {
                    return res.status(400).json({
                         success: false,
                         message: 'Notification ID is required'
                    });
               }

               const result = await this.notificationModel.delete(notificationId, userId);

               if (result.rowsAffected === 0) {
                    return res.status(404).json({
                         success: false,
                         message: 'Notification not found'
                    });
               }

               res.status(200).json({
                    success: true,
                    message: 'Notification deleted successfully'
               });

          } catch (error) {
               console.error('Error deleting notification:', error);
               res.status(500).json({
                    success: false,
                    message: 'Failed to delete notification',
                    error: error.message
               });
          }
     }

     /**
      * Delete all notifications for the authenticated user
      */
     async deleteAllNotifications(req, res) {
          try {
               const userId = req.user.id;

               if (!userId) {
                    return res.status(401).json({
                         success: false,
                         message: 'User id not found. Please ensure you are properly authenticated.',
                         code: 'NO_USER_ID'
                    });
               }

               const result = await this.notificationModel.deleteAll(userId);

               res.status(200).json({
                    success: true,
                    message: `${result.rowsAffected} notifications deleted`
               });

          } catch (error) {
               console.error('Error deleting all notifications:', error);
               res.status(500).json({
                    success: false,
                    message: 'Failed to delete all notifications',
                    error: error.message
               });
          }
     }

     /**
      * Create a notification (for internal use)
      */
     async createNotification(notificationData) {
          console.log("creating notification inside controller", notificationData)
          try {
               const userId = notificationData.user_id;

               if (!userId) {
                    return res.status(401).json({
                         success: false,
                         message: 'User id not found. Please ensure you are properly authenticated.',
                         code: 'NO_USER_ID'
                    });
               }

               const {
                    title,
                    message,
                    document_id,
                    ingestion_source,
                    notification_type = 'upload',
               } = notificationData;

               if (!title || !message) {
                    return res.status(400).json({
                         success: false,
                         message: 'Title and message are required'
                    });
               }

               const result = await this.notificationModel.create({
                    user_id: userId,
                    title,
                    message,
                    document_id,
                    ingestion_source,
                    notification_type,
               });

               res.status(201).json({
                    success: true,
                    data: result.notification,
                    message: 'Notification created successfully'
               });

          } catch (error) {
               console.error('Error creating notification:', error);
               res.status(500).json({
                    success: false,
                    message: 'Failed to create notification',
                    error: error.message
               });
          }
     }

          /**
 * Get unread notification count for the authenticated user
 */
     async getUnreadCount(req, res) {
          try {
               const userId = req.query.user_id;

               if (!userId) {
                    return res.status(401).json({
                         success: false,
                         message: 'User id not found. Please ensure you are properly authenticated.',
                         code: 'NO_USER_ID'
                    });
               }

               const result = await this.notificationModel.getUnreadCount(userId);

               res.status(200).json({
                    success: true,
                    unreadCount: result.unreadCount
               });

          } catch (error) {
               console.error('Error fetching unread count:', error);
               res.status(500).json({
                    success: false,
                    message: 'Failed to fetch unread count',
                    error: error.message
               });
          }
     }
}

module.exports = new NotificationController(); 