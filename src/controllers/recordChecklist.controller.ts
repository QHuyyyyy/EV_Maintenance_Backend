import { Request, Response } from 'express';
import recordChecklistService from '../services/recordChecklist.service';

export class RecordChecklistController {
    async createRecordChecklist(req: Request, res: Response) {
        /* #swagger.tags = ['Service Checklists']
           #swagger.description = 'Create record checklist items. You can pass `checklist_id` for a single link or `checklist_ids` (array) to link multiple checklist templates to the same service record.'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.requestBody = {
               required: true,
               content: {
                   'application/json': {
                       schema: { $ref: '#/components/schemas/CreateRecordChecklist' }
                   }
               }
           }
        */
        try {
            const rc = await recordChecklistService.createRecordChecklist(req.body);
            res.status(201).json({ success: true, message: 'Record checklist created', data: rc });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ success: false, message: error.message });
            } else {
                res.status(400).json({ success: false, message: 'Failed to create record checklist' });
            }
        }
    }

    async getByRecord(req: Request, res: Response) {
        /* #swagger.tags = ['Service Checklists']
           #swagger.description = 'Get checklist items for a given service record'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['recordId'] = {
               in: 'path',
               description: 'Service Record ID'
               required: true,
               type: 'string'
           }
        */
        try {
            // support optional pagination query params in service later; for now controller forwards recordId
            const list = await recordChecklistService.getRecordChecklistsByRecord(req.params.recordId);
            res.status(200).json({ success: true, data: list });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ success: false, message: error.message });
            } else {
                res.status(400).json({ success: false, message: 'Failed to get record checklists' });
            }
        }
    }

    async updateRecordChecklist(req: Request, res: Response) {
        /* #swagger.tags = ['Service Checklists']
           #swagger.description = 'Update a record checklist item (status or note)'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['id'] = {
               in: 'path',
               description: 'Record Checklist ID',
               required: true,
               type: 'string'
           }
           #swagger.requestBody = {
               required: true,
               content: {
                   'application/json': {
                       schema: { $ref: '#/components/schemas/UpdateRecordChecklist' }
                   }
               }
           }
        */
        try {
            const rc = await recordChecklistService.updateRecordChecklist(req.params.id, req.body);
            if (!rc) return res.status(404).json({ success: false, message: 'Record checklist not found' });
            res.status(200).json({ success: true, message: 'Record checklist updated', data: rc });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ success: false, message: error.message });
            } else {
                res.status(400).json({ success: false, message: 'Failed to update record checklist' });
            }
        }
    }

    async deleteRecordChecklist(req: Request, res: Response) {
        /* #swagger.tags = ['Service Checklists']
           #swagger.description = 'Delete a record checklist item'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['id'] = {
               in: 'path',
               description: 'Record Checklist ID',
               required: true,
               type: 'string'
           }
        */
        try {
            const rc = await recordChecklistService.deleteRecordChecklist(req.params.id);
            if (!rc) return res.status(404).json({ success: false, message: 'Record checklist not found' });
            res.status(200).json({ success: true, message: 'Record checklist deleted', data: rc });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ success: false, message: error.message });
            } else {
                res.status(400).json({ success: false, message: 'Failed to delete record checklist' });
            }
        }
    }
}

export default new RecordChecklistController();
