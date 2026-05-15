// backend/controllers/instructor.controller.js
import Instructor from '../models/instructor.model.js';
import User from '../models/user.model.js';
import Course from '../models/course.model.js';
import { errorHandler } from '../utils/error.js';
import mongoose from 'mongoose';
import NotificationService from '../services/notificationService.js';

// @desc    Get all instructors with pagination and search
// @route   GET /api/instructors
export const getInstructors = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', department = '', status = '' } = req.query;
    
    const query = {};
    
    if (search) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      
      const userIds = users.map(user => user._id);
      
      query.$or = [
        { employeeId: { $regex: search, $options: 'i' } },
        { user: { $in: userIds } },
        { department: { $regex: search, $options: 'i' } },
        { specialization: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (department) query.department = department;
    if (status) query.status = status;
    
    const instructors = await Instructor.find(query)
      .populate('user', 'name email role isActive')
      .populate('supervisor', 'name email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    
    const total = await Instructor.countDocuments(query);
    
    res.json({
      success: true,
      data: instructors,
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

// @desc    Get single instructor with details
// @route   GET /api/instructors/:id
export const getInstructor = async (req, res, next) => {
  try {
    const instructor = await Instructor.findById(req.params.id)
      .populate('user', 'name email role isActive')
      .populate('supervisor', 'name email role');
    
    if (!instructor) {
      return next(errorHandler(404, 'Instructor not found'));
    }
    
    // Get assigned courses
    const courses = await Course.find({ 
      instructor: instructor.user._id,
      status: 'active'
    }).select('courseCode name status');
    
    const instructorWithCourses = instructor.toObject();
    instructorWithCourses.assignedCourses = courses;
    instructorWithCourses.currentWorkload = courses.length;
    
    res.json({
      success: true,
      data: instructorWithCourses
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Create new instructor
// @route   POST /api/instructors
export const createInstructor = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { name, email, password, ...instructorData } = req.body;
    
    // Validate required fields
    if (!name || !email || !password) {
      await session.abortTransaction();
      session.endSession();
      return next(errorHandler(400, 'Name, email, and password are required'));
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email }).session(session);
    if (existingUser) {
      await session.abortTransaction();
      session.endSession();
      return next(errorHandler(400, 'User with this email already exists'));
    }
    
    // Create user first
    const [user] = await User.create([{
      name,
      email,
      password,
      role: 'instructor',
      isActive: true
    }], { session });
    
    // Parse dates if they're strings
    if (instructorData.dateOfBirth && typeof instructorData.dateOfBirth === 'string') {
      instructorData.dateOfBirth = new Date(instructorData.dateOfBirth);
    }
    if (instructorData.hireDate && typeof instructorData.hireDate === 'string') {
      instructorData.hireDate = new Date(instructorData.hireDate);
    }
    if (instructorData.instructorSince && typeof instructorData.instructorSince === 'string') {
      instructorData.instructorSince = new Date(instructorData.instructorSince);
    }
    
    // Create instructor profile
    const [instructor] = await Instructor.create([{
      user: user._id,
      ...instructorData,
    }], { session });
    
    await session.commitTransaction();
    session.endSession();
    
    // Populate and return
    const populatedInstructor = await Instructor.findById(instructor._id)
      .populate('user', 'name email role');
    
    // Send notifications
    try {
      // Notify all admins
      await NotificationService.createForRole('admin', {
        title: '👨‍🏫 New Instructor Joined',
        message: `${name} has been added as a new instructor. Department: ${instructorData.department || 'Not specified'}, Employee ID: ${populatedInstructor.employeeId}`,
        type: 'system',
        actionUrl: `/instructors/${populatedInstructor._id}`
      });
      
      // Welcome notification for the instructor
      const currentDate = new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      await NotificationService.createNotification({
        recipientId: user._id,
        title: '🎉 Welcome to the Team!',
        message: `Hello ${name}! Welcome to Serian Institute. Your instructor account has been successfully created on ${currentDate}. Your Employee ID is ${populatedInstructor.employeeId}. We're excited to have you on board! 🚀`,
        type: 'system',
        actionUrl: '/dashboard'
      });
    } catch (notificationError) {
      console.error('Failed to send notifications:', notificationError);
    }
    
    res.status(201).json({
      success: true,
      message: 'Instructor created successfully',
      data: populatedInstructor
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return next(errorHandler(400, errors.join(', ')));
    }
    
    console.error('Instructor creation error:', error);
    next(errorHandler(400, error.message));
  }
};

// @desc    Update instructor
// @route   PUT /api/instructors/:id
export const updateInstructor = async (req, res, next) => {
  try {
    const instructor = await Instructor.findById(req.params.id);
    if (!instructor) {
      return next(errorHandler(404, 'Instructor not found'));
    }
    
    const { name, email, ...instructorData } = req.body;
    
    const changes = [];
    
    // Update user if name or email changed
    if (name || email) {
      const userUpdate = {};
      if (name && name !== instructor.user?.name) {
        userUpdate.name = name;
        changes.push(`Name updated to: ${name}`);
      }
      if (email && email !== instructor.user?.email) {
        userUpdate.email = email;
        changes.push(`Email updated to: ${email}`);
      }
      
      if (Object.keys(userUpdate).length > 0) {
        await User.findByIdAndUpdate(instructor.user, userUpdate, { 
          new: true, 
          runValidators: true 
        });
      }
    }
    
    // Track professional changes
    if (instructorData.department && instructorData.department !== instructor.department) {
      changes.push(`Department changed to: ${instructorData.department}`);
    }
    if (instructorData.designation && instructorData.designation !== instructor.designation) {
      changes.push(`Designation changed to: ${instructorData.designation}`);
    }
    if (instructorData.specialization && instructorData.specialization !== instructor.specialization) {
      changes.push(`Specialization changed to: ${instructorData.specialization}`);
    }
    if (instructorData.status && instructorData.status !== instructor.status) {
      changes.push(`Status changed from ${instructor.status} to ${instructorData.status}`);
    }
    if (instructorData.salary && instructorData.salary !== instructor.salary) {
      changes.push(`Salary updated from ${instructor.salary} to ${instructorData.salary}`);
    }
    
    // Update instructor
    const updatedInstructor = await Instructor.findByIdAndUpdate(
      req.params.id,
      instructorData,
      { new: true, runValidators: true }
    ).populate('user', 'name email role');
    
    // Send notifications if there were changes
    if (changes.length > 0) {
      try {
        // Notify admins
        await NotificationService.createForRole('admin', {
          title: '📝 Instructor Profile Updated',
          message: `${updatedInstructor.user?.name || 'Instructor'}'s profile was updated by ${req.user.name || 'an admin'}. Changes: ${changes.join(', ')}`,
          type: 'system',
          actionUrl: `/instructors/${updatedInstructor._id}`
        });
        
        // Notify the instructor
        await NotificationService.createNotification({
          recipientId: instructor.user,
          title: '🔔 Your Profile Has Been Updated',
          message: `Your instructor profile has been updated. Changes made: ${changes.join(', ')}. If you didn't request these changes, please contact administration.`,
          type: 'system',
          actionUrl: `/instructors/${updatedInstructor._id}`
        });
      } catch (notificationError) {
        console.error('Failed to send update notifications:', notificationError);
      }
    }
    
    res.json({
      success: true,
      message: 'Instructor updated successfully',
      data: updatedInstructor
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return next(errorHandler(400, errors.join(', ')));
    }
    next(errorHandler(400, error.message));
  }
};

// @desc    Delete instructor
// @route   DELETE /api/instructors/:id
export const deleteInstructor = async (req, res, next) => {
  try {
    const instructor = await Instructor.findById(req.params.id)
      .populate('user', 'name email');
    
    if (!instructor) {
      return next(errorHandler(404, 'Instructor not found'));
    }
    
    // Check if instructor has active courses
    const activeCourses = await Course.find({
      instructor: instructor.user._id,
      status: 'active'
    });
    
    if (activeCourses.length > 0) {
      return next(errorHandler(400, `Cannot delete instructor with ${activeCourses.length} active course(s). Please reassign courses first.`));
    }
    
    const instructorName = instructor.user?.name;
    const instructorEmail = instructor.user?.email;
    const employeeId = instructor.employeeId;
    
    await User.findByIdAndDelete(instructor.user);
    await Instructor.findByIdAndDelete(req.params.id);
    
    try {
      await NotificationService.createForRole('admin', {
        title: '🗑️ Instructor Account Deleted',
        message: `Instructor account for ${instructorName} (ID: ${employeeId}, Email: ${instructorEmail}) was permanently deleted by ${req.user.name || 'an admin'}.`,
        type: 'system',
        actionUrl: '/instructors'
      });
    } catch (notificationError) {
      console.error('Failed to send deletion notifications:', notificationError);
    }
    
    res.json({
      success: true,
      message: 'Instructor deleted successfully'
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Record salary payment
// @route   POST /api/instructors/:id/salary-payment
export const recordSalaryPayment = async (req, res, next) => {
  try {
    const instructor = await Instructor.findById(req.params.id)
      .populate('user', 'name email');
    
    if (!instructor) {
      return next(errorHandler(404, 'Instructor not found'));
    }
    
    const { amount, paidForMonth, paymentMethod, transactionReference, notes } = req.body;
    
    if (!amount || !paidForMonth) {
      return next(errorHandler(400, 'Amount and paid for month are required'));
    }
    
    // Add payment record
    instructor.salaryPayments.push({
      paymentDate: new Date(),
      amount,
      paidForMonth,
      paymentMethod: paymentMethod || 'Bank Transfer',
      transactionReference,
      notes,
      paidBy: req.user._id
    });
    
    // Update last payment info
    instructor.lastSalaryPaidDate = new Date();
    instructor.lastSalaryAmount = amount;
    
    // Calculate new balance
    const totalPaid = instructor.salaryPayments.reduce((sum, p) => sum + p.amount, 0);
    instructor.salaryBalance = instructor.salary - totalPaid;
    
    // Update status
    if (instructor.salaryBalance <= 0) {
      instructor.salaryStatus = 'paid';
    } else if (totalPaid > 0 && instructor.salaryBalance > 0) {
      instructor.salaryStatus = 'partial';
    }
    
    await instructor.save();
    
    // Send notifications
    try {
      const paymentType = instructor.salaryBalance <= 0 ? 'full' : 'partial';
      const balanceText = instructor.salaryBalance > 0 ? ` Remaining balance: ${instructor.salaryCurrency} ${instructor.salaryBalance.toLocaleString()}.` : '';
      
      // Notify instructor
      await NotificationService.createNotification({
        recipientId: instructor.user._id,
        title: paymentType === 'full' ? '✅ Salary Payment Received' : '💰 Partial Salary Payment Received',
        message: `Your ${paymentType === 'full' ? 'full' : 'partial'} salary payment of ${instructor.salaryCurrency} ${amount.toLocaleString()} for ${paidForMonth} has been processed.${balanceText}`,
        type: 'system',
        actionUrl: `/instructors/${instructor._id}`
      });
      
      // Notify admins
      await NotificationService.createForRole('admin', {
        title: '💰 Salary Payment Recorded',
        message: `${paymentType === 'full' ? 'Full' : 'Partial'} salary payment of ${instructor.salaryCurrency} ${amount.toLocaleString()} was recorded for ${instructor.user?.name} (${paidForMonth}) by ${req.user.name || 'an admin'}.`,
        type: 'system',
        actionUrl: `/instructors/${instructor._id}`
      });
    } catch (notificationError) {
      console.error('Failed to send salary payment notifications:', notificationError);
    }
    
    res.json({
      success: true,
      message: 'Salary payment recorded successfully',
      data: {
        salaryBalance: instructor.salaryBalance,
        salaryStatus: instructor.salaryStatus,
        totalPaid: instructor.salaryPayments.reduce((sum, p) => sum + p.amount, 0)
      }
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Get instructor count for sidebar
// @route   GET /api/instructors/count
export const getInstructorCount = async (req, res, next) => {
  try {
    const count = await Instructor.countDocuments({ status: 'active' });
    
    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Get instructor statistics for dashboard
// @route   GET /api/instructors/stats
export const getInstructorStats = async (req, res, next) => {
  try {
    const total = await Instructor.countDocuments();
    const active = await Instructor.countDocuments({ status: 'active' });
    const onLeave = await Instructor.countDocuments({ status: 'on_leave' });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const newThisMonth = await Instructor.countDocuments({
      createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
    });
    
    const byDepartment = await Instructor.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    res.json({
      success: true,
      data: {
        total,
        active,
        onLeave,
        newThisMonth,
        byDepartment
      }
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Get instructor's assigned courses
// @route   GET /api/instructors/:id/courses
export const getInstructorCourses = async (req, res, next) => {
  try {
    const instructor = await Instructor.findById(req.params.id);
    if (!instructor) {
      return next(errorHandler(404, 'Instructor not found'));
    }
    
    const courses = await Course.find({ 
      instructor: instructor.user._id 
    }).select('courseCode name status duration intakeMonth intakeYear enrolledStudents');
    
    // Add enrolled count
    const coursesWithCount = courses.map(course => ({
      ...course.toObject(),
      enrolledCount: course.enrolledStudents?.length || 0
    }));
    
    res.json({
      success: true,
      data: coursesWithCount,
      workload: {
        current: courses.length,
        max: instructor.maxWorkload,
        available: Math.max(0, instructor.maxWorkload - courses.length)
      }
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Update instructor workload (recalculate)
// @route   PUT /api/instructors/:id/update-workload
export const updateInstructorWorkload = async (req, res, next) => {
  try {
    const instructor = await Instructor.findById(req.params.id);
    if (!instructor) {
      return next(errorHandler(404, 'Instructor not found'));
    }
    
    const newWorkload = await instructor.updateWorkload();
    
    res.json({
      success: true,
      message: 'Workload updated successfully',
      data: {
        currentWorkload: newWorkload,
        maxWorkload: instructor.maxWorkload,
        teachingStatus: instructor.teachingStatus,
        availableSpots: Math.max(0, instructor.maxWorkload - newWorkload)
      }
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};