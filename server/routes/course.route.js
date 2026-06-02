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
  getCourseCount,
  getCoursePaymentSummary,
  getCourseStudentsPaymentStatus,
  getStudentCoursePayments,
  exportCoursePaymentReport
} from '../controllers/course.controller.js';
import { auth, adminAuth, instructorAuth } from '../middleware/auth.js';

const router = express.Router();

// ============= ALL ROUTES REQUIRE AUTHENTICATION =============
router.use(auth);

// ============= COURSE QUERIES (Accessible to authenticated users) =============
// Get all courses with pagination and filters
router.get('/', auth, getCourses);

// Get course count for sidebar (role-based)
router.get('/count', auth, getCourseCount);

// Get course statistics overview (admin/instructor only)
router.get('/stats/overview', auth, instructorAuth, getCourseStats);

// Get available instructors for course creation
router.get('/instructors/available', auth, instructorAuth, getAvailableInstructors);

// Get single course by ID
router.get('/:id', auth, getCourse);

// Get enrolled students for a specific course
router.get('/:id/students', auth, getEnrolledStudents);

// ============= COURSE MANAGEMENT (Admin/Instructor only) =============
// Create a new course (manual course code entry required)
router.post('/', auth, instructorAuth, createCourse);

// Update an existing course
router.put('/:id', auth, instructorAuth, updateCourse);

// Delete a course (admin only)
router.delete('/:id', auth, adminAuth, deleteCourse);

// ============= ENROLLMENT MANAGEMENT (Admin/Instructor/Receptionist) =============
// Enroll a student in a course (legacy endpoint, use /api/enrollments instead)
router.post('/:id/enroll', auth, instructorAuth, enrollStudent);

// Remove a student from a course (legacy endpoint, use /api/enrollments instead)
router.delete('/:id/enroll', auth, instructorAuth, removeStudent);

// ============= PAYMENT ROUTES =============
// Get payment summary for a specific course
router.get('/:courseId/payments/summary', auth, instructorAuth, getCoursePaymentSummary);

// Get all students' payment status for a specific course
router.get('/:courseId/payments/students', auth, instructorAuth, getCourseStudentsPaymentStatus);

// Get payment details for a specific student in a course
router.get('/:courseId/students/:studentId/payments', auth, getStudentCoursePayments);

// Export course payment report as CSV
router.get('/:courseId/payments/export', auth, instructorAuth, exportCoursePaymentReport);

export default router;