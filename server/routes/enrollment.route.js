// routes/enrollments.js
import express from 'express';
import { 
  enrollStudent, 
  removeStudent, 
  getCourseEnrollments, 
  getStudentEnrollments,
  updateEnrollmentStatus,
  bulkEnrollStudents
} from '../controllers/enrollment.controller.js';
import { auth, adminAuth, instructorAuth } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(auth);

// Enrollment operations (instructor/admin only)
router.post('/', instructorAuth, enrollStudent);
router.delete('/', instructorAuth, removeStudent);
router.put('/:id', instructorAuth, updateEnrollmentStatus);
router.post('/bulk', instructorAuth, bulkEnrollStudents);

// Get enrollments (accessible to all authenticated users)
router.get('/course/:id', getCourseEnrollments);
router.get('/student/:id', getStudentEnrollments);

export default router;