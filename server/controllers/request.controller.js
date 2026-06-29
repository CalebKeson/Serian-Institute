// controllers/request.controller.js - COMPLETE UPDATED VERSION

import Request from '../models/request.model.js';
import User from '../models/user.model.js';
import Analytics from '../models/analytics.model.js';
import { errorHandler } from '../utils/error.js';
import NotificationService from '../services/notificationService.js';

// ============ EXISTING FUNCTIONS (Unchanged) ============

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
    }).catch(err => console.error('Notification error:', err));

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
    const { status, department, priority, startDate, endDate, assignedTo, type } = req.query;
    
    let filter = {};
    
    // Filter by status
    if (status) filter.status = status;
    
    // Filter by department
    if (department) filter.department = department;
    
    // Filter by priority
    if (priority) filter.priority = priority;
    
    // Filter by assigned staff
    if (assignedTo) filter.assignedTo = assignedTo;
    
    // Filter by type (online vs physical)
    if (type === 'online') filter.isOnlineEnquiry = true;
    else if (type === 'physical') filter.isOnlineEnquiry = { $ne: true };
    
    // Filter by date range
    if (startDate || endDate) {
      const dateField = filter.isOnlineEnquiry ? 'submittedAt' : 'createdAt';
      filter[dateField] = {};
      if (startDate) filter[dateField].$gte = new Date(startDate);
      if (endDate) filter[dateField].$lte = new Date(endDate);
    }
    
    // If user is receptionist (not admin), only show their requests
    if (req.user.role === 'receptionist') {
      filter.receptionist = req.user._id;
    }
    
    const requests = await Request.find(filter)
      .populate('receptionist', 'name email')
      .populate('assignedTo', 'name email role')
      .populate('courseOfInterest', 'courseCode name')
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
      .populate('notes.addedBy', 'name role')
      .populate('courseOfInterest', 'courseCode name');

    if (!request) {
      return next(errorHandler(404, 'Request not found'));
    }

    // Check permissions
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

