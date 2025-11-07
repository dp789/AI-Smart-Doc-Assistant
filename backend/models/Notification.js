const sql = require('mssql');
const { poolPromise } = require('../db/index');
const { v4: uuidv4 } = require('uuid');
const { INGESTION_FILE_TYPE } = require('../utils/helper');
class Notification {
     constructor() {
          this.tableName = 'dbo.notifications';
     }

     /**
      * Create a new notification
      */
     async create(notificationData) {
          try {
               const pool = await poolPromise;
               const {
                    user_id,
                    title,
                    message,
                    document_id = null,
                    ingestion_source,
                    notification_type = 'upload'
               } = notificationData;

               const request = pool.request();
               request.input('id', sql.VarChar(255), uuidv4());
               request.input('user_id', sql.VarChar(255), user_id);
               request.input('title', sql.NVarChar(255), title);
               request.input('message', sql.NVarChar(500), message);
               request.input('document_id', sql.VarChar(255), document_id);
               request.input('ingestion_source', sql.Int, ingestion_source);
               request.input('notification_type', sql.VarChar(50), notification_type);
               request.input('is_read', sql.Bit, false);
               request.input('created_at', sql.DateTime, new Date());

               const result = await request.query(`
                INSERT INTO ${this.tableName} 
                (id, user_id, title, message, document_id, ingestion_source, notification_type, is_read, created_at)
                OUTPUT INSERTED.*
                VALUES (@id, @user_id, @title, @message, @document_id, @ingestion_source, @notification_type, @is_read, @created_at)
            `);

               return {
                    success: true,
                    notification: result.recordset[0]
               };
          } catch (error) {
               console.error('Error creating notification:', error);
               throw new Error(`Failed to create notification: ${error.message}`);
          }
     }

     /**
      * Get notifications for a user
      */
     async getUserNotifications(userId, options = {}) {
          try {
               console.log('📡 Attempting to get database pool...');
               const pool = await poolPromise;
               console.log('✅ Database pool obtained:', !!pool);

               const {
                    limit = 50,
                    offset = 0,
                    isRead = null,
                    notificationType = null
               } = options;

               const request = pool.request();

               request.input('user_id', sql.VarChar(255), userId);
               request.input('limit', sql.Int, limit);
               request.input('offset', sql.Int, offset);

               let whereClause = 'WHERE user_id = @user_id';

               if (isRead !== null) {
                    request.input('is_read', sql.Bit, isRead);
                    whereClause += ' AND is_read = @is_read';
               }

               if (notificationType) {
                    request.input('notification_type', sql.VarChar(50), notificationType);
                    whereClause += ' AND notification_type = @notification_type';
               }

               const finalQuery = `
                SELECT *
                FROM ${this.tableName}
                ${whereClause}
                ORDER BY created_at DESC
                OFFSET @offset ROWS
                FETCH NEXT @limit ROWS ONLY
            `;


               // 🔍 Debug: Count ALL records for this user_id to compare
               const debugCountQuery = `SELECT COUNT(*) as total FROM ${this.tableName} WHERE user_id = @user_id`;
               const debugCountResult = await pool.request()
                    .input('user_id', sql.VarChar(255), userId)
                    .query(debugCountQuery);

               const result = await request.query(finalQuery);
               // Return notifications directly
               const notifications = result.recordset;

               return {
                    success: true,
                    notifications,
                    count: notifications.length
               };
          } catch (error) {
               console.error('Error fetching notifications inside model:', error);
               throw new Error(`Failed to fetch notifications inside model: ${error.message}`);
          }
     }

     /**
      * Get unread notification count for a user
      */
     async getUnreadCount(userId) {
          try {
               const pool = await poolPromise;
               const request = pool.request();

               request.input('user_id', sql.VarChar(255), userId);

               const result = await request.query(`
                SELECT COUNT(*) as unread_count
                FROM ${this.tableName}
                WHERE user_id = @user_id AND is_read = 0
            `);

               return {
                    success: true,
                    unreadCount: result.recordset[0].unread_count
               };
          } catch (error) {
               console.error('Error getting unread count:', error);
               throw new Error(`Failed to get unread count: ${error.message}`);
          }
     }

