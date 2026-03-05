// routes/students.js
import express from 'express';
import { 
  getStudents, 
  getStudent, 
  createStudent, 
  updateStudent, 
  deleteStudent, 
  getStudentStats,
  getStudentCount,
  getAvailableStudents
} from '../controllers/student.controller.js';
import { auth, adminAuth, instructorAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/count', auth, getStudentCount);
router.get('/', auth, getStudents);
router.get('/:id', auth, getStudent);
router.get('/stats', auth, instructorAuth, getStudentStats);
router.get('/available/:courseId', auth, instructorAuth, getAvailableStudents);
router.post('/', auth, adminAuth, createStudent);
router.put('/:id', auth, adminAuth, updateStudent);
router.delete('/:id', auth, adminAuth, deleteStudent);


export default router;