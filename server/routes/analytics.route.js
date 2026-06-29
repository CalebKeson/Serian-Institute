// routes/analytics.route.js - COMPLETE NEW FILE

import express from 'express';
import {
  trackPageView,
  trackConversion,
  getAnalyticsSummary,
  getSourceBreakdown,
  getConversionReport,
  getTopSources
} from '../controllers/analytics.controller.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// ============ PUBLIC ROUTES (No Authentication) ============
// These are called from the frontend to track visits
router.post('/track', trackPageView);
router.post('/convert', trackConversion);

// ============ ADMIN ROUTES (Authentication Required) ============
// All routes below require authentication and admin role
router.use(auth);

router.get('/summary', (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
}, getAnalyticsSummary);

router.get('/sources', (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
}, getSourceBreakdown);

router.get('/conversions', (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
}, getConversionReport);

router.get('/top-sources', (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
}, getTopSources);

export default router;