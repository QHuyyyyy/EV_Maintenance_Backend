import { Request, Response } from 'express';
import { WorkShift } from '../models/workshift.model';
import { ShiftAssignment } from '../models/shift-assignment.model';
import { Slot } from '../models/slot.model';


export const createWorkShift = async (req: Request, res: Response) => {
    // #swagger.tags = ['Work Shifts']
    // #swagger.summary = 'Create a new work shift'
    /* #swagger.security = [{ "bearerAuth": [] }] */
    /* #swagger.requestBody = {
        required: true,
        content: {
            "application/json": {
                schema: { $ref: '#/definitions/CreateWorkShift' }
            }
        }
    } */
    /* #swagger.responses[201] = {
        description: 'Work shift created',
        schema: { success: true, data: { $ref: '#/definitions/WorkShift' } }
    } */
    try {
        const { shift_date, shift_dates, start_time, end_time, status, center_id } = req.body as any;

        if (!center_id || !start_time || !end_time) {
            return res.status(400).json({ success: false, message: 'center_id, start_time, end_time are required' });
        }
        if (!/^\d{2}:\d{2}$/.test(start_time) || !/^\d{2}:\d{2}$/.test(end_time)) {
            return res.status(400).json({ success: false, message: 'start_time and end_time must be in HH:mm format' });
        }
        let dateInputs: any[] = [];
        if (Array.isArray(shift_dates) && shift_dates.length > 0) {
            dateInputs = shift_dates;
        } else if (shift_date) {
            dateInputs = [shift_date];
        } else {
            return res.status(400).json({ success: false, message: 'Provide shift_date or shift_dates[]' });
        }

        // Normalize and dedupe by date string (YYYY-MM-DD)
        const dayStrs = Array.from(new Set(dateInputs.map(d => {
            if (typeof d === 'string') return d;
            if (d instanceof Date) return d.toISOString().slice(0, 10);
            return String(d);
        })));
        const dateObjs = dayStrs.map(ds => new Date(`${ds}T00:00:00.000Z`));

        // Fetch existing to avoid duplicates for same center/date/time
        const existing = await WorkShift.find({
            center_id,
            shift_date: { $in: dateObjs },
            start_time,
            end_time
        }).select('shift_date').lean();
        const existingDays = new Set(existing.map(e => new Date((e as any).shift_date).toISOString().slice(0, 10)));

        const toCreate = dateObjs
            .filter(d => !existingDays.has(d.toISOString().slice(0, 10)))
            .map(d => ({ shift_date: d, start_time, end_time, status: status || 'active', center_id }));

        if (toCreate.length === 0) {
            return res.status(200).json({ success: true, created: 0, skipped: dayStrs.length, data: [] });
        }

        const inserted = await WorkShift.insertMany(toCreate);
        res.status(201).json({ success: true, created: inserted.length, skipped: dayStrs.length - inserted.length, data: inserted });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getAllWorkShifts = async (req: Request, res: Response) => {
    // #swagger.tags = ['Work Shifts']
    // #swagger.summary = 'Get all work shifts'
    /* #swagger.security = [{ "bearerAuth": [] }] */
    // #swagger.parameters['center_id'] = { in: 'query', required: false, type: 'string' }
    // #swagger.parameters['date'] = { in: 'query', required: false, type: 'string', description: 'YYYY-MM-DD' }
    // #swagger.parameters['page'] = { in: 'query', required: false, type: 'integer', example: 1 }
    // #swagger.parameters['limit'] = { in: 'query', required: false, type: 'integer', example: 10 }
    /* #swagger.responses[200] = {
        description: 'List of work shifts',
        schema: { success: true, data: [{ $ref: '#/definitions/WorkShift' }], pagination: { $ref: '#/definitions/PaginationInfo' } }
    } */
    try {
        const { center_id, date, page = '1', limit = '10' } = req.query as any;
        const q: any = {};
        if (center_id) q.center_id = center_id;
        if (date) {
            const start = new Date(`${date}T00:00:00.000Z`);
            const end = new Date(`${date}T23:59:59.999Z`);
            q.shift_date = { $gte: start, $lte: end };
        }
        const pageNum = Math.max(parseInt(page as string, 10) || 1, 1);
        const limitNum = Math.min(Math.max(parseInt(limit as string, 10) || 10, 1), 100);
        const skip = (pageNum - 1) * limitNum;

        const [items, total] = await Promise.all([
            WorkShift.find(q).sort({ shift_date: 1, start_time: 1 }).skip(skip).limit(limitNum).lean(),
            WorkShift.countDocuments(q)
        ]);
        res.status(200).json({
            success: true,
            data: items,
            pagination: {
                current_page: pageNum,
                total_pages: Math.ceil(total / limitNum),
                total_count: total,
                per_page: limitNum
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update WorkShift
export const updateWorkShift = async (req: Request, res: Response) => {
    // #swagger.tags = ['Work Shifts']
    // #swagger.summary = 'Update a work shift by ID'
    /* #swagger.security = [{ "bearerAuth": [] }] */
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'string' }
    /* #swagger.requestBody = {
        required: true,
        content: {
            "application/json": {
                schema: { $ref: '#/definitions/UpdateWorkShift' }
            }
        }
    } */
    /* #swagger.responses[200] = {
        description: 'Work shift updated',
        schema: { success: true, data: { $ref: '#/definitions/WorkShift' } }
    } */
    try {
        const { id } = req.params;
        const updateData = req.body;
        const updated = await WorkShift.findByIdAndUpdate(id, updateData, { new: true });
        if (!updated) return res.status(404).json({ success: false, message: 'WorkShift not found' });
        res.status(200).json({ success: true, data: updated });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete WorkShift
export const deleteWorkShift = async (req: Request, res: Response) => {
    // #swagger.tags = ['Work Shifts']
    // #swagger.summary = 'Delete a work shift by ID'
    /* #swagger.security = [{ "bearerAuth": [] }] */
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'string' }
    /* #swagger.responses[200] = {
        description: 'Work shift deleted',
        schema: { success: true, message: 'Deleted successfully' }
    } */
    try {
        const { id } = req.params;
        // Guard: prevent deletion when there are shift assignments or slots referencing this workshift
        const [assignmentCount, slotCount] = await Promise.all([
            ShiftAssignment.countDocuments({ workshift_id: id }),
            Slot.countDocuments({ workshift_id: id })
        ]);
        if (assignmentCount > 0 || slotCount > 0) {
            return res.status(409).json({
                success: false,
                message: 'Không thể xóa ca làm việc vì còn shift assignment hoặc slot liên quan'
            });
        }
        const deleted = await WorkShift.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ success: false, message: 'WorkShift not found' });
        res.status(200).json({ success: true, message: 'Deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
