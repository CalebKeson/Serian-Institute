// routes/attendance.js
import express from 'express';
import { 
  markAttendance,
  bulkMarkAttendance,
  getCourseAttendance,
  getStudentAttendance,
  updateAttendance,
  getAttendanceStats,
  getAttendanceCalendar,
  getAttendanceReport,
  getStudentSummary,
  getStudentCalendar,
  getStudentCourseBreakdown,
  getConsecutiveAbsences,
  getStudentTrend,
  // Add these new chart controller imports
  getDailyTrend,
  getWeeklyComparison,
  getStatusDistribution,
  getCourseChartData
} from '../controllers/attendance.controller.js';
import { auth, instructorAuth } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(auth);

// Existing routes
router.post('/', instructorAuth, markAttendance);
router.post('/bulk', instructorAuth, bulkMarkAttendance);
router.get('/course/:id', getCourseAttendance);
router.get('/student/:id', getStudentAttendance);
router.put('/:id', instructorAuth, updateAttendance);
router.get('/stats', getAttendanceStats);
router.get('/calendar/:studentId', getAttendanceCalendar);
router.get('/reports', getAttendanceReport);

// ============= CHART DATA ROUTES =============
router.get('/course/:courseId/charts', getCourseChartData);
router.get('/course/:courseId/trend', getDailyTrend);
router.get('/course/:courseId/distribution', getStatusDistribution);
router.get('/course/:courseId/weekly', getWeeklyComparison);

// ============= STUDENT SUMMARY ROUTES =============
router.get('/student/:studentId/summary', getStudentSummary);
router.get('/student/:studentId/calendar', getStudentCalendar);
router.get('/student/:studentId/courses', getStudentCourseBreakdown);
router.get('/student/:studentId/absences/consecutive', getConsecutiveAbsences);
router.get('/student/:studentId/trend', getStudentTrend);

export default router;