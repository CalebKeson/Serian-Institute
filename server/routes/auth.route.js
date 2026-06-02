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

// ============= PUBLIC ROUTES (No authentication required) =============
// Register a new user
router.post('/register', register);

// Login user
router.post('/login', login);

// Forgot password - request reset link
router.post('/forgot-password', forgotPassword);

// Validate reset password token
router.get('/reset-password/:token', validateResetToken);

// Reset password with token
router.post('/reset-password/:token', resetPassword);

// Google authentication
router.post('/google-auth', googleAuth);

// ============= PROTECTED ROUTES (Authentication required) =============
// Get all instructors (admin/instructor only)
router.get('/instructors', auth, getInstructors);

// Create a new instructor (admin only)
router.post('/instructors', auth, adminAuth, createInstructor);

export default router;