import { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';
import notificationService from '../services/notificationService';

// Create notification context
const NotificationContext = createContext();

// Provider component
export const NotificationProvider = ({ children }) => {
     const [notifications, setNotifications] = useState([]);
     const [unreadCount, setUnreadCount] = useState(0);
     const [loading, setLoading] = useState(false);
     const [error, setError] = useState(null);
     const [lastRefreshTime, setLastRefreshTime] = useState(Date.now());

     // Fetch notifications
     const fetchNotifications = useCallback(async (options = {}) => {
          setLoading(true);
          setError(null);

          try {
               const result = await notificationService.getUserNotifications(options);

               if (result.success) {
                    setNotifications(result.notifications);
                    return result;
               } else {
                    setError(result.error);
                    return result;
               }
          } catch (error) {
               setError(error.message);
               return { success: false, error: error.message };
          } finally {
               setLoading(false);
          }
     }, []);

     // Fetch unread count
     const fetchUnreadCount = useCallback(async () => {
          try {
               const result = await notificationService.getUnreadCount();

               if (result.success) {
                    setUnreadCount(result.unreadCount);
               }

               return result;
          } catch (error) {
               console.error('Error fetching unread count:', error);
               return { success: false, error: error.message };
          }
     }, []);

     // Mark notification as read
     const markAsRead = useCallback(async (notificationId) => {
          try {
               const result = await notificationService.markNotificationAsRead(notificationId);

               if (result.success) {
                    // Update local state
                    setNotifications(prev =>
                         prev.map(notification =>
                              notification.id === notificationId
                                   ? { ...notification, is_read: true }
                                   : notification
                         )
                    );

                    // Update unread count
                    setUnreadCount(prev => Math.max(0, prev - 1));
               }

               return result;
          } catch (error) {
               console.error('Error marking notification as read:', error);
               return { success: false, error: error.message };
          }
     }, []);

     // Mark all notifications as read
     const markAllAsRead = useCallback(async () => {
          try {
               const result = await notificationService.markAllNotificationsAsRead();

               if (result.success) {
                    // Update local state
                    setNotifications(prev =>
                         prev.map(notification => ({ ...notification, is_read: true }))
                    );

                    // Reset unread count
                    setUnreadCount(0);
               }

               return result;
          } catch (error) {
               console.error('Error marking all notifications as read:', error);
               return { success: false, error: error.message };
          }
     }, []);

     // Delete notification
     const deleteNotification = useCallback(async (notificationId) => {
          try {
               const result = await notificationService.deleteNotification(notificationId);

               if (result.success) {
                    // Update local state
                    setNotifications(prev => {
                         const notification = prev.find(n => n.id === notificationId);
                         const updated = prev.filter(n => n.id !== notificationId);

                         // Update unread count if deleted notification was unread
                         if (notification && !notification.is_read) {
                              setUnreadCount(count => Math.max(0, count - 1));
                         }

                         return updated;
                    });
               }

               return result;
          } catch (error) {
               console.error('Error deleting notification:', error);
               return { success: false, error: error.message };
          }
     }, []);

     // Delete all notifications
     const deleteAllNotifications = useCallback(async () => {
          try {
               const result = await notificationService.deleteAllNotifications();

               if (result.success) {
                    // Clear local state
                    setNotifications([]);
                    setUnreadCount(0);
               }

               return result;
          } catch (error) {
               console.error('Error deleting all notifications:', error);
               return { success: false, error: error.message };
          }
     }, []);

     // Refresh notifications and unread count
     const refresh = useCallback(async () => {
          await Promise.all([
               fetchNotifications(),
               fetchUnreadCount()
          ]);
          setLastRefreshTime(Date.now());
     }, [fetchNotifications, fetchUnreadCount]);

     // Force refresh (useful when notification panel opens)
     const forceRefresh = useCallback(async () => {
          console.log('🔄 Force refreshing notifications...');
          await refresh();
     }, [refresh]);

     const value = {
          notifications,
          unreadCount,
          loading,
          error,
          fetchNotifications,
          fetchUnreadCount,
          markAsRead,
          markAllAsRead,
          deleteNotification,
          deleteAllNotifications,
          refresh,
          forceRefresh,
          lastRefreshTime
     };

     return (
          <NotificationContext.Provider value={value}>
               {children}
          </NotificationContext.Provider>
     );
};

// Hook to use notification context
export const useNotifications = () => {
     const context = useContext(NotificationContext);
     if (!context) {
          throw new Error('useNotifications must be used within a NotificationProvider');
     }
     return context;
}; 