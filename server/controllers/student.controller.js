import Student from '../models/student.model.js';
import User from '../models/user.model.js';
import { errorHandler } from '../utils/error.js';
import mongoose from 'mongoose';
import NotificationService from '../services/notificationService.js'; 

// @desc    Get all students with pagination and search
// @route   GET /api/students
export const getStudents = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    
    const query = {};
    if (search) {
      query.$or = [
        { studentId: { $regex: search, $options: 'i' } },
        // Add search by user name and email via populate
      ];
    }

    const students = await Student.find(query)
      .populate('user', 'name email role')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Student.countDocuments(query);

    res.json({
      success: true,
      data: students,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        results: total
      }
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Get single student
// @route   GET /api/students/:id
export const getStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('user', 'name email role');

    if (!student) {
      return next(errorHandler(404, 'Student not found'));
    }

    res.json({
      success: true,
      data: student
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Create new student with notifications
// @route   POST /api/students
export const createStudent = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { name, email, password, role, ...studentData } = req.body;

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
    const user = await User.create([{
      name,
      email,
      password,
      role: 'student'
    }], { session });

    // Parse dates if they're strings
    if (studentData.dateOfBirth && typeof studentData.dateOfBirth === 'string') {
      studentData.dateOfBirth = new Date(studentData.dateOfBirth);
    }

    // Create student profile
    const student = await Student.create([{
      user: user[0]._id,
      ...studentData,
    }], { session });

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    // Populate and return
    const populatedStudent = await Student.findById(student[0]._id)
      .populate('user', 'name email role');

    // ============= NOTIFICATION: Student Created =============
    
    // 1. NOTIFY ADMINS - New student account created
    try {
      await NotificationService.createForRole('admin', {
        title: '🎓 New Student Enrolled',
        message: `${name} has been enrolled as a new student. Student ID: ${populatedStudent.studentId}`,
        type: 'student',
        actionUrl: `/students/${populatedStudent._id}`
      });
    } catch (notificationError) {
      console.error('Failed to notify admins:', notificationError);
      // Don't fail the whole request if notification fails
    }

    // 2. NOTIFY THE STUDENT - Welcome message
    try {
      const currentDate = new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      await NotificationService.createNotification({
        recipientId: user[0]._id,
        title: '🎉 Welcome to Serian Institute!',
        message: `Hello ${name}! Your student account has been successfully created on ${currentDate}. Your Student ID is ${populatedStudent.studentId}. You can now access your dashboard, courses, and resources. Welcome to our learning community! 🚀`,
        type: 'student',
        actionUrl: '/dashboard'
      });
    } catch (studentNotificationError) {
      console.error('Failed to notify student:', studentNotificationError);
      // Don't fail the whole request if notification fails
    }

    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: populatedStudent
    });
  } catch (error) {
    // Rollback transaction on error
    await session.abortTransaction();
    session.endSession();
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return next(errorHandler(400, errors.join(', ')));
    }
    
    console.error('Student creation error:', error);
    next(errorHandler(400, error.message));
  }
};

// @desc    Update student with notifications
// @route   PUT /api/students/:id
export const updateStudent = async (req, res, next) => {
  try {
    // Find student first
    const student = await Student.findById(req.params.id);
    if (!student) {
      return next(errorHandler(404, 'Student not found'));
    }

    // Extract user update data if present
    const { name, email, ...studentData } = req.body;

    // Track changes for notification
    const changes = [];
    
    // Update user if name or email provided
    if (name || email) {
      const userUpdate = {};
      if (name) {
        userUpdate.name = name;
        changes.push(`Name updated to: ${name}`);
      }
      if (email) {
        userUpdate.email = email;
        changes.push(`Email updated to: ${email}`);
      }
      
      await User.findByIdAndUpdate(student.user, userUpdate, { 
        new: true, 
        runValidators: true 
      });
    }

    // Check student data changes
    if (studentData.gender && studentData.gender !== student.gender) {
      changes.push(`Gender updated to: ${studentData.gender}`);
    }
    if (studentData.phone && studentData.phone !== student.phone) {
      changes.push(`Phone updated to: ${studentData.phone}`);
    }
    if (studentData.status && studentData.status !== student.status) {
      changes.push(`Status changed from ${student.status} to ${studentData.status}`);
    }

    // Update student
    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      studentData,
      { new: true, runValidators: true }
    ).populate('user', 'name email role');

    // ============= NOTIFICATION: Student Updated =============
    if (changes.length > 0) {
      try {
        // 1. NOTIFY ADMINS - Student profile updated
        await NotificationService.createForRole('admin', {
          title: '📝 Student Profile Updated',
          message: `${updatedStudent.user.name}'s profile was updated by ${req.user.name || 'an admin'}. Changes: ${changes.join(', ')}`,
          type: 'student',
          actionUrl: `/students/${updatedStudent._id}`
        });

        // 2. NOTIFY THE STUDENT - Their profile was updated
        if (changes.length > 0) {
          await NotificationService.createNotification({
            recipientId: student.user,
            title: '🔔 Your Profile Has Been Updated',
            message: `Your student profile has been updated. Changes made: ${changes.join(', ')}. If you didn't request these changes, please contact administration.`,
            type: 'student',
            actionUrl: `/students/${updatedStudent._id}`
          });
        }
      } catch (notificationError) {
        console.error('Failed to send update notifications:', notificationError);
      }
    }

    res.json({
      success: true,
      message: 'Student updated successfully',
      data: updatedStudent
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return next(errorHandler(400, errors.join(', ')));
    }
    next(errorHandler(400, error.message));
  }
};

