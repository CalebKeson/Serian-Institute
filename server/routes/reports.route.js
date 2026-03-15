import express from 'express';
import { 
  getCollectionReport, 
  getOutstandingReport 
} from '../controllers/reports.controller.js';
import { auth, adminAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(auth);
router.use(adminAuth); // All reports are admin only

router.get('/collections', getCollectionReport);
router.get('/outstanding', getOutstandingReport);

export default router;