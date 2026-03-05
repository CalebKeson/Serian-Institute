import Enrollment from '../models/enrollment.model.js';
import Course from '../models/course.model.js';
import Student from '../models/student.model.js';
import User from '../models/user.model.js';
import { errorHandler } from '../utils/error.js';
import mongoose from 'mongoose';
import NotificationService from '../services/notificationService.js';

// @desc    Enroll student in course
// @route   POST /api/enrollments
export const enrollStudent = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    const { studentId, courseId, notes } = req.body;
    const enrolledBy = req.user._id;

    // Validate required fields
    if (!studentId || !courseId) {
      await session.abortTransaction();
      session.endSession();
      return next(errorHandler(400, 'Student ID and Course ID are required'));
    }

    // Check if student exists with populated user data
    const student = await Student.findById(studentId)
      .populate('user', 'name email')
      .session(session);
    
    if (!student) {
      await session.abortTransaction();
      session.endSession();
      return next(errorHandler(404, 'Student not found'));
    }

    // Check if course exists with populated instructor data
    const course = await Course.findById(courseId)
      .populate('instructor', 'name email')
      .session(session);
    
    if (!course) {
      await session.abortTransaction();
      session.endSession();
      return next(errorHandler(404, 'Course not found'));
    }

    // Check if course is active
    if (course.status !== 'active') {
      await session.abortTransaction();
      session.endSession();
      return next(errorHandler(400, 'Cannot enroll in inactive course'));
    }

    // Check if student is already enrolled
    const existingEnrollment = await Enrollment.findOne({
      student: studentId,
      course: courseId,
      status: 'enrolled'
    }).session(session);

    if (existingEnrollment) {
      await session.abortTransaction();
      session.endSession();
      return next(errorHandler(400, 'Student is already enrolled in this course'));
    }

    // Check if there's a dropped/completed enrollment that can be re-activated
    const existingHistorical = await Enrollment.findOne({
      student: studentId,
      course: courseId,
      status: { $in: ['dropped', 'completed'] }
    }).session(session);

    let enrollment;
    let isReenrollment = false;

    if (existingHistorical) {
      // Reactivate existing enrollment
      existingHistorical.status = 'enrolled';
      existingHistorical.enrollmentDate = new Date();
      existingHistorical.droppedDate = undefined;
      existingHistorical.completedDate = undefined;
      existingHistorical.notes = notes || existingHistorical.notes;
      existingHistorical.enrolledBy = enrolledBy;
      
      await existingHistorical.save({ session });
      enrollment = existingHistorical;
      isReenrollment = true;
    } else {
      // Check course capacity
      const enrolledCount = await Enrollment.countDocuments({
        course: courseId,
        status: 'enrolled'
      }).session(session);

      const maxStudents = course.maxStudents || 20;
      if (enrolledCount >= maxStudents) {
        await session.abortTransaction();
        session.endSession();
        return next(errorHandler(400, `Course is full. Maximum capacity is ${maxStudents} students`));
      }

      // Create new enrollment
      const [newEnrollment] = await Enrollment.create([{
        student: studentId,
        course: courseId,
        enrolledBy,
        notes,
        status: 'enrolled',
        enrollmentDate: new Date()
      }], { session });
      
      enrollment = newEnrollment;
    }

    // Update Course enrolledStudents array
    if (!course.enrolledStudents || !Array.isArray(course.enrolledStudents)) {
      course.enrolledStudents = [];
    }
    
    const studentExists = course.enrolledStudents.some(id => 
      id && id.toString() === studentId.toString()
    );
    
    if (!studentExists) {
      course.enrolledStudents.push(studentId);
      await course.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    const populatedEnrollment = await Enrollment.findById(enrollment._id)
      .populate({
        path: 'student',
        select: 'studentId',
        populate: {
          path: 'user',
          select: 'name email'
        }
      })
      .populate('course', 'courseCode name maxStudents instructor')
      .populate('enrolledBy', 'name email');

    // ============= NOTIFICATION: Student Enrolled =============
    
    try {
      const studentName = student.user?.name || 'A student';
      const courseName = course.name;
      const courseCode = course.courseCode;

      // 1. NOTIFY ADMINS - New enrollment
      await NotificationService.createForRole('admin', {
        title: isReenrollment ? '🔄 Student Re-enrolled' : '🎓 New Course Enrollment',
        message: `${studentName} has been ${isReenrollment ? 're-enrolled' : 'enrolled'} in ${courseCode} - ${courseName} by ${req.user.name || 'a staff member'}.`,
        type: 'course',
        actionUrl: `/courses/${courseId}/enrollments`
      });

      // 2. NOTIFY INSTRUCTOR - New student in their course
      if (course.instructor && course.instructor._id) {
        await NotificationService.createNotification({
          recipientId: course.instructor._id,
          title: '👨‍🎓 New Student Enrolled',
          message: `${studentName} has enrolled in your course: ${courseCode} - ${courseName}.`,
          type: 'course',
          actionUrl: `/courses/${courseId}/enrollments`
        });
      }

      // 3. NOTIFY THE STUDENT - Welcome to course
      if (student.user && student.user._id) {
        const welcomeMessage = isReenrollment 
          ? `You have been successfully re-enrolled in ${courseCode} - ${courseName}. Welcome back!`
          : `You have been successfully enrolled in ${courseCode} - ${courseName}. Your journey begins ${course.intakeMonth} ${course.intakeYear}.`;

        await NotificationService.createNotification({
          recipientId: student.user._id,
          title: isReenrollment ? '🔄 Welcome Back!' : '🎉 Welcome to the Course!',
          message: welcomeMessage,
          type: 'course',
          actionUrl: `/courses/${courseId}`
        });
      }

    } catch (notificationError) {
      console.error('Failed to send enrollment notifications:', notificationError);
    }

    res.status(201).json({
      success: true,
      data: {
        enrollment: populatedEnrollment,
        course
      },
      message: isReenrollment ? 'Student re-enrolled successfully' : 'Student enrolled successfully'
    });

  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    
    console.error('Enrollment error:', error);
    
    if (error.code === 11000) {
      return next(errorHandler(400, 'Student is already enrolled in this course'));
    }
    
    next(errorHandler(400, error.message || 'Failed to enroll student'));
  }
};

