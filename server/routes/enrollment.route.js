import express from 'express';
import { 
  enrollStudent, 
  removeStudent, 
  getCourseEnrollments, 
  getStudentEnrollments,
  updateEnrollmentStatus,
  bulkEnrollStudents,
  getEnrollmentStats,
  getActiveEnrollmentCount,
  validateAdmissionNumberAPI,
  getEnrollmentByAdmissionNumber
} from '../controllers/enrollment.controller.js';
import { auth, adminAuth, instructorAuth } from '../middleware/auth.js';

const router = express.Router();

// ============= ALL ROUTES REQUIRE AUTHENTICATION =============
router.use(auth);

// ============= ENROLLMENT OPERATIONS (Instructor/Admin only) =============
// Enroll a single student in a course
router.post('/', instructorAuth, enrollStudent);

// Remove a student from a course
router.delete('/', instructorAuth, removeStudent);

// Update enrollment status (e.g., mark as completed, dropped)
router.put('/:id', instructorAuth, updateEnrollmentStatus);

// Bulk enroll multiple students in a course
router.post('/bulk', instructorAuth, bulkEnrollStudents);

// ============= ADMISSION NUMBER ROUTES =============
// Validate an admission number format and check if it exists
router.get('/validate-admission-number/:admissionNumber', auth, validateAdmissionNumberAPI);

// Get enrollment details by admission number
router.get('/admission-number/:admissionNumber', auth, getEnrollmentByAdmissionNumber);

// ============= ENROLLMENT QUERIES (Accessible to authenticated users) =============
// Get all enrollments for a specific course
router.get('/course/:id', auth, getCourseEnrollments);

// Get all enrollments for a specific student
router.get('/student/:id', auth, getStudentEnrollments);

// ============= STATISTICS & COUNTS =============
// Get enrollment statistics (admin/instructor only)
router.get('/stats', auth, instructorAuth, getEnrollmentStats);

// Get active enrollment count for sidebar (role-based)
router.get('/count/active', auth, getActiveEnrollmentCount);

export default router;