     /**
      * Mark notification as read
      */
     async markAsRead(notificationId, userId) {
          try {
               const pool = await poolPromise;
               const request = pool.request();
               request.input('id', sql.VarChar(255), notificationId);
               request.input('user_id', sql.VarChar(255), userId);

               const result = await request.query(`
                UPDATE ${this.tableName}
                SET is_read = 1
                WHERE id = @id AND user_id = @user_id
            `);

               return {
                    success: true,
                    rowsAffected: result.rowsAffected[0]
               };
          } catch (error) {
               console.error('Error marking notification as read:', error);
               throw new Error(`Failed to mark notification as read: ${error.message}`);
          }
     }

     /**
      * Mark all notifications as read for a user
      */
     async markAllAsRead(userId) {
          try {
               const pool = await poolPromise;
               const request = pool.request();
               request.input('user_id', sql.VarChar(255), userId);

               const result = await request.query(`
                UPDATE ${this.tableName}
                SET is_read = 1
                WHERE user_id = @user_id AND is_read = 0
            `);

               return {
                    success: true,
                    rowsAffected: result.rowsAffected[0]
               };
          } catch (error) {
               console.error('Error marking all notifications as read:', error);
               throw new Error(`Failed to mark all notifications as read: ${error.message}`);
          }
     }

     /**
      * Delete a notification
      */
     async delete(notificationId, userId) {
          try {
               const pool = await poolPromise;
               const request = pool.request();

               request.input('id', sql.VarChar(255), notificationId);
               request.input('user_id', sql.VarChar(255), userId);

               const result = await request.query(`
                DELETE FROM ${this.tableName}
                WHERE id = @id AND user_id = @user_id
            `);

               return {
                    success: true,
                    rowsAffected: result.rowsAffected[0]
               };
          } catch (error) {
               console.error('Error deleting notification:', error);
               throw new Error(`Failed to delete notification: ${error.message}`);
          }
     }

     /**
      * Delete all notifications for a user
      */
     async deleteAll(userId) {
          try {
               const pool = await poolPromise;
               const request = pool.request();

               request.input('user_id', sql.VarChar(255), userId);

               const result = await request.query(`
                DELETE FROM ${this.tableName}
                WHERE user_id = @user_id
            `);

               return {
                    success: true,
                    rowsAffected: result.rowsAffected[0]
               };
          } catch (error) {
               console.error('Error deleting all notifications:', error);
               throw new Error(`Failed to delete all notifications: ${error.message}`);
          }
     }

     /**
      * Create upload success notification
      */
     async createUploadSuccessNotification(userId, fileName, documentId, ingestionSource) {

          // Simple source name mapping
          let sourceName = 'Unknown Source';
          switch (ingestionSource) {
               case 1: sourceName = 'SharePoint'; break;
               case 2: sourceName = 'Web Scraped'; break;
               case 3: sourceName = 'Local Upload'; break;
          }

          return await this.create({
               user_id: userId,
               title: 'Upload Successful',
               message: `${fileName} uploaded successfully`,
               document_id: documentId,
               ingestion_source: ingestionSource,
               notification_type: 'upload_success'
          });
     }

     /**
      * Create upload error notification
      */
     async createUploadErrorNotification(userId, fileName, error, ingestionSource) {
          // Simple source name mapping
          let sourceName = 'Unknown Source';
          switch (ingestionSource) {
               case 1: sourceName = 'SharePoint'; break;
               case 2: sourceName = 'Web Scraped'; break;
               case 3: sourceName = 'Local Upload'; break;
          }
          let message = '';
          if (ingestionSource === INGESTION_FILE_TYPE.WEB_SCAPED) {
               message = `Failed to Import URL: ${error}`;
          } else {
               message = `Failed to upload ${fileName} from ${sourceName}: ${error}`;
          }
          return await this.create({
               user_id: userId,
               title: 'Upload Failed',
               message: message,
               document_id: null,
               ingestion_source: ingestionSource,
               notification_type: 'upload_error'
          });
     }
}

module.exports = Notification; 