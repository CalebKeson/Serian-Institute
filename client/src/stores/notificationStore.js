import { create } from 'zustand';
import { notificationAPI } from '../services/notificationAPI';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  pollingInterval: null,
  
  // Fetch notifications
  fetchNotifications: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await notificationAPI.getNotifications(params);
      set({ 
        notifications: response.data.data,
        loading: false 
      });
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch notifications';
      set({ error: errorMessage, loading: false });
      return { success: false, message: errorMessage };
    }
  },
  
  // Fetch unread count (FIXED: Only update if count changed)
  fetchUnreadCount: async () => {
    try {
      const response = await notificationAPI.getUnreadCount();
      const newCount = response.data.data.count;
      
      // Only update state if the count actually changed
      if (get().unreadCount !== newCount) {
        set({ unreadCount: newCount });
      }
      
      return { success: true, count: newCount };
    } catch (error) {
      // Silent fail for polling - don't trigger re-renders
      console.warn('Failed to fetch unread count:', error);
      return { success: false };
    }
  },
  
  // Mark as read
  markAsRead: async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      
      // Update local state
      set(state => ({
        notifications: state.notifications.map(notification =>
          notification._id === id 
            ? { ...notification, status: 'read' }
            : notification
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }));
      
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to mark as read';
      return { success: false, message: errorMessage };
    }
  },
  
  // Mark all as read
  markAllAsRead: async () => {
    try {
      await notificationAPI.markAllAsRead();
      
      // Update local state
      set(state => ({
        notifications: state.notifications.map(notification => ({
          ...notification,
          status: 'read'
        })),
        unreadCount: 0
      }));
      
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to mark all as read';
      return { success: false, message: errorMessage };
    }
  },
  
  // Delete notification
  deleteNotification: async (id) => {
    try {
      await notificationAPI.deleteNotification(id);
      
      // Update local state
      const notification = get().notifications.find(n => n._id === id);
      const wasUnread = notification?.status === 'unread';
      
      set(state => ({
        notifications: state.notifications.filter(n => n._id !== id),
        unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount
      }));
      
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete notification';
      return { success: false, message: errorMessage };
    }
  },
  
  // Delete all notifications
  deleteAllNotifications: async () => {
    try {
      await notificationAPI.deleteAllNotifications();
      
      // Clear local state
      set({ notifications: [], unreadCount: 0 });
      
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete all notifications';
      return { success: false, message: errorMessage };
    }
  },
  
  // Start polling for new notifications (FIXED: Silent polling)
  startPolling: () => {
    // Clear any existing interval
    if (get().pollingInterval) {
      clearInterval(get().pollingInterval);
    }
    
    // Poll every 30 seconds (30000ms)
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        get().fetchUnreadCount();
      }
    }, 30000);
    
    set({ pollingInterval: interval });
    
    // Initial fetch
    get().fetchUnreadCount();
  },
  
  // Stop polling
  stopPolling: () => {
    if (get().pollingInterval) {
      clearInterval(get().pollingInterval);
      set({ pollingInterval: null });
    }
  },
  
  // Clear error
  clearError: () => set({ error: null }),
}));