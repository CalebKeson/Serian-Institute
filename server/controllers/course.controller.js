import Course from '../models/course.model.js';
import User from '../models/user.model.js';
import { errorHandler } from '../utils/error.js';
import NotificationService from '../services/notificationService.js';

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

    const total = await Course.countDocuments(query);

    res.json({
      success: true,
      count: courses.length,
      data: courses,
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

    res.json({
      success: true,
      data: course
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Create new course
// @route   POST /api/courses
export const createCourse = async (req, res, next) => {
  try {
    if (!['admin', 'instructor'].includes(req.user.role)) {
      return next(errorHandler(403, 'Not authorized to create courses'));
    }

    const courseData = req.body;

    const requiredFields = [
      'courseCode', 'name', 'courseType', 'duration', 
      'intakeMonth', 'intakeYear', 'batchNumber', 'instructor',
      'maxStudents', 'certification'
    ];

    for (const field of requiredFields) {
      if (!courseData[field]) {
        return next(errorHandler(400, `${field} is required`));
      }
    }

    const existingCourse = await Course.findOne({ 
      courseCode: courseData.courseCode.toUpperCase()
    });
    
    if (existingCourse) {
      return next(errorHandler(400, 'Course code already exists'));
    }

    const instructor = await User.findById(courseData.instructor);
    if (!instructor || !['admin', 'instructor'].includes(instructor.role)) {
      return next(errorHandler(400, 'Selected instructor is not valid'));
    }

    const course = await Course.create({
      ...courseData,
      courseCode: courseData.courseCode.toUpperCase()
    });

    const populatedCourse = await Course.findById(course._id)
      .populate('instructor', 'name email role');

    // ============= NOTIFICATION: Course Created =============
    
    // 1. NOTIFY ADMINS - New course created
    try {
      await NotificationService.createForRole('admin', {
        title: '📚 New Course Created',
        message: `Course "${populatedCourse.name}" (${populatedCourse.courseCode}) has been created by ${req.user.name || 'an instructor'}.`,
        type: 'course',
        actionUrl: `/courses/${populatedCourse._id}`
      });
    } catch (notificationError) {
      console.error('Failed to notify admins:', notificationError);
    }

    // 2. NOTIFY THE INSTRUCTOR - They've been assigned
    try {
      await NotificationService.createNotification({
        recipientId: courseData.instructor,
        title: '📝 New Course Assignment',
        message: `You have been assigned as instructor for "${populatedCourse.name}" (${populatedCourse.courseCode}). The course starts in ${populatedCourse.intakeMonth} ${populatedCourse.intakeYear}.`,
        type: 'course',
        actionUrl: `/courses/${populatedCourse._id}`
      });
    } catch (notificationError) {
      console.error('Failed to notify instructor:', notificationError);
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
      { ...req.body, courseCode: req.body.courseCode?.toUpperCase() },
      { new: true, runValidators: true }
    )
      .populate('instructor', 'name email role')
      .populate({
        path: 'enrolledStudents',
        select: 'studentId',
        populate: {
          path: 'user',
          select: 'name email'
        }
      });

    // ============= NOTIFICATION: Course Updated =============
    
    try {
      // Track changes for notification
      const changes = [];
      if (req.body.name && req.body.name !== existingCourse.name) changes.push('name');
      if (req.body.duration && req.body.duration !== existingCourse.duration) changes.push('duration');
      if (req.body.status && req.body.status !== existingCourse.status) changes.push('status');
      
      // 1. NOTIFY ADMINS - Course updated
      await NotificationService.createForRole('admin', {
        title: '📝 Course Updated',
        message: `Course "${updatedCourse.name}" (${updatedCourse.courseCode}) was updated by ${req.user.name || 'a user'}. Changes made to: ${changes.join(', ') || 'general information'}.`,
        type: 'course',
        actionUrl: `/courses/${updatedCourse._id}`
      });

      // 2. NOTIFY OLD INSTRUCTOR - If instructor changed
      if (instructorChanged && oldInstructor) {
        await NotificationService.createNotification({
          recipientId: oldInstructor,
          title: '🔄 Course Reassignment',
          message: `You have been removed as instructor for "${updatedCourse.name}" (${updatedCourse.courseCode}).`,
          type: 'course',
          actionUrl: `/courses/${updatedCourse._id}`
        });
      }

      // 3. NOTIFY NEW INSTRUCTOR - If instructor changed
      if (instructorChanged && newInstructor) {
        await NotificationService.createNotification({
          recipientId: newInstructor,
          title: '📝 New Course Assignment',
          message: `You have been assigned as instructor for "${updatedCourse.name}" (${updatedCourse.courseCode}).`,
          type: 'course',
          actionUrl: `/courses/${updatedCourse._id}`
        });
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
      return next(errorHandler(400, 'Cannot delete course with enrolled students'));
    }

    const courseName = course.name;
    const courseCode = course.courseCode;
    const instructorId = course.instructor?._id;

    await course.deleteOne();

    // ============= NOTIFICATION: Course Deleted =============
    
    try {
      // 1. NOTIFY ADMINS - Course deleted
      await NotificationService.createForRole('admin', {
        title: '🗑️ Course Deleted',
        message: `Course "${courseName}" (${courseCode}) was permanently deleted by ${req.user.name || 'an admin'}.`,
        type: 'course',
        actionUrl: '/courses'
      });

      // 2. NOTIFY INSTRUCTOR - Their course was deleted
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
        select: 'studentId phone dateOfBirth gender address emergencyContact', // Add phone and other fields
        populate: {
          path: 'user',
          select: 'name email'
        }
      })
      .select('enrolledStudents');

    if (!course) {
      return next(errorHandler(404, 'Course not found'));
    }

    res.json({
      success: true,
      data: course.enrolledStudents
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

    res.json({
      success: true,
      data: {
        totalCourses,
        activeCourses,
        totalEnrolled: totalEnrolled[0]?.total || 0,
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
    } else {
      // Students and parents see count of enrolled courses (handled by enrollment controller)
      return res.json({
        success: true,
        data: { count: 0 }
      });
    }

    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};