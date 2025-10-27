import { Request, Response } from 'express';
import { WorkShift } from '../models/workshift.model';


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
        const { shift_id, shift_date, start_time, end_time, status, center_id } = req.body;
        const workShift = new WorkShift({ shift_id, shift_date, start_time, end_time, status, center_id });
        await workShift.save();
        res.status(201).json({ success: true, data: workShift });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getAllWorkShifts = async (req: Request, res: Response) => {
    // #swagger.tags = ['Work Shifts']
    // #swagger.summary = 'Get all work shifts'
    /* #swagger.security = [{ "bearerAuth": [] }] */
    /* #swagger.responses[200] = {
        description: 'List of work shifts',
        schema: { success: true, data: [{ $ref: '#/definitions/WorkShift' }] }
    } */
    try {
        const shifts = await WorkShift.find();
        res.status(200).json({ success: true, data: shifts });
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
        const deleted = await WorkShift.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ success: false, message: 'WorkShift not found' });
        res.status(200).json({ success: true, message: 'Deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
