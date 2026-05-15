// routes/incomeTransaction.routes.js
import express from 'express';
import {
  getIncomeTransactions,
  getIncomeTransaction,
  createIncomeTransaction,
  updateIncomeTransaction,
  deleteIncomeTransaction,
  getIncomeStats,
  getIncomeBySource,
  allocateIncome
} from '../controllers/incomeTransaction.controller.js';
import { auth, adminAuth } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication and admin privileges
router.use(auth);
router.use(adminAuth);

// Stats and summary routes (must come before /:id routes)
router.get('/stats', getIncomeStats);
router.get('/by-source/:sourceType', getIncomeBySource);

// Main CRUD routes
router.get('/', getIncomeTransactions);
router.post('/', createIncomeTransaction);
router.get('/:id', getIncomeTransaction);
router.put('/:id', updateIncomeTransaction);
router.delete('/:id', deleteIncomeTransaction);

// Allocation route
router.post('/:id/allocate', allocateIncome);

export default router;