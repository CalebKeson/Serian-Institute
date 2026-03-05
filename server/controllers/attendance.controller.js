// controllers/attendanceController.js
import Attendance from '../models/attendance.model.js';
import Course from '../models/course.model.js';
import Student from '../models/student.model.js';
import Enrollment from '../models/enrollment.model.js';
import { errorHandler } from '../utils/error.js';

// @desc    Mark attendance for a student
// @route   POST /api/attendance
export const markAttendance = async (req, res, next) => {
  try {
    const { studentId, courseId, date, session, status, checkInTime, notes, excusedReason } = req.body;
    const markedBy = req.user.id;

    // Validate required fields
    if (!studentId || !courseId || !date || !status) {
      return next(errorHandler(400, 'Student, course, date, and status are required'));
    }

    // Check if student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return next(errorHandler(404, 'Student not found'));
    }

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return next(errorHandler(404, 'Course not found'));
    }

    // Check if student is enrolled in the course
    const isEnrolled = await Enrollment.findOne({
      student: studentId,
      course: courseId,
      status: 'enrolled'
    });

    if (!isEnrolled) {
      return next(errorHandler(400, 'Student is not enrolled in this course'));
    }

    // Parse and validate date
    const attendanceDate = new Date(date);
    if (isNaN(attendanceDate.getTime())) {
      return next(errorHandler(400, 'Invalid date format'));
    }

    // Check if attendance already exists for this student/course/date/session
    const existingAttendance = await Attendance.attendanceExists(studentId, courseId, attendanceDate, session);
    if (existingAttendance) {
      return next(errorHandler(400, 'Attendance already marked for this student on this date and session'));
    }

    // Validate check-in time for late status
    if (status === 'late' && !checkInTime) {
      return next(errorHandler(400, 'Check-in time is required for late attendance'));
    }

    // Validate excused reason for excused status
    if (status === 'excused' && !excusedReason) {
      return next(errorHandler(400, 'Excused reason is required for excused attendance'));
    }

    // Create attendance record
    const attendance = await Attendance.create({
      student: studentId,
      course: courseId,
      date: attendanceDate,
      session,
      status,
      checkInTime: status === 'late' ? checkInTime : undefined,
      notes,
      excusedReason: status === 'excused' ? excusedReason : undefined,
      markedBy
    });

    // Populate and return the attendance record
    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate('student', 'studentId user')
      .populate('course', 'courseCode name')
      .populate('markedBy', 'name email');

    res.status(201).json({
      success: true,
      data: populatedAttendance,
      message: 'Attendance marked successfully'
    });

  } catch (error) {
    if (error.code === 11000) {
      return next(errorHandler(400, 'Attendance already exists for this student on this date and session'));
    }
    next(errorHandler(400, error.message));
  }
};

