import { Request, Response } from 'express';
import slotService from '../services/slot.service';
import { ISlot } from '../models/slot.model';

class SlotController {
    /**
     * POST /slots/generate
     * Body: { center_ids: string[], dates: string[], start_time: 'HH:mm', end_time: 'HH:mm', duration: number }
     */
    async generateSlots(req: Request, res: Response) {
        /* #swagger.tags = ['Slots']
           #swagger.summary = 'Generate slots'
           #swagger.description = 'Generate slots for multiple centers and multiple dates. Capacity is automatically calculated based on the number of technicians assigned to shifts (WorkShift).' 
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.requestBody = {
             required: true,
             content: { 'application/json': { schema: { $ref: '#/components/schemas/GenerateSlotsRequest' } } }
           }
        */
        try {
            const { center_ids, dates, start_time, end_time, duration } = req.body;
            const result = await slotService.generateSlots({
                centerIds: center_ids,
                dates,
                startTime: start_time,
                endTime: end_time,
                duration
            });
            res.status(201).json({
                success: true,
                message: 'Slots generated',
                data: result
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to generate slots'
            });
        }
    }

    /**
     * GET /slots
     * Optional query: center_id, from, to, status
     */
    async listSlots(req: Request, res: Response) {
        /* #swagger.tags = ['Slots']
            #swagger.summary = 'List slots'
                  #swagger.security = [{ "bearerAuth": [] }]
            #swagger.parameters['center_id'] = { in: 'query', required: false, description: 'Filter by center ID', type: 'string', example: '60f1b2b3c4e5f6g7h8i9j0k5' }
            #swagger.parameters['date'] = { in: 'query', required: false, description: 'Filter by date (YYYY-MM-DD)', type: 'string', example: '2025-11-10' }
            #swagger.parameters['from'] = { in: 'query', required: false, description: 'From datetime (ISO)', type: 'string', example: '2025-11-10T00:00:00.000Z' }
            #swagger.parameters['to'] = { in: 'query', required: false, description: 'To datetime (ISO)', type: 'string', example: '2025-11-10T23:59:59.999Z' }
            #swagger.parameters['status'] = { in: 'query', required: false, description: 'Slot status', type: 'string', enum: ['active','inactive','full','expired'] }
        */
        try {
            const { center_id, date, from, to, status } = req.query;
            let fromDate: Date | undefined;
            let toDate: Date | undefined;
            if (from && typeof from === 'string') fromDate = new Date(from);
            if (to && typeof to === 'string') toDate = new Date(to);
            const slots = await slotService.listSlots({
                center_id: center_id as string,
                date: date as string,
                from: fromDate,
                to: toDate,
                status: status as string
            });
            res.status(200).json({ success: true, data: slots });
        } catch (error) {
            res.status(400).json({ success: false, message: error instanceof Error ? error.message : 'Failed to list slots' });
        }
    }
}

export default new SlotController();
