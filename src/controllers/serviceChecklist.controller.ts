import { Request, Response } from 'express';
import serviceChecklistService from '../services/serviceChecklist.service';

export class ServiceChecklistController {
    async createServiceChecklist(req: Request, res: Response) {
        /* #swagger.tags = ['Service Checklists']
           #swagger.description = 'Create a new service checklist item'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.requestBody = {
               required: true,
               content: {
                   'application/json': {
                       schema: { $ref: '#/components/schemas/CreateServiceChecklist' }
                   }
               }
           }
        */
        try {
            const checklist = await serviceChecklistService.createServiceChecklist(req.body);
            res.status(201).json({
                success: true,
                message: 'Service checklist created successfully',
                data: checklist
            });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({
                    success: false,
                    message: error.message
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: 'Failed to create service checklist'
                });
            }
        }
    }

    async getServiceChecklistById(req: Request, res: Response) {
        /* #swagger.tags = ['Service Checklists']
           #swagger.description = 'Get service checklist by ID'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['id'] = {
               in: 'path',
               description: 'Service Checklist ID',
               required: true,
               type: 'string'
           }
        */
        try {
            const checklist = await serviceChecklistService.getServiceChecklistById(req.params.id);
            if (!checklist) {
                return res.status(404).json({
                    success: false,
                    message: 'Service checklist not found'
                });
            }
            res.status(200).json({
                success: true,
                data: checklist
            });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({
                    success: false,
                    message: error.message
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: 'Failed to get service checklist'
                });
            }
        }
    }

    async getAllServiceChecklists(req: Request, res: Response) {
        /* #swagger.tags = ['Service Checklists']
           #swagger.description = 'Get all service checklists with optional filters'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['status'] = {
               in: 'query',
               description: 'Filter by status',
               required: false,
               type: 'string',
               enum: ['pending', 'completed', 'skipped']
           }
           #swagger.parameters['record_id'] = {
               in: 'query',
               description: 'Filter by service record ID',
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
                status: req.query.status as string,
                record_id: req.query.record_id as string,
                page: req.query.page ? parseInt(req.query.page as string) : undefined,
                limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
            };
            const result = await serviceChecklistService.getAllServiceChecklists(filters);
            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({
                    success: false,
                    message: error.message
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: 'Failed to get service checklists'
                });
            }
        }
    }

    async updateServiceChecklist(req: Request, res: Response) {
        /* #swagger.tags = ['Service Checklists']
           #swagger.description = 'Update a service checklist item'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['id'] = {
               in: 'path',
               description: 'Service Checklist ID',
               required: true,
               type: 'string'
           }
           #swagger.requestBody = {
               required: true,
               content: {
                   'application/json': {
                       schema: { $ref: '#/components/schemas/UpdateServiceChecklist' }
                   }
               }
           }
        */
        try {
            const checklist = await serviceChecklistService.updateServiceChecklist(req.params.id, req.body);
            if (!checklist) {
                return res.status(404).json({
                    success: false,
                    message: 'Service checklist not found'
                });
            }
            res.status(200).json({
                success: true,
                message: 'Service checklist updated successfully',
                data: checklist
            });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({
                    success: false,
                    message: error.message
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: 'Failed to update service checklist'
                });
            }
        }
    }

    async deleteServiceChecklist(req: Request, res: Response) {
        /* #swagger.tags = ['Service Checklists']
           #swagger.description = 'Delete a service checklist item'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['id'] = {
               in: 'path',
               description: 'Service Checklist ID',
               required: true,
               type: 'string'
           }
        */
        try {
            const checklist = await serviceChecklistService.deleteServiceChecklist(req.params.id);
            if (!checklist) {
                return res.status(404).json({
                    success: false,
                    message: 'Service checklist not found'
                });
            }
            res.status(200).json({
                success: true,
                message: 'Service checklist deleted successfully',
                data: checklist
            });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({
                    success: false,
                    message: error.message
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: 'Failed to delete service checklist'
                });
            }
        }
    }
}

export default new ServiceChecklistController();
