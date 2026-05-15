// controllers/grade.controller.js
import Grade from '../models/grade.model.js';
import GradingScale from '../models/gradingScale.model.js';
import Course from '../models/course.model.js';
import Student from '../models/student.model.js';
import Enrollment from '../models/enrollment.model.js';
import { errorHandler } from '../utils/error.js';
import { validateAcademicYear, getCurrentAcademicYear, validateGradeData } from '../utils/gradeValidation.js';
import mongoose from 'mongoose';
import NotificationService from '../services/notificationService.js';

// @desc    Create a single grade
// @route   POST /api/grades
// @access  Private (Instructor/Admin)
export const createGrade = async (req, res, next) => {
  try {
    const gradeData = req.body;
    const gradedBy = req.user.id;

    // Validate required fields
    const validation = validateGradeData(gradeData);
    if (!validation.isValid) {
      return next(errorHandler(400, validation.errors.join(', ')));
    }

    // Check if student exists
    const student = await Student.findById(gradeData.student)
      .populate('user', 'name email');
    
    if (!student) {
      return next(errorHandler(404, 'Student not found'));
    }

    // Check if course exists
    const course = await Course.findById(gradeData.course)
      .populate('instructor', 'name email');
    
    if (!course) {
      return next(errorHandler(404, 'Course not found'));
    }

    // Verify student is enrolled in the course
    const isEnrolled = await Enrollment.findOne({
      student: gradeData.student,
      course: gradeData.course,
      status: 'enrolled'
    });

    if (!isEnrolled) {
      return next(errorHandler(400, 'Student is not enrolled in this course'));
    }

    // Check if grade already exists for this assessment
    const existingGrade = await Grade.gradeExists(
      gradeData.student,
      gradeData.course,
      gradeData.assessmentName,
      gradeData.assessmentDate
    );

    if (existingGrade) {
      return next(errorHandler(400, 'Grade already exists for this assessment'));
    }

    // Set academic year if not provided
    if (!gradeData.academicYear) {
      gradeData.academicYear = getCurrentAcademicYear();
    }

    // Create grade
    const grade = await Grade.create({
      ...gradeData,
      gradedBy
    });

    // Populate and return
    const populatedGrade = await Grade.findById(grade._id)
      .populate('student', 'studentId user')
      .populate('course', 'courseCode name')
      .populate('gradedBy', 'name email');

    // ============= NOTIFICATIONS =============
    try {
      const studentName = student.user?.name || 'Student';
      const courseName = course.name;
      const assessmentType = grade.assessmentType === 'final' ? 'Final Grade' : grade.assessmentType;
      const gradeDisplay = grade.letterGrade || `${grade.percentage}%`;

      // 1. Notify the student
      if (student.user) {
        await NotificationService.createNotification({
          recipientId: student.user._id,
          title: '📊 New Grade Posted',
          message: `Your ${assessmentType} grade for ${courseName} has been posted. Grade: ${gradeDisplay}. ${grade.comments ? `Comments: ${grade.comments}` : ''}`,
          type: 'grade',
          actionUrl: `/grades`
        });
      }

      // 2. Notify the instructor (if different from grader)
      if (course.instructor && course.instructor._id.toString() !== req.user.id) {
        await NotificationService.createNotification({
          recipientId: course.instructor._id,
          title: '📊 Grade Posted',
          message: `A grade of ${gradeDisplay} was posted for ${studentName} in ${courseName} by ${req.user.name || 'an instructor'}.`,
          type: 'grade',
          actionUrl: `/courses/${course._id}/grades`
        });
      }

      // 3. Notify admins
      await NotificationService.createForRole('admin', {
        title: '📊 New Grade Recorded',
        message: `${studentName} received ${gradeDisplay} in ${courseName} for ${assessmentType}.`,
        type: 'grade',
        actionUrl: `/grades/${grade._id}`
      });

    } catch (notificationError) {
      console.error('Failed to send grade notifications:', notificationError);
    }

    res.status(201).json({
      success: true,
      data: populatedGrade,
      message: 'Grade created successfully'
    });

  } catch (error) {
    if (error.code === 11000) {
      return next(errorHandler(400, 'Duplicate grade entry'));
    }
    next(errorHandler(500, error.message));
  }
};

