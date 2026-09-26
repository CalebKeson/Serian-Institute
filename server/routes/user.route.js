// routes/user.route.js - COMPLETE

import express from 'express';
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getUserStats,
  getProfile,
  updateProfile,
  updateAvatar
} from '../controllers/user.controller.js';
import { auth, adminAuth } from '../middleware/auth.js';

const router = express.Router();

// ============= ALL ROUTES REQUIRE AUTHENTICATION =============
router.use(auth);

// ============= PROFILE ROUTES =============
// Get current user profile with role-specific data
router.get('/profile', getProfile);

// Update current user profile
router.put('/profile', updateProfile);

// Update avatar (stores in localStorage for now)
router.post('/profile/avatar', updateAvatar);

// ============= ADMIN ROUTES =============
router.use(adminAuth);

router.get('/', getUsers);
router.get('/stats', getUserStats);
router.post('/', createUser);
router.get('/:id', getUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;