// routes/request.route.js
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
  getTodayRequestCount
} from '../controllers/request.controller.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
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



export default router;