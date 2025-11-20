import { Request, Response } from 'express';
import { enqueueCenterJob } from '../ai/services/analysisJob.service';
import mongoose from 'mongoose';
import partAnalysisModel from '../models/partAnalysis.model';


export async function getCenterAnalyses(req: Request, res: Response) {
    // #swagger.tags = ['Forecast']
    // #swagger.summary = 'Get recent part analyses for a center.'
    /* #swagger.security = [{ "bearerAuth": [] }] */
    // #swagger.description = 'Get recent part analyses for a center.'
    // #swagger.parameters['part_id'] = { in: 'query', description: 'Optional part ID to filter analyses by specific part.', type: 'string' }
    // #swagger.parameters['limit'] = { in: 'query', description: 'Maximum number of analysis records to return. Default is 100.', type: 'integer' }
    // #swagger.parameters['page'] = { in: 'query', description: 'Page number for pagination.', type: 'integer' }
    // #swagger.parameters['date'] = { in: 'query', description: 'Optional date (YYYY-MM-DD) to filter analyses created on that date.', type: 'string' }
    try {

        const centerId = (req.params.centerId || req.params.centerID) as string;
        if (!centerId) return res.status(400).json({ success: false, message: 'centerId is required in params' });
        if (!mongoose.isValidObjectId(centerId)) {
            return res.status(400).json({ success: false, message: 'Invalid centerId format' });
        }

        const limit = Math.max(1, parseInt(req.query.limit as string) || 10);

        // optional page param (1-based). If provided, we will compute skip=(page-1)*limit
        const pageStr = req.query.page as string | undefined;
        let skip = 0;
        if (pageStr !== undefined) {
            const pageNum = parseInt(pageStr);
            if (isNaN(pageNum) || pageNum < 1) {
                return res.status(400).json({ success: false, message: 'Invalid page value. Page must be an integer >= 1' });
            }
            skip = (pageNum - 1) * limit;
        }

        // optional `date` query param (expected format: YYYY-MM-DD or any Date-parsable string)
        const dateStr = req.query.date as string | undefined;
        const filter: any = { center_id: centerId };
        // optional filter by part_id
        const partId = (req.query.part_id as string | undefined)?.trim();
        if (partId) {
            filter.part_id = partId;
        }
        if (dateStr) {
            const start = new Date(dateStr);
            if (isNaN(start.getTime())) {
                return res.status(400).json({ success: false, message: 'Invalid date format for query param `date`' });
            }
            const end = new Date(start);
            end.setDate(end.getDate() + 1);
            filter.createdAt = { $gte: start, $lt: end };
        }

        const query = partAnalysisModel.find(filter).sort({ createdAt: -1 }).limit(limit);
        if (skip > 0) query.skip(skip);
        const [results, total] = await Promise.all([query.lean(), partAnalysisModel.countDocuments(filter)]);

        return res.json({
            success: true,
            results,
            total,
            page: skip > 0 ? Math.floor(skip / limit) + 1 : 1,
            limit,
            totalPages: Math.ceil(total / limit) || 1
        });
    } catch (err: any) {
        console.error('getCenterAnalyses error', err);
        return res.status(500).json({ success: false, error: err?.message ?? String(err) });
    }
}

export async function postCenterForecast(req: Request, res: Response) {
    // #swagger.tags = ['Forecast']
    // #swagger.summary = 'Enqueue center forecast analysis job.'
    /* #swagger.security = [{ "bearerAuth": [] }] */
    // #swagger.description = 'Enqueue center forecast analysis job.'
    try {
        const { centerId } = req.params as { centerId?: string };
        if (!centerId) return res.status(400).json({ success: false, message: 'centerId is required in params' });
        if (!mongoose.isValidObjectId(centerId)) {
            return res.status(400).json({ success: false, message: 'Invalid centerId format' });
        }

        // Enqueue the center analysis job (async). enqueueCenterJob returns a Bull Job object.
        const job = await enqueueCenterJob(centerId);

        return res.status(202).json({ success: true, jobId: job.id, status: 'queued' });
    } catch (err: any) {
        console.error('postCenterForecast error', err);
        return res.status(500).json({ success: false, error: err?.message ?? String(err) });
    }
}

export async function getUrgentParts(req: Request, res: Response) {
    // #swagger.tags = ['Forecast']
    // #swagger.summary = 'Get urgent (HIGH risk) parts for a center.'
    /* #swagger.security = [{ "bearerAuth": [] }] */
    // #swagger.description = 'Get list of parts with HIGH risk level that need immediate attention and ordering.'
    // #swagger.parameters['limit'] = { in: 'query', description: 'Maximum number of urgent parts to return. Default is 50.', type: 'integer' }
    // #swagger.parameters['page'] = { in: 'query', description: 'Page number for pagination.', type: 'integer' }
    try {
        const centerId = (req.params.centerId || req.params.centerID) as string;
        if (!centerId) return res.status(400).json({ success: false, message: 'centerId is required in params' });
        if (!mongoose.isValidObjectId(centerId)) {
            return res.status(400).json({ success: false, message: 'Invalid centerId format' });
        }

        const limit = Math.max(1, parseInt(req.query.limit as string) || 50);
        const pageStr = req.query.page as string | undefined;
        let skip = 0;
        if (pageStr !== undefined) {
            const pageNum = parseInt(pageStr);
            if (isNaN(pageNum) || pageNum < 1) {
                return res.status(400).json({ success: false, message: 'Invalid page value. Page must be an integer >= 1' });
            }
            skip = (pageNum - 1) * limit;
        }

        const filter: any = {
            center_id: centerId,
            'analysis.riskLevel': 'HIGH'
        };

        const query = partAnalysisModel
            .find(filter)
            .populate('part_id', 'name cost_price')
            .populate('center_id', 'name')
            .sort({ createdAt: -1 })
            .limit(limit);

        if (skip > 0) query.skip(skip);

        const [results, total] = await Promise.all([
            query.lean(),
            partAnalysisModel.countDocuments(filter)
        ]);

        return res.json({
            success: true,
            data: results,
            total,
            page: skip > 0 ? Math.floor(skip / limit) + 1 : 1,
            limit,
            totalPages: Math.ceil(total / limit) || 1,
            message: `Found ${total} urgent parts that need immediate attention`
        });
    } catch (err: any) {
        console.error('getUrgentParts error', err);
        return res.status(500).json({ success: false, error: err?.message ?? String(err) });
    }
}

export default {
    postCenterForecast,
    getCenterAnalyses,
    getUrgentParts
};
