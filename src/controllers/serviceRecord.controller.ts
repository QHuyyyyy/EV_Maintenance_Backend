import { Request, Response } from 'express';
import serviceRecordService from '../services/serviceRecord.service';

export class ServiceRecordController {
    async createServiceRecord(req: Request, res: Response) {
        /* #swagger.tags = ['Service Records']
          #swagger.summary = 'Create Service Record'
           #swagger.description = 'Create a new service record'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.requestBody = {
               required: true,
               content: {
                   'application/json': {
                       schema: { $ref: '#/components/schemas/CreateServiceRecord' }
                   }
               }
           }
        */
        try {
            const record = await serviceRecordService.createServiceRecord(req.body);
            res.status(201).json({
                success: true,
                message: 'Service record created successfully',
                data: record
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
                    message: 'Failed to create service record'
                });
            }
        }
    }

    async getServiceRecordById(req: Request, res: Response) {
        /* #swagger.tags = ['Service Records']
           #swagger.summary = 'Get Service Record by ID'
           #swagger.description = 'Get service record by ID'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['id'] = {
               in: 'path',
               description: 'Service Record ID',
               required: true,
               type: 'string'
           }
        */
        try {
            const record = await serviceRecordService.getServiceRecordById(req.params.id);
            if (!record) {
                return res.status(404).json({
                    success: false,
                    message: 'Service record not found'
                });
            }
            res.status(200).json({
                success: true,
                data: record
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
                    message: 'Failed to get service record'
                });
            }
        }
    }

    async getAllSuggestedParts(req: Request, res: Response) {
        /* #swagger.tags = ['Service Records']
           #swagger.summary = 'Get all suggested parts for a service record'
           #swagger.description = 'Aggregate CenterAutoPart suggestions from all checklist items for the given service record, grouped with counts.'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['id'] = {
               in: 'path',
               description: 'Service Record ID',
               required: true,
               type: 'string'
           }
        */
        try {
            const data = await serviceRecordService.getAllSuggestedParts(req.params.id);
            res.status(200).json({ success: true, data });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ success: false, message: error.message });
            } else {
                res.status(400).json({ success: false, message: 'Failed to get suggested parts' });
            }
        }
    }

    async getAllServiceRecords(req: Request, res: Response) {
        /* #swagger.tags = ['Service Records']
           #swagger.summary = 'Get All Service Records'
           #swagger.description = 'Get all service records with optional filters'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['status'] = {
               in: 'query',
               description: 'Filter by status',
               required: false,
               type: 'string',
               enum: ['pending', 'in-progress', 'completed', 'cancelled']
           }
           #swagger.parameters['appointment_id'] = {
               in: 'query',
               description: 'Filter by appointment ID',
               required: false,
               type: 'string'
           }
           #swagger.parameters['technician_id'] = {
               in: 'query',
               description: 'Filter by technician ID',
               required: false,
               type: 'string'
           }
           #swagger.parameters['startDate'] = {
               in: 'query',
               description: 'Filter by start date (from)',
               required: false,
               type: 'string',
               format: 'date-time'
           }
           #swagger.parameters['endDate'] = {
               in: 'query',
               description: 'Filter by end date (to)',
               required: false,
               type: 'string',
               format: 'date-time'
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
                appointment_id: req.query.appointment_id as string,
                technician_id: req.query.technician_id as string,
                startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
                endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
                page: req.query.page ? parseInt(req.query.page as string) : undefined,
                limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
            };
            const result = await serviceRecordService.getAllServiceRecords(filters);
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
                    message: 'Failed to get service records'
                });
            }
        }
    }

    async updateServiceRecord(req: Request, res: Response) {
        /* #swagger.tags = ['Service Records']
           #swagger.summary = 'Update a service record'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['id'] = {
               in: 'path',
               description: 'Service Record ID',
               required: true,
               type: 'string'
           }
           #swagger.requestBody = {
               required: true,
               content: {
                   'application/json': {
                       schema: { $ref: '#/components/schemas/UpdateServiceRecord' }
                   }
               }
           }
        */
        try {
            const record = await serviceRecordService.updateServiceRecord(req.params.id, req.body);
            if (!record) {
                return res.status(404).json({
                    success: false,
                    message: 'Service record not found'
                });
            }
            res.status(200).json({
                success: true,
                message: 'Service record updated successfully',
                data: record
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
                    message: 'Failed to update service record'
                });
            }
        }
    }

    async deleteServiceRecord(req: Request, res: Response) {
        /* #swagger.tags = ['Service Records']
           #swagger.summary = 'Delete a service record'
           #swagger.description = 'Delete a service record'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['id'] = {
               in: 'path',
               description: 'Service Record ID',
               required: true,
               type: 'string'
           }
        */
        try {
            const record = await serviceRecordService.deleteServiceRecord(req.params.id);
            if (!record) {
                return res.status(404).json({
                    success: false,
                    message: 'Service record not found'
                });
            }
            res.status(200).json({
                success: true,
                message: 'Service record deleted successfully',
                data: record
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
                    message: 'Failed to delete service record'
                });
            }
        }
    }

    async calculateBillWithSubscription(req: Request, res: Response) {
        /* #swagger.tags = ['Service Records']
           #swagger.summary = 'Calculate bill with subscription discount'
           #swagger.description = 'Calculate total bill for a service record including subscription discount if applicable'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['id'] = {
               in: 'path',
               description: 'Service Record ID',
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
                               serviceCharges: { type: 'number', description: 'Total service charges' },
                               partsTotal: { type: 'number', description: 'Total parts cost' }
                           },
                           required: ['serviceCharges', 'partsTotal']
                       }
                   }
               }
           }
        */
        try {
            const { serviceCharges, partsTotal } = req.body;
            
            if (typeof serviceCharges !== 'number' || typeof partsTotal !== 'number') {
                return res.status(400).json({
                    success: false,
                    message: 'serviceCharges and partsTotal must be numbers'
                });
            }

            const billCalculation = await serviceRecordService.calculateBillWithSubscription(
                req.params.id,
                serviceCharges,
                partsTotal
            );

            res.status(200).json({
                success: true,
                message: 'Bill calculated successfully',
                data: billCalculation
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
                    message: 'Failed to calculate bill'
                });
            }
        }
    }


}

export default new ServiceRecordController();
