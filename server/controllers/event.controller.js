// backend/controllers/event.controller.js
import Event from '../models/event.model.js';
import User from '../models/user.model.js';
import { errorHandler } from '../utils/error.js';
import NotificationService from '../services/notificationService.js';

// Helper function to get user IDs by roles
const getUserIdsByRoles = async (roles) => {
  const users = await User.find({ 
    role: { $in: roles }, 
    isActive: true 
  }).select('_id');
  return users.map(user => user._id);
};

// Helper function to get target audience IDs
const getTargetAudienceIds = async (forRoles) => {
  if (forRoles.includes('all')) {
    // Get all active users
    const users = await User.find({ isActive: true }).select('_id');
    return users.map(user => user._id);
  }
  
  // Map event roles to user roles
  const roleMapping = {
    'students': 'student',
    'instructors': 'instructor',
    'staff': ['admin', 'receptionist', 'instructor'] // Staff roles
  };
  
  const userRoles = [];
  forRoles.forEach(role => {
    if (roleMapping[role]) {
      if (Array.isArray(roleMapping[role])) {
        userRoles.push(...roleMapping[role]);
      } else {
        userRoles.push(roleMapping[role]);
      }
    }
  });
  
  if (userRoles.length === 0) return [];
  
  const users = await User.find({ 
    role: { $in: userRoles }, 
    isActive: true 
  }).select('_id');
  
  return users.map(user => user._id);
};

