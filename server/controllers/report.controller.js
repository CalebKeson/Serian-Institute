// controllers/reportController.js
import Attendance from '../models/attendance.model.js';
import Course from '../models/course.model.js';
import { errorHandler } from '../utils/error.js';

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
    
    // Calculate attendance rate
    const totalPossible = summary.totalDays * (await getEnrolledCount(courseId));
    summary.attendanceRate = totalPossible > 0 
      ? ((summary.present + summary.excused) / totalPossible) * 100 
      : 0;
    
    summary.averageAttendance = summary.totalDays > 0 
      ? (summary.present + summary.late) / summary.totalDays 
      : 0;
    
    // Group data by day/week/month
    let groupedData = [];
    if (groupBy === 'week') {
      // Group by week logic
    } else if (groupBy === 'month') {
      // Group by month logic
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

// Helper function to get enrolled count
async function getEnrolledCount(courseId) {
  if (!courseId) return 1;
  const course = await Course.findById(courseId);
  return course?.enrolledStudents?.length || 20;
}