// routes/incomeSource.routes.js
import express from 'express';
import {
  getIncomeSources,
  getIncomeSource,
  createIncomeSource,
  updateIncomeSource,
  deleteIncomeSource,
  getIncomeSourceTypes
} from '../controllers/incomeSource.controller.js';
import { auth, adminAuth } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication and admin privileges
router.use(auth);
router.use(adminAuth);

// Get income source types (enum values)
router.get('/types', getIncomeSourceTypes);

// Main CRUD routes
router.get('/', getIncomeSources);
router.post('/', createIncomeSource);
router.get('/:id', getIncomeSource);
router.put('/:id', updateIncomeSource);
router.delete('/:id', deleteIncomeSource);

export default router;