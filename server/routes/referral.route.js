// backend/routes/referrals.js - COMPLETE VERSION

import express from 'express';
import { 
  getReferrers,
  getReferrer,
  createReferrer,
  updateReferrer,
  deleteReferrer,
  getReferralLeaderboard,
  recordBonusPayment,
  getReferralStats,
  getReferrerByCode,
  generateReferralCode
} from '../controllers/referral.controller.js';
import { auth, adminAuth } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(auth);

// Public routes (require auth but not admin)
router.get('/leaderboard', getReferralLeaderboard);
router.get('/stats', adminAuth, getReferralStats);
router.get('/code/:code', getReferrerByCode);

// CRUD operations (admin only)
router.get('/', adminAuth, getReferrers);
router.get('/:id', adminAuth, getReferrer);
router.post('/', adminAuth, createReferrer);
router.put('/:id', adminAuth, updateReferrer);
router.delete('/:id', adminAuth, deleteReferrer);

// Bonus and code generation (admin only)
router.post('/:id/bonus', adminAuth, recordBonusPayment);
router.post('/:id/generate-code', adminAuth, generateReferralCode);

export default router;