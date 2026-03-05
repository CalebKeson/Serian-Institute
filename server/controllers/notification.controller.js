// controllers/notificationController.js
import Notification from '../models/notification.model.js';
import User from '../models/user.model.js';
import { errorHandler } from '../utils/error.js';

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req, res, next) => {
  try {
    const { 
      limit = 20, 
      page = 1, 
      type, 
      status,
      sort = '-createdAt' 
    } = req.query;
    
    const query = { recipient: req.user._id };
    
    // Apply filters if provided
    if (type) query.type = type;
    if (status) query.status = status;
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get notifications
    const notifications = await Notification.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    // Get total count for pagination info
    const total = await Notification.countDocuments(query);
    
    res.json({
      success: true,
      data: notifications,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Get unread notifications count
// @route   GET /api/notifications/unread-count
// @access  Private
export const getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.getUnreadCount(req.user._id);
    
    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user._id
    });
    
    if (!notification) {
      return next(errorHandler(404, 'Notification not found'));
    }
    
    notification.status = 'read';
    await notification.save();
    
    res.json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
export const markAllAsRead = async (req, res, next) => {
  try {
    const result = await Notification.markAllAsRead(req.user._id);
    
    res.json({
      success: true,
      message: 'All notifications marked as read',
      data: { modifiedCount: result.modifiedCount }
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id
    });
    
    if (!notification) {
      return next(errorHandler(404, 'Notification not found'));
    }
    
    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Delete all user notifications
// @route   DELETE /api/notifications
// @access  Private
export const deleteAllNotifications = async (req, res, next) => {
  try {
    const result = await Notification.deleteMany({ 
      recipient: req.user._id 
    });
    
    res.json({
      success: true,
      message: 'All notifications deleted',
      data: { deletedCount: result.deletedCount }
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Send notification (Admin only)
// @route   POST /api/notifications
// @access  Private/Admin
export const sendNotification = async (req, res, next) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return next(errorHandler(403, 'Only admin can send notifications'));
    }
    
    const { recipientId, title, message, type = 'system', actionUrl } = req.body;
    
    // Validate required fields
    if (!recipientId || !title || !message) {
      return next(errorHandler(400, 'Recipient ID, title and message are required'));
    }
    
    // Verify recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return next(errorHandler(404, 'Recipient not found'));
    }
    
    // Create notification
    const notification = await Notification.create({
      recipient: recipientId,
      title,
      message,
      type,
      actionUrl
    });
    
    res.status(201).json({
      success: true,
      message: 'Notification sent successfully',
      data: notification
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Send notification to multiple users (Admin only)
// @route   POST /api/notifications/bulk
// @access  Private/Admin
export const sendBulkNotifications = async (req, res, next) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return next(errorHandler(403, 'Only admin can send bulk notifications'));
    }
    
    const { recipientIds, title, message, type = 'system', actionUrl } = req.body;
    
    // Validate required fields
    if (!recipientIds || !Array.isArray(recipientIds) || recipientIds.length === 0) {
      return next(errorHandler(400, 'Recipient IDs array is required'));
    }
    
    if (!title || !message) {
      return next(errorHandler(400, 'Title and message are required'));
    }
    
    // Verify recipients exist
    const recipients = await User.find({ _id: { $in: recipientIds } });
    if (recipients.length !== recipientIds.length) {
      return next(errorHandler(404, 'Some recipients not found'));
    }
    
    // Create notifications for each recipient
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
    
    res.status(201).json({
      success: true,
      message: `Notifications sent to ${notifications.length} users`,
      data: notifications
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};