// @desc    Bulk create grades (CSV/Excel upload)
// @route   POST /api/grades/bulk
// @access  Private (Instructor/Admin)
export const bulkCreateGrades = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { grades } = req.body;
    const gradedBy = req.user.id;

    if (!grades || !Array.isArray(grades) || grades.length === 0) {
      return next(errorHandler(400, 'Grades array is required'));
    }

    const results = {
      successful: [],
      errors: []
    };

    // Process each grade
    for (const gradeData of grades) {
      try {
        // Validate
        const validation = validateGradeData(gradeData);
        if (!validation.isValid) {
          results.errors.push({
            data: gradeData,
            errors: validation.errors
          });
          continue;
        }

        // Check enrollment
        const isEnrolled = await Enrollment.findOne({
          student: gradeData.student,
          course: gradeData.course,
          status: 'enrolled'
        }).session(session);

        if (!isEnrolled) {
          results.errors.push({
            data: gradeData,
            errors: ['Student not enrolled in course']
          });
          continue;
        }

        // Set academic year
        if (!gradeData.academicYear) {
          gradeData.academicYear = getCurrentAcademicYear();
        }

        // Create grade
        const grade = await Grade.create([{
          ...gradeData,
          gradedBy
        }], { session });

        results.successful.push(grade[0]);
      } catch (error) {
        results.errors.push({
          data: gradeData,
          errors: [error.message]
        });
      }
    }

    await session.commitTransaction();
    session.endSession();

    // ============= NOTIFICATION FOR BULK CREATE =============
    if (results.successful.length > 0) {
      try {
        const course = await Course.findById(grades[0]?.course).populate('instructor', 'name email');
        const courseName = course?.name || 'Course';

        // Notify admins about bulk grade upload
        await NotificationService.createForRole('admin', {
          title: '📊 Bulk Grades Uploaded',
          message: `${results.successful.length} grade(s) were uploaded for ${courseName} by ${req.user.name || 'an instructor'}. ${results.errors.length} failed.`,
          type: 'grade',
          actionUrl: `/courses/${grades[0]?.course}/grades`
        });

        // Notify affected students (limit to first 10 to avoid spam)
        const notifiedStudents = new Set();
        for (const grade of results.successful.slice(0, 10)) {
          if (!notifiedStudents.has(grade.student.toString())) {
            notifiedStudents.add(grade.student.toString());
            const student = await Student.findById(grade.student).populate('user', 'name email');
            if (student?.user) {
              await NotificationService.createNotification({
                recipientId: student.user._id,
                title: '📊 New Grades Posted',
                message: `New grades have been posted for ${courseName}. Please check your grade portal for details.`,
                type: 'grade',
                actionUrl: `/grades`
              });
            }
          }
        }
      } catch (notificationError) {
        console.error('Failed to send bulk grade notifications:', notificationError);
      }
    }

    res.status(201).json({
      success: true,
      data: results,
      message: `Successfully created ${results.successful.length} grades`
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(errorHandler(500, error.message));
  }
};

