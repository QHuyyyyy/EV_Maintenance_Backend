import { Request, Response } from 'express';
import forecastService from '../ai/services/forecast.service';
import { enqueueCenterJob } from '../ai/services/analysisJob.service';

export async function postPartForecast(req: Request, res: Response) {
    try {
        const { part_id, center_id, horizon_days } = req.body;
        if (!part_id || !center_id) return res.status(400).json({ success: false, message: 'part_id and center_id are required' });

        const result = await forecastService.generateForecastForPart({ part_id, center_id, horizon_days });
        return res.json({ success: true, result });
    } catch (err: any) {
        console.error('forecast.controller error', err);
        return res.status(500).json({ success: false, error: err?.message ?? String(err) });
    }
}

export async function postCenterForecast(req: Request, res: Response) {
    try {
        const { centerId } = req.params as { centerId?: string };
        if (!centerId) return res.status(400).json({ success: false, message: 'centerId is required in params' });

        // Enqueue the center analysis job (async). enqueueCenterJob returns a Bull Job object.
        const job = await enqueueCenterJob(centerId);

        return res.status(202).json({ success: true, jobId: job.id, status: 'queued' });
    } catch (err: any) {
        console.error('postCenterForecast error', err);
        return res.status(500).json({ success: false, error: err?.message ?? String(err) });
    }
}

export default {
    postPartForecast
    , postCenterForecast
};
