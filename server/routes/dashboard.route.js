import express from 'express';
import { getFinancialDashboard } from '../controllers/dashboard.controller.js';
import { auth, adminAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(auth);
router.get('/financial', adminAuth, getFinancialDashboard);

export default router;