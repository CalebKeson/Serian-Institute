import express from 'express';
import { 
  getCourses, 
  getCourse, 
  createCourse, 
  updateCourse, 
  deleteCourse,
  enrollStudent,
  removeStudent,
  getEnrolledStudents,
  getAvailableInstructors,
  getCourseStats,
  getCourseCount
} from '../controllers/course.controller.js';

// IMPORT THE NEW PAYMENT CONTROLLERS
import {
  getCoursePaymentSummary,
  getCourseStudentsPaymentStatus,
  getStudentCoursePayments,
  exportCoursePaymentReport
} from '../controllers/coursePayment.controller.js';

import { auth, adminAuth, instructorAuth } from '../middleware/auth.js';

const router = express.Router();

// ============= EXISTING COURSE ROUTES =============
// Public routes (require auth)
router.get('/', auth, getCourses);
router.get('/count', auth, getCourseCount);
router.get('/stats/overview', auth, instructorAuth, getCourseStats);
router.get('/:id', auth, getCourse);
router.get('/:id/students', auth, getEnrolledStudents);
router.get('/instructors/available', auth, instructorAuth, getAvailableInstructors);

// Protected routes (admin/instructor only)
router.post('/', auth, instructorAuth, createCourse);
router.put('/:id', auth, instructorAuth, updateCourse);
router.delete('/:id', auth, adminAuth, deleteCourse);

// Enrollment routes
router.post('/:id/enroll', auth, instructorAuth, enrollStudent);
router.delete('/:id/enroll', auth, instructorAuth, removeStudent);

// ============= NEW PAYMENT ROUTES (ADDED HERE) =============
/**
 * @route   GET /api/courses/:courseId/payments/summary
 * @desc    Get payment summary for a specific course
 * @access  Private (Admin, Instructor)
 */
router.get('/:courseId/payments/summary', auth, instructorAuth, getCoursePaymentSummary);

/**
 * @route   GET /api/courses/:courseId/payments/students
 * @desc    Get all students payment status for a specific course
 * @access  Private (Admin, Instructor)
 */
router.get('/:courseId/payments/students', auth, instructorAuth, getCourseStudentsPaymentStatus);

/**
 * @route   GET /api/courses/:courseId/students/:studentId/payments
 * @desc    Get payment details for a specific student in a course
 * @access  Private (Admin, Instructor, Student)
 */
router.get('/:courseId/students/:studentId/payments', auth, getStudentCoursePayments);

/**
 * @route   GET /api/courses/:courseId/payments/export
 * @desc    Export course payment report as CSV
 * @access  Private (Admin, Instructor)
 */
router.get('/:courseId/payments/export', auth, instructorAuth, exportCoursePaymentReport);

export default router;