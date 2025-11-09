import { Request, Response } from 'express';
import { ShiftAssignmentService } from '../services/shiftAssignment.service';
import { AssignShiftsRequest } from '../types/shiftAssignment.type';

const service = new ShiftAssignmentService();

export class ShiftAssignmentController {

    async assignShifts(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['Shift Assignments']
        // #swagger.summary = 'Assign multiple shifts to a system user'
        /* #swagger.security = [{ "bearerAuth": [] }] */
        /* #swagger.requestBody = {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: '#/definitions/AssignShiftsRequest' }
              }
            }
        } */
        try {
            const body = req.body as AssignShiftsRequest;
            const ids = (body.workshift_ids && Array.isArray(body.workshift_ids) ? body.workshift_ids : (body as any).shift_ids) as string[];
            if (!body || !body.system_user_id || !Array.isArray(ids) || ids.length === 0) {
                res.status(400).json({ success: false, message: 'system_user_id and workshift_ids[] are required' });
                return;
            }
            const created = await service.assignShifts(body.system_user_id, ids);
            res.status(201).json({ success: true, data: created });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }


    async getShiftsOfUser(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['Shift Assignments']
        // #swagger.summary = 'Get all shifts assigned to a system user'
        /* #swagger.security = [{ "bearerAuth": [] }] */
        // #swagger.parameters['system_user_id'] = { in: 'path', required: true, type: 'string' }
        try {
            const { system_user_id } = req.params;
            const shifts = await service.getShiftsOfUser(system_user_id);
            res.status(200).json({ success: true, data: shifts });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getUsersOfShift(req: Request, res: Response): Promise<void> {

        // #swagger.tags = ['Shift Assignments']
        // #swagger.summary = 'Get all system users assigned to a shift'
        /* #swagger.security = [{ "bearerAuth": [] }] */
        // #swagger.parameters['workshift_id'] = { in: 'path', required: true, type: 'string' }
        try {
            const { workshift_id } = req.params as any;
            const users = await service.getUsersOfShift(workshift_id);
            res.status(200).json({ success: true, data: users });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }


    async deleteAssignment(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['Shift Assignments']
        // #swagger.summary = 'Delete a shift assignment by id'
        /* #swagger.security = [{ "bearerAuth": [] }] */
        // #swagger.parameters['id'] = { in: 'path', required: true, type: 'string' }
        try {
            const { id } = req.params;
            const ok = await service.deleteAssignment(id);
            if (!ok) {
                res.status(404).json({ success: false, message: 'Assignment not found' });
                return;
            }
            res.status(200).json({ success: true, message: 'Deleted' });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
export default new ShiftAssignmentController;