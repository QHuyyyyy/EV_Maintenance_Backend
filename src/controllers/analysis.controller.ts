import { Request, Response } from 'express';
import PartAnalysisModel from '../models/partAnalysis.model';

export async function getCenterAnalyses(req: Request, res: Response) {
    try {
        const centerId = req.params.centerId;
        const limit = parseInt(req.query.limit as string) || 100;
        const results = await PartAnalysisModel.find({ center_id: centerId }).sort({ createdAt: -1 }).limit(limit).lean();
        return res.json({ success: true, results });
    } catch (err: any) {
        console.error('getCenterAnalyses error', err);
        return res.status(500).json({ success: false, error: err?.message ?? String(err) });
    }
}

export default { getCenterAnalyses };
