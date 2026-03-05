// controllers/requestController.js - WITH NOTIFICATION INTEGRATION
import Request from '../models/request.model.js';
import User from '../models/user.model.js';
import { errorHandler } from '../utils/error.js';
import NotificationService from '../services/notificationService.js'; // ADD THIS IMPORT

// @desc    Create new visitor request (receptionist only)
// @route   POST /api/requests
export const createRequest = async (req, res, next) => {
  try {
    // Only receptionists can create requests
    if (req.user.role !== 'receptionist' && req.user.role !== 'admin') {
      return next(errorHandler(403, 'Only receptionists can create visitor requests'));
    }

    const requestData = {
      ...req.body,
      receptionist: req.user._id // Auto-assign logged-in receptionist
    };

    const request = await Request.create(requestData);

    // NOTIFICATION: New request created - Notify admins
    NotificationService.createForRole('admin', {
      title: 'New Visitor Request',
      message: `New visitor request from ${request.visitorName || 'a visitor'} (${request.purpose || 'General'})`,
      type: 'request',
      actionUrl: `/requests/${request._id}`
    }).catch(err => console.error('Notification error:', err)); // Optional error handling

    res.status(201).json({
      success: true,
      data: request
    });
  } catch (error) {
    next(errorHandler(400, error.message));
  }
};