// @desc    Get all events with filters
// @route   GET /api/events
export const getEvents = async (req, res, next) => {
  try {
    const { 
      eventType, 
      upcoming, 
      start, 
      end,
      page = 1, 
      limit = 20 
    } = req.query;
    
    const query = {};
    
    if (eventType) {
      query.eventType = eventType;
    }
    
    if (start && end) {
      query.startDate = { $gte: new Date(start), $lte: new Date(end) };
    } else if (upcoming === 'true') {
      query.endDate = { $gte: new Date() };
    }
    
    const events = await Event.find(query)
      .populate('createdBy', 'name email')
      .sort({ startDate: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Event.countDocuments(query);
    
    res.json({
      success: true,
      data: events,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        results: total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Get single event
// @route   GET /api/events/:id
export const getEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'name email');
    
    if (!event) {
      return next(errorHandler(404, 'Event not found'));
    }
    
    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Get upcoming events
// @route   GET /api/events/upcoming
export const getUpcomingEvents = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const events = await Event.find({
      endDate: { $gte: today }
    })
      .populate('createdBy', 'name email')
      .sort({ startDate: 1 })
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      data: events,
      count: events.length
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Get events by date range
// @route   GET /api/events/range/:start/:end
export const getEventsByDateRange = async (req, res, next) => {
  try {
    const { start, end } = req.params;
    
    const events = await Event.find({
      startDate: { $lte: new Date(end) },
      endDate: { $gte: new Date(start) }
    }).populate('createdBy', 'name email').sort({ startDate: 1 });
    
    res.json({
      success: true,
      data: events,
      count: events.length
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Create new event with notifications
// @route   POST /api/events
export const createEvent = async (req, res, next) => {
  try {
    // Only admin can create events
    if (req.user.role !== 'admin') {
      return next(errorHandler(403, 'Only admin can create events'));
    }
    
    const eventData = {
      ...req.body,
      createdBy: req.user._id
    };
    
    const event = await Event.create(eventData);
    
    const populatedEvent = await Event.findById(event._id)
      .populate('createdBy', 'name email');
    
    // ============= NOTIFICATIONS =============
    
    try {
      const startDate = new Date(event.startDate).toLocaleDateString();
      const endDate = new Date(event.endDate).toLocaleDateString();
      const dateRange = startDate === endDate ? startDate : `${startDate} - ${endDate}`;
      
      // 1. Notify all admins
      await NotificationService.createForRole('admin', {
        title: '📅 New Event Created',
        message: `${req.user.name} created a new event: "${event.title}" on ${dateRange}. Type: ${event.eventType}`,
        type: 'system',
        actionUrl: `/events/${event._id}`
      });
      
      // 2. Notify target audience
      const targetUserIds = await getTargetAudienceIds(event.forRoles);
      if (targetUserIds.length > 0) {
        let impactMessage = '';
        if (event.noClasses && event.officesClosed) {
          impactMessage = ' No classes and offices will be closed.';
        } else if (event.noClasses) {
          impactMessage = ' No classes will be held.';
        } else if (event.officesClosed) {
          impactMessage = ' Administrative offices will be closed.';
        }
        
        await NotificationService.createForMultiple(targetUserIds, {
          title: `📢 ${event.eventType === 'holiday' ? 'Holiday' : 'Event'} Announcement`,
          message: `${event.eventType === 'holiday' ? 'Holiday' : 'Event'}: "${event.title}" on ${dateRange}.${impactMessage} ${event.location ? `Location: ${event.location}` : ''}`,
          type: 'event',
          actionUrl: `/events/${event._id}`
        });
      }
      
      // 3. Special notification for important events (no classes or offices closed)
      if (event.noClasses || event.officesClosed) {
        await NotificationService.createForRole('admin', {
          title: '⚠️ Important Schedule Change',
          message: `Event "${event.title}" will affect institute operations.${event.noClasses ? ' No classes.' : ''}${event.officesClosed ? ' Offices closed.' : ''}`,
          type: 'alert',
          actionUrl: `/events/${event._id}`
        });
      }
      
    } catch (notificationError) {
      console.error('Failed to send event notifications:', notificationError);
    }
    
    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: populatedEvent
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return next(errorHandler(400, errors.join(', ')));
    }
    next(errorHandler(500, error.message));
  }
};

// @desc    Update event with notifications
// @route   PUT /api/events/:id
export const updateEvent = async (req, res, next) => {
  try {
    // Only admin can update events
    if (req.user.role !== 'admin') {
      return next(errorHandler(403, 'Only admin can update events'));
    }
    
    const existingEvent = await Event.findById(req.params.id);
    
    if (!existingEvent) {
      return next(errorHandler(404, 'Event not found'));
    }
    
    // Track changes for notification
    const changes = [];
    if (req.body.title && req.body.title !== existingEvent.title) {
      changes.push(`title changed to "${req.body.title}"`);
    }
    if (req.body.startDate && new Date(req.body.startDate).toDateString() !== new Date(existingEvent.startDate).toDateString()) {
      changes.push('start date changed');
    }
    if (req.body.endDate && new Date(req.body.endDate).toDateString() !== new Date(existingEvent.endDate).toDateString()) {
      changes.push('end date changed');
    }
    if (req.body.eventType && req.body.eventType !== existingEvent.eventType) {
      changes.push(`type changed to ${req.body.eventType}`);
    }
    if (req.body.location && req.body.location !== existingEvent.location) {
      changes.push('location changed');
    }
    
    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');
    
    // ============= NOTIFICATIONS =============
    
    if (changes.length > 0) {
      try {
        const startDate = new Date(updatedEvent.startDate).toLocaleDateString();
        
        // 1. Notify all admins
        await NotificationService.createForRole('admin', {
          title: '📝 Event Updated',
          message: `Event "${updatedEvent.title}" was updated by ${req.user.name}. Changes: ${changes.join(', ')}`,
          type: 'system',
          actionUrl: `/events/${updatedEvent._id}`
        });
        
        // 2. Notify creator (if different from updater)
        if (existingEvent.createdBy && existingEvent.createdBy.toString() !== req.user._id.toString()) {
          await NotificationService.createNotification({
            recipientId: existingEvent.createdBy,
            title: '📝 Your Event Has Been Updated',
            message: `Admin ${req.user.name} updated your event "${updatedEvent.title}" scheduled for ${startDate}. Changes: ${changes.join(', ')}`,
            type: 'event',
            actionUrl: `/events/${updatedEvent._id}`
          });
        }
        
        // 3. Notify target audience about important changes
        const significantChanges = changes.some(c => c.includes('date') || c.includes('cancelled') || c.includes('location'));
        if (significantChanges) {
          const targetUserIds = await getTargetAudienceIds(updatedEvent.forRoles);
          if (targetUserIds.length > 0) {
            await NotificationService.createForMultiple(targetUserIds, {
              title: '⚠️ Event Update',
              message: `Important update for event "${updatedEvent.title}" on ${startDate}. Please check the event details.`,
              type: 'event',
              actionUrl: `/events/${updatedEvent._id}`
            });
          }
        }
        
      } catch (notificationError) {
        console.error('Failed to send update notifications:', notificationError);
      }
    }
    
    res.json({
      success: true,
      message: 'Event updated successfully',
      data: updatedEvent
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return next(errorHandler(400, errors.join(', ')));
    }
    next(errorHandler(500, error.message));
  }
};

// @desc    Delete event with notifications
// @route   DELETE /api/events/:id
export const deleteEvent = async (req, res, next) => {
  try {
    // Only admin can delete events
    if (req.user.role !== 'admin') {
      return next(errorHandler(403, 'Only admin can delete events'));
    }
    
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return next(errorHandler(404, 'Event not found'));
    }
    
    const eventTitle = event.title;
    const eventDate = new Date(event.startDate).toLocaleDateString();
    const eventType = event.eventType;
    const targetAudience = event.forRoles;
    
    await event.deleteOne();
    
    // ============= NOTIFICATIONS =============
    
    try {
      // 1. Notify all admins
      await NotificationService.createForRole('admin', {
        title: '🗑️ Event Deleted',
        message: `Event "${eventTitle}" scheduled for ${eventDate} was deleted by ${req.user.name}.`,
        type: 'system',
        actionUrl: '/events'
      });
      
      // 2. Notify target audience about cancellation
      const targetUserIds = await getTargetAudienceIds(targetAudience);
      if (targetUserIds.length > 0) {
        let cancellationReason = '';
        if (eventType === 'holiday') {
          cancellationReason = 'This holiday has been cancelled.';
        } else if (eventType === 'academic') {
          cancellationReason = 'This academic event has been cancelled. Please check for rescheduling.';
        } else {
          cancellationReason = 'This event has been cancelled.';
        }
        
        await NotificationService.createForMultiple(targetUserIds, {
          title: '❌ Event Cancelled',
          message: `"${eventTitle}" scheduled for ${eventDate} has been cancelled. ${cancellationReason}`,
          type: 'alert',
          actionUrl: '/events'
        });
      }
      
      // 3. Special notification if it was a no-classes event
      if (event.noClasses || event.officesClosed) {
        await NotificationService.createForRole('admin', {
          title: '📅 Schedule Change',
          message: `Previously scheduled ${eventType === 'holiday' ? 'holiday' : 'closure'} "${eventTitle}" on ${eventDate} has been cancelled. Regular schedule resumes.`,
          type: 'alert',
          actionUrl: '/events'
        });
      }
      
    } catch (notificationError) {
      console.error('Failed to send deletion notifications:', notificationError);
    }
    
    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Get event statistics
// @route   GET /api/events/stats
export const getEventStats = async (req, res, next) => {
  try {
    const total = await Event.countDocuments();
    const upcoming = await Event.countDocuments({ endDate: { $gte: new Date() } });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEvents = await Event.countDocuments({
      startDate: { $lte: today },
      endDate: { $gte: today }
    });
    
    const byType = await Event.aggregate([
      { $group: { _id: '$eventType', count: { $sum: 1 } } }
    ]);
    
    res.json({
      success: true,
      data: {
        total,
        upcoming,
        todayEvents,
        byType
      }
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Send event reminder (manual or scheduled)
// @route   POST /api/events/:id/remind
export const sendEventReminder = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return next(errorHandler(403, 'Only admin can send reminders'));
    }
    
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return next(errorHandler(404, 'Event not found'));
    }
    
    const targetUserIds = await getTargetAudienceIds(event.forRoles);
    const startDate = new Date(event.startDate).toLocaleDateString();
    const startTime = event.startTime ? ` at ${event.startTime}` : '';
    
    await NotificationService.createForMultiple(targetUserIds, {
      title: `🔔 Reminder: ${event.title}`,
      message: `This is a reminder that "${event.title}" is scheduled for ${startDate}${startTime}. ${event.location ? `Location: ${event.location}` : ''}`,
      type: 'event',
      actionUrl: `/events/${event._id}`
    });
    
    res.json({
      success: true,
      message: `Reminder sent to ${targetUserIds.length} users`
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};