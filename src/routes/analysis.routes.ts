import { Router } from 'express';
import analysisController from '../controllers/analysis.controller';

const router = Router();

// GET latest analyses for a center
router.get('/centers/:centerId', analysisController.getCenterAnalyses);

export default router;