// @desc    Bulk mark attendance for multiple students
// @route   POST /api/attendance/bulk
export const bulkMarkAttendance = async (req, res, next) => {
  try {
    const { courseId, date, session, attendanceData } = req.body;
    const markedBy = req.user.id;

    // Validate required fields
    if (!courseId || !date || !session || !attendanceData || !Array.isArray(attendanceData)) {
      return next(errorHandler(400, 'Course, date, session, and attendance data are required'));
    }

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return next(errorHandler(404, 'Course not found'));
    }

    // Parse and validate date
    const attendanceDate = new Date(date);
    if (isNaN(attendanceDate.getTime())) {
      return next(errorHandler(400, 'Invalid date format'));
    }

    const results = {
      successful: [],
      errors: []
    };

    // Process each attendance record
    for (const record of attendanceData) {
      try {
        const { studentId, status, checkInTime, notes, excusedReason } = record;

        // Validate required fields for each record
        if (!studentId || !status) {
          results.errors.push(`Missing studentId or status for record: ${JSON.stringify(record)}`);
          continue;
        }

        // Check if student exists
        const student = await Student.findById(studentId);
        if (!student) {
          results.errors.push(`Student not found: ${studentId}`);
          continue;
        }

        // Check if student is enrolled in the course
        const isEnrolled = await Enrollment.findOne({
          student: studentId,
          course: courseId,
          status: 'enrolled'
        });

        if (!isEnrolled) {
          results.errors.push(`Student ${student.user.name} is not enrolled in this course`);
          continue;
        }

        // Check if attendance already exists
        const existingAttendance = await Attendance.attendanceExists(studentId, courseId, attendanceDate, session);
        if (existingAttendance) {
          // Update existing record instead of creating new one
          const updatedAttendance = await Attendance.findOneAndUpdate(
            {
              student: studentId,
              course: courseId,
              date: {
                $gte: new Date(attendanceDate.setHours(0, 0, 0, 0)),
                $lt: new Date(attendanceDate.setHours(23, 59, 59, 999))
              },
              session: session
            },
            {
              status,
              checkInTime: status === 'late' ? checkInTime : undefined,
              notes,
              excusedReason: status === 'excused' ? excusedReason : undefined,
              markedBy,
              markedAt: new Date()
            },
            { new: true, runValidators: true }
          )
            .populate('student', 'studentId user')
            .populate('course', 'courseCode name')
            .populate('markedBy', 'name email');

          results.successful.push(updatedAttendance);
        } else {
          // Create new attendance record
          const attendance = await Attendance.create({
            student: studentId,
            course: courseId,
            date: attendanceDate,
            session,
            status,
            checkInTime: status === 'late' ? checkInTime : undefined,
            notes,
            excusedReason: status === 'excused' ? excusedReason : undefined,
            markedBy
          });

          const populatedAttendance = await Attendance.findById(attendance._id)
            .populate('student', 'studentId user')
            .populate('course', 'courseCode name')
            .populate('markedBy', 'name email');

          results.successful.push(populatedAttendance);
        }

      } catch (error) {
        results.errors.push(`Failed to process record for student ${record.studentId}: ${error.message}`);
      }
    }

    res.status(201).json({
      success: true,
      data: {
        successful: results.successful,
        errors: results.errors,
        summary: {
          attempted: attendanceData.length,
          successful: results.successful.length,
          failed: results.errors.length
        }
      },
      message: `Successfully processed ${results.successful.length} attendance records`
    });

  } catch (error) {
    next(errorHandler(400, error.message));
  }
};

// @desc    Get attendance for a course on a specific date
// @route   GET /api/attendance/course/:id
export const getCourseAttendance = async (req, res, next) => {
  try {
    const { id: courseId } = req.params;
    const { date, session } = req.query;

    if (!date) {
      return next(errorHandler(400, 'Date is required'));
    }

    // Parse date
    const attendanceDate = new Date(date);
    if (isNaN(attendanceDate.getTime())) {
      return next(errorHandler(400, 'Invalid date format'));
    }

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return next(errorHandler(404, 'Course not found'));
    }

    const attendance = await Attendance.getCourseAttendance(courseId, attendanceDate, session);

    // If no attendance records exist, return enrolled students with default status
    if (attendance.length === 0) {
      const enrolledStudents = await Enrollment.find({
        course: courseId,
        status: 'enrolled'
      }).populate({
        path: 'student',
        populate: {
          path: 'user',
          select: 'name email'
        }
      });

      const studentsWithDefaultAttendance = enrolledStudents.map(enrollment => ({
        _id: null,
        student: {
          ...enrollment.student.toObject(),
          phone: enrollment.student.phone // Make sure phone is included
        },
        course: courseId,
        date: attendanceDate,
        session: session || 'full-day',
        status: 'absent',
        checkInTime: null,
        notes: '',
        isExcused: false,
        markedBy: null,
        markedAt: null,
        createdAt: null,
        updatedAt: null
      }));

      return res.json({
        success: true,
        data: studentsWithDefaultAttendance,
        message: 'No attendance records found for this date. Showing enrolled students with default status.'
      });
    }

    res.json({
      success: true,
      data: attendance,
      count: attendance.length
    });

  } catch (error) {
    next(errorHandler(500, error.message));
  }
};
// @desc    Get attendance history for a student
// @route   GET /api/attendance/student/:id
export const getStudentAttendance = async (req, res, next) => {
  try {
    const { id: studentId } = req.params;
    const { startDate, endDate, courseId, page = 1, limit = 20 } = req.query;

    // Validate date range
    if (!startDate || !endDate) {
      return next(errorHandler(400, 'Start date and end date are required'));
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return next(errorHandler(400, 'Invalid date format'));
    }

    if (start > end) {
      return next(errorHandler(400, 'Start date cannot be after end date'));
    }

    // Check if student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return next(errorHandler(404, 'Student not found'));
    }

    const query = {
      student: studentId,
      date: { $gte: start, $lte: end }
    };

    if (courseId) {
      query.course = courseId;
    }

    const attendance = await Attendance.find(query)
      .populate('course', 'courseCode name instructor')
      .populate('markedBy', 'name email')
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Attendance.countDocuments(query);

    res.json({
      success: true,
      data: attendance,
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

// @desc    Update attendance record
// @route   PUT /api/attendance/:id
export const updateAttendance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, checkInTime, notes, excusedReason } = req.body;
    const updatedBy = req.user.id;

    const attendance = await Attendance.findByIdAndUpdate(
      id,
      {
        status,
        checkInTime: status === 'late' ? checkInTime : undefined,
        notes,
        excusedReason: status === 'excused' ? excusedReason : undefined,
        markedBy: updatedBy,
        markedAt: new Date()
      },
      { new: true, runValidators: true }
    )
      .populate('student', 'studentId user')
      .populate('course', 'courseCode name')
      .populate('markedBy', 'name email');

    if (!attendance) {
      return next(errorHandler(404, 'Attendance record not found'));
    }

    res.json({
      success: true,
      data: attendance,
      message: 'Attendance updated successfully'
    });

  } catch (error) {
    if (error.code === 11000) {
      return next(errorHandler(400, 'Attendance record already exists for this student on this date and session'));
    }
    next(errorHandler(400, error.message));
  }
};

