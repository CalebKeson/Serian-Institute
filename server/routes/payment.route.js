import express from 'express';
import {
  recordPayment,
  getPayments,
  getPayment,
  updatePayment,
  deletePayment,
  getStudentFeeSummary,
  getPaymentStats,
  exportPayments
} from '../controllers/payment.controller.js';
import { auth, adminAuth, instructorAuth } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(auth);

// Payment CRUD
router.post('/', instructorAuth, recordPayment);
router.get('/', instructorAuth, getPayments);
router.get('/stats', adminAuth, getPaymentStats);
router.get('/export', adminAuth, exportPayments);
router.get('/:id', getPayment);
router.put('/:id', adminAuth, updatePayment);
router.delete('/:id', adminAuth, deletePayment);

// Student fee summary
router.get('/student/:studentId/summary', getStudentFeeSummary);

export default router;