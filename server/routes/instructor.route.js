// backend/routes/instructors.js
import express from 'express';
import { 
  getInstructors,
  getInstructor,
  createInstructor,
  updateInstructor,
  deleteInstructor,
  getInstructorCount,
  getInstructorStats,
  recordSalaryPayment,
  getInstructorCourses,
  updateInstructorWorkload
} from '../controllers/instructor.controller.js';
import { auth, adminAuth } from '../middleware/auth.js';

const router = express.Router();

// Public/Protected routes with role-based access
router.get('/count', auth, getInstructorCount);
router.get('/stats', auth, adminAuth, getInstructorStats);
router.get('/', auth, getInstructors);
router.get('/:id', auth, getInstructor);
router.get('/:id/courses', auth, getInstructorCourses);
router.post('/', auth, adminAuth, createInstructor);
router.put('/:id', auth, adminAuth, updateInstructor);
router.delete('/:id', auth, adminAuth, deleteInstructor);
router.post('/:id/salary-payment', auth, adminAuth, recordSalaryPayment);
router.put('/:id/update-workload', auth, adminAuth, updateInstructorWorkload);

export default router;