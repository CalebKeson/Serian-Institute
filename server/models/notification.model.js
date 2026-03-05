// models/Notification.js
import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Notification recipient is required']
    },
    
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
      maxlength: [500, 'Message cannot exceed 500 characters']
    },
    
    type: {
      type: String,
      required: [true, 'Notification type is required'],
      enum: {
        values: ['request', 'course', 'student', 'attendance', 'system', 'alert'],
        message: 'Invalid notification type'
      },
      default: 'system'
    },
    
    status: {
      type: String,
      enum: {
        values: ['unread', 'read'],
        message: 'Invalid notification status'
      },
      default: 'unread'
    },
    
    actionUrl: {
      type: String,
      trim: true,
      maxlength: [500, 'Action URL cannot exceed 500 characters']
    },
    
    expiresAt: {
      type: Date,
      default: function() {
        return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
      }
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for performance
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, status: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for auto-deletion

// Pre-save middleware to limit notifications per user to 100
notificationSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      // Count current notifications for this user
      const count = await mongoose.models.Notification.countDocuments({ 
        recipient: this.recipient 
      });
      
      // If user has 100 or more notifications, delete the oldest ones
      if (count >= 100) {
        const notificationsToDelete = count - 99; // Keep 99 + this new one = 100
        const oldestNotifications = await mongoose.models.Notification
          .find({ recipient: this.recipient })
          .sort({ createdAt: 1 }) // Oldest first
          .limit(notificationsToDelete)
          .select('_id');
        
        const idsToDelete = oldestNotifications.map(n => n._id);
        if (idsToDelete.length > 0) {
          await mongoose.models.Notification.deleteMany({ 
            _id: { $in: idsToDelete } 
          });
        }
      }
    } catch (error) {
      // If cleanup fails, still save the notification
      console.error('Error in notification cleanup:', error);
    }
  }
  
  next();
});

// Virtual for formatted time ago
notificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const created = new Date(this.createdAt);
  const diffInSeconds = Math.floor((now - created) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return created.toLocaleDateString();
});

// Static method to get unread count for a user
notificationSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({ 
    recipient: userId, 
    status: 'unread' 
  });
};

// Static method to mark all as read for a user
notificationSchema.statics.markAllAsRead = async function(userId) {
  return await this.updateMany(
    { recipient: userId, status: 'unread' },
    { status: 'read' }
  );
};

// Static method to cleanup old notifications (for cron job)
notificationSchema.statics.cleanupOldNotifications = async function() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return await this.deleteMany({
    createdAt: { $lt: thirtyDaysAgo }
  });
};

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;