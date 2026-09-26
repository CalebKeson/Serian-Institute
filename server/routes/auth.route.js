// routes/auth.route.js - COMPLETE

import express from 'express';
import { 
  register, 
  login, 
  forgotPassword, 
  validateResetToken, 
  resetPassword, 
  googleAuth,
  getInstructors,
  createInstructor,
  changePassword
} from '../controllers/auth.controller.js';
import { auth, adminAuth } from '../middleware/auth.js';

const router = express.Router();

// ============= PUBLIC ROUTES (No authentication required) =============
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.get('/reset-password/:token', validateResetToken);
router.post('/reset-password/:token', resetPassword);
router.post('/google-auth', googleAuth);

// ============= PROTECTED ROUTES (Authentication required) =============
// Change password (authenticated user)
router.post('/change-password', auth, changePassword);

// Get all instructors (admin/instructor only)
router.get('/instructors', auth, getInstructors);

// Create a new instructor (admin only)
router.post('/instructors', auth, adminAuth, createInstructor);

export default router;