// @desc    Get all requests (admin sees all, receptionist sees their own)
// @route   GET /api/requests
export const getAllRequests = async (req, res, next) => {
  try {
    const { status, department, priority, startDate, endDate, assignedTo } = req.query;
    
    let filter = {};
    
    // Filter by status
    if (status) filter.status = status;
    
    // Filter by department
    if (department) filter.department = department;
    
    // Filter by priority
    if (priority) filter.priority = priority;
    
    // Filter by assigned staff
    if (assignedTo) filter.assignedTo = assignedTo;
    
    // Filter by date range
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    
    // If user is receptionist (not admin), only show their requests
    if (req.user.role === 'receptionist') {
      filter.receptionist = req.user._id;
    }
    
    const requests = await Request.find(filter)
      .populate('receptionist', 'name email')
      .populate('assignedTo', 'name email role')
      .sort('-createdAt')
      .lean();

    res.json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Get single request
// @route   GET /api/requests/:id
export const getRequest = async (req, res, next) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate('receptionist', 'name email')
      .populate('assignedTo', 'name email role')
      .populate('notes.addedBy', 'name role');

    if (!request) {
      return next(errorHandler(404, 'Request not found'));
    }

    // Check permissions using your auth logic
    const userId = req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    const isReceptionistOwner = request.receptionist._id.toString() === userId;
    const isAssignedStaff = request.assignedTo && request.assignedTo._id.toString() === userId;
    
    if (!isAdmin && !isReceptionistOwner && !isAssignedStaff) {
      return next(errorHandler(403, 'Not authorized to view this request'));
    }

    res.json({
      success: true,
      data: request
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Update request status/assignment (admin/receptionist/assigned staff)
// @route   PUT /api/requests/:id
export const updateRequest = async (req, res, next) => {
  try {
    const request = await Request.findById(req.params.id);

    if (!request) {
      return next(errorHandler(404, 'Request not found'));
    }

    // Check permissions
    const userId = req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    const isReceptionistOwner = request.receptionist.toString() === userId;
    const isAssignedStaff = request.assignedTo && request.assignedTo.toString() === userId;
    
    if (!isAdmin && !isReceptionistOwner && !isAssignedStaff) {
      return next(errorHandler(403, 'Not authorized to update this request'));
    }

    // Track if status changed
    const oldStatus = request.status;
    let newStatus = oldStatus;

    // Define what each role can update
    const updatableFields = [];
    
    if (isAdmin) {
      // Admin can update everything
      updatableFields.push('status', 'priority', 'department', 'assignedTo', 'notes', 
                          'description', 'scheduledDate', 'resolvedDate', 'visitorName',
                          'visitorEmail', 'visitorPhone', 'purpose');
    } else if (isReceptionistOwner) {
      // Receptionist can update basic info for their own requests
      updatableFields.push('description', 'priority', 'department', 'notes');
    } else if (isAssignedStaff) {
      // Assigned staff can update status and add notes
      updatableFields.push('status', 'notes');
    }
    
    // Apply updates
    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        // Handle notes array specially
        if (field === 'notes' && Array.isArray(req.body.notes)) {
          request.notes = req.body.notes;
        } 
        // Handle single note addition
        else if (field === 'notes' && typeof req.body.notes === 'object') {
          request.notes.push({
            ...req.body.notes,
            addedBy: req.user._id
          });
        }
        else {
          request[field] = req.body[field];
        }
        
        // Track status change
        if (field === 'status') {
          newStatus = req.body[field];
        }
      }
    });

    // If status changed to completed, set resolved date
    if (req.body.status === 'completed' && !request.resolvedDate) {
      request.resolvedDate = new Date();
    }

    await request.save();

    // Populate before sending response
    const populatedRequest = await Request.findById(request._id)
      .populate('receptionist', 'name email')
      .populate('assignedTo', 'name email role')
      .populate('notes.addedBy', 'name role');

    // NOTIFICATION: Status changed - Notify relevant parties
    if (newStatus !== oldStatus) {
      // Determine recipients (excluding the updater)
      const recipientIds = [];
      
      if (populatedRequest.receptionist && populatedRequest.receptionist._id) {
        recipientIds.push(populatedRequest.receptionist._id);
      }
      
      if (populatedRequest.assignedTo && populatedRequest.assignedTo._id) {
        recipientIds.push(populatedRequest.assignedTo._id);
      }
      
      // Remove updater from recipients
      const filteredRecipients = recipientIds.filter(
        id => id.toString() !== req.user._id.toString()
      );
      
      if (filteredRecipients.length > 0) {
        NotificationService.createForMultiple(
          filteredRecipients.map(r => r._id),
          {
            title: 'Request Status Updated',
            message: `Request #${populatedRequest._id} status changed from ${oldStatus} to ${newStatus}`,
            type: 'request',
            actionUrl: `/requests/${populatedRequest._id}`
          }
        ).catch(err => console.error('Notification error:', err));
      }
      
      // NOTIFICATION: Request completed - Notify admins and creator
      if (newStatus === 'completed') {
        const completedRecipients = [];
        
        if (populatedRequest.receptionist && populatedRequest.receptionist._id) {
          completedRecipients.push(populatedRequest.receptionist._id);
        }
        
        // Get admin IDs (excluding updater if admin)
        const admins = await User.find({ role: 'admin', isActive: true }).select('_id');
        admins.forEach(admin => {
          if (admin._id.toString() !== req.user._id.toString()) {
            completedRecipients.push(admin._id);
          }
        });
        
        if (completedRecipients.length > 0) {
          NotificationService.createForMultiple(
            completedRecipients,
            {
              title: 'Request Completed',
              message: `Visitor request from ${populatedRequest.visitorName || 'a visitor'} has been completed`,
              type: 'request',
              actionUrl: `/requests/${populatedRequest._id}`
            }
          ).catch(err => console.error('Notification error:', err));
        }
      }
    }

    res.json({
      success: true,
      data: populatedRequest
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Delete request (admin only)
// @route   DELETE /api/requests/:id
export const deleteRequest = async (req, res, next) => {
  try {
    // Only admin can delete requests
    if (req.user.role !== 'admin') {
      return next(errorHandler(403, 'Only admin can delete requests'));
    }

    const request = await Request.findById(req.params.id);
    
    if (!request) {
      return next(errorHandler(404, 'Request not found'));
    }

    await request.deleteOne();

    res.json({
      success: true,
      message: 'Request deleted successfully'
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Add note to request
// @route   POST /api/requests/:id/notes
export const addNote = async (req, res, next) => {
  try {
    const { content } = req.body;
    
    if (!content || content.trim() === '') {
      return next(errorHandler(400, 'Note content is required'));
    }

    const request = await Request.findById(req.params.id);
    
    if (!request) {
      return next(errorHandler(404, 'Request not found'));
    }

    // Check permissions
    const userId = req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    const isReceptionistOwner = request.receptionist.toString() === userId;
    const isAssignedStaff = request.assignedTo && request.assignedTo.toString() === userId;
    
    if (!isAdmin && !isReceptionistOwner && !isAssignedStaff) {
      return next(errorHandler(403, 'Not authorized to add notes'));
    }

    request.notes.push({
      content: content.trim(),
      addedBy: req.user._id
    });

    await request.save();

    // Populate the new note
    const populatedRequest = await Request.findById(request._id)
      .populate('receptionist', 'name email')
      .populate('assignedTo', 'name email role')
      .populate('notes.addedBy', 'name role');

    const newNote = populatedRequest.notes[populatedRequest.notes.length - 1];

    // NOTIFICATION: Note added - Notify all other involved parties
    const recipientIds = [];
    
    // Receptionist (creator)
    if (populatedRequest.receptionist && populatedRequest.receptionist._id) {
      recipientIds.push(populatedRequest.receptionist._id);
    }
    
    // Assigned staff
    if (populatedRequest.assignedTo && populatedRequest.assignedTo._id) {
      recipientIds.push(populatedRequest.assignedTo._id);
    }
    
    // Get admins
    const admins = await User.find({ role: 'admin', isActive: true }).select('_id');
    admins.forEach(admin => recipientIds.push(admin._id));
    
    // Remove note author from recipients
    const filteredRecipients = recipientIds.filter(
      id => id.toString() !== req.user._id.toString()
    );
    
    // Remove duplicates
    const uniqueRecipients = [...new Set(filteredRecipients.map(id => id.toString()))]
      .map(id => filteredRecipients.find(r => r.toString() === id));
    
    if (uniqueRecipients.length > 0) {
      const truncatedNote = content.trim().length > 50 
        ? content.trim().substring(0, 47) + '...' 
        : content.trim();
      
      NotificationService.createForMultiple(
        uniqueRecipients.map(r => r._id ? r._id : r),
        {
          title: 'New Note on Request',
          message: `${req.user.name || 'Someone'} added a note: "${truncatedNote}"`,
          type: 'request',
          actionUrl: `/requests/${populatedRequest._id}`
        }
      ).catch(err => console.error('Notification error:', err));
    }

    res.json({
      success: true,
      data: newNote
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Get request statistics
// @route   GET /api/requests/stats
export const getRequestStats = async (req, res, next) => {
  try {
    let filter = {};
    
    // If receptionist (not admin), only show their stats
    if (req.user.role === 'receptionist') {
      filter.receptionist = req.user._id;
    }

    const stats = await Request.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const total = await Request.countDocuments(filter);
    
    // Today's requests
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayRequests = await Request.countDocuments({
      ...filter,
      createdAt: { $gte: today }
    });

    // Pending requests count
    const pendingRequests = stats.find(stat => stat._id === 'pending')?.count || 0;

    res.json({
      success: true,
      data: {
        stats,
        total,
        today: todayRequests,
        pending: pendingRequests
      }
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Get staff members for assignment (admin only)
// @route   GET /api/requests/staff
export const getStaffMembers = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return next(errorHandler(403, 'Only admin can view staff list'));
    }

    const staff = await User.find({
      role: { $in: ['admin', 'teacher', 'receptionist'] },
      isActive: true
    }).select('name email role');

    res.json({
      success: true,
      data: staff
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Assign request to staff member (admin only)
// @route   POST /api/requests/:id/assign
export const assignRequest = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return next(errorHandler(403, 'Only admin can assign requests'));
    }

    const { assignedTo } = req.body;
    
    if (!assignedTo) {
      return next(errorHandler(400, 'Staff member ID is required'));
    }

    const request = await Request.findById(req.params.id);
    
    if (!request) {
      return next(errorHandler(404, 'Request not found'));
    }

    // Verify staff member exists
    const staffMember = await User.findById(assignedTo);
    if (!staffMember) {
      return next(errorHandler(404, 'Staff member not found'));
    }

    const oldAssignedTo = request.assignedTo;
    request.assignedTo = assignedTo;
    request.status = 'in-progress';
    
    // Add note about assignment
    request.notes.push({
      content: `Assigned to ${staffMember.name} (${staffMember.role})`,
      addedBy: req.user._id
    });

    await request.save();

    const populatedRequest = await Request.findById(request._id)
      .populate('receptionist', 'name email')
      .populate('assignedTo', 'name email role')
      .populate('notes.addedBy', 'name role');

    // NOTIFICATION: Request assigned - Notify the assigned staff
    if (oldAssignedTo?.toString() !== assignedTo.toString()) {
      NotificationService.createNotification({
        recipientId: assignedTo,
        title: 'Request Assigned to You',
        message: `You have been assigned to handle visitor request from ${populatedRequest.visitorName || 'a visitor'} by ${req.user.name || 'Admin'}`,
        type: 'request',
        actionUrl: `/requests/${populatedRequest._id}`
      }).catch(err => console.error('Notification error:', err));
    }

    res.json({
      success: true,
      data: populatedRequest
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// controllers/requestController.js - ADD THIS FUNCTION AT THE BOTTOM (BEFORE EXPORTS)
// @desc    Get today's request count for current user
// @route   GET /api/requests/today-count
// @access  Private
export const getTodayRequestCount = async (req, res, next) => {
  try {
    // Get today's date at midnight (00:00:00)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get tomorrow's date at midnight
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Base filter for today's requests
    let filter = {
      createdAt: {
        $gte: today,
        $lt: tomorrow
      }
    };
    
    // Role-specific filtering
    if (req.user.role === 'receptionist') {
      // Receptionist: Only count requests they created
      filter.receptionist = req.user._id;
    } else if (req.user.role === 'admin') {
      // Admin: Count all requests (no additional filter needed)
    } else {
      // Other roles (teacher, student, parent): No access to requests
      return res.json({
        success: true,
        data: { count: 0 }
      });
    }
    
    const count = await Request.countDocuments(filter);
    
    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// Export all functions
// export {
//   createRequest,
//   getAllRequests,
//   getRequest,
//   updateRequest,
//   deleteRequest,
//   addNote,
//   getRequestStats,
//   getStaffMembers,
//   assignRequest
// };