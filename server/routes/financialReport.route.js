// routes/financialReport.routes.js
import express from 'express';
import {
  getProfitLoss,
  getCashFlow,
  getBudgetVsActual,
  getFinancialSummary
} from '../controllers/financialReport.controller.js';
import { auth, adminAuth } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication and admin privileges
router.use(auth);
router.use(adminAuth);

// Financial report routes
router.get('/profit-loss', getProfitLoss);
router.get('/cash-flow', getCashFlow);
router.get('/budget-vs-actual', getBudgetVsActual);
router.get('/summary', getFinancialSummary);

export default router;