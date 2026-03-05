// services/notificationAPI.js
import api from './api';

export const notificationAPI = {
  // Get user notifications
  getNotifications: (params) => api.get('/notifications', { params }),
  
  // Get unread count
  getUnreadCount: () => api.get('/notifications/unread-count'),
  
  // Mark as read
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  
  // Mark all as read
  markAllAsRead: () => api.put('/notifications/read-all'),
  
  // Delete notification
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
  
  // Delete all notifications
  deleteAllNotifications: () => api.delete('/notifications'),
  
  // Send notification (admin only)
  sendNotification: (data) => api.post('/notifications', data),
  
  // Send bulk notifications (admin only)
  sendBulkNotifications: (data) => api.post('/notifications/bulk', data),
};