// @desc    Update request status/assignment
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
      updatableFields.push('status', 'priority', 'department', 'assignedTo', 'notes', 
                          'description', 'scheduledDate', 'resolvedDate', 'visitorName',
                          'visitorEmail', 'visitorPhone', 'purpose');
    } else if (isReceptionistOwner) {
      updatableFields.push('description', 'priority', 'department', 'notes');
    } else if (isAssignedStaff) {
      updatableFields.push('status', 'notes');
    }
    
    // Apply updates
    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'notes' && Array.isArray(req.body.notes)) {
          request.notes = req.body.notes;
        } else if (field === 'notes' && typeof req.body.notes === 'object') {
          request.notes.push({
            ...req.body.notes,
            addedBy: req.user._id
          });
        } else {
          request[field] = req.body[field];
        }
        
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
      .populate('notes.addedBy', 'name role')
      .populate('courseOfInterest', 'courseCode name');

    // NOTIFICATION: Status changed
    if (newStatus !== oldStatus) {
      const recipientIds = [];
      
      if (populatedRequest.receptionist && populatedRequest.receptionist._id) {
        recipientIds.push(populatedRequest.receptionist._id);
      }
      
      if (populatedRequest.assignedTo && populatedRequest.assignedTo._id) {
        recipientIds.push(populatedRequest.assignedTo._id);
      }
      
      const filteredRecipients = recipientIds.filter(
        id => id.toString() !== req.user._id.toString()
      );
      
      if (filteredRecipients.length > 0) {
        NotificationService.createForMultiple(
          filteredRecipients.map(r => r._id ? r._id : r),
          {
            title: 'Request Status Updated',
            message: `Request #${populatedRequest._id} status changed from ${oldStatus} to ${newStatus}`,
            type: 'request',
            actionUrl: `/requests/${populatedRequest._id}`
          }
        ).catch(err => console.error('Notification error:', err));
      }
      
      if (newStatus === 'completed') {
        const completedRecipients = [];
        
        if (populatedRequest.receptionist && populatedRequest.receptionist._id) {
          completedRecipients.push(populatedRequest.receptionist._id);
        }
        
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

    const populatedRequest = await Request.findById(request._id)
      .populate('receptionist', 'name email')
      .populate('assignedTo', 'name email role')
      .populate('notes.addedBy', 'name role')
      .populate('courseOfInterest', 'courseCode name');

    const newNote = populatedRequest.notes[populatedRequest.notes.length - 1];

    const recipientIds = [];
    
    if (populatedRequest.receptionist && populatedRequest.receptionist._id) {
      recipientIds.push(populatedRequest.receptionist._id);
    }
    
    if (populatedRequest.assignedTo && populatedRequest.assignedTo._id) {
      recipientIds.push(populatedRequest.assignedTo._id);
    }
    
    const admins = await User.find({ role: 'admin', isActive: true }).select('_id');
    admins.forEach(admin => recipientIds.push(admin._id));
    
    const filteredRecipients = recipientIds.filter(
      id => id.toString() !== req.user._id.toString()
    );
    
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
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayRequests = await Request.countDocuments({
      ...filter,
      createdAt: { $gte: today }
    });

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
      role: { $in: ['admin', 'instructor', 'receptionist'] },
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

    const staffMember = await User.findById(assignedTo);
    if (!staffMember) {
      return next(errorHandler(404, 'Staff member not found'));
    }

    const oldAssignedTo = request.assignedTo;
    request.assignedTo = assignedTo;
    request.status = 'in-progress';
    
    request.notes.push({
      content: `Assigned to ${staffMember.name} (${staffMember.role})`,
      addedBy: req.user._id
    });

    await request.save();

    const populatedRequest = await Request.findById(request._id)
      .populate('receptionist', 'name email')
      .populate('assignedTo', 'name email role')
      .populate('notes.addedBy', 'name role')
      .populate('courseOfInterest', 'courseCode name');

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

// @desc    Get today's request count for current user
// @route   GET /api/requests/today-count
export const getTodayRequestCount = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    let filter = {
      createdAt: {
        $gte: today,
        $lt: tomorrow
      }
    };
    
    if (req.user.role === 'receptionist') {
      filter.receptionist = req.user._id;
    } else if (req.user.role === 'admin') {
      // Admin sees all
    } else {
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

// ============ NEW: ONLINE ENQUIRY SUBMISSION (Public) ============

// @desc    Submit online enquiry (public - no authentication)
// @route   POST /api/requests/enquiry
// @access  Public
export const submitEnquiry = async (req, res, next) => {
  try {
    const {
      // Personal Information
      visitorName,
      visitorEmail,
      visitorPhone,
      
      // Enquiry Details
      enquiryType,
      message,
      courseOfInterest,
      courseOfInterestNames,
      preferredContactMethod,
      bestTimeToContact,
      
      // Source Tracking (captured from frontend)
      source,
      sourceOther,
      sourceUrl,
      referrer,
      utmSource,
      utmMedium,
      utmCampaign,
      utmTerm,
      utmContent,
      
      // Device Info
      visitorId,
      sessionId,
      device,
      browser,
      os,
      ipAddress
    } = req.body;

    // ============ VALIDATION ============
    if (!visitorName || visitorName.trim() === '') {
      return next(errorHandler(400, 'Full name is required'));
    }

    if (!visitorEmail || !visitorEmail.match(/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/)) {
      return next(errorHandler(400, 'Valid email address is required'));
    }

    if (!visitorPhone || visitorPhone.trim() === '') {
      return next(errorHandler(400, 'Phone number is required'));
    }

    if (!message || message.trim() === '') {
      return next(errorHandler(400, 'Message is required'));
    }

    // ============ FIND OR CREATE RECEPTIONIST ============
    // Find the first admin to assign as receptionist
    let receptionist = await User.findOne({ role: 'admin', isActive: true });
    
    if (!receptionist) {
      // Fallback: find any active user
      receptionist = await User.findOne({ isActive: true });
    }
    
    if (!receptionist) {
      return next(errorHandler(500, 'No receptionist available to handle enquiries'));
    }

    // ============ CREATE ENQUIRY ============
    const enquiryData = {
      // Personal Info
      visitorName: visitorName.trim(),
      visitorEmail: visitorEmail.toLowerCase().trim(),
      visitorPhone: visitorPhone.trim(),
      
      // Enquiry Details
      description: message.trim(),
      purpose: enquiryType === 'admission_inquiry' ? 'Admission Inquiry' : 
               enquiryType === 'fee_inquiry' ? 'Fee Payment' : 'Other',
      enquiryType: enquiryType || 'general_inquiry',
      message: message.trim(),
      courseOfInterest: courseOfInterest || [],
      courseOfInterestNames: courseOfInterestNames || [],
      preferredContactMethod: preferredContactMethod || 'email',
      bestTimeToContact: bestTimeToContact || 'anytime',
      
      // Metadata
      isOnlineEnquiry: true,
      status: 'pending',
      priority: 'medium',
      receptionist: receptionist._id,
      submittedAt: new Date(),
      
      // Source Tracking
      source: source || 'direct',
      sourceOther: source === 'other' ? sourceOther : undefined,
      sourceUrl: sourceUrl || null,
      referrer: referrer || req.headers.referer || null,
      utmSource: utmSource || null,
      utmMedium: utmMedium || null,
      utmCampaign: utmCampaign || null,
      utmTerm: utmTerm || null,
      utmContent: utmContent || null,
      
      // Device Info
      ipAddress: ipAddress || req.ip || req.headers['x-forwarded-for'] || null,
      userAgent: req.headers['user-agent'] || null,
    };

    const enquiry = await Request.create(enquiryData);

    // ============ UPDATE ANALYTICS ============
    // Mark analytics records as converted
    if (visitorId) {
      await Analytics.updateMany(
        { visitorId: visitorId },
        { 
          $set: { 
            converted: true, 
            convertedAt: new Date(),
            requestId: enquiry._id
          } 
        }
      );
    }

    // ============ SEND NOTIFICATIONS ============
    // Notify all admins about the new enquiry
    const admins = await User.find({ role: 'admin', isActive: true }).select('_id');
    
    if (admins.length > 0) {
      const adminIds = admins.map(a => a._id);
      
      // Get source display name
      const sourceMap = {
        google: 'Google Search',
        facebook: 'Facebook',
        instagram: 'Instagram',
        linkedin: 'LinkedIn',
        tiktok: 'TikTok',
        twitter: 'Twitter/X',
        referral: 'Referral',
        direct: 'Direct Visit',
        advertisement: 'Advertisement',
        other: 'Other'
      };
      const sourceDisplay = sourceMap[source] || source || 'Unknown';
      
      NotificationService.createForMultiple(
        adminIds,
        {
          title: '📝 New Online Enquiry',
          message: `New enquiry from ${visitorName} (${visitorEmail}) via ${sourceDisplay}`,
          type: 'request',
          actionUrl: `/requests/${enquiry._id}`
        }
      ).catch(err => console.error('Notification error:', err));
    }

    // ============ RESPONSE ============
    const populatedEnquiry = await Request.findById(enquiry._id)
      .populate('courseOfInterest', 'courseCode name')
      .populate('receptionist', 'name email');

    res.status(201).json({
      success: true,
      message: 'Enquiry submitted successfully! We will contact you shortly.',
      data: {
        id: enquiry._id,
        visitorName: enquiry.visitorName,
        visitorEmail: enquiry.visitorEmail,
        visitorPhone: enquiry.visitorPhone,
        enquiryType: enquiry.enquiryTypeDisplay,
        submittedAt: enquiry.submittedAt,
        source: enquiry.sourceDisplay
      }
    });

  } catch (error) {
    console.error('Submit enquiry error:', error);
    next(errorHandler(500, error.message));
  }
};

// @desc    Convert online enquiry to physical visit request
// @route   POST /api/requests/:id/convert-to-visit
// @access  Private (Admin/Receptionist)
export const convertEnquiryToVisit = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check permissions
    if (req.user.role !== 'admin' && req.user.role !== 'receptionist') {
      return next(errorHandler(403, 'Not authorized to convert enquiries'));
    }

    const enquiry = await Request.findById(id);
    
    if (!enquiry) {
      return next(errorHandler(404, 'Enquiry not found'));
    }
    
    if (!enquiry.isOnlineEnquiry) {
      return next(errorHandler(400, 'This is not an online enquiry'));
    }
    
    if (enquiry.convertedToVisit) {
      return next(errorHandler(400, 'This enquiry has already been converted to a visit'));
    }

    // Mark as converted
    enquiry.convertedToVisit = true;
    enquiry.convertedAt = new Date();
    enquiry.status = 'in-progress';
    await enquiry.save();

    // Get the populated enquiry
    const populatedEnquiry = await Request.findById(id)
      .populate('receptionist', 'name email')
      .populate('assignedTo', 'name email role')
      .populate('courseOfInterest', 'courseCode name');

    res.json({
      success: true,
      message: 'Enquiry converted to visit successfully',
      data: populatedEnquiry
    });

  } catch (error) {
    console.error('Convert enquiry error:', error);
    next(errorHandler(500, error.message));
  }
};