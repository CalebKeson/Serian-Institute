import express from 'express';
import { 
  register, 
  login, 
  forgotPassword, 
  validateResetToken, 
  resetPassword, 
  googleAuth,
  getInstructors,
  createInstructor 
} from '../controllers/auth.controller.js';
import { auth, adminAuth } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.get('/reset-password/:token', validateResetToken);
router.post('/reset-password/:token', resetPassword);
router.post('/google-auth', googleAuth);

// Protected routes for instructors
router.get('/instructors', auth, getInstructors);
router.post('/instructors', auth, adminAuth, createInstructor);

export default router;