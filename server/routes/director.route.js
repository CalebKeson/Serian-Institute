// routes/director.routes.js
import express from 'express';
import {
  getDirectors,
  getDirector,
  createDirector,
  updateDirector,
  deleteDirector,
  recordDirectorInvestment,
  recordDirectorRepayment,
  getDirectorSummary
} from '../controllers/director.controller.js';
import { auth, adminAuth } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication and admin privileges
router.use(auth);
router.use(adminAuth);

// Summary route (must come before /:id routes)
router.get('/summary', getDirectorSummary);

// Main CRUD routes
router.get('/', getDirectors);
router.post('/', createDirector);
router.get('/:id', getDirector);
router.put('/:id', updateDirector);
router.delete('/:id', deleteDirector);

// Investment routes
router.post('/:id/investment', recordDirectorInvestment);
router.post('/:id/repayment', recordDirectorRepayment);

export default router;