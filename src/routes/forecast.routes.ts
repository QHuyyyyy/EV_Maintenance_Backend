import { Router } from 'express';
import forecastController from '../controllers/forecast.controller';

const router = Router();

// POST /api/forecast/parts - accept minimal input (part_id + center_id)
router.post('/parts', forecastController.postPartForecast);
// POST /api/forecast/center/:centerId - enqueue AI analysis for a center
router.post('/center/:centerId', forecastController.postCenterForecast);

export default router;
