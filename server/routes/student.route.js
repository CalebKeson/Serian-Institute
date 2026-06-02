import express from 'express';
import { 
  getStudents, 
  getStudent, 
  createStudent, 
  updateStudent, 
  deleteStudent, 
  getStudentStats,
  getStudentCount,
  getAvailableStudents,
  getStudentWithEnrollments,
  getStudentFees,
  getAllStudentsFeeStatus
} from '../controllers/student.controller.js';
import { auth, adminAuth, instructorAuth } from '../middleware/auth.js';

const router = express.Router();

// ============= ALL ROUTES REQUIRE AUTHENTICATION =============
router.use(auth);

// ============= STUDENT QUERIES (Accessible to authenticated users) =============
// Get all students with pagination and search
router.get('/', auth, getStudents);

// Get student count for sidebar (role-based)
router.get('/count', auth, getStudentCount);

// Get student statistics (admin/instructor only)
router.get('/stats', auth, instructorAuth, getStudentStats);

// Get all students with fee status (admin/instructor only)
router.get('/fees/overview', auth, instructorAuth, getAllStudentsFeeStatus);

// Get student with enrollments (for dashboard)
router.get('/:id/with-enrollments', auth, getStudentWithEnrollments);

// Get single student by ID
router.get('/:id', auth, getStudent);

// Get student fee summary
router.get('/:id/fees', auth, getStudentFees);

// Get students not enrolled in a specific course (for enrollment dropdown)
router.get('/available/:courseId', auth, instructorAuth, getAvailableStudents);

// ============= STUDENT MANAGEMENT (Admin only) =============
// Create a new student (NO studentId generated automatically)
router.post('/', auth, adminAuth, createStudent);

// Update an existing student
router.put('/:id', auth, adminAuth, updateStudent);

// Delete a student (admin only, checks for existing enrollments)
router.delete('/:id', auth, adminAuth, deleteStudent);

export default router;