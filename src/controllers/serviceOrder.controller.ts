import { Request, Response } from 'express';
import serviceOrderService from '../services/serviceOrder.service';

export class ServiceOrderController {
    async createServiceOrder(req: Request, res: Response) {
        /* #swagger.tags = ['Service Orders']
           #swagger.summary = 'Create Service Order'
           #swagger.description = 'Create a new service order (customer chooses to fix something)'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.requestBody = {
               required: true,
               content: {
                   'application/json': {
                       schema: { $ref: '#/components/schemas/CreateServiceOrder' }
                   }
               }
           }
        */
        try {
            const order = await serviceOrderService.createServiceOrder(req.body);
            res.status(201).json({ success: true, message: 'Service order created', data: order });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ success: false, message: error.message });
            } else {
                res.status(400).json({ success: false, message: 'Failed to create service order' });
            }
        }
    }

    async createMultipleServiceOrders(req: Request, res: Response) {
        /* #swagger.tags = ['Service Orders']
           #swagger.summary = 'Create Multiple Service Orders'
           #swagger.description = 'Create multiple service orders at once (customer confirms repair list)'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.requestBody = {
               required: true,
               content: {
                   'application/json': {
                       schema: { $ref: '#/components/schemas/CreateMultipleServiceOrders' }
                   }
               }
           }
        */
        try {
            const { orders } = req.body;
            if (!Array.isArray(orders) || orders.length === 0) {
                return res.status(400).json({ success: false, message: 'orders must be a non-empty array' });
            }
            const created = await serviceOrderService.createMultipleServiceOrders(orders);
            res.status(201).json({ success: true, message: 'Service orders created', data: created });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ success: false, message: error.message });
            } else {
                res.status(400).json({ success: false, message: 'Failed to create service orders' });
            }
        }
    }

    async getServiceOrdersByRecord(req: Request, res: Response) {
        /* #swagger.tags = ['Service Orders']
           #swagger.summary = 'Get Service Orders by Record'
           #swagger.description = 'Get all service orders for a specific service record'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['recordId'] = {
               in: 'path',
               description: 'Service Record ID',
               required: true,
               type: 'string'
           }
        */
        try {
            const { recordId } = req.params;
            const orders = await serviceOrderService.getServiceOrdersByRecord(recordId);
            res.status(200).json({ success: true, data: orders });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ success: false, message: error.message });
            } else {
                res.status(400).json({ success: false, message: 'Failed to get service orders' });
            }
        }
    }

    async getServiceOrdersByStatus(req: Request, res: Response) {
        /* #swagger.tags = ['Service Orders']
           #swagger.summary = 'Get Service Orders by Status'
           #swagger.description = 'Get service orders filtered by stock status (SUFFICIENT or LACKING)'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['recordId'] = {
               in: 'path',
               description: 'Service Record ID',
               required: true,
               type: 'string'
           }
           #swagger.parameters['status'] = {
               in: 'path',
               description: 'Stock status (SUFFICIENT or LACKING)',
               required: true,
               type: 'string',
               enum: ['SUFFICIENT', 'LACKING']
           }
        */
        try {
            const { recordId, status } = req.params;
            if (!['SUFFICIENT', 'LACKING'].includes(status)) {
                return res.status(400).json({ success: false, message: 'Invalid status' });
            }
            const orders = await serviceOrderService.getServiceOrdersByStatus(
                recordId,
                status as 'SUFFICIENT' | 'LACKING'
            );
            res.status(200).json({ success: true, data: orders });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ success: false, message: error.message });
            } else {
                res.status(400).json({ success: false, message: 'Failed to get service orders' });
            }
        }
    }

    async getServiceOrderById(req: Request, res: Response) {
        /* #swagger.tags = ['Service Orders']
           #swagger.summary = 'Get Service Order by ID'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['id'] = {
               in: 'path',
               description: 'Service Order ID',
               required: true,
               type: 'string'
           }
        */
        try {
            const { id } = req.params;
            const order = await serviceOrderService.getServiceOrderById(id);
            if (!order) {
                return res.status(404).json({ success: false, message: 'Service order not found' });
            }
            res.status(200).json({ success: true, data: order });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ success: false, message: error.message });
            } else {
                res.status(400).json({ success: false, message: 'Failed to get service order' });
            }
        }
    }

    async updateServiceOrderStatus(req: Request, res: Response) {
        /* #swagger.tags = ['Service Orders']
           #swagger.summary = 'Update Service Order Status'
           #swagger.description = 'Update stock status of a service order (e.g., when new stock arrives)'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['id'] = {
               in: 'path',
               description: 'Service Order ID',
               required: true,
               type: 'string'
           }
           #swagger.requestBody = {
               required: true,
               content: {
                   'application/json': {
                       schema: { $ref: '#/components/schemas/UpdateServiceOrderStatus' }
                   }
               }
           }
        */
        try {
            const { id } = req.params;
            const { stock_status } = req.body;
            if (!['SUFFICIENT', 'LACKING'].includes(stock_status)) {
                return res.status(400).json({ success: false, message: 'Invalid stock status' });
            }
            const order = await serviceOrderService.updateServiceOrderStatus(id, stock_status);
            if (!order) {
                return res.status(404).json({ success: false, message: 'Service order not found' });
            }
            res.status(200).json({ success: true, message: 'Service order updated', data: order });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ success: false, message: error.message });
            } else {
                res.status(400).json({ success: false, message: 'Failed to update service order' });
            }
        }
    }

    async deleteServiceOrder(req: Request, res: Response) {
        /* #swagger.tags = ['Service Orders']
           #swagger.summary = 'Delete Service Order'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['id'] = {
               in: 'path',
               description: 'Service Order ID',
               required: true,
               type: 'string'
           }
        */
        try {
            const { id } = req.params;
            const order = await serviceOrderService.deleteServiceOrder(id);
            if (!order) {
                return res.status(404).json({ success: false, message: 'Service order not found' });
            }
            res.status(200).json({ success: true, message: 'Service order deleted', data: order });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ success: false, message: error.message });
            } else {
                res.status(400).json({ success: false, message: 'Failed to delete service order' });
            }
        }
    }

    async getLackingPartsForShift(req: Request, res: Response) {
        /* #swagger.tags = ['Service Orders']
           #swagger.summary = 'Get Lacking Parts for Shift'
           #swagger.description = 'Get total lacking parts quantity for a specific shift (and optional slot)'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.requestBody = {
               required: true,
               content: {
                   'application/json': {
                       schema: { $ref: '#/components/schemas/GetLackingPartsForShiftRequest' }
                   }
               }
           }
        */
        try {
            const { shift_id, slot_id } = req.body;
            if (!shift_id) {
                return res.status(400).json({ success: false, message: 'shift_id is required' });
            }
            const lackingParts = await serviceOrderService.getLackingPartsForShift(shift_id, slot_id);
            res.status(200).json({ success: true, data: lackingParts });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ success: false, message: error.message });
            } else {
                res.status(400).json({ success: false, message: 'Failed to get lacking parts' });
            }
        }
    }

}

export default new ServiceOrderController();
