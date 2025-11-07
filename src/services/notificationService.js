import axios from 'axios';
import { getAuthHeaders } from '../utils/authUtils';
import envConfig from '../envConfig';

// Constants for bypass mode
const BYPASS_USER_ID = 'deepak.singh@nitor.infortech.com';

class NotificationService {
     constructor() {
          this.baseUrl = `${envConfig.apiUrl}/notifications`;
     }

     getUserId() {
          // Check for bypass mode first
          const isBypassMode = () => sessionStorage.getItem('bypass_auth') === 'true';

          if (isBypassMode()) {
               console.log('🔧 Using bypass mode user ID');
               return BYPASS_USER_ID;
          }

          // Try to get from window.msalInstance if available
          if (window.msalInstance) {
               const accounts = window.msalInstance.getAllAccounts();
               if (accounts && accounts.length > 0) {
                    const account = accounts[0];
                    const userId = account.localAccountId || account.homeAccountId || account.username;
                    console.log('🔐 Using MSAL account user ID:', userId);
                    return userId;
               }
          }

          // Fallback to 'unknown-user' if no account found
          console.log('📧 Using fallback user ID: unknown-user');
          return 'unknown-user';
     }

     /**
      * Get user notifications with optional filters
      */
     async getUserNotifications(options = {}) {
          try {
               const {
                    limit = 50,
                    offset = 0,
                    is_read,
                    notification_type
               } = options;
               const user_id = this.getUserId();

               const params = new URLSearchParams({
                    limit: limit.toString(),
                    offset: offset.toString(),
                    user_id: user_id,
               });

               if (is_read !== undefined) {
                    params.append('is_read', is_read.toString());
               }

               if (notification_type) {
                    params.append('notification_type', notification_type);
               }

               const headers = await getAuthHeaders();
               // Add cache-busting headers
               headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
               headers['Pragma'] = 'no-cache';

               const response = await axios.get(`${this.baseUrl}?${params}`, { headers });

               return {
                    success: true,
                    notifications: response.data.data || [],
                    count: response.data.count || 0,
                    pagination: response.data.pagination
               };
          } catch (error) {
               console.error('Error fetching notifications:', error);
               return {
                    success: false,
                    error: error.response?.data?.message || error.message,
                    notifications: [],
                    count: 0
               };
          }
     }

     /**
      * Get unread notification count
      */
     async getUnreadCount() {
          try {
               const user_id = this.getUserId();

               const params = new URLSearchParams({
                    user_id: user_id,
               });

               const headers = await getAuthHeaders();
               // Add cache-busting headers and timestamp
               headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
               headers['Pragma'] = 'no-cache';

               const response = await axios.get(`${this.baseUrl}/unread-count?${params}`, { headers });

               return {
                    success: true,
                    unreadCount: response.data.unreadCount || 0
               };
          } catch (error) {
               console.error('Error fetching unread count:', error);
               return {
                    success: false,
                    error: error.response?.data?.message || error.message,
                    unreadCount: 0
               };
          }
     }

     /**
      * Mark notification as read
      */
     async markNotificationAsRead(notificationId) {
          try {
               const headers = await getAuthHeaders();
               const response = await axios.put(`${this.baseUrl}/${notificationId}/read`, {}, { headers });

               return {
                    success: true,
                    message: response.data.message
               };
          } catch (error) {
               console.error('Error marking notification as read:', error);
               return {
                    success: false,
                    error: error.response?.data?.message || error.message
               };
          }
     }

     /**
      * Mark all notifications as read
      */
     async markAllNotificationsAsRead() {
          try {
               const headers = await getAuthHeaders();
               const response = await axios.put(`${this.baseUrl}/mark-all-read`, {}, { headers });

               return {
                    success: true,
                    message: response.data.message
               };
          } catch (error) {
               console.error('Error marking all notifications as read:', error);
               return {
                    success: false,
                    error: error.response?.data?.message || error.message
               };
          }
     }

     /**
      * Delete notification
      */
     async deleteNotification(notificationId) {
          try {
               const headers = await getAuthHeaders();
               const response = await axios.delete(`${this.baseUrl}/${notificationId}`, { headers });

               return {
                    success: true,
                    message: response.data.message
               };
          } catch (error) {
               console.error('Error deleting notification:', error);
               return {
                    success: false,
                    error: error.response?.data?.message || error.message
               };
          }
     }

     /**
      * Delete all notifications
      */
     async deleteAllNotifications() {
          try {
               const headers = await getAuthHeaders();
               const response = await axios.delete(`${this.baseUrl}`, { headers });

               return {
                    success: true,
                    message: response.data.message
               };
          } catch (error) {
               console.error('Error deleting all notifications:', error);
               return {
                    success: false,
                    error: error.response?.data?.message || error.message
               };
          }
     }

     /**
      * Create notification (for testing/admin purposes)
      */
     async createNotification(notificationData) {
          try {
               const headers = await getAuthHeaders();
               const response = await axios.post(`${this.baseUrl}`, notificationData, { headers });

               return {
                    success: true,
                    notification: response.data.data,
                    message: response.data.message
               };
          } catch (error) {
               console.error('Error creating notification:', error);
               return {
                    success: false,
                    error: error.response?.data?.message || error.message
               };
          }
     }
}

export default new NotificationService(); 