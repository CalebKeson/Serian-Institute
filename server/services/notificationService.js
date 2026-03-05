// services/notificationService.js
import Notification from '../models/notification.model.js';
import User from '../models/user.model.js';

class NotificationService {
  /**
   * Create a single notification
   * @param {Object} data - Notification data
   * @param {string} data.recipientId - User ID who receives notification
   * @param {string} data.title - Notification title
   * @param {string} data.message - Notification message
   * @param {string} data.type - Notification type (request, course, student, etc.)
   * @param {string} data.actionUrl - Optional URL to navigate to
   * @returns {Promise<Object>} Created notification
   */
  static async createNotification({ recipientId, title, message, type = 'system', actionUrl = null }) {
    try {
      // Verify recipient exists
      const recipient = await User.findById(recipientId);
      if (!recipient) {
        throw new Error(`Recipient with ID ${recipientId} not found`);
      }

      const notification = await Notification.create({
        recipient: recipientId,
        title,
        message,
        type,
        actionUrl
      });

      return {
        success: true,
        data: notification
      };
    } catch (error) {
      console.error('Error creating notification:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Create same notification for multiple users
   * @param {Array<string>} recipientIds - Array of user IDs
   * @param {Object} data - Notification data (title, message, type, actionUrl)
   * @returns {Promise<Object>} Created notifications
   */
  static async createForMultiple(recipientIds, { title, message, type = 'system', actionUrl = null }) {
    try {
      if (!Array.isArray(recipientIds) || recipientIds.length === 0) {
        throw new Error('Recipient IDs array is required and cannot be empty');
      }

      // Verify all recipients exist
      const recipients = await User.find({ _id: { $in: recipientIds } });
      if (recipients.length !== recipientIds.length) {
        throw new Error('Some recipients not found');
      }

      const notifications = await Promise.all(
        recipientIds.map(recipientId =>
          Notification.create({
            recipient: recipientId,
            title,
            message,
            type,
            actionUrl
          })
        )
      );

      return {
        success: true,
        data: notifications,
        message: `Notifications sent to ${notifications.length} users`
      };
    } catch (error) {
      console.error('Error creating multiple notifications:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Create notification for all users with specific role
   * @param {string} role - User role (admin, receptionist, teacher, student, parent)
   * @param {Object} data - Notification data
   * @returns {Promise<Object>} Created notifications
   */
  static async createForRole(role, { title, message, type = 'system', actionUrl = null }) {
    try {
      // Get all users with the specified role
      const users = await User.find({ role, isActive: true }).select('_id');
      
      if (users.length === 0) {
        return {
          success: true,
          data: [],
          message: `No active users found with role: ${role}`
        };
      }

      const recipientIds = users.map(user => user._id);
      return await this.createForMultiple(recipientIds, { title, message, type, actionUrl });
    } catch (error) {
      console.error('Error creating notifications for role:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Manually trigger notification cleanup
   * Useful for cron jobs or manual cleanup
   * @returns {Promise<Object>} Cleanup result
   */
  static async cleanupOldNotifications() {
    try {
      const result = await Notification.cleanupOldNotifications();
      return {
        success: true,
        data: result,
        message: `Cleaned up ${result.deletedCount} old notifications`
      };
    } catch (error) {
      console.error('Error cleaning up notifications:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Get type icon based on notification type
   * @param {string} type - Notification type
   * @returns {string} Emoji icon
   */
  static getTypeIcon(type) {
    const icons = {
      request: '📋',
      course: '📚',
      student: '👨‍🎓',
      attendance: '✅',
      system: '⚙️',
      alert: '🔔'
    };
    return icons[type] || '📢';
  }

  /**
   * Generate notification title based on event type
   * @param {string} event - Event type
   * @param {Object} data - Event data
   * @returns {string} Generated title
   */
  static generateTitle(event, data = {}) {
    const titles = {
      request_created: 'New Visitor Request',
      request_assigned: 'Request Assigned',
      request_updated: 'Request Updated',
      request_completed: 'Request Completed',
      course_created: 'New Course Created',
      student_enrolled: 'Student Enrolled',
      attendance_marked: 'Attendance Marked',
      grade_posted: 'Grade Posted'
    };
    return titles[event] || 'New Notification';
  }

  /**
   * Generate notification message based on event type and data
   * @param {string} event - Event type
   * @param {Object} data - Event data
   * @returns {string} Generated message
   */
  static generateMessage(event, data = {}) {
    const messages = {
      request_created: `New visitor request from ${data.visitorName || 'a visitor'}`,
      request_assigned: `You have been assigned to handle request #${data.requestId || ''}`,
      request_updated: `Request #${data.requestId || ''} status updated to ${data.status || 'updated'}`,
      request_completed: `Request #${data.requestId || ''} has been completed`,
      course_created: `New course "${data.courseName || 'Course'}" has been created`,
      student_enrolled: `New student ${data.studentName || 'Student'} enrolled in ${data.courseName || 'course'}`,
      attendance_marked: `Attendance marked for ${data.studentName || 'Student'} in ${data.courseName || 'course'}`,
      grade_posted: `New grade posted for ${data.studentName || 'Student'} in ${data.courseName || 'course'}`
    };
    return messages[event] || 'You have a new notification';
  }
}

export default NotificationService;