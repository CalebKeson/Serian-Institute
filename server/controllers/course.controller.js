import mongoose from 'mongoose';
import Course from '../models/course.model.js';
import User from '../models/user.model.js';
import Enrollment from '../models/enrollment.model.js';
import { errorHandler } from '../utils/error.js';
import NotificationService from '../services/notificationService.js';
import { getCourseEnrollmentStats } from '../services/admissionNumberService.js';

// @desc    Get all courses with pagination and filters
// @route   GET /api/courses
export const getCourses = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '',
      courseType = '',
      intakeMonth = '',
      status = '',
      instructor = ''
    } = req.query;
    
    const skip = (page - 1) * limit;
    const query = {};
    
    if (search) {
      query.$or = [
        { courseCode: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (courseType) query.courseType = courseType;
    if (intakeMonth) query.intakeMonth = intakeMonth;
    if (status) query.status = status;
    if (instructor) query.instructor = instructor;

    const courses = await Course.find(query)
      .populate('instructor', 'name email role')
      .populate({
        path: 'enrolledStudents',
        select: 'studentId user',
        populate: {
          path: 'user',
          select: 'name email'
        }
      })
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    // Get enrollment stats for each course
    const coursesWithStats = await Promise.all(
      courses.map(async (course) => {
        const stats = await getCourseEnrollmentStats(course._id);
        return {
          ...course.toObject(),
          enrollmentStats: stats
        };
      })
    );

    const total = await Course.countDocuments(query);

    res.json({
      success: true,
      count: courses.length,
      data: coursesWithStats,
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

// @desc    Get single course
// @route   GET /api/courses/:id
export const getCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'name email role')
      .populate({
        path: 'enrolledStudents',
        select: 'studentId user',
        populate: {
          path: 'user',
          select: 'name email'
        }
      });

    if (!course) {
      return next(errorHandler(404, 'Course not found'));
    }

    // Get detailed enrollment stats
    const stats = await getCourseEnrollmentStats(course._id);

    res.json({
      success: true,
      data: {
        ...course.toObject(),
        enrollmentStats: stats
      }
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Create new course (MANUAL courseCode entry)
// @route   POST /api/courses
export const createCourse = async (req, res, next) => {
  try {
    if (!['admin', 'instructor'].includes(req.user.role)) {
      return next(errorHandler(403, 'Not authorized to create courses'));
    }

    const courseData = req.body;

    // Validate required fields including courseCode
    const requiredFields = [
      'courseCode', 'name', 'courseType', 'duration', 
      'intakeMonth', 'intakeYear', 'batchNumber', 'instructor',
      'maxStudents', 'certification', 'price'
    ];

    for (const field of requiredFields) {
      if (!courseData[field] && courseData[field] !== 0) {
        return next(errorHandler(400, `${field} is required`));
      }
    }

    // Validate courseCode format (3-4 uppercase letters)
    const courseCodeRegex = /^[A-Z]{3,4}$/;
    if (!courseCodeRegex.test(courseData.courseCode.toUpperCase())) {
      return next(errorHandler(400, 'Course code must be 3-4 uppercase letters (e.g., CNA, DRV, PLB, ELC, COM)'));
    }

    // Check if course code already exists
    const existingCourse = await Course.findOne({ 
      courseCode: courseData.courseCode.toUpperCase()
    });
    
    if (existingCourse) {
      return next(errorHandler(400, 'Course code already exists. Please use a different code.'));
    }

    // Validate instructor
    const instructor = await User.findById(courseData.instructor);
    if (!instructor || !['admin', 'instructor'].includes(instructor.role)) {
      return next(errorHandler(400, 'Selected instructor is not valid'));
    }

    // Create course with MANUAL courseCode (NO auto-generation)
    const course = await Course.create({
      ...courseData,
      courseCode: courseData.courseCode.toUpperCase(), // Just convert to uppercase, not generate
      enrolledStudents: [] // Initialize empty array
    });

    const populatedCourse = await Course.findById(course._id)
      .populate('instructor', 'name email role');

    // Send notifications
    try {
      await NotificationService.createForRole('admin', {
        title: '📚 New Course Created',
        message: `Course "${populatedCourse.name}" (${populatedCourse.courseCode}) has been created by ${req.user.name || 'an instructor'}.`,
        type: 'course',
        actionUrl: `/courses/${populatedCourse._id}`
      });

      await NotificationService.createNotification({
        recipientId: courseData.instructor,
        title: '📝 New Course Assignment',
        message: `You have been assigned as instructor for "${populatedCourse.name}" (${populatedCourse.courseCode}). The course starts in ${populatedCourse.intakeMonth} ${populatedCourse.intakeYear}.`,
        type: 'course',
        actionUrl: `/courses/${populatedCourse._id}`
      });
    } catch (notificationError) {
      console.error('Failed to send notifications:', notificationError);
    }

    res.status(201).json({
      success: true,
      data: populatedCourse,
      message: 'Course created successfully'
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return next(errorHandler(400, messages.join(', ')));
    }
    if (error.code === 11000) {
      return next(errorHandler(400, 'Course code already exists'));
    }
    next(errorHandler(500, error.message));
  }
};

// @desc    Update course
// @route   PUT /api/courses/:id
export const updateCourse = async (req, res, next) => {
  try {
    if (!['admin', 'instructor'].includes(req.user.role)) {
      return next(errorHandler(403, 'Not authorized to update courses'));
    }

    const existingCourse = await Course.findById(req.params.id);
    if (!existingCourse) {
      return next(errorHandler(404, 'Course not found'));
    }

    const isOwner = existingCourse.instructor.toString() === req.user._id.toString();
    if (req.user.role !== 'admin' && !isOwner) {
      return next(errorHandler(403, 'You can only update your own courses'));
    }

    // If updating courseCode, validate it
    if (req.body.courseCode && req.body.courseCode !== existingCourse.courseCode) {
      const courseCodeRegex = /^[A-Z]{3,4}$/;
      if (!courseCodeRegex.test(req.body.courseCode.toUpperCase())) {
        return next(errorHandler(400, 'Course code must be 3-4 uppercase letters (e.g., CNA, DRV, PLB, ELC, COM)'));
      }
      
      // Check if new courseCode already exists
      const codeExists = await Course.findOne({ 
        courseCode: req.body.courseCode.toUpperCase(),
        _id: { $ne: req.params.id }
      });
      
      if (codeExists) {
        return next(errorHandler(400, 'Course code already exists. Please use a different code.'));
      }
    }

    let instructorChanged = false;
    let oldInstructor = null;
    let newInstructor = null;

    // If updating instructor, validate and track change
    if (req.body.instructor && req.body.instructor !== existingCourse.instructor.toString()) {
      const newInstructorData = await User.findById(req.body.instructor);
      if (!newInstructorData || !['admin', 'instructor'].includes(newInstructorData.role)) {
        return next(errorHandler(400, 'Selected instructor is not valid'));
      }
      oldInstructor = existingCourse.instructor;
      newInstructor = req.body.instructor;
      instructorChanged = true;
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      { 
        ...req.body, 
        courseCode: req.body.courseCode ? req.body.courseCode.toUpperCase() : existingCourse.courseCode 
      },
      { new: true, runValidators: true }
    )
      .populate('instructor', 'name email role')
      .populate({
        path: 'enrolledStudents',
        select: 'studentId user',
        populate: {
          path: 'user',
          select: 'name email'
        }
      });

    // Send notifications
    try {
      const changes = [];
      if (req.body.name && req.body.name !== existingCourse.name) changes.push('name');
      if (req.body.duration && req.body.duration !== existingCourse.duration) changes.push('duration');
      if (req.body.status && req.body.status !== existingCourse.status) changes.push('status');
      if (req.body.courseCode && req.body.courseCode !== existingCourse.courseCode) changes.push('course code');
      if (req.body.price && req.body.price !== existingCourse.price) changes.push('price');
      
      await NotificationService.createForRole('admin', {
        title: '📝 Course Updated',
        message: `Course "${updatedCourse.name}" (${updatedCourse.courseCode}) was updated by ${req.user.name || 'a user'}. Changes: ${changes.join(', ') || 'general information'}.`,
        type: 'course',
        actionUrl: `/courses/${updatedCourse._id}`
      });

      if (instructorChanged && oldInstructor) {
        await NotificationService.createNotification({
          recipientId: oldInstructor,
          title: '🔄 Course Reassignment',
          message: `You have been removed as instructor for "${updatedCourse.name}" (${updatedCourse.courseCode}).`,
          type: 'course',
          actionUrl: `/courses/${updatedCourse._id}`
        });
      }

      if (instructorChanged && newInstructor) {
        await NotificationService.createNotification({
          recipientId: newInstructor,
          title: '📝 New Course Assignment',
          message: `You have been assigned as instructor for "${updatedCourse.name}" (${updatedCourse.courseCode}).`,
          type: 'course',
          actionUrl: `/courses/${updatedCourse._id}`
        });
      }

      // Notify all enrolled students about important changes
      if (changes.includes('status') && updatedCourse.status === 'cancelled') {
        const enrollments = await Enrollment.find({ 
          course: updatedCourse._id, 
          status: 'enrolled' 
        }).populate('student');
        
        for (const enrollment of enrollments) {
          const studentUser = await User.findById(enrollment.student.user);
          if (studentUser) {
            await NotificationService.createNotification({
              recipientId: studentUser._id,
              title: '⚠️ Course Cancelled',
              message: `The course "${updatedCourse.name}" (${updatedCourse.courseCode}) has been cancelled. Please contact administration for assistance.`,
              type: 'course',
              actionUrl: `/courses`
            });
          }
        }
      }
    } catch (notificationError) {
      console.error('Failed to send update notifications:', notificationError);
    }

    res.json({
      success: true,
      data: updatedCourse,
      message: 'Course updated successfully'
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return next(errorHandler(400, messages.join(', ')));
    }
    if (error.code === 11000) {
      return next(errorHandler(400, 'Course code already exists'));
    }
    next(errorHandler(500, error.message));
  }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
export const deleteCourse = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return next(errorHandler(403, 'Only admin can delete courses'));
    }

    const course = await Course.findById(req.params.id)
      .populate('instructor', 'name email');

    if (!course) {
      return next(errorHandler(404, 'Course not found'));
    }

    if (course.enrolledStudents && course.enrolledStudents.length > 0) {
      return next(errorHandler(400, 'Cannot delete course with enrolled students. Please remove all students first.'));
    }

    const courseName = course.name;
    const courseCode = course.courseCode;
    const instructorId = course.instructor?._id;

    await course.deleteOne();

    try {
      await NotificationService.createForRole('admin', {
        title: '🗑️ Course Deleted',
        message: `Course "${courseName}" (${courseCode}) was permanently deleted by ${req.user.name || 'an admin'}.`,
        type: 'course',
        actionUrl: '/courses'
      });

      if (instructorId) {
        await NotificationService.createNotification({
          recipientId: instructorId,
          title: '❌ Course Cancelled',
          message: `The course "${courseName}" (${courseCode}) that you were instructing has been cancelled and removed from the system.`,
          type: 'course',
          actionUrl: '/courses'
        });
      }
    } catch (notificationError) {
      console.error('Failed to send deletion notifications:', notificationError);
    }

    res.json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Enroll student in course
// @route   POST /api/courses/:id/enroll
export const enrollStudent = async (req, res, next) => {
  try {
    if (!['admin', 'instructor', 'receptionist'].includes(req.user.role)) {
      return next(errorHandler(403, 'Not authorized to enroll students'));
    }

    const { studentId } = req.body;
    
    if (!studentId) {
      return next(errorHandler(400, 'Student ID is required'));
    }

    const course = await Course.findById(req.params.id);

    if (!course) {
      return next(errorHandler(404, 'Course not found'));
    }

    if (course.status !== 'active') {
      return next(errorHandler(400, 'Cannot enroll in inactive course'));
    }

    await course.enrollStudent(studentId);

    const updatedCourse = await Course.findById(req.params.id)
      .populate('instructor', 'name email role')
      .populate({
        path: 'enrolledStudents',
        select: 'studentId',
        populate: {
          path: 'user',
          select: 'name email'
        }
      });

    res.json({
      success: true,
      data: updatedCourse,
      message: 'Student enrolled successfully'
    });
  } catch (error) {
    next(errorHandler(400, error.message));
  }
};

// @desc    Remove student from course
// @route   DELETE /api/courses/:id/enroll
export const removeStudent = async (req, res, next) => {
  try {
    if (!['admin', 'instructor', 'receptionist'].includes(req.user.role)) {
      return next(errorHandler(403, 'Not authorized to remove students'));
    }

    const { studentId } = req.body;
    
    if (!studentId) {
      return next(errorHandler(400, 'Student ID is required'));
    }

    const course = await Course.findById(req.params.id);

    if (!course) {
      return next(errorHandler(404, 'Course not found'));
    }

    await course.removeStudent(studentId);

    const updatedCourse = await Course.findById(req.params.id)
      .populate('instructor', 'name email role')
      .populate({
        path: 'enrolledStudents',
        select: 'studentId',
        populate: {
          path: 'user',
          select: 'name email'
        }
      });

    res.json({
      success: true,
      data: updatedCourse,
      message: 'Student removed from course successfully'
    });
  } catch (error) {
    next(errorHandler(400, error.message));
  }
};

// @desc    Get enrolled students for a course
// @route   GET /api/courses/:id/students
export const getEnrolledStudents = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate({
        path: 'enrolledStudents',
        select: 'studentId phone dateOfBirth gender address emergencyContact',
        populate: {
          path: 'user',
          select: 'name email'
        }
      })
      .select('enrolledStudents courseCode name');

    if (!course) {
      return next(errorHandler(404, 'Course not found'));
    }

    // Get admission numbers for each enrolled student
    const studentsWithAdmissionNumbers = await Promise.all(
      course.enrolledStudents.map(async (student) => {
        const enrollment = await Enrollment.findOne({
          student: student._id,
          course: course._id,
          status: 'enrolled'
        }).select('admissionNumber enrollmentDate');
        
        return {
          ...student.toObject(),
          admissionNumber: enrollment?.admissionNumber || null,
          enrollmentDate: enrollment?.enrollmentDate || null
        };
      })
    );

    res.json({
      success: true,
      data: studentsWithAdmissionNumbers,
      courseCode: course.courseCode,
      courseName: course.name
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Get available instructors for course creation
// @route   GET /api/courses/instructors/available
export const getAvailableInstructors = async (req, res, next) => {
  try {
    if (!['admin', 'instructor'].includes(req.user.role)) {
      return next(errorHandler(403, 'Not authorized'));
    }

    const instructors = await User.find({
      role: { $in: ['instructor', 'admin'] },
      isActive: true
    }).select('_id name email role');

    res.json({
      success: true,
      data: instructors
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Get course statistics
// @route   GET /api/courses/stats/overview
export const getCourseStats = async (req, res, next) => {
  try {
    if (!['admin', 'instructor'].includes(req.user.role)) {
      return next(errorHandler(403, 'Not authorized'));
    }

    const totalCourses = await Course.countDocuments();
    const activeCourses = await Course.countDocuments({ status: 'active' });
    const totalEnrolled = await Course.aggregate([
      { $unwind: '$enrolledStudents' },
      { $count: 'total' }
    ]);

    const byCourseType = await Course.aggregate([
      { $group: { _id: '$courseType', count: { $sum: 1 } } }
    ]);

    const byStatus = await Course.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Get capacity utilization
    const courses = await Course.find().select('maxStudents enrolledStudents');
    let totalCapacity = 0;
    let totalUtilized = 0;
    
    courses.forEach(course => {
      totalCapacity += course.maxStudents || 0;
      totalUtilized += (course.enrolledStudents || []).length;
    });

    const utilizationRate = totalCapacity > 0 ? (totalUtilized / totalCapacity) * 100 : 0;

    res.json({
      success: true,
      data: {
        totalCourses,
        activeCourses,
        totalEnrolled: totalEnrolled[0]?.total || 0,
        totalCapacity,
        totalUtilized,
        utilizationRate: Math.round(utilizationRate),
        byCourseType,
        byStatus
      }
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Get course count for sidebar
// @route   GET /api/courses/count
export const getCourseCount = async (req, res, next) => {
  try {
    let count = 0;
    
    // Role-based access
    if (['admin', 'instructor'].includes(req.user.role)) {
      // Admins and instructors see all courses
      count = await Course.countDocuments();
    } else if (req.user.role === 'receptionist') {
      // Receptionists see only active courses (for enrollment)
      count = await Course.countDocuments({ status: 'active' });
    } else if (req.user.role === 'student') {
      // Students see count of courses they're enrolled in
      const student = await Student.findOne({ user: req.user._id });
      if (student) {
        count = await Enrollment.countDocuments({ 
          student: student._id, 
          status: 'enrolled' 
        });
      }
    } else {
      // Parents and other roles
      count = await Course.countDocuments({ status: 'active' });
    }

    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Get course payment summary
// @route   GET /api/courses/:courseId/payments/summary
export const getCoursePaymentSummary = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    
    if (!['admin', 'instructor'].includes(req.user.role)) {
      return next(errorHandler(403, 'Not authorized'));
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return next(errorHandler(404, 'Course not found'));
    }

    const StudentFee = mongoose.model('StudentFee');
    const enrollments = await Enrollment.find({ 
      course: courseId, 
      status: 'enrolled' 
    }).select('student');

    const studentIds = enrollments.map(e => e.student);
    
    let totalFees = 0;
    let totalPaid = 0;
    let fullyPaid = 0;
    let partial = 0;
    let unpaid = 0;

    for (const studentId of studentIds) {
      const studentFee = await StudentFee.findOne({ student: studentId });
      if (studentFee) {
        const courseFee = studentFee.courses.find(
          c => c.course.toString() === courseId
        );
        if (courseFee) {
          totalFees += courseFee.coursePrice;
          totalPaid += courseFee.totalPaid;
          const balance = courseFee.coursePrice - courseFee.totalPaid;
          if (balance === 0) fullyPaid++;
          else if (courseFee.totalPaid > 0) partial++;
          else unpaid++;
        }
      } else {
        unpaid++;
        totalFees += course.price;
      }
    }

    res.json({
      success: true,
      data: {
        courseCode: course.courseCode,
        courseName: course.name,
        totalStudents: studentIds.length,
        totalFees,
        totalPaid,
        totalBalance: totalFees - totalPaid,
        collectionRate: totalFees > 0 ? (totalPaid / totalFees) * 100 : 0,
        paymentStatus: {
          fullyPaid,
          partial,
          unpaid
        }
      }
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Get course students payment status
// @route   GET /api/courses/:courseId/payments/students
export const getCourseStudentsPaymentStatus = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    
    if (!['admin', 'instructor'].includes(req.user.role)) {
      return next(errorHandler(403, 'Not authorized'));
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return next(errorHandler(404, 'Course not found'));
    }

    const enrollments = await Enrollment.find({ 
      course: courseId, 
      status: 'enrolled' 
    })
    .populate({
      path: 'student',
      populate: {
        path: 'user',
        select: 'name email'
      }
    })
    .select('student admissionNumber');

    const StudentFee = mongoose.model('StudentFee');
    const studentsWithPayment = [];

    for (const enrollment of enrollments) {
      const student = enrollment.student;
      const studentFee = await StudentFee.findOne({ student: student._id });
      let paymentInfo = {
        coursePrice: course.price,
        totalPaid: 0,
        balance: course.price,
        percentage: 0,
        status: 'unpaid'
      };

      if (studentFee) {
        const courseFee = studentFee.courses.find(
          c => c.course.toString() === courseId
        );
        if (courseFee) {
          paymentInfo = {
            coursePrice: courseFee.coursePrice,
            totalPaid: courseFee.totalPaid,
            balance: courseFee.coursePrice - courseFee.totalPaid,
            percentage: (courseFee.totalPaid / courseFee.coursePrice) * 100,
            status: courseFee.totalPaid === 0 ? 'unpaid' : 
                    courseFee.totalPaid >= courseFee.coursePrice ? 'paid' : 'partial'
          };
        }
      }

      studentsWithPayment.push({
        studentId: student._id,
        studentName: student.user?.name,
        studentEmail: student.user?.email,
        admissionNumber: enrollment.admissionNumber,
        payment: paymentInfo
      });
    }

    res.json({
      success: true,
      data: {
        courseCode: course.courseCode,
        courseName: course.name,
        students: studentsWithPayment
      }
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Get student course payments
// @route   GET /api/courses/:courseId/students/:studentId/payments
export const getStudentCoursePayments = async (req, res, next) => {
  try {
    const { courseId, studentId } = req.params;
    
    // Check authorization
    if (req.user.role === 'student') {
      const student = await Student.findOne({ user: req.user._id });
      if (!student || student._id.toString() !== studentId) {
        return next(errorHandler(403, 'Access denied'));
      }
    } else if (!['admin', 'instructor'].includes(req.user.role)) {
      return next(errorHandler(403, 'Access denied'));
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return next(errorHandler(404, 'Course not found'));
    }

    const student = await Student.findById(studentId).populate('user', 'name email');
    if (!student) {
      return next(errorHandler(404, 'Student not found'));
    }

    const enrollment = await Enrollment.findOne({
      student: studentId,
      course: courseId,
      status: 'enrolled'
    }).select('admissionNumber enrollmentDate');

    const StudentFee = mongoose.model('StudentFee');
    const Payment = mongoose.model('Payment');

    const studentFee = await StudentFee.findOne({ student: studentId });
    let coursePayment = null;
    let payments = [];

    if (studentFee) {
      coursePayment = studentFee.courses.find(
        c => c.course.toString() === courseId
      );
      if (coursePayment) {
        payments = await Payment.find({
          student: studentId,
          course: courseId
        }).sort({ paymentDate: -1 });
      }
    }

    res.json({
      success: true,
      data: {
        student: {
          id: student._id,
          name: student.user?.name,
          email: student.user?.email,
          admissionNumber: enrollment?.admissionNumber
        },
        course: {
          id: course._id,
          code: course.courseCode,
          name: course.name,
          price: course.price
        },
        paymentSummary: coursePayment ? {
          totalFees: coursePayment.coursePrice,
          totalPaid: coursePayment.totalPaid,
          balance: coursePayment.coursePrice - coursePayment.totalPaid,
          percentage: (coursePayment.totalPaid / coursePayment.coursePrice) * 100,
          status: coursePayment.totalPaid === 0 ? 'unpaid' : 
                  coursePayment.totalPaid >= coursePayment.coursePrice ? 'paid' : 'partial'
        } : {
          totalFees: course.price,
          totalPaid: 0,
          balance: course.price,
          percentage: 0,
          status: 'unpaid'
        },
        payments: payments.map(p => ({
          id: p._id,
          amount: p.amount,
          formattedAmount: `KSh ${p.amount.toLocaleString()}`,
          date: p.paymentDate,
          method: p.paymentMethod,
          reference: p.reference,
          status: p.status
        }))
      }
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Export course payment report as CSV
// @route   GET /api/courses/:courseId/payments/export
export const exportCoursePaymentReport = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    
    if (!['admin', 'instructor'].includes(req.user.role)) {
      return next(errorHandler(403, 'Not authorized'));
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return next(errorHandler(404, 'Course not found'));
    }

    const enrollments = await Enrollment.find({ 
      course: courseId, 
      status: 'enrolled' 
    })
    .populate({
      path: 'student',
      populate: {
        path: 'user',
        select: 'name email'
      }
    })
    .select('student admissionNumber');

    const StudentFee = mongoose.model('StudentFee');
    const reportData = [];

    for (const enrollment of enrollments) {
      const student = enrollment.student;
      const studentFee = await StudentFee.findOne({ student: student._id });
      let paidAmount = 0;
      let balance = course.price;

      if (studentFee) {
        const courseFee = studentFee.courses.find(
          c => c.course.toString() === courseId
        );
        if (courseFee) {
          paidAmount = courseFee.totalPaid;
          balance = courseFee.coursePrice - paidAmount;
        }
      }

      reportData.push({
        'Admission Number': enrollment.admissionNumber,
        'Student Name': student.user?.name,
        'Student Email': student.user?.email,
        'Course Code': course.courseCode,
        'Course Name': course.name,
        'Total Fees': course.price,
        'Amount Paid': paidAmount,
        'Balance': balance,
        'Payment Status': balance === 0 ? 'Fully Paid' : paidAmount > 0 ? 'Partial' : 'Unpaid',
        'Percentage': balance === 0 ? '100%' : paidAmount > 0 ? `${Math.round((paidAmount / course.price) * 100)}%` : '0%'
      });
    }

    // Convert to CSV
    const headers = Object.keys(reportData[0] || {});
    const csvRows = [
      headers.join(','),
      ...reportData.map(row => 
        headers.map(header => {
          const value = row[header]?.toString() || '';
          return `"${value.replace(/"/g, '""')}"`;
        }).join(',')
      )
    ];
    const csv = csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${course.courseCode}_payment_report.csv`);
    res.status(200).send(csv);
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};