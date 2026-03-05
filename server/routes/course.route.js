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
  getCourseCount  // ADD THIS IMPORT
} from '../controllers/course.controller.js';
import { auth, adminAuth, instructorAuth } from '../middleware/auth.js';

const router = express.Router();

// Public routes (require auth)
router.get('/', auth, getCourses);
router.get('/count', auth, getCourseCount);  // ADD THIS ROUTE
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

export default router;