// @desc    Delete student with notifications
// @route   DELETE /api/students/:id
export const deleteStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('user', 'name email');
    
    if (!student) {
      return next(errorHandler(404, 'Student not found'));
    }

    // Store student info before deletion for notification
    const studentName = student.user.name;
    const studentEmail = student.user.email;
    const studentId = student.studentId;

    // Delete both student and user
    await User.findByIdAndDelete(student.user);
    await Student.findByIdAndDelete(req.params.id);

    // ============= NOTIFICATION: Student Deleted =============
    try {
      // NOTIFY ADMINS - Student account deleted
      await NotificationService.createForRole('admin', {
        title: '🗑️ Student Account Deleted',
        message: `Student account for ${studentName} (ID: ${studentId}, Email: ${studentEmail}) was permanently deleted by ${req.user.name || 'an admin'}.`,
        type: 'student',
        actionUrl: '/students'
      });

      // Optional: If you want to notify the student (via email before deletion)
      // This would require sending an email before deleting the account
      // For now, we'll skip since the account is deleted
      
    } catch (notificationError) {
      console.error('Failed to send deletion notifications:', notificationError);
    }

    res.json({
      success: true,
      message: 'Student deleted successfully'
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Get student statistics (for dashboard)
// @route   GET /api/students/stats
export const getStudentStats = async (req, res, next) => {
  try {
    // Only admin and teachers can view student stats
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      return next(errorHandler(403, 'Access denied'));
    }

    const stats = await Student.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get total count
    const total = await Student.countDocuments();

    // Get today's new students
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayStudents = await Student.countDocuments({
      createdAt: { $gte: today }
    });

    // Format the stats
    const formattedStats = {
      total,
      today: todayStudents,
      byStatus: stats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {})
    };

    res.json({
      success: true,
      data: formattedStats
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Get student count (optimized for sidebar)
// @route   GET /api/students/count
export const getStudentCount = async (req, res, next) => {
  try {
    // Only admin and teachers can view student count
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      return res.json({
        success: true,
        data: { count: 0 }
      });
    }

    const count = await Student.countDocuments();

    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Get students not enrolled in a specific course (for enrollment)
// @route   GET /api/students/available/:courseId
export const getAvailableStudents = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { search = '' } = req.query;

    // Check if course exists
    const Course = (await import('../models/course.model.js')).default;
    const course = await Course.findById(courseId);
    
    if (!course) {
      return next(errorHandler(404, 'Course not found'));
    }

    // Get enrolled student IDs for this course
    const Enrollment = (await import('../models/enrollment.model.js')).default;
    const enrollments = await Enrollment.find({ 
      course: courseId,
      status: 'enrolled' 
    }).select('student');

    const enrolledStudentIds = enrollments.map(e => e.student);

    // Build query for available students (not enrolled)
    const query = {
      _id: { $nin: enrolledStudentIds },
      status: 'active' // Only active students
    };

    // Add search filter if provided
    if (search) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');

      const userIds = users.map(user => user._id);
      
      query.$or = [
        { studentId: { $regex: search, $options: 'i' } },
        { user: { $in: userIds } }
      ];
    }

    // Get available students with user data populated
    const students = await Student.find(query)
      .populate('user', 'name email')
      .sort({ studentId: 1 })
      .limit(50); // Limit for UI performance

    res.json({
      success: true,
      data: students,
      count: students.length
    });

  } catch (error) {
    next(errorHandler(500, error.message));
  } 
};