// @desc    Get all grades for a course
// @route   GET /api/grades/course/:courseId
// @access  Private (Instructor/Admin/Student with restrictions)
export const getCourseGrades = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { term, academicYear, assessmentType, studentId, page = 1, limit = 50 } = req.query;

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return next(errorHandler(404, 'Course not found'));
    }

    // Build query
    const query = { course: courseId };
    
    if (term) query.term = term;
    if (academicYear) query.academicYear = academicYear;
    if (assessmentType) query.assessmentType = assessmentType;
    if (studentId) query.student = studentId;

    // If user is a student, only show published grades
    if (req.user.role === 'student') {
      query.isPublished = true;
      
      // Get the student's profile
      const student = await Student.findOne({ user: req.user._id });
      if (student) {
        query.student = student._id;
      }
    }

    const grades = await Grade.find(query)
      .populate('student', 'studentId user')
      .populate('course', 'courseCode name')
      .populate('gradedBy', 'name email')
      .sort({ assessmentDate: -1, assessmentName: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Grade.countDocuments(query);

    // Get statistics
    const statistics = await Grade.getCourseStatistics(courseId, term, academicYear);
    
    // Get grade distribution
    const distribution = await Grade.getGradeDistribution(courseId, term, academicYear);

    res.json({
      success: true,
      data: grades,
      statistics,
      distribution,
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

// @desc    Get all grades for a student
// @route   GET /api/grades/student/:studentId
// @access  Private (Student can view own, Admin/Instructor can view any)
export const getStudentGrades = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { academicYear, courseId, page = 1, limit = 50 } = req.query;

    // Check permissions
    let studentName = '';
    if (req.user.role === 'student') {
      const student = await Student.findOne({ user: req.user._id });
      if (!student || student._id.toString() !== studentId) {
        return next(errorHandler(403, 'Access denied'));
      }
      studentName = student.user?.name || '';
    }

    // Check if student exists
    const student = await Student.findById(studentId).populate('user', 'name email');
    if (!student) {
      return next(errorHandler(404, 'Student not found'));
    }

    // Build query
    const query = { student: studentId };
    if (academicYear) query.academicYear = academicYear;
    if (courseId) query.course = courseId;

    // Students can only see published grades
    if (req.user.role === 'student') {
      query.isPublished = true;
    }

    const grades = await Grade.find(query)
      .populate('course', 'courseCode name instructor')
      .populate('gradedBy', 'name email')
      .sort({ assessmentDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Grade.countDocuments(query);

    // Calculate statistics per course
    const courseStats = await Grade.aggregate([
      { $match: { student: new mongoose.Types.ObjectId(studentId) } },
      {
        $group: {
          _id: '$course',
          averagePercentage: { $avg: '$percentage' },
          totalCredits: { $sum: '$weight' },
          grades: { $push: '$$ROOT' }
        }
      },
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: '_id',
          as: 'courseInfo'
        }
      }
    ]);

    res.json({
      success: true,
      data: grades,
      courseStats,
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

// @desc    Get grades for a specific student in a specific course
// @route   GET /api/grades/student/:studentId/course/:courseId
// @access  Private
export const getStudentCourseGrades = async (req, res, next) => {
  try {
    const { studentId, courseId } = req.params;
    const { term, academicYear } = req.query;

    // Check permissions
    if (req.user.role === 'student') {
      const student = await Student.findOne({ user: req.user._id });
      if (!student || student._id.toString() !== studentId) {
        return next(errorHandler(403, 'Access denied'));
      }
    }

    const query = {
      student: studentId,
      course: courseId
    };

    if (term) query.term = term;
    if (academicYear) query.academicYear = academicYear;

    // Students can only see published grades
    if (req.user.role === 'student') {
      query.isPublished = true;
    }

    const grades = await Grade.find(query)
      .populate('course', 'courseCode name')
      .populate('gradedBy', 'name email')
      .sort({ assessmentDate: 1 });

    // Calculate weighted average
    let totalWeight = 0;
    let weightedSum = 0;

    grades.forEach(grade => {
      if (!grade.isDropped && grade.percentage) {
        weightedSum += grade.percentage * grade.weight;
        totalWeight += grade.weight;
      }
    });

    const finalGrade = totalWeight > 0 ? weightedSum / totalWeight : 0;

    // Get letter grade from grading scale
    const gradingScale = await GradingScale.getDefaultScale();
    const letterGrade = gradingScale.getLetterGrade(finalGrade);

    res.json({
      success: true,
      data: {
        grades,
        summary: {
          totalAssessments: grades.length,
          publishedCount: grades.filter(g => g.isPublished).length,
          weightedAverage: Math.round(finalGrade * 10) / 10,
          letterGrade,
          gpaValue: gradingScale.getGPAValue(finalGrade)
        }
      }
    });

  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Update a grade
// @route   PUT /api/grades/:id
// @access  Private (Instructor/Admin)
export const updateGrade = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const grade = await Grade.findById(id)
      .populate('student', 'studentId')
      .populate('student.user', 'name email')
      .populate('course', 'courseCode name');
    
    if (!grade) {
      return next(errorHandler(404, 'Grade not found'));
    }

    // Check permissions (only instructor who graded it or admin)
    if (req.user.role !== 'admin' && grade.gradedBy.toString() !== req.user.id) {
      return next(errorHandler(403, 'Not authorized to update this grade'));
    }

    // Track changes for notification
    const changes = [];
    const oldPercentage = grade.percentage;
    const oldLetter = grade.letterGrade;

    // Validate score if being updated
    if (updates.score && updates.maxScore) {
      if (updates.score > updates.maxScore) {
        return next(errorHandler(400, 'Score cannot exceed maximum score'));
      }
    } else if (updates.score && grade.maxScore) {
      if (updates.score > grade.maxScore) {
        return next(errorHandler(400, 'Score cannot exceed maximum score'));
      }
    }

    // Record changes
    if (updates.score && updates.score !== grade.score) {
      changes.push(`score changed from ${grade.score}/${grade.maxScore} to ${updates.score}/${grade.maxScore || updates.maxScore}`);
    }
    if (updates.letterGrade && updates.letterGrade !== grade.letterGrade) {
      changes.push(`letter grade changed from ${grade.letterGrade} to ${updates.letterGrade}`);
    }

    const updatedGrade = await Grade.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: Date.now() },
      { new: true, runValidators: true }
    )
      .populate('student', 'studentId user')
      .populate('course', 'courseCode name')
      .populate('gradedBy', 'name email');

    // ============= NOTIFICATIONS FOR UPDATE =============
    if (changes.length > 0 && grade.student?.user) {
      try {
        const courseName = grade.course.name;
        const studentName = grade.student.user?.name || 'Student';

        // Notify the student about grade change
        await NotificationService.createNotification({
          recipientId: grade.student.user._id,
          title: '📝 Grade Updated',
          message: `Your grade for ${courseName} has been updated. Changes: ${changes.join(', ')}. Please review your updated grade.`,
          type: 'grade',
          actionUrl: `/grades`
        });

        // Notify instructor (if different from updater)
        if (grade.gradedBy.toString() !== req.user.id) {
          await NotificationService.createNotification({
            recipientId: grade.gradedBy,
            title: '📝 Grade Modified',
            message: `A grade you posted for ${studentName} in ${courseName} was modified by ${req.user.name || 'an admin'}. Changes: ${changes.join(', ')}`,
            type: 'grade',
            actionUrl: `/courses/${grade.course._id}/grades`
          });
        }

        // Notify admins
        await NotificationService.createForRole('admin', {
          title: '📝 Grade Modified',
          message: `${studentName}'s grade in ${courseName} was updated by ${req.user.name || 'an instructor'}. Changes: ${changes.join(', ')}`,
          type: 'grade',
          actionUrl: `/grades/${updatedGrade._id}`
        });
      } catch (notificationError) {
        console.error('Failed to send grade update notifications:', notificationError);
      }
    }

    res.json({
      success: true,
      data: updatedGrade,
      message: 'Grade updated successfully'
    });

  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Delete a grade
// @route   DELETE /api/grades/:id
// @access  Private (Instructor/Admin)
export const deleteGrade = async (req, res, next) => {
  try {
    const { id } = req.params;

    const grade = await Grade.findById(id)
      .populate('student', 'studentId')
      .populate('student.user', 'name email')
      .populate('course', 'courseCode name');
    
    if (!grade) {
      return next(errorHandler(404, 'Grade not found'));
    }

    // Check permissions (only instructor who graded it or admin)
    if (req.user.role !== 'admin' && grade.gradedBy.toString() !== req.user.id) {
      return next(errorHandler(403, 'Not authorized to delete this grade'));
    }

    const studentName = grade.student?.user?.name || 'Student';
    const courseName = grade.course.name;
    const gradeDisplay = grade.letterGrade || `${grade.percentage}%`;

    await grade.deleteOne();

    // ============= NOTIFICATIONS FOR DELETE =============
    try {
      // Notify the student
      if (grade.student?.user) {
        await NotificationService.createNotification({
          recipientId: grade.student.user._id,
          title: '⚠️ Grade Removed',
          message: `Your grade (${gradeDisplay}) for ${courseName} has been removed from the system. If you believe this is an error, please contact your instructor.`,
          type: 'alert',
          actionUrl: `/grades`
        });
      }

      // Notify the instructor who graded it
      if (grade.gradedBy && grade.gradedBy.toString() !== req.user.id) {
        await NotificationService.createNotification({
          recipientId: grade.gradedBy,
          title: '🗑️ Grade Deleted',
          message: `The grade you posted for ${studentName} in ${courseName} (${gradeDisplay}) was deleted by ${req.user.name || 'an admin'}.`,
          type: 'alert',
          actionUrl: `/courses/${grade.course._id}/grades`
        });
      }

      // Notify admins
      await NotificationService.createForRole('admin', {
        title: '🗑️ Grade Deleted',
        message: `${studentName}'s grade (${gradeDisplay}) in ${courseName} was deleted by ${req.user.name || 'an instructor'}.`,
        type: 'grade',
        actionUrl: `/courses/${grade.course._id}/grades`
      });
    } catch (notificationError) {
      console.error('Failed to send grade deletion notifications:', notificationError);
    }

    res.json({
      success: true,
      message: 'Grade deleted successfully'
    });

  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Publish grades for a course
// @route   POST /api/grades/publish/:courseId
// @access  Private (Instructor/Admin)
export const publishGrades = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { studentIds, assessmentIds, sendNotifications = true } = req.body;

    const query = { course: courseId };
    
    if (studentIds && studentIds.length > 0) {
      query.student = { $in: studentIds };
    }
    
    if (assessmentIds && assessmentIds.length > 0) {
      query._id = { $in: assessmentIds };
    }

    const gradesToPublish = await Grade.find(query)
      .populate('student', 'studentId')
      .populate('student.user', 'name email')
      .populate('course', 'courseCode name');

    const result = await Grade.updateMany(
      query,
      { isPublished: true }
    );

    // ============= NOTIFICATIONS FOR PUBLISHING =============
    if (sendNotifications && result.modifiedCount > 0) {
      try {
        const courseName = gradesToPublish[0]?.course?.name || 'Course';
        
        // Notify admins
        await NotificationService.createForRole('admin', {
          title: '📊 Grades Published',
          message: `${result.modifiedCount} grade(s) were published for ${courseName} by ${req.user.name || 'an instructor'}.`,
          type: 'grade',
          actionUrl: `/courses/${courseId}/grades`
        });

        // Notify affected students (limit to first 20 to avoid spam)
        const notifiedStudents = new Set();
        for (const grade of gradesToPublish.slice(0, 20)) {
          if (!notifiedStudents.has(grade.student?._id?.toString())) {
            notifiedStudents.add(grade.student?._id?.toString());
            if (grade.student?.user) {
              await NotificationService.createNotification({
                recipientId: grade.student.user._id,
                title: '📊 Grades Available',
                message: `Your grades for ${courseName} have been published and are now available for viewing.`,
                type: 'grade',
                actionUrl: `/grades`
              });
            }
          }
        }

        // If more than 20 students, send a summary notification
        if (gradesToPublish.length > 20) {
          await NotificationService.createForRole('admin', {
            title: '📊 Bulk Grade Publication',
            message: `${gradesToPublish.length} students have had grades published for ${courseName}. Individual notifications were sent to a sample of students.`,
            type: 'grade',
            actionUrl: `/courses/${courseId}/grades`
          });
        }
      } catch (notificationError) {
        console.error('Failed to send grade publication notifications:', notificationError);
      }
    }

    res.json({
      success: true,
      data: result,
      message: `Published ${result.modifiedCount} grades`
    });

  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Calculate final grade for a student in a course
// @route   POST /api/grades/calculate/:studentId/:courseId
// @access  Private (Instructor/Admin)
export const calculateFinalGrade = async (req, res, next) => {
  try {
    const { studentId, courseId } = req.params;
    const { term, academicYear, publishImmediately = false } = req.body;

    const student = await Student.findById(studentId).populate('user', 'name email');
    const course = await Course.findById(courseId);

    if (!student || !course) {
      return next(errorHandler(404, 'Student or course not found'));
    }

    const query = {
      student: studentId,
      course: courseId
    };

    if (term) query.term = term;
    if (academicYear) query.academicYear = academicYear;

    const grades = await Grade.find(query);

    if (grades.length === 0) {
      return next(errorHandler(404, 'No grades found for this student/course'));
    }

    // Calculate weighted average
    let totalWeight = 0;
    let weightedSum = 0;

    grades.forEach(grade => {
      if (!grade.isDropped && grade.percentage) {
        weightedSum += grade.percentage * grade.weight;
        totalWeight += grade.weight;
      }
    });

    const finalPercentage = totalWeight > 0 ? weightedSum / totalWeight : 0;

    // Get letter grade
    const gradingScale = await GradingScale.getDefaultScale();
    const letterGrade = gradingScale.getLetterGrade(finalPercentage);

    // Create a final grade record
    const finalGrade = await Grade.create({
      student: studentId,
      course: courseId,
      assessmentType: 'final',
      assessmentName: 'Final Grade',
      score: finalPercentage,
      maxScore: 100,
      percentage: finalPercentage,
      letterGrade,
      weight: 1,
      term: term || 'Final',
      academicYear: academicYear || getCurrentAcademicYear(),
      assessmentDate: new Date(),
      gradedBy: req.user.id,
      isPublished: publishImmediately,
      comments: `Calculated from ${grades.length} assessments`
    });

    // ============= NOTIFICATION FOR FINAL GRADE =============
    try {
      if (student.user) {
        const gradeDisplay = letterGrade || `${finalPercentage.toFixed(1)}%`;
        let message = `Your final grade for ${course.name} has been calculated: ${gradeDisplay}.`;
        if (publishImmediately) {
          message += ` This grade has been published to your record.`;
        } else {
          message += ` The grade is pending review and will be published soon.`;
        }

        await NotificationService.createNotification({
          recipientId: student.user._id,
          title: '🎓 Final Grade Calculated',
          message: message,
          type: 'grade',
          actionUrl: `/grades`
        });
      }

      await NotificationService.createForRole('admin', {
        title: '🎓 Final Grade Calculated',
        message: `Final grade of ${letterGrade || finalPercentage.toFixed(1)}% calculated for ${student.user?.name || 'Student'} in ${course.name}.`,
        type: 'grade',
        actionUrl: `/grades/${finalGrade._id}`
      });
    } catch (notificationError) {
      console.error('Failed to send final grade notification:', notificationError);
    }

    res.json({
      success: true,
      data: {
        finalGrade,
        calculation: {
          assessmentsUsed: grades.length,
          weightedAverage: Math.round(finalPercentage * 10) / 10,
          letterGrade,
          gpaValue: gradingScale.getGPAValue(finalPercentage)
        }
      },
      message: 'Final grade calculated successfully'
    });

  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Get grade statistics for a course
// @route   GET /api/grades/stats/:courseId
// @access  Private (Instructor/Admin)
export const getGradeStatistics = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { term, academicYear } = req.query;

    // Get basic statistics
    const statistics = await Grade.getCourseStatistics(courseId, term, academicYear);
    
    // Get grade distribution
    const distribution = await Grade.getGradeDistribution(courseId, term, academicYear);

    // Get performance by assessment type
    const assessmentTypeStats = await Grade.aggregate([
      {
        $match: {
          course: new mongoose.Types.ObjectId(courseId),
          ...(term && { term }),
          ...(academicYear && { academicYear })
        }
      },
      {
        $group: {
          _id: '$assessmentType',
          averagePercentage: { $avg: '$percentage' },
          count: { $sum: 1 },
          highestScore: { $max: '$score' },
          lowestScore: { $min: '$score' }
        }
      }
    ]);

    // Get top performing students
    const topStudents = await Grade.aggregate([
      {
        $match: {
          course: new mongoose.Types.ObjectId(courseId),
          ...(term && { term }),
          ...(academicYear && { academicYear })
        }
      },
      {
        $group: {
          _id: '$student',
          averagePercentage: { $avg: '$percentage' },
          totalAssessments: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'students',
          localField: '_id',
          foreignField: '_id',
          as: 'studentInfo'
        }
      },
      { $sort: { averagePercentage: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      success: true,
      data: {
        overview: statistics,
        distribution,
        byAssessmentType: assessmentTypeStats,
        topStudents
      }
    });

  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Export grades as CSV
// @route   GET /api/grades/export/:courseId
// @access  Private (Instructor/Admin)
export const exportGrades = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { format = 'csv', term, academicYear } = req.query;

    const query = { course: courseId };
    if (term) query.term = term;
    if (academicYear) query.academicYear = academicYear;

    const grades = await Grade.find(query)
      .populate('student', 'studentId user')
      .populate('course', 'courseCode name')
      .sort({ 'student.user.name': 1, assessmentDate: 1 });

    if (format === 'csv') {
      // Create CSV header
      const headers = [
        'Student ID',
        'Student Name',
        'Email',
        'Course Code',
        'Course Name',
        'Assessment Type',
        'Assessment Name',
        'Score',
        'Max Score',
        'Percentage',
        'Letter Grade',
        'Weight',
        'Term',
        'Academic Year',
        'Assessment Date',
        'Comments',
        'Published'
      ];

      // Create CSV rows
      const rows = grades.map(grade => [
        grade.student?.studentId || '',
        grade.student?.user?.name || '',
        grade.student?.user?.email || '',
        grade.course?.courseCode || '',
        grade.course?.name || '',
        grade.assessmentType,
        grade.assessmentName,
        grade.score,
        grade.maxScore,
        grade.percentage?.toFixed(1) || '',
        grade.letterGrade || '',
        grade.weight,
        grade.term,
        grade.academicYear,
        new Date(grade.assessmentDate).toLocaleDateString(),
        grade.comments || '',
        grade.isPublished ? 'Yes' : 'No'
      ]);

      const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=grades_${courseId}_${new Date().toISOString().split('T')[0]}.csv`);
      
      return res.send(csvContent);
    }

    // Default JSON response
    res.json({
      success: true,
      data: grades
    });

  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Get all grading scales
// @route   GET /api/grades/scales
// @access  Private
export const getGradingScales = async (req, res, next) => {
  try {
    const { type, courseId } = req.query;

    const query = { isActive: true };
    
    if (type) query.type = type;
    if (courseId) {
      query.$or = [
        { course: courseId },
        { course: null, isDefault: true }
      ];
    }

    const scales = await GradingScale.find(query)
      .populate('createdBy', 'name email')
      .sort({ isDefault: -1, name: 1 });

    res.json({
      success: true,
      data: scales
    });

  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Create a new grading scale
// @route   POST /api/grades/scales
// @access  Private (Admin only)
export const createGradingScale = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return next(errorHandler(403, 'Only admins can create grading scales'));
    }

    const scaleData = req.body;

    // Validate scale entries
    if (scaleData.type === 'letter') {
      let prevMax = -1;
      for (const entry of scaleData.scale) {
        if (entry.minPercentage <= prevMax) {
          return next(errorHandler(400, 'Grade ranges must not overlap'));
        }
        if (entry.minPercentage > entry.maxPercentage) {
          return next(errorHandler(400, 'Min percentage cannot be greater than max'));
        }
        prevMax = entry.maxPercentage;
      }
    }

    const scale = await GradingScale.create({
      ...scaleData,
      createdBy: req.user.id
    });

    // ============= NOTIFICATION FOR NEW GRADING SCALE =============
    try {
      await NotificationService.createForRole('admin', {
        title: '📏 New Grading Scale Created',
        message: `${req.user.name || 'An admin'} created a new grading scale: ${scale.name}`,
        type: 'system',
        actionUrl: `/grades/scales`
      });
    } catch (notificationError) {
      console.error('Failed to send grading scale notification:', notificationError);
    }

    res.status(201).json({
      success: true,
      data: scale,
      message: 'Grading scale created successfully'
    });

  } catch (error) {
    if (error.code === 11000) {
      return next(errorHandler(400, 'Scale name already exists'));
    }
    next(errorHandler(500, error.message));
  }
};