// @desc    Remove student from course
// @route   DELETE /api/enrollments
export const removeStudent = async (req, res, next) => {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    const { studentId, courseId } = req.body;

    if (!studentId || !courseId) {
      await session.abortTransaction();
      session.endSession();
      return next(errorHandler(400, 'Student ID and Course ID are required'));
    }

    // Find the enrollment with populated data
    const enrollment = await Enrollment.findOne({
      student: studentId,
      course: courseId,
      status: 'enrolled'
    })
      .populate({
        path: 'student',
        populate: { path: 'user', select: 'name email' }
      })
      .populate({
        path: 'course',
        populate: { path: 'instructor', select: 'name email' }
      })
      .session(session);

    if (!enrollment) {
      await session.abortTransaction();
      session.endSession();
      return next(errorHandler(404, 'Enrollment not found or student not enrolled'));
    }

    // Store data for notifications before updating
    const studentName = enrollment.student?.user?.name || 'A student';
    const courseName = enrollment.course?.name;
    const courseCode = enrollment.course?.courseCode;
    const instructorId = enrollment.course?.instructor?._id;
    const studentUserId = enrollment.student?.user?._id;

    // Update enrollment status to dropped
    enrollment.status = 'dropped';
    enrollment.droppedDate = new Date();
    await enrollment.save({ session });

    // SYNC: Remove student from Course model's enrolledStudents array
    const course = await Course.findById(courseId).session(session);
    if (course) {
      if (!course.enrolledStudents || !Array.isArray(course.enrolledStudents)) {
        course.enrolledStudents = [];
      }
      
      course.enrolledStudents = course.enrolledStudents.filter(id => 
        id && id.toString() !== studentId.toString()
      );
      
      await course.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    // ============= NOTIFICATION: Student Removed =============
    
    try {
      // 1. NOTIFY ADMINS - Student dropped
      await NotificationService.createForRole('admin', {
        title: '📉 Student Dropped Course',
        message: `${studentName} has been removed from ${courseCode} - ${courseName} by ${req.user.name || 'a staff member'}.`,
        type: 'course',
        actionUrl: `/courses/${courseId}/enrollments`
      });

      // 2. NOTIFY INSTRUCTOR - Student dropped from their course
      if (instructorId) {
        await NotificationService.createNotification({
          recipientId: instructorId,
          title: '📉 Student Dropped',
          message: `${studentName} has been removed from your course: ${courseCode} - ${courseName}.`,
          type: 'course',
          actionUrl: `/courses/${courseId}/enrollments`
        });
      }

      // 3. NOTIFY THE STUDENT - They've been removed
      if (studentUserId) {
        await NotificationService.createNotification({
          recipientId: studentUserId,
          title: '❌ Course Removal',
          message: `You have been removed from ${courseCode} - ${courseName}. If you believe this is an error, please contact the administration.`,
          type: 'course',
          actionUrl: `/courses`
        });
      }

    } catch (notificationError) {
      console.error('Failed to send removal notifications:', notificationError);
    }

    const populatedEnrollment = await Enrollment.findById(enrollment._id)
      .populate({
        path: 'student',
        select: 'studentId',
        populate: {
          path: 'user',
          select: 'name email'
        }
      })
      .populate('course', 'courseCode name');

    res.json({
      success: true,
      data: populatedEnrollment,
      message: 'Student removed from course successfully'
    });

  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    console.error('Remove student error:', error);
    next(errorHandler(400, error.message || 'Failed to remove student'));
  }
};

