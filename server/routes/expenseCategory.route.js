// routes/expenseCategory.routes.js
import express from 'express';
import {
  getExpenseCategories,
  getExpenseCategory,
  createExpenseCategory,
  updateExpenseCategory,
  deleteExpenseCategory,
  getBudgetSummary,
  getCategoriesByBudgetStatus,
  addOneTimeBudget,
  updateOneTimeBudget,
  deleteOneTimeBudget
} from '../controllers/expenseCategory.controller.js';
import { auth, adminAuth } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication and admin privileges
router.use(auth);
router.use(adminAuth);

// Budget summary routes (must come before /:id routes)
router.get('/budget/summary', getBudgetSummary);
router.get('/budget/status/:status', getCategoriesByBudgetStatus);

// Main CRUD routes
router.get('/', getExpenseCategories);
router.post('/', createExpenseCategory);
router.get('/:id', getExpenseCategory);
router.put('/:id', updateExpenseCategory);
router.delete('/:id', deleteExpenseCategory);

// One-time budget routes
router.post('/:id/one-time-budget', addOneTimeBudget);
router.put('/:id/one-time-budget/:budgetId', updateOneTimeBudget);
router.delete('/:id/one-time-budget/:budgetId', deleteOneTimeBudget);

export default router;