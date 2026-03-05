// routes/grades.js
import express from 'express';
import {
  createGrade,
  bulkCreateGrades,
  getCourseGrades,
  getStudentGrades,
  getStudentCourseGrades,
  updateGrade,
  deleteGrade,
  calculateFinalGrade,
  publishGrades,
  getGradeStatistics,
  exportGrades,
  getGradingScales,
  createGradingScale
} from '../controllers/grade.controller.js';
import { auth, adminAuth, instructorAuth } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(auth);

// ============= GRADE MANAGEMENT ROUTES =============

/**
 * @route   POST /api/grades
 * @desc    Create a single grade
 * @access  Instructor/Admin
 */
router.post('/', instructorAuth, createGrade);

/**
 * @route   POST /api/grades/bulk
 * @desc    Bulk create grades (CSV/Excel upload)
 * @access  Instructor/Admin
 */
router.post('/bulk', instructorAuth, bulkCreateGrades);

/**
 * @route   GET /api/grades/course/:courseId
 * @desc    Get all grades for a course
 * @access  Instructor/Admin/Student (with restrictions)
 */
router.get('/course/:courseId', getCourseGrades);

/**
 * @route   GET /api/grades/student/:studentId
 * @desc    Get all grades for a student
 * @access  Student (own) / Instructor/Admin (any)
 */
router.get('/student/:studentId', getStudentGrades);

/**
 * @route   GET /api/grades/student/:studentId/course/:courseId
 * @desc    Get grades for a specific student in a specific course
 * @access  Student (own) / Instructor/Admin
 */
router.get('/student/:studentId/course/:courseId', getStudentCourseGrades);

/**
 * @route   PUT /api/grades/:id
 * @desc    Update a grade
 * @access  Instructor/Admin
 */
router.put('/:id', instructorAuth, updateGrade);

/**
 * @route   DELETE /api/grades/:id
 * @desc    Delete a grade
 * @access  Instructor/Admin
 */
router.delete('/:id', instructorAuth, deleteGrade);

/**
 * @route   POST /api/grades/calculate/:studentId/:courseId
 * @desc    Calculate final grade for a student in a course
 * @access  Instructor/Admin
 */
router.post('/calculate/:studentId/:courseId', instructorAuth, calculateFinalGrade);

/**
 * @route   POST /api/grades/publish/:courseId
 * @desc    Publish grades for a course
 * @access  Instructor/Admin
 */
router.post('/publish/:courseId', instructorAuth, publishGrades);

/**
 * @route   GET /api/grades/stats/:courseId
 * @desc    Get grade statistics for a course
 * @access  Instructor/Admin
 */
router.get('/stats/:courseId', instructorAuth, getGradeStatistics);

/**
 * @route   GET /api/grades/export/:courseId
 * @desc    Export grades as CSV
 * @access  Instructor/Admin
 */
router.get('/export/:courseId', instructorAuth, exportGrades);

// ============= GRADING SCALE ROUTES =============

/**
 * @route   GET /api/grades/scales
 * @desc    Get all grading scales
 * @access  Private
 */
router.get('/scales', getGradingScales);

/**
 * @route   POST /api/grades/scales
 * @desc    Create a new grading scale
 * @access  Admin only
 */
router.post('/scales', adminAuth, createGradingScale);

export default router;