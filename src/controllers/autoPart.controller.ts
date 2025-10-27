import { Request, Response } from 'express';
import autoPartService from '../services/autoPart.service';

export class AutoPartController {
    async createAutoPart(req: Request, res: Response) {
        /* #swagger.tags = ['Auto Parts']
           #swagger.summary = 'Create a new auto part'
           #swagger.description = 'Create a new auto part'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.requestBody = {
               required: true,
               content: {
                   'application/json': {
                       schema: { $ref: '#/components/schemas/CreateAutoPart' }
                   }
               }
           }
        */
        try {
            const part = await autoPartService.createAutoPart(req.body);
            res.status(201).json({
                success: true,
                message: 'Auto part created successfully',
                data: part
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
                    message: 'Failed to create auto part'
                });
            }
        }
    }

    async getAutoPartById(req: Request, res: Response) {
        /* #swagger.tags = ['Auto Parts']
              #swagger.summary = 'Get auto part by ID'
           #swagger.description = 'Get auto part by ID'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['id'] = {
               in: 'path',
               description: 'Auto Part ID',
               required: true,
               type: 'string'
           }
        */
        try {
            const part = await autoPartService.getAutoPartById(req.params.id);
            if (!part) {
                return res.status(404).json({
                    success: false,
                    message: 'Auto part not found'
                });
            }
            res.status(200).json({
                success: true,
                data: part
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
                    message: 'Failed to get auto part'
                });
            }
        }
    }

    async getAllAutoParts(req: Request, res: Response) {
        /* #swagger.tags = ['Auto Parts']
           #swagger.summary = 'Get all auto parts with optional filters'
           #swagger.description = 'Get all auto parts with optional filters'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['name'] = {
               in: 'query',
               description: 'Filter by part name',
               required: false,
               type: 'string'
           }
           // Inventory-level filters are provided by center scoped endpoints (CenterAutoPart)
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
                name: req.query.name as string,
                page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
                limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined
            };
            const result = await autoPartService.getAllAutoParts(filters);
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
                    message: 'Failed to get auto parts'
                });
            }
        }
    }

    async updateAutoPart(req: Request, res: Response) {
        /* #swagger.tags = ['Auto Parts']
           #swagger.summary = 'Update an auto part'
           #swagger.description = 'Update an auto part'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['id'] = {
               in: 'path',
               description: 'Auto Part ID',
               required: true,
               type: 'string'
           }
           #swagger.requestBody = {
               required: true,
               content: {
                   'application/json': {
                       schema: { $ref: '#/components/schemas/UpdateAutoPart' }
                   }
               }
           }
        */
        try {
            const part = await autoPartService.updateAutoPart(req.params.id, req.body);
            if (!part) {
                return res.status(404).json({
                    success: false,
                    message: 'Auto part not found'
                });
            }
            res.status(200).json({
                success: true,
                message: 'Auto part updated successfully',
                data: part
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
                    message: 'Failed to update auto part'
                });
            }
        }
    }

    async deleteAutoPart(req: Request, res: Response) {
        /* #swagger.tags = ['Auto Parts']
              #swagger.summary = 'Delete an auto part'
           #swagger.description = 'Delete an auto part'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['id'] = {
               in: 'path',
               description: 'Auto Part ID',
               required: true,
               type: 'string'
           }
        */
        try {
            const part = await autoPartService.deleteAutoPart(req.params.id);
            if (!part) {
                return res.status(404).json({
                    success: false,
                    message: 'Auto part not found'
                });
            }
            res.status(200).json({
                success: true,
                message: 'Auto part deleted successfully',
                data: part
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
                    message: 'Failed to delete auto part'
                });
            }
        }
    }
}

export default new AutoPartController();