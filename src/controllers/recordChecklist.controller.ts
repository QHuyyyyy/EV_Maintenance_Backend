import { Request, Response } from 'express';
import recordChecklistService from '../services/recordChecklist.service';
import checklistDefectService from '../services/checklistDefect.service';

export class RecordChecklistController {
    async createRecordChecklist(req: Request, res: Response) {
        /* #swagger.tags = ['Record Checklists']
          #swagger.summary = 'Create Record Checklist Items'
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
        // #swagger.tags = ['Record Checklists']
        // #swagger.summary = 'Get Record Checklists by Service Record ID'
        //  #swagger.description = 'Get checklist items for a given service record'
        //  #swagger.security = [{ "bearerAuth": [] }]
        /*   #swagger.parameters['recordId'] = {
              in: 'path',
              description: 'Service Record ID',
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
        /* #swagger.tags = ['Record Checklists']
           #swagger.summary = 'Update Record Checklist Item'
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
        /* #swagger.tags = ['Record Checklists']
              #swagger.summary = 'Delete Record Checklist Item'
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

    // Checklist Defect endpoints
    async createChecklistDefect(req: Request, res: Response) {
        /* #swagger.tags = ['Record Checklists']
           #swagger.summary = 'Create Checklist Defect'
           #swagger.description = 'Create a new defect record for a checklist item'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['recordChecklistId'] = {
               in: 'path',
               description: 'Record Checklist ID',
               required: true,
               type: 'string'
           }
           #swagger.requestBody = {
               required: true,
               content: {
                   'application/json': {
                       schema: { $ref: '#/components/schemas/CreateChecklistDefect' }
                   }
               }
           }
        */
        try {
            const { recordChecklistId } = req.params;
            const defect = await checklistDefectService.createChecklistDefect({
                ...req.body,
                record_checklist_id: recordChecklistId
            });
            res.status(201).json({ success: true, message: 'Checklist defect created', data: defect });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ success: false, message: error.message });
            } else {
                res.status(400).json({ success: false, message: 'Failed to create checklist defect' });
            }
        }
    }

    async createMultipleDefects(req: Request, res: Response) {
        /* #swagger.tags = ['Record Checklists']
           #swagger.summary = 'Create Multiple Checklist Defects'
           #swagger.description = 'Create multiple defect records at once'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['recordChecklistId'] = {
               in: 'path',
               description: 'Record Checklist ID',
               required: true,
               type: 'string'
           }
           #swagger.requestBody = {
               required: true,
               content: {
                   'application/json': {
                       schema: { 
                           type: 'object',
                           properties: {
                               defects: { type: 'array', items: { $ref: '#/components/schemas/CreateChecklistDefect' } }
                           }
                       }
                   }
               }
           }
        */
        try {
            const { recordChecklistId } = req.params;
            const { defects } = req.body;
            if (!Array.isArray(defects)) {
                return res.status(400).json({ success: false, message: 'defects must be an array' });
            }
            // Add record_checklist_id to each defect
            const defectsWithChecklistId = defects.map(defect => ({
                ...defect,
                record_checklist_id: recordChecklistId
            }));
            const created = await checklistDefectService.createMultiple(defectsWithChecklistId);
            res.status(201).json({ success: true, message: 'Checklist defects created', data: created });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ success: false, message: error.message });
            } else {
                res.status(400).json({ success: false, message: 'Failed to create checklist defects' });
            }
        }
    }

    async getDefectsByRecordChecklist(req: Request, res: Response) {
        /* #swagger.tags = ['Record Checklists']
           #swagger.summary = 'Get Defects by Record Checklist'
           #swagger.description = 'Get all defects for a specific record checklist'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['recordChecklistId'] = {
               in: 'path',
               description: 'Record Checklist ID',
               required: true,
               type: 'string'
           }
        */
        try {
            const { recordChecklistId } = req.params;
            const defects = await checklistDefectService.getDefectsByRecordChecklist(recordChecklistId);
            res.status(200).json({ success: true, data: defects });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ success: false, message: error.message });
            } else {
                res.status(400).json({ success: false, message: 'Failed to get checklist defects' });
            }
        }
    }

    async getChecklistDefectById(req: Request, res: Response) {
        /* #swagger.tags = ['Record Checklists']
           #swagger.summary = 'Get Checklist Defect by ID'
           #swagger.description = 'Get a specific checklist defect by ID'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['defectId'] = {
               in: 'path',
               description: 'Checklist Defect ID',
               required: true,
               type: 'string'
           }
        */
        try {
            const { defectId } = req.params;
            const defect = await checklistDefectService.getChecklistDefectById(defectId);
            if (!defect) {
                return res.status(404).json({ success: false, message: 'Checklist defect not found' });
            }
            res.status(200).json({ success: true, data: defect });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ success: false, message: error.message });
            } else {
                res.status(400).json({ success: false, message: 'Failed to get checklist defect' });
            }
        }
    }

    async updateChecklistDefect(req: Request, res: Response) {
        /* #swagger.tags = ['Record Checklists']
           #swagger.summary = 'Update Checklist Defect'
           #swagger.description = 'Update a checklist defect'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['defectId'] = {
               in: 'path',
               description: 'Checklist Defect ID',
               required: true,
               type: 'string'
           }
           #swagger.requestBody = {
               required: true,
               content: {
                   'application/json': {
                       schema: { $ref: '#/components/schemas/UpdateChecklistDefect' }
                   }
               }
           }
        */
        try {
            const { defectId } = req.params;
            const defect = await checklistDefectService.updateChecklistDefect(defectId, req.body);
            if (!defect) {
                return res.status(404).json({ success: false, message: 'Checklist defect not found' });
            }
            res.status(200).json({ success: true, message: 'Checklist defect updated', data: defect });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ success: false, message: error.message });
            } else {
                res.status(400).json({ success: false, message: 'Failed to update checklist defect' });
            }
        }
    }

    async deleteChecklistDefect(req: Request, res: Response) {
        /* #swagger.tags = ['Record Checklists']
           #swagger.summary = 'Delete Checklist Defect'
           #swagger.description = 'Delete a checklist defect'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['defectId'] = {
               in: 'path',
               description: 'Checklist Defect ID',
               required: true,
               type: 'string'
           }
        */
        try {
            const { defectId } = req.params;
            const defect = await checklistDefectService.deleteChecklistDefect(defectId);
            if (!defect) {
                return res.status(404).json({ success: false, message: 'Checklist defect not found' });
            }
            res.status(200).json({ success: true, message: 'Checklist defect deleted', data: defect });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ success: false, message: error.message });
            } else {
                res.status(400).json({ success: false, message: 'Failed to delete checklist defect' });
            }
        }
    }
}

export default new RecordChecklistController();
