// backend/controllers/student.controller.js - COMPLETE

import Student from '../models/student.model.js';
import User from '../models/user.model.js';
import Enrollment from '../models/enrollment.model.js';
import { errorHandler } from '../utils/error.js';
import mongoose from 'mongoose';
import NotificationService from '../services/notificationService.js';
import { hasAnyAdmissionNumber, getStudentAdmissionNumbers } from '../services/admissionNumberService.js';

// @desc    Get all students with pagination and search
// @route   GET /api/students
export const getStudents = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    
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
        { studentId: { $regex: search, $options: 'i' } },
        { user: { $in: userIds } }
      ];
    }

    const students = await Student.find(query)
      .populate('user', 'name email role')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const studentsWithStatus = await Promise.all(
      students.map(async (student) => {
        const hasEnrollments = await hasAnyAdmissionNumber(student._id);
        const admissionNumbers = await getStudentAdmissionNumbers(student._id);
        
        return {
          ...student.toObject(),
          hasEnrollments,
          admissionNumbers,
          displayStatus: hasEnrollments ? 'enrolled' : 'not enrolled',
          displayAdmissionNumbers: admissionNumbers.map(a => a.admissionNumber).join(', ') || 'Not enrolled'
        };
      })
    );

    const total = await Student.countDocuments(query);

    res.json({
      success: true,
      data: studentsWithStatus,
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

// @desc    Get single student with enrollments
// @route   GET /api/students/:id
export const getStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('user', 'name email role');

    if (!student) {
      return next(errorHandler(404, 'Student not found'));
    }

    const enrollments = await Enrollment.find({ 
      student: student._id,
      status: 'enrolled'
    })
    .populate({
      path: 'course',
      select: 'courseCode name price duration intakeMonth intakeYear'
    })
    .select('admissionNumber course enrollmentDate status');

    const allAdmissionNumbers = await getStudentAdmissionNumbers(student._id);

    const studentWithEnrollments = student.toObject();
    studentWithEnrollments.enrollments = enrollments.map(e => ({
      admissionNumber: e.admissionNumber,
      courseId: e.course._id,
      courseCode: e.course.courseCode,
      courseName: e.course.name,
      coursePrice: e.course.price,
      courseDuration: e.course.duration,
      enrollmentDate: e.enrollmentDate,
      status: e.status
    }));
    studentWithEnrollments.admissionNumbers = allAdmissionNumbers;
    studentWithEnrollments.hasEnrollments = allAdmissionNumbers.length > 0;
    studentWithEnrollments.enrollmentStatus = allAdmissionNumbers.length > 0 ? 'enrolled' : 'not enrolled';

    res.json({
      success: true,
      data: studentWithEnrollments
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Create new student (Student ID auto-generated)
// @route   POST /api/students
export const createStudent = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { name, email, password, role, ...studentData } = req.body;

    if (!name || !email || !password) {
      await session.abortTransaction();
      session.endSession();
      return next(errorHandler(400, 'Name, email, and password are required'));
    }

    if (!studentData.dateOfBirth || !studentData.gender || !studentData.phone) {
      await session.abortTransaction();
      session.endSession();
      return next(errorHandler(400, 'Date of birth, gender, and phone are required'));
    }

    const existingUser = await User.findOne({ email }).session(session);
    if (existingUser) {
      await session.abortTransaction();
      session.endSession();
      return next(errorHandler(400, 'User with this email already exists'));
    }

    const [user] = await User.create([{
      name,
      email,
      password,
      role: 'student'
    }], { session });

    if (studentData.dateOfBirth && typeof studentData.dateOfBirth === 'string') {
      studentData.dateOfBirth = new Date(studentData.dateOfBirth);
    }

    // Student ID will be auto-generated by the model pre-save middleware
    const [student] = await Student.create([{
      user: user._id,
      ...studentData,
    }], { session });

    await session.commitTransaction();
    session.endSession();

    const populatedStudent = await Student.findById(student._id)
      .populate('user', 'name email role');

    try {
      await NotificationService.createForRole('admin', {
        title: '🎓 New Student Created',
        message: `${name} has been registered. Student ID: ${populatedStudent.studentId}`,
        type: 'student',
        actionUrl: `/students/${populatedStudent._id}`
      });

      const currentDate = new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      await NotificationService.createNotification({
        recipientId: user._id,
        title: '🎉 Welcome to Serian Institute!',
        message: `Hello ${name}! Your student account has been successfully created on ${currentDate}. Your Student ID is ${populatedStudent.studentId}. You are currently not enrolled in any course. Once you enroll in a course, you will receive admission numbers. Welcome to our learning community! 🚀`,
        type: 'student',
        actionUrl: '/dashboard'
      });
    } catch (notificationError) {
      console.error('Failed to send notifications:', notificationError);
    }

    res.status(201).json({
      success: true,
      message: `Student created successfully. Student ID: ${populatedStudent.studentId}`,
      data: {
        ...populatedStudent.toObject(),
        enrollmentStatus: 'not enrolled',
        hasEnrollments: false,
        admissionNumbers: []
      }
    });
  } catch (error) {
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
    const student = await Student.findById(req.params.id);
    if (!student) {
      return next(errorHandler(404, 'Student not found'));
    }

    const { name, email, ...studentData } = req.body;

    const changes = [];
    
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

    if (studentData.gender && studentData.gender !== student.gender) {
      changes.push(`Gender updated to: ${studentData.gender}`);
    }
    if (studentData.phone && studentData.phone !== student.phone) {
      changes.push(`Phone updated to: ${studentData.phone}`);
    }
    if (studentData.status && studentData.status !== student.status) {
      changes.push(`Status changed from ${student.status} to ${studentData.status}`);
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      studentData,
      { new: true, runValidators: true }
    ).populate('user', 'name email role');

    if (changes.length > 0) {
      try {
        await NotificationService.createForRole('admin', {
          title: '📝 Student Profile Updated',
          message: `${updatedStudent.user.name}'s profile was updated by ${req.user.name || 'an admin'}. Changes: ${changes.join(', ')}`,
          type: 'student',
          actionUrl: `/students/${updatedStudent._id}`
        });

        await NotificationService.createNotification({
          recipientId: student.user,
          title: '🔔 Your Profile Has Been Updated',
          message: `Your student profile has been updated. Changes made: ${changes.join(', ')}. If you didn't request these changes, please contact administration.`,
          type: 'student',
          actionUrl: `/students/${updatedStudent._id}`
        });
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

    const enrollmentCount = await Enrollment.countDocuments({ student: student._id });
    if (enrollmentCount > 0) {
      return next(errorHandler(400, `Cannot delete student with ${enrollmentCount} active enrollment(s). Please remove student from all courses first.`));
    }

    const studentName = student.user.name;
    const studentEmail = student.user.email;

    await User.findByIdAndDelete(student.user);
    await Student.findByIdAndDelete(req.params.id);

    try {
      await NotificationService.createForRole('admin', {
        title: '🗑️ Student Account Deleted',
        message: `Student account for ${studentName} (ID: ${student.studentId}, Email: ${studentEmail}) was permanently deleted by ${req.user.name || 'an admin'}.`,
        type: 'student',
        actionUrl: '/students'
      });
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
    if (req.user.role !== 'admin' && req.user.role !== 'instructor') {
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

    const total = await Student.countDocuments();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayStudents = await Student.countDocuments({
      createdAt: { $gte: today }
    });

    const enrolledStudents = await Enrollment.distinct('student', { status: 'enrolled' });
    const notEnrolledCount = total - enrolledStudents.length;

    const formattedStats = {
      total,
      enrolled: enrolledStudents.length,
      notEnrolled: notEnrolledCount,
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
    if (req.user.role !== 'admin' && req.user.role !== 'instructor') {
      return res.json({
        success: true,
        data: { count: 0 }
      });
    }

    const total = await Student.countDocuments();
    const enrolled = await Enrollment.distinct('student', { status: 'enrolled' });
    const notEnrolled = total - enrolled.length;

    res.json({
      success: true,
      data: { 
        total,
        enrolled: enrolled.length,
        notEnrolled
      }
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

    const course = await mongoose.model('Course').findById(courseId);
    
    if (!course) {
      return next(errorHandler(404, 'Course not found'));
    }

    const enrollments = await Enrollment.find({ 
      course: courseId,
      status: 'enrolled' 
    }).select('student');

    const enrolledStudentIds = enrollments.map(e => e.student);

    const query = {
      _id: { $nin: enrolledStudentIds },
      status: 'active'
    };

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

    const students = await Student.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);

    const studentsWithStatus = await Promise.all(
      students.map(async (student) => {
        const hasEnrollments = await hasAnyAdmissionNumber(student._id);
        const admissionNumbers = await getStudentAdmissionNumbers(student._id);
        
        return {
          ...student.toObject(),
          hasEnrollments,
          enrollmentStatus: hasEnrollments ? 'has other enrollments' : 'not enrolled',
          existingAdmissionNumbers: admissionNumbers.map(a => a.admissionNumber)
        };
      })
    );

    res.json({
      success: true,
      data: studentsWithStatus,
      count: studentsWithStatus.length
    });

  } catch (error) {
    next(errorHandler(500, error.message));
  } 
};

// @desc    Get student with enrollments (for student dashboard)
// @route   GET /api/students/:id/with-enrollments
export const getStudentWithEnrollments = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('user', 'name email role');

    if (!student) {
      return next(errorHandler(404, 'Student not found'));
    }

    const enrollments = await Enrollment.find({ 
      student: student._id,
      status: 'enrolled'
    })
    .populate({
      path: 'course',
      select: 'courseCode name price _id instructor duration',
      populate: {
        path: 'instructor',
        select: 'name email'
      }
    })
    .select('admissionNumber course enrollmentDate');

    const studentWithEnrollments = student.toObject();
    studentWithEnrollments.enrollments = enrollments.map(e => ({
      admissionNumber: e.admissionNumber,
      courseId: e.course._id,
      courseCode: e.course.courseCode,
      courseName: e.course.name,
      coursePrice: e.course.price,
      courseDuration: e.course.duration,
      instructor: e.course.instructor,
      enrollmentDate: e.enrollmentDate
    }));
    studentWithEnrollments.hasEnrollments = enrollments.length > 0;
    studentWithEnrollments.enrollmentStatus = enrollments.length > 0 ? 'enrolled' : 'not enrolled';

    res.json({
      success: true,
      data: studentWithEnrollments
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Get student fee summary (for student dashboard)
// @route   GET /api/students/:id/fees
export const getStudentFees = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (req.user.role === 'student') {
      const student = await Student.findOne({ user: req.user._id });
      if (!student || student._id.toString() !== id) {
        return next(errorHandler(403, 'Access denied'));
      }
    } else if (!['admin', 'instructor'].includes(req.user.role)) {
      return next(errorHandler(403, 'Access denied'));
    }

    const StudentFee = mongoose.model('StudentFee');
    const Payment = mongoose.model('Payment');

    let studentFee = await StudentFee.findOne({ student: id })
      .populate({
        path: 'courses.course',
        select: 'courseCode name price duration instructor status'
      })
      .populate({
        path: 'courses.payments',
        options: { sort: { paymentDate: -1 } }
      });

    if (!studentFee) {
      studentFee = await StudentFee.create({
        student: id,
        courses: []
      });
    }

    const recentPayments = await Payment.find({ student: id })
      .populate('course', 'courseCode name')
      .sort({ paymentDate: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        summary: studentFee.paymentSummary,
        courses: studentFee.courseBreakdown,
        recentPayments: recentPayments.map(p => ({
          id: p._id,
          amount: p.amount,
          formattedAmount: `KSh ${p.amount.toLocaleString()}`,
          date: p.paymentDate,
          course: p.course?.name,
          method: p.paymentMethodDisplay || p.paymentMethod,
          purpose: p.paymentForDisplay || p.paymentFor
        }))
      }
    });

  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Get all students with fee status (for admin)
// @route   GET /api/students/fees/overview
export const getAllStudentsFeeStatus = async (req, res, next) => {
  try {
    const { status, courseId, search } = req.query;

    const StudentFee = mongoose.model('StudentFee');
    
    let filters = {};
    if (status) filters.status = status;

    let summaries = await StudentFee.getAllFeeSummaries(filters);

    if (courseId) {
      const enrollments = await Enrollment.find({ 
        course: courseId, 
        status: 'enrolled' 
      }).select('student');
      
      const enrolledStudentIds = enrollments.map(e => e.student.toString());
      summaries = summaries.filter(s => 
        enrolledStudentIds.includes(s.studentId.toString())
      );
    }

    if (search) {
      const searchLower = search.toLowerCase();
      summaries = summaries.filter(s =>
        s.studentName.toLowerCase().includes(searchLower) ||
        s.studentNumber.toLowerCase().includes(searchLower)
      );
    }

    const stats = {
      totalStudents: summaries.length,
      totalFees: summaries.reduce((sum, s) => sum + s.totalFees, 0),
      totalPaid: summaries.reduce((sum, s) => sum + s.totalPaid, 0),
      totalBalance: summaries.reduce((sum, s) => sum + s.totalBalance, 0),
      averagePercentage: summaries.length > 0
        ? Math.round(summaries.reduce((sum, s) => sum + s.overallPercentage, 0) / summaries.length)
        : 0,
      byStatus: {
        fullyPaid: summaries.filter(s => s.totalBalance === 0).length,
        partial: summaries.filter(s => s.totalPaid > 0 && s.totalBalance > 0).length,
        unpaid: summaries.filter(s => s.totalPaid === 0).length
      }
    };

    res.json({
      success: true,
      data: {
        stats,
        students: summaries
      }
    });

  } catch (error) {
    next(errorHandler(500, error.message));
  }
};