import { Request, Response } from 'express';
import serviceDetailService from '../services/serviceDetail.service';

export class ServiceDetailController {
    async createServiceDetail(req: Request, res: Response) {
        /* #swagger.tags = ['Service Details']
           #swagger.summary = 'Create a new service detail entry'
           #swagger.description = 'Create a new service detail entry'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.requestBody = {
               required: true,
               content: {
                   'application/json': {
                       schema: { $ref: '#/components/schemas/CreateServiceDetail' }
                   }
               }
           }
        */
        try {
            const detail = await serviceDetailService.createServiceDetail(req.body);
            res.status(201).json({
                success: true,
                message: 'Service detail created successfully',
                data: detail
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
                    message: 'Failed to create service detail'
                });
            }
        }
    }

    async getServiceDetailById(req: Request, res: Response) {
        /* #swagger.tags = ['Service Details']
           #swagger.summary = 'Get service detail by ID'
           #swagger.description = 'Get service detail by ID'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['id'] = {
               in: 'path',
               description: 'Service Detail ID',
               required: true,
               type: 'string'
           }
        */
        try {
            const detail = await serviceDetailService.getServiceDetailById(req.params.id);
            if (!detail) {
                return res.status(404).json({
                    success: false,
                    message: 'Service detail not found'
                });
            }
            res.status(200).json({
                success: true,
                data: detail
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
                    message: 'Failed to get service detail'
                });
            }
        }
    }

    async getAllServiceDetails(req: Request, res: Response) {
        /* #swagger.tags = ['Service Details']
           #swagger.summary = 'Get all service details with optional filters'
           #swagger.description = 'Get all service details with optional filters'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['record_id'] = {
               in: 'query',
               description: 'Filter by service record ID',
               required: false,
               type: 'string'
           }
             #swagger.parameters['centerpart_id'] = {
               in: 'query',
               description: 'Filter by center auto part ID (CenterAutoPart _id)',
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
                record_id: req.query.record_id as string,
                centerpart_id: req.query.centerpart_id as string,
                page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
                limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined
            };
            const result = await serviceDetailService.getAllServiceDetails(filters);
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
                    message: 'Failed to get service details'
                });
            }
        }
    }

    async updateServiceDetail(req: Request, res: Response) {
        /* #swagger.tags = ['Service Details']
           #swagger.summary = 'Update a service detail entry'
           #swagger.description = 'Update a service detail entry'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['id'] = {
               in: 'path',
               description: 'Service Detail ID',
               required: true,
               type: 'string'
           }
           #swagger.requestBody = {
               required: true,
               content: {
                   'application/json': {
                       schema: { $ref: '#/components/schemas/UpdateServiceDetail' }
                   }
               }
           }
        */
        try {
            const detail = await serviceDetailService.updateServiceDetail(req.params.id, req.body);
            if (!detail) {
                return res.status(404).json({
                    success: false,
                    message: 'Service detail not found'
                });
            }
            res.status(200).json({
                success: true,
                message: 'Service detail updated successfully',
                data: detail
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
                    message: 'Failed to update service detail'
                });
            }
        }
    }

    async deleteServiceDetail(req: Request, res: Response) {
        /* #swagger.tags = ['Service Details']
              #swagger.summary = 'Delete a service detail entry'
           #swagger.description = 'Delete a service detail entry'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['id'] = {
               in: 'path',
               description: 'Service Detail ID',
               required: true,
               type: 'string'
           }
        */
        try {
            const detail = await serviceDetailService.deleteServiceDetail(req.params.id);
            if (!detail) {
                return res.status(404).json({
                    success: false,
                    message: 'Service detail not found'
                });
            }
            res.status(200).json({
                success: true,
                message: 'Service detail deleted successfully',
                data: detail
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
                    message: 'Failed to delete service detail'
                });
            }
        }
    }
}

export default new ServiceDetailController();