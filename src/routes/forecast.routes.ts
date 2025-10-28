import { Router } from 'express';
import forecastController from '../controllers/forecast.controller';

const router = Router();
// đặt tên cho route này để get thông tin phân tích của trung tâm
router.get('/info/:centerID', forecastController.getCenterAnalyses);
router.post('/center/:centerId', forecastController.postCenterForecast);

export default router;
