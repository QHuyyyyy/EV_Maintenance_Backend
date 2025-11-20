import { Router, Request, Response } from 'express';
import forecastController from '../controllers/forecast.controller';
import { validate } from '../middlewares/auth';
import { triggerAnalysisNow } from '../ai/services/analysisScheduler.service';

const router = Router();
// đặt tên cho route này để get thông tin phân tích của trung tâm
router.get('/info/:centerID', forecastController.getCenterAnalyses);
router.get('/urgent/:centerID', forecastController.getUrgentParts);
router.post('/center/:centerId', forecastController.postCenterForecast);

// Manually trigger forecast jobs for all centers now
router.post('/trigger-all', validate, async (req: Request, res: Response) => {
    // #swagger.tags = ['Forecast']
    // #swagger.summary = 'Trigger forecast jobs for all centers'
    // #swagger.description = 'Enqueue forecast analysis jobs for all centers immediately.'
    /* #swagger.security = [{ "bearerAuth": [] }] */
    try {
        await triggerAnalysisNow();
        res.status(202).json({ success: true, status: 'queued' });
    } catch (err: any) {
        console.error('trigger-all forecast error', err);
        res.status(500).json({ success: false, error: err?.message ?? String(err) });
    }
});

export default router;