// @desc    Get enrollments for a course
// @route   GET /api/enrollments/course/:id
export const getCourseEnrollments = async (req, res, next) => {
  try {
    const { id: courseId } = req.params;
    const { status = 'enrolled' } = req.query;

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return next(errorHandler(404, 'Course not found'));
    }

    const enrollments = await Enrollment.find({ 
      course: courseId, 
      ...(status && { status })
    })
      .populate({
        path: 'student',
        select: 'studentId',
        populate: {
          path: 'user',
          select: 'name email'
        }
      })
      .populate('enrolledBy', 'name email')
      .sort({ enrollmentDate: -1 });

    res.json({
      success: true,
      data: enrollments,
      count: enrollments.length
    });

  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Get enrollments for a student
// @route   GET /api/enrollments/student/:id
export const getStudentEnrollments = async (req, res, next) => {
  try {
    const { id: studentId } = req.params;
    const { status = 'enrolled' } = req.query;

    // Check if student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return next(errorHandler(404, 'Student not found'));
    }

    const enrollments = await Enrollment.find({ 
      student: studentId,
      ...(status && { status })
    })
      .populate({
        path: 'course',
        select: 'courseCode name instructor schedule',
        populate: {
          path: 'instructor',
          select: 'name email'
        }
      })
      .populate('enrolledBy', 'name email')
      .sort({ enrollmentDate: -1 });

    res.json({
      success: true,
      data: enrollments,
      count: enrollments.length
    });

  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Update enrollment status
// @route   PUT /api/enrollments/:id
export const updateEnrollmentStatus = async (req, res, next) => {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    const { id } = req.params;
    const { status, grade, notes } = req.body;

    if (!id) {
      await session.abortTransaction();
      session.endSession();
      return next(errorHandler(400, 'Enrollment ID is required'));
    }

    // Find enrollment with populated data
    const enrollment = await Enrollment.findById(id)
      .populate({
        path: 'student',
        populate: { path: 'user', select: 'name email' }
      })
      .populate({
        path: 'course',
        populate: { path: 'instructor', select: 'name email' }
      })
      .session(session);
    
    if (!enrollment) {
      await session.abortTransaction();
      session.endSession();
      return next(errorHandler(404, 'Enrollment not found'));
    }

    // Store old status for comparison
    const oldStatus = enrollment.status;
    const studentName = enrollment.student?.user?.name || 'A student';
    const courseName = enrollment.course?.name;
    const courseCode = enrollment.course?.courseCode;
    const instructorId = enrollment.course?.instructor?._id;
    const studentUserId = enrollment.student?.user?._id;
    
    // Update enrollment fields
    if (status) enrollment.status = status;
    if (grade !== undefined) enrollment.grade = grade;
    if (notes !== undefined) enrollment.notes = notes;
    
    // Set date fields based on status
    if (status === 'dropped' && oldStatus !== 'dropped') {
      enrollment.droppedDate = new Date();
    } else if (status === 'completed' && oldStatus !== 'completed') {
      enrollment.completedDate = new Date();
    }
    
    await enrollment.save({ session });

    // SYNC: Update Course model's enrolledStudents array
    const course = await Course.findById(enrollment.course._id).session(session);
    
    if (course) {
      if (!course.enrolledStudents || !Array.isArray(course.enrolledStudents)) {
        course.enrolledStudents = [];
      }

      const studentId = enrollment.student._id.toString();
      const studentIdIndex = course.enrolledStudents.findIndex(id => 
        id && id.toString() === studentId
      );
      
      if (status === 'enrolled') {
        if (studentIdIndex === -1) {
          course.enrolledStudents.push(enrollment.student._id);
        }
      } else if (status === 'dropped' || status === 'completed') {
        if (studentIdIndex !== -1) {
          course.enrolledStudents.splice(studentIdIndex, 1);
        }
      }
      
      await course.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    // ============= NOTIFICATION: Enrollment Status Updated =============
    
    try {
      if (status && status !== oldStatus) {
        const statusMessages = {
          completed: {
            title: '✅ Course Completed',
            action: 'has completed',
            studentMessage: `Congratulations! You have successfully completed ${courseCode} - ${courseName}. Well done! 🎉`
          },
          dropped: {
            title: '📉 Course Dropped',
            action: 'has dropped',
            studentMessage: `You have been marked as dropped from ${courseCode} - ${courseName}.`
          },
          enrolled: {
            title: '🔄 Student Re-enrolled',
            action: 'has been re-enrolled in',
            studentMessage: `You have been re-enrolled in ${courseCode} - ${courseName}.`
          }
        };

        const config = statusMessages[status];
        
        if (config) {
          // 1. NOTIFY ADMINS - Status change
          await NotificationService.createForRole('admin', {
            title: config.title,
            message: `${studentName} ${config.action} ${courseCode} - ${courseName}.`,
            type: 'course',
            actionUrl: `/courses/${enrollment.course._id}/enrollments`
          });

          // 2. NOTIFY INSTRUCTOR - Status change in their course
          if (instructorId) {
            await NotificationService.createNotification({
              recipientId: instructorId,
              title: config.title,
              message: `${studentName} ${config.action} your course: ${courseCode} - ${courseName}.`,
              type: 'course',
              actionUrl: `/courses/${enrollment.course._id}/enrollments`
            });
          }

          // 3. NOTIFY THE STUDENT - Their status changed
          if (studentUserId) {
            await NotificationService.createNotification({
              recipientId: studentUserId,
              title: status === 'completed' ? '🎉 Course Completed!' : `Course Status Updated`,
              message: config.studentMessage,
              type: 'course',
              actionUrl: `/courses/${enrollment.course._id}`
            });
          }
        }

        // 4. Special notification for completed with grade
        if (status === 'completed' && grade && studentUserId) {
          await NotificationService.createNotification({
            recipientId: studentUserId,
            title: '📊 Grade Posted',
            message: `Your grade for ${courseCode} - ${courseName} is: ${grade}.`,
            type: 'course',
            actionUrl: `/courses/${enrollment.course._id}`
          });
        }
      }
    } catch (notificationError) {
      console.error('Failed to send status update notifications:', notificationError);
    }

    const populatedEnrollment = await Enrollment.findById(enrollment._id)
      .populate({
        path: 'student',
        select: 'studentId',
        populate: {
          path: 'user',
          select: 'name email'
        }
      })
      .populate('course', 'courseCode name')
      .populate('enrolledBy', 'name email');

    res.json({
      success: true,
      data: populatedEnrollment,
      message: 'Enrollment updated successfully'
    });

  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    console.error('Update enrollment error:', error);
    
    if (error.message && error.message.includes('length')) {
      return next(errorHandler(400, 'Course data issue detected. Please refresh the page.'));
    }
    
    next(errorHandler(400, error.message || 'Failed to update enrollment'));
  }
};

// @desc    Bulk enroll students
// @route   POST /api/enrollments/bulk
export const bulkEnrollStudents = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { courseId, studentIds, notes } = req.body;
    const enrolledBy = req.user._id;

    // Check if course exists with populated instructor
    const course = await Course.findById(courseId)
      .populate('instructor', 'name email')
      .session(session);
      
    if (!course) {
      await session.abortTransaction();
      session.endSession();
      return next(errorHandler(404, 'Course not found'));
    }

    // Check course capacity
    const maxStudents = course.maxStudents || 20;
    const currentEnrollments = await Enrollment.countDocuments({
      course: courseId,
      status: 'enrolled'
    }).session(session);

    const availableSpots = maxStudents - currentEnrollments;
    
    if (studentIds.length > availableSpots) {
      await session.abortTransaction();
      session.endSession();
      return next(errorHandler(400, `Only ${availableSpots} spots available. Cannot enroll ${studentIds.length} students`));
    }

    // Initialize course.enrolledStudents if needed
    if (!course.enrolledStudents || !Array.isArray(course.enrolledStudents)) {
      course.enrolledStudents = [];
    }

    const enrollments = [];
    const errors = [];
    const successfulStudents = [];

    // Process each student enrollment
    for (const studentId of studentIds) {
      try {
        // Check if student exists with user data
        const student = await Student.findById(studentId)
          .populate('user', 'name email')
          .session(session);
          
        if (!student) {
          errors.push(`Student ${studentId} not found`);
          continue;
        }

        // Check if already enrolled
        const existingEnrollment = await Enrollment.findOne({
          student: studentId,
          course: courseId,
          status: 'enrolled'
        }).session(session);

        if (existingEnrollment) {
          errors.push(`Student ${student.user?.name || studentId} is already enrolled`);
          continue;
        }

        // Create enrollment
        const [enrollment] = await Enrollment.create([{
          student: studentId,
          course: courseId,
          enrolledBy,
          notes,
          status: 'enrolled',
          enrollmentDate: new Date()
        }], { session });

        // Add to course.enrolledStudents if not already there
        if (!course.enrolledStudents.some(id => id && id.toString() === studentId.toString())) {
          course.enrolledStudents.push(studentId);
        }

        const populatedEnrollment = await Enrollment.findById(enrollment._id)
          .populate({
            path: 'student',
            select: 'studentId',
            populate: {
              path: 'user',
              select: 'name email'
            }
          })
          .populate('course', 'courseCode name');

        enrollments.push(populatedEnrollment);
        successfulStudents.push({
          id: studentId,
          name: student.user?.name || 'Unknown',
          email: student.user?.email
        });

      } catch (error) {
        errors.push(`Failed to enroll student ${studentId}: ${error.message}`);
      }
    }

    // Save the updated course with all new enrollments
    if (enrollments.length > 0) {
      await course.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    // ============= NOTIFICATION: Bulk Enrollment =============
    
    try {
      if (enrollments.length > 0) {
        const courseName = course.name;
        const courseCode = course.courseCode;

        // 1. NOTIFY ADMINS - Bulk enrollment completed
        await NotificationService.createForRole('admin', {
          title: '📚 Bulk Enrollment Completed',
          message: `${enrollments.length} students have been enrolled in ${courseCode} - ${courseName} by ${req.user.name || 'a staff member'}.`,
          type: 'course',
          actionUrl: `/courses/${courseId}/enrollments`
        });

        // 2. NOTIFY INSTRUCTOR - Multiple students enrolled
        if (course.instructor && course.instructor._id) {
          await NotificationService.createNotification({
            recipientId: course.instructor._id,
            title: '👥 Multiple Students Enrolled',
            message: `${enrollments.length} new students have been enrolled in your course: ${courseCode} - ${courseName}.`,
            type: 'course',
            actionUrl: `/courses/${courseId}/enrollments`
          });
        }

        // 3. NOTIFY EACH STUDENT - Welcome to course (limit to first 5 to avoid spam)
        const studentsToNotify = successfulStudents.slice(0, 5);
        for (const student of studentsToNotify) {
          const studentUser = await User.findOne({ email: student.email }).session(session);
          if (studentUser) {
            await NotificationService.createNotification({
              recipientId: studentUser._id,
              title: '🎉 Welcome to the Course!',
              message: `You have been enrolled in ${courseCode} - ${courseName}. Your journey begins ${course.intakeMonth} ${course.intakeYear}.`,
              type: 'course',
              actionUrl: `/courses/${courseId}`
            });
          }
        }

        // If more than 5 students, send a summary notification
        if (successfulStudents.length > 5) {
          // Could implement batch notification here
        }
      }
    } catch (notificationError) {
      console.error('Failed to send bulk enrollment notifications:', notificationError);
    }

    res.status(201).json({
      success: true,
      data: {
        enrollments,
        errors,
        summary: {
          attempted: studentIds.length,
          successful: enrollments.length,
          failed: errors.length
        }
      },
      message: `Successfully enrolled ${enrollments.length} students`
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(errorHandler(400, error.message));
  }
};

// @desc    Get enrollment statistics
// @route   GET /api/enrollments/stats
export const getEnrollmentStats = async (req, res, next) => {
  try {
    const stats = await Enrollment.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get today's enrollments
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayEnrollments = await Enrollment.countDocuments({
      enrollmentDate: { $gte: today }
    });

    // Get total active enrollments
    const activeEnrollments = await Enrollment.countDocuments({
      status: 'enrolled'
    });

    res.json({
      success: true,
      data: {
        byStatus: stats,
        total: await Enrollment.countDocuments(),
        today: todayEnrollments,
        active: activeEnrollments
      }
    });

  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Get enrollment count for sidebar (for students)
// @route   GET /api/enrollments/count/active
export const getActiveEnrollmentCount = async (req, res, next) => {
  try {
    let count = 0;
    
    if (req.user.role === 'student') {
      // Students see their own active enrollments
      const student = await Student.findOne({ user: req.user._id });
      if (student) {
        count = await Enrollment.countDocuments({
          student: student._id,
          status: 'enrolled'
        });
      }
    }

    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};