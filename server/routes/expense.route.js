// routes/expense.routes.js
import express from 'express';
import {
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  approveExpense,
  payExpense,
  getExpenseStats,
  getExpensesByCategory,
  submitForApproval 
} from '../controllers/expense.controller.js';
import { auth, adminAuth } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication and admin privileges
router.use(auth);
router.use(adminAuth);

// Stats and summary routes (must come before /:id routes)
router.get('/stats', getExpenseStats);
router.get('/by-category/:categoryId', getExpensesByCategory);

// Main CRUD routes
router.get('/', getExpenses);
router.post('/', createExpense);
router.get('/:id', getExpense);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

// Workflow routes
router.post('/:id/submit', submitForApproval); 
router.post('/:id/approve', approveExpense);
router.post('/:id/pay', payExpense);

export default router;