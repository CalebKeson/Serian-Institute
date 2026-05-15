import express from 'express';
import { 
  getEvents,
  getEvent,
  getUpcomingEvents,
  getEventsByDateRange,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventStats
} from '../controllers/event.controller.js';
import { auth, adminAuth } from '../middleware/auth.js';

const router = express.Router();

// Public routes (authenticated users can view)
router.get('/', auth, getEvents);
router.get('/upcoming', auth, getUpcomingEvents);
router.get('/range/:start/:end', auth, getEventsByDateRange);
router.get('/stats', auth, getEventStats);
router.get('/:id', auth, getEvent);

// Admin only routes
router.post('/', auth, adminAuth, createEvent);
router.put('/:id', auth, adminAuth, updateEvent);
router.delete('/:id', auth, adminAuth, deleteEvent);

export default router;