// routes/request.route.js - COMPLETE UPDATED VERSION

import express from 'express';
import {
  createRequest,
  getAllRequests,
  getRequest,
  updateRequest,
  deleteRequest,
  addNote,
  getRequestStats,
  getStaffMembers,
  assignRequest,
  getTodayRequestCount,
  submitEnquiry,           // NEW
  convertEnquiryToVisit    // NEW
} from '../controllers/request.controller.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// ============ PUBLIC ROUTE (No Authentication) ============
// Submit online enquiry - accessible to everyone
router.post('/enquiry', submitEnquiry);

// ============ PROTECTED ROUTES (Authentication Required) ============
router.use(auth);

// Routes accessible to both admin and receptionist
router.route('/')
  .post(createRequest)  // Receptionist creates requests
  .get(getAllRequests); // Admin sees all, receptionist sees their own

router.route('/stats')
  .get(getRequestStats);

router.get('/today-count', getTodayRequestCount);

router.route('/:id')
  .get(getRequest)
  .put(updateRequest);

router.route('/:id/notes')
  .post(addNote);

// Admin-only routes
router.get('/staff', (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin privileges required'
    });
  }
  next();
}, getStaffMembers);

router.post('/:id/assign', (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin privileges required'
    });
  }
  next();
}, assignRequest);

router.delete('/:id', (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin privileges required'
    });
  }
  next();
}, deleteRequest);

// NEW: Convert online enquiry to physical visit
router.post('/:id/convert-to-visit', (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'receptionist') {
    return res.status(403).json({
      success: false,
      message: 'Admin or receptionist privileges required'
    });
  }
  next();
}, convertEnquiryToVisit);

export default router;