// @desc    Get attendance statistics
// @route   GET /api/attendance/stats
export const getAttendanceStats = async (req, res, next) => {
  try {
    const { courseId, studentId, startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return next(errorHandler(400, 'Start date and end date are required'));
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return next(errorHandler(400, 'Invalid date format'));
    }

    let stats;

    if (courseId) {
      // Course-specific statistics
      const course = await Course.findById(courseId);
      if (!course) {
        return next(errorHandler(404, 'Course not found'));
      }

      stats = await Attendance.getAttendanceStats(courseId, start, end);
    } else if (studentId) {
      // Student-specific statistics
      const student = await Student.findById(studentId);
      if (!student) {
        return next(errorHandler(404, 'Student not found'));
      }

      const attendanceRecords = await Attendance.find({
        student: studentId,
        date: { $gte: start, $lte: end }
      });

      const total = attendanceRecords.length;
      const present = attendanceRecords.filter(a => a.status === 'present').length;
      const absent = attendanceRecords.filter(a => a.status === 'absent').length;
      const late = attendanceRecords.filter(a => a.status === 'late').length;
      const excused = attendanceRecords.filter(a => a.status === 'excused').length;

      stats = [{
        total,
        present,
        absent,
        late,
        excused,
        attendanceRate: total > 0 ? ((present + excused) / total) * 100 : 0
      }];
    } else {
      return next(errorHandler(400, 'Either courseId or studentId is required'));
    }

    res.json({
      success: true,
      data: stats[0] || {
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
        attendanceRate: 0
      }
    });

  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Get attendance calendar for a student
// @route   GET /api/attendance/calendar/:studentId
export const getAttendanceCalendar = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { year, month, courseId } = req.query;

    if (!year || !month) {
      return next(errorHandler(400, 'Year and month are required'));
    }

    // Check if student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return next(errorHandler(404, 'Student not found'));
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const query = {
      student: studentId,
      date: { $gte: startDate, $lte: endDate }
    };

    if (courseId) {
      query.course = courseId;
    }

    const attendance = await Attendance.find(query)
      .select('date status course session')
      .populate('course', 'courseCode name color')
      .sort({ date: 1 });

    // Format data for calendar
    const calendarData = attendance.map(record => ({
      date: record.date.toISOString().split('T')[0],
      status: record.status,
      course: record.course.courseCode,
      courseName: record.course.name,
      session: record.session
    }));

    res.json({
      success: true,
      data: calendarData,
      period: {
        startDate,
        endDate,
        year: parseInt(year),
        month: parseInt(month)
      }
    });

  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Get student attendance summary
// @route   GET /api/attendance/student/:studentId/summary
export const getStudentSummary = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { courseId, startDate, endDate } = req.query;

    // Build query
    const query = { student: studentId };
    
    if (courseId) {
      query.course = courseId;
    }
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Get all attendance records
    const records = await Attendance.find(query)
      .populate('course', 'name courseCode')
      .sort({ date: 1 });

    // Calculate statistics
    const totalDays = records.length;
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const late = records.filter(r => r.status === 'late').length;
    const excused = records.filter(r => r.status === 'excused').length;
    
    const attendanceRate = totalDays > 0 
      ? ((present + excused) / totalDays) * 100 
      : 0;

    // Calculate streaks
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    records.forEach((record, index) => {
      if (record.status === 'present' || record.status === 'excused') {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
        
        // Check if this is the most recent record for current streak
        if (index === records.length - 1) {
          currentStreak = tempStreak;
        }
      } else {
        tempStreak = 0;
      }
    });

    // Find best and worst days
    const dayStats = {};
    records.forEach(record => {
      const day = new Date(record.date).toLocaleDateString('en-US', { weekday: 'long' });
      if (!dayStats[day]) {
        dayStats[day] = { total: 0, present: 0 };
      }
      dayStats[day].total++;
      if (record.status === 'present' || record.status === 'excused') {
        dayStats[day].present++;
      }
    });

    let bestDay = 'N/A';
    let worstDay = 'N/A';
    let bestRate = 0;
    let worstRate = 100;

    Object.entries(dayStats).forEach(([day, stats]) => {
      const rate = (stats.present / stats.total) * 100;
      if (rate > bestRate) {
        bestRate = rate;
        bestDay = day;
      }
      if (rate < worstRate) {
        worstRate = rate;
        worstDay = day;
      }
    });

    // Get most common status
    const statusCounts = { present, absent, late, excused };
    const mostCommon = Object.keys(statusCounts).reduce((a, b) => 
      statusCounts[a] > statusCounts[b] ? a : b
    );

    // Calculate this week's attendance
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const thisWeekRecords = records.filter(r => 
      r.date >= startOfWeek && r.date <= endOfWeek
    );
    
    const thisWeekPresent = thisWeekRecords.filter(r => 
      r.status === 'present' || r.status === 'excused'
    ).length;

    res.json({
      success: true,
      data: {
        totalDays,
        totalRecords: totalDays,
        present,
        absent,
        late,
        excused,
        attendanceRate: Math.round(attendanceRate * 10) / 10,
        consecutiveAbsences: await getConsecutiveAbsenceCount(studentId, courseId),
        currentStreak,
        longestStreak,
        bestDay,
        worstDay,
        mostCommon,
        thisWeek: thisWeekPresent
      }
    });

  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Get student calendar data
// @route   GET /api/attendance/student/:studentId/calendar
export const getStudentCalendar = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { year, month, courseId } = req.query;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const query = {
      student: studentId,
      date: { $gte: startDate, $lte: endDate }
    };

    if (courseId) {
      query.course = courseId;
    }

    const records = await Attendance.find(query)
      .populate('course', 'name')
      .select('date status checkInTime notes course');

    const calendarData = records.map(record => ({
      date: record.date.toISOString().split('T')[0],
      status: record.status,
      checkInTime: record.checkInTime,
      notes: record.notes,
      courseName: record.course?.name
    }));

    res.json({
      success: true,
      data: calendarData
    });

  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Get student course breakdown
// @route   GET /api/attendance/student/:studentId/courses
export const getStudentCourseBreakdown = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;

    // Get all enrollments for the student
    const enrollments = await Enrollment.find({ 
      student: studentId,
      status: 'enrolled'
    }).populate('course');

    const courseData = [];

    for (const enrollment of enrollments) {
      const course = enrollment.course;
      
      // Build date filter
      const dateFilter = {};
      if (startDate && endDate) {
        dateFilter.date = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      // Get attendance records for this course
      const records = await Attendance.find({
        student: studentId,
        course: course._id,
        ...dateFilter
      }).sort({ date: -1 });

      const totalClasses = records.length;
      const present = records.filter(r => r.status === 'present').length;
      const absent = records.filter(r => r.status === 'absent').length;
      const late = records.filter(r => r.status === 'late').length;
      const excused = records.filter(r => r.status === 'excused').length;
      
      const attendanceRate = totalClasses > 0 
        ? Math.round(((present + excused) / totalClasses) * 100) 
        : 0;

      // Calculate trend (compare with previous period)
      let trend = 0;
      if (records.length >= 10) {
        const midPoint = Math.floor(records.length / 2);
        const firstHalf = records.slice(0, midPoint);
        const secondHalf = records.slice(midPoint);
        
        const firstHalfRate = firstHalf.filter(r => r.status === 'present' || r.status === 'excused').length / firstHalf.length * 100;
        const secondHalfRate = secondHalf.filter(r => r.status === 'present' || r.status === 'excused').length / secondHalf.length * 100;
        
        trend = Math.round(secondHalfRate - firstHalfRate);
      }

      courseData.push({
        courseId: course._id,
        courseCode: course.courseCode,
        courseName: course.name,
        instructor: course.instructor?.name || 'Unknown',
        totalClasses,
        present,
        absent,
        late,
        excused,
        attendanceRate,
        trend,
        recentAttendance: records.slice(0, 5).map(r => ({
          date: r.date,
          status: r.status,
          checkInTime: r.checkInTime,
          notes: r.notes
        }))
      });
    }

    res.json({
      success: true,
      data: courseData
    });

  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Get consecutive absences
// @route   GET /api/attendance/student/:studentId/absences/consecutive
export const getConsecutiveAbsences = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { courseId } = req.query;

    const query = { student: studentId };
    if (courseId) query.course = courseId;

    const records = await Attendance.find(query)
      .sort({ date: -1 })
      .limit(30); // Check last 30 days

    let consecutiveCount = 0;
    const absenceDates = [];

    for (const record of records) {
      if (record.status === 'absent') {
        consecutiveCount++;
        absenceDates.push(record.date);
      } else {
        break; // Stop at first non-absent
      }
    }

    res.json({
      success: true,
      data: {
        count: consecutiveCount,
        dates: absenceDates
      }
    });

  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Get student attendance trend
// @route   GET /api/attendance/student/:studentId/trend
export const getStudentTrend = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate, courseId } = req.query;

    const query = {
      student: studentId,
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    if (courseId) {
      query.course = courseId;
    }

    const records = await Attendance.find(query).sort({ date: 1 });

    // Group by week for trend data
    const weeklyData = [];
    const weeklyMap = new Map();

    records.forEach(record => {
      const date = new Date(record.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeklyMap.has(weekKey)) {
        weeklyMap.set(weekKey, {
          week: `Week ${weeklyMap.size + 1}`,
          date: weekKey,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          total: 0
        });
      }
      
      const week = weeklyMap.get(weekKey);
      week[record.status]++;
      week.total++;
    });

    weeklyData.push(...weeklyMap.values());

    res.json({
      success: true,
      data: weeklyData
    });

  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// Helper function to get consecutive absence count
async function getConsecutiveAbsenceCount(studentId, courseId) {
  const query = { student: studentId };
  if (courseId) query.course = courseId;

  const records = await Attendance.find(query)
    .sort({ date: -1 })
    .limit(10);

  let count = 0;
  for (const record of records) {
    if (record.status === 'absent') {
      count++;
    } else {
      break;
    }
  }
  return count;
}

// @desc    Get attendance report for date range
// @route   GET /api/attendance/reports
export const getAttendanceReport = async (req, res, next) => {
  try {
    const { courseId, studentId, startDate, endDate, status, groupBy } = req.query;
    
    if (!courseId && !studentId) {
      return next(errorHandler(400, 'Either courseId or studentId is required'));
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    // Build query
    const query = {
      date: { $gte: start, $lte: end }
    };
    
    if (courseId) query.course = courseId;
    if (studentId) query.student = studentId;
    if (status) query.status = status;
    
    // Get all attendance records in date range
    const records = await Attendance.find(query)
      .populate('student', 'studentId user')
      .populate('course', 'courseCode name')
      .sort({ date: 1 });
    
    // Calculate summary statistics
    const summary = {
      totalDays: 0,
      totalRecords: records.length,
      present: records.filter(r => r.status === 'present').length,
      absent: records.filter(r => r.status === 'absent').length,
      late: records.filter(r => r.status === 'late').length,
      excused: records.filter(r => r.status === 'excused').length,
    };
    
    // Calculate unique days
    const uniqueDays = new Set(records.map(r => r.date.toISOString().split('T')[0]));
    summary.totalDays = uniqueDays.size;
    
    // Get enrolled count for attendance rate calculation
    let enrolledCount = 0;
    if (courseId) {
      const course = await Course.findById(courseId);
      enrolledCount = course?.enrolledStudents?.length || 0;
    } else {
      enrolledCount = 1; // For student reports
    }
    
    const totalPossible = summary.totalDays * enrolledCount;
    summary.attendanceRate = totalPossible > 0 
      ? ((summary.present + summary.excused) / totalPossible) * 100 
      : 0;
    
    summary.averageAttendance = summary.totalDays > 0 
      ? (summary.present + summary.late) / summary.totalDays 
      : 0;
    
    // Group data by day/week/month
    let groupedData = [];
    if (groupBy === 'week') {
      // Group by week
      const weekMap = new Map();
      records.forEach(record => {
        const date = new Date(record.date);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekKey = weekStart.toISOString().split('T')[0];
        
        if (!weekMap.has(weekKey)) {
          weekMap.set(weekKey, {
            date: weekKey,
            present: 0,
            absent: 0,
            late: 0,
            excused: 0
          });
        }
        
        const week = weekMap.get(weekKey);
        week[record.status]++;
      });
      groupedData = Array.from(weekMap.values());
    } else if (groupBy === 'month') {
      // Group by month
      const monthMap = new Map();
      records.forEach(record => {
        const date = new Date(record.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthMap.has(monthKey)) {
          monthMap.set(monthKey, {
            date: monthKey,
            present: 0,
            absent: 0,
            late: 0,
            excused: 0
          });
        }
        
        const month = monthMap.get(monthKey);
        month[record.status]++;
      });
      groupedData = Array.from(monthMap.values());
    } else {
      // Group by day (default)
      groupedData = Array.from(uniqueDays).map(date => {
        const dayRecords = records.filter(r => 
          r.date.toISOString().split('T')[0] === date
        );
        return {
          date,
          present: dayRecords.filter(r => r.status === 'present').length,
          absent: dayRecords.filter(r => r.status === 'absent').length,
          late: dayRecords.filter(r => r.status === 'late').length,
          excused: dayRecords.filter(r => r.status === 'excused').length,
        };
      });
    }
    
    res.json({
      success: true,
      data: groupedData,
      summary
    });
    
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// ============= CHART DATA CONTROLLERS =============

// @desc    Get daily trend data for course (IMPROVED ACCURACY)
// @route   GET /api/attendance/course/:courseId/trend
export const getDailyTrend = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return next(errorHandler(400, 'Start date and end date are required'));
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Get course details including schedule
    const course = await Course.findById(courseId);
    if (!course) {
      return next(errorHandler(404, 'Course not found'));
    }

    // Get all enrolled students (active enrollments only)
    const activeEnrollments = await Enrollment.find({
      course: courseId,
      status: 'enrolled'
    }).select('student');
    
    const enrolledStudentIds = activeEnrollments.map(e => e.student.toString());

    // Get attendance records for the date range
    const records = await Attendance.find({
      course: courseId,
      date: { $gte: start, $lte: end }
    }).sort({ date: 1 });

    // Create a map of dates to attendance records
    const attendanceByDate = new Map();
    records.forEach(record => {
      const dateStr = record.date.toISOString().split('T')[0];
      if (!attendanceByDate.has(dateStr)) {
        attendanceByDate.set(dateStr, []);
      }
      attendanceByDate.get(dateStr).push(record);
    });

    // Generate daily data
    const dailyData = [];
    const currentDate = new Date(start);
    
    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      // Check if this is a class day based on course schedule
      const isClassDay = course.schedule?.days?.some(day => {
        const dayMap = {
          'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
          'Thursday': 4, 'Friday': 5, 'Saturday': 6
        };
        return dayMap[day] === dayOfWeek;
      });

      // Get attendance records for this date
      const dayRecords = attendanceByDate.get(dateStr) || [];
      
      // Count students who were marked present/late/excused
      const presentCount = dayRecords.filter(r => r.status === 'present').length;
      const lateCount = dayRecords.filter(r => r.status === 'late').length;
      const excusedCount = dayRecords.filter(r => r.status === 'excused').length;
      const absentCount = dayRecords.filter(r => r.status === 'absent').length;
      
      // Total students who should be present on this class day
      const expectedStudents = isClassDay ? enrolledStudentIds.length : 0;
      
      // Total students actually accounted for (attendance marked)
      const markedCount = dayRecords.length;
      
      // Calculate percentages based on expected students (for class days)
      let presentPercent = 0, latePercent = 0, excusedPercent = 0, absentPercent = 0;
      
      if (isClassDay && expectedStudents > 0) {
        presentPercent = Math.round((presentCount / expectedStudents) * 100);
        latePercent = Math.round((lateCount / expectedStudents) * 100);
        excusedPercent = Math.round((excusedCount / expectedStudents) * 100);
        absentPercent = Math.round((absentCount / expectedStudents) * 100);
      } else if (!isClassDay) {
        // For non-class days, show 0 or N/A
        presentPercent = 0;
        latePercent = 0;
        excusedPercent = 0;
        absentPercent = 0;
      }

      dailyData.push({
        date: dateStr,
        displayDate: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        present: presentPercent,
        absent: absentPercent,
        late: latePercent,
        excused: excusedPercent,
        markedCount,
        expectedCount: expectedStudents,
        isClassDay
      });

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.json({
      success: true,
      data: dailyData
    });

  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Get status distribution for course
// @route   GET /api/attendance/course/:courseId/distribution
export const getStatusDistribution = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { startDate, endDate } = req.query;

    const start = new Date(startDate || new Date().setDate(new Date().getDate() - 30));
    const end = new Date(endDate || new Date());
    end.setHours(23, 59, 59, 999);

    const records = await Attendance.find({
      course: courseId,
      date: { $gte: start, $lte: end }
    });

    const distribution = {
      present: records.filter(r => r.status === 'present').length,
      absent: records.filter(r => r.status === 'absent').length,
      late: records.filter(r => r.status === 'late').length,
      excused: records.filter(r => r.status === 'excused').length
    };

    const total = Object.values(distribution).reduce((a, b) => a + b, 0);

    // Format for pie chart
    const data = [
      { name: 'Present', value: distribution.present, color: '#10b981' },
      { name: 'Absent', value: distribution.absent, color: '#ef4444' },
      { name: 'Late', value: distribution.late, color: '#f59e0b' },
      { name: 'Excused', value: distribution.excused, color: '#3b82f6' }
    ].filter(item => item.value > 0);

    res.json({
      success: true,
      data,
      summary: {
        total,
        ...distribution,
        attendanceRate: total > 0 
          ? Math.round(((distribution.present + distribution.excused) / total) * 100) 
          : 0
      }
    });

  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Get weekly comparison data (IMPROVED ACCURACY)
// @route   GET /api/attendance/course/:courseId/weekly
export const getWeeklyComparison = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { weeks = 8 } = req.query;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - (weeks * 7));

    // Get course details
    const course = await Course.findById(courseId);
    if (!course) {
      return next(errorHandler(404, 'Course not found'));
    }

    // Get active enrollments
    const activeEnrollments = await Enrollment.find({
      course: courseId,
      status: 'enrolled'
    }).select('student');
    
    const enrolledStudentIds = activeEnrollments.map(e => e.student.toString());

    // Get attendance records
    const records = await Attendance.find({
      course: courseId,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });

    // Group by week
    const weeklyData = [];
    const weekMap = new Map();

    records.forEach(record => {
      const date = new Date(record.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, {
          week: `Week ${weekMap.size + 1}`,
          startDate: weekKey,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          total: 0,
          classDays: new Set()
        });
      }
      
      const week = weekMap.get(weekKey);
      week[record.status]++;
      week.total++;
      
      // Track which days had class
      const dayOfWeek = date.getDay();
      if (course.schedule?.days?.some(day => {
        const dayMap = {'Sunday':0,'Monday':1,'Tuesday':2,'Wednesday':3,'Thursday':4,'Friday':5,'Saturday':6};
        return dayMap[day] === dayOfWeek;
      })) {
        week.classDays.add(date.toISOString().split('T')[0]);
      }
    });

    // Calculate weekly percentages
    weekMap.forEach((week, key) => {
      const classDaysCount = week.classDays.size;
      const expectedTotal = classDaysCount * enrolledStudentIds.length;
      
      weeklyData.push({
        week: week.week,
        present: expectedTotal > 0 ? Math.round((week.present / expectedTotal) * 100) : 0,
        absent: expectedTotal > 0 ? Math.round((week.absent / expectedTotal) * 100) : 0,
        late: expectedTotal > 0 ? Math.round((week.late / expectedTotal) * 100) : 0,
        excused: expectedTotal > 0 ? Math.round((week.excused / expectedTotal) * 100) : 0,
        classDays: classDaysCount,
        total: week.total
      });
    });

    res.json({
      success: true,
      data: weeklyData.slice(-weeks)
    });

  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Get all chart data for course (combined)
// @route   GET /api/attendance/course/:courseId/charts
export const getCourseChartData = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { startDate, endDate } = req.query;

    const start = new Date(startDate || new Date().setDate(new Date().getDate() - 30));
    const end = new Date(endDate || new Date());
    end.setHours(23, 59, 59, 999);

    // Get all records for the period
    const records = await Attendance.find({
      course: courseId,
      date: { $gte: start, $lte: end }
    }).sort({ date: 1 });

    const course = await Course.findById(courseId);
    const enrolledCount = course?.enrolledStudents?.length || 0;

    // Daily trend data
    const dailyMap = new Map();
    const weeklyMap = new Map();
    const statusCounts = { present: 0, absent: 0, late: 0, excused: 0 };

    records.forEach(record => {
      const dateStr = record.date.toISOString().split('T')[0];
      
      // Daily aggregation
      if (!dailyMap.has(dateStr)) {
        dailyMap.set(dateStr, {
          date: dateStr,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0
        });
      }
      const day = dailyMap.get(dateStr);
      day[record.status]++;
      
      // Status counts
      statusCounts[record.status]++;

      // Weekly aggregation
      const date = new Date(record.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeklyMap.has(weekKey)) {
        weeklyMap.set(weekKey, {
          week: `Week ${weeklyMap.size + 1}`,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0
        });
      }
      const week = weeklyMap.get(weekKey);
      week[record.status]++;
    });

    // Convert daily data to percentages
    const dailyTrend = Array.from(dailyMap.values()).map(day => ({
      date: day.date,
      present: enrolledCount > 0 ? Math.round((day.present / enrolledCount) * 100) : 0,
      absent: enrolledCount > 0 ? Math.round((day.absent / enrolledCount) * 100) : 0,
      late: enrolledCount > 0 ? Math.round((day.late / enrolledCount) * 100) : 0,
      excused: enrolledCount > 0 ? Math.round((day.excused / enrolledCount) * 100) : 0
    }));

    // Status distribution
    const total = Object.values(statusCounts).reduce((a, b) => a + b, 0);
    const statusDistribution = [
      { name: 'Present', value: statusCounts.present, color: '#10b981' },
      { name: 'Absent', value: statusCounts.absent, color: '#ef4444' },
      { name: 'Late', value: statusCounts.late, color: '#f59e0b' },
      { name: 'Excused', value: statusCounts.excused, color: '#3b82f6' }
    ].filter(item => item.value > 0);

    // Weekly comparison
    const weeklyComparison = Array.from(weeklyMap.values()).map(week => {
      const expectedPerWeek = 7 * enrolledCount;
      return {
        week: week.week,
        present: expectedPerWeek > 0 ? Math.round((week.present / expectedPerWeek) * 100) : 0,
        absent: expectedPerWeek > 0 ? Math.round((week.absent / expectedPerWeek) * 100) : 0,
        late: expectedPerWeek > 0 ? Math.round((week.late / expectedPerWeek) * 100) : 0,
        excused: expectedPerWeek > 0 ? Math.round((week.excused / expectedPerWeek) * 100) : 0
      };
    });

    res.json({
      success: true,
      data: {
        dailyTrend,
        statusDistribution,
        weeklyComparison,
        summary: {
          total,
          ...statusCounts,
          attendanceRate: total > 0 
            ? Math.round(((statusCounts.present + statusCounts.excused) / total) * 100) 
            : 0
        }
      }
    });

  } catch (error) {
    next(errorHandler(500, error.message));
  }
};