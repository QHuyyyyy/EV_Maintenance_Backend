import { Request, Response } from 'express';
import centerAutoPartService from '../services/centerAutoPart.service';

export class CenterAutoPartController {
    async createCenterAutoPart(req: Request, res: Response) {
        /* #swagger.tags = ['Center Auto Parts']
           #swagger.summary = 'Create a new center-scoped auto part entry'
           #swagger.description = 'Create a new center-scoped auto part entry'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.requestBody = {
               required: true,
               content: {
                   'application/json': {
                       schema: { $ref: '#/components/schemas/CreateCenterAutoPart' }
                   }
               }
           }
        */
        try {
            const item = await centerAutoPartService.createCenterAutoPart(req.body);
            res.status(201).json({ success: true, message: 'Center auto part created', data: item });
        } catch (error) {
            if (error instanceof Error) res.status(400).json({ success: false, message: error.message });
            else res.status(400).json({ success: false, message: 'Failed to create center auto part' });
        }
    }

    async getCenterAutoPartById(req: Request, res: Response) {
        /* #swagger.tags = ['Center Auto Parts']
           #swagger.summary = 'Get center auto part by ID'
           #swagger.description = 'Get center auto part by ID'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['id'] = {
               in: 'path',
               description: 'CenterAutoPart ID',
               required: true,
               type: 'string'
           }
        */
        try {
            const item = await centerAutoPartService.getCenterAutoPartById(req.params.id);
            if (!item) return res.status(404).json({ success: false, message: 'Not found' });
            res.status(200).json({ success: true, data: item });
        } catch (error) {
            if (error instanceof Error) res.status(400).json({ success: false, message: error.message });
            else res.status(400).json({ success: false, message: 'Failed to get center auto part' });
        }
    }

    async getAllCenterAutoParts(req: Request, res: Response) {
        /* #swagger.tags = ['Center Auto Parts']
              #swagger.summary = 'Get all center auto parts with optional filters'
           #swagger.description = 'Get all center auto parts with optional filters'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['center_id'] = {
               in: 'query',
               description: 'Filter by center ID',
               required: false,
               type: 'string'
           }
           #swagger.parameters['part_id'] = {
               in: 'query',
               description: 'Filter by auto part ID',
               required: false,
               type: 'string'
           }
           #swagger.parameters['page'] = {
               in: 'query',
               description: 'Page number',
               required: false,
               type: 'integer',
               default: 1
           }
           #swagger.parameters['limit'] = {
               in: 'query',
               description: 'Items per page',
               required: false,
               type: 'integer',
               default: 10
           }
        */
        try {
            const filters = {
                center_id: req.query.center_id as string,
                part_id: req.query.part_id as string,
                page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
                limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined
            };
            const result = await centerAutoPartService.getAllCenterAutoParts(filters as any);
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            if (error instanceof Error) res.status(400).json({ success: false, message: error.message });
            else res.status(400).json({ success: false, message: 'Failed to get center auto parts' });
        }
    }

    async updateCenterAutoPart(req: Request, res: Response) {
        /* #swagger.tags = ['Center Auto Parts']
              #swagger.summary = 'Update a center auto part entry'
           #swagger.description = 'Update a center auto part entry'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['id'] = {
               in: 'path',
               description: 'CenterAutoPart ID',
               required: true,
               type: 'string'
           }
           #swagger.requestBody = {
               required: true,
               content: {
                   'application/json': {
                       schema: { $ref: '#/components/schemas/UpdateCenterAutoPart' }
                   }
               }
           }
        */
        try {
            const item = await centerAutoPartService.updateCenterAutoPart(req.params.id, req.body);
            if (!item) return res.status(404).json({ success: false, message: 'Not found' });
            res.status(200).json({ success: true, message: 'Updated', data: item });
        } catch (error) {
            if (error instanceof Error) res.status(400).json({ success: false, message: error.message });
            else res.status(400).json({ success: false, message: 'Failed to update center auto part' });
        }
    }

    async deleteCenterAutoPart(req: Request, res: Response) {
        /* #swagger.tags = ['Center Auto Parts']
                #swagger.summary = 'Delete a center auto part entry'
           #swagger.description = 'Delete a center auto part entry'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['id'] = {
               in: 'path',
               description: 'CenterAutoPart ID',
               required: true,
               type: 'string'
           }
        */
        try {
            const item = await centerAutoPartService.deleteCenterAutoPart(req.params.id);
            if (!item) return res.status(404).json({ success: false, message: 'Not found' });
            res.status(200).json({ success: true, message: 'Deleted', data: item });
        } catch (error) {
            if (error instanceof Error) res.status(400).json({ success: false, message: error.message });
            else res.status(400).json({ success: false, message: 'Failed to delete center auto part' });
        }
    }
}

export default new CenterAutoPartController();
