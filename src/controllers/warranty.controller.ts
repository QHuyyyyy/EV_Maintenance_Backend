import { Request, Response } from 'express';
import { getPartWarrantiesForCustomer, warrantyService } from '../services/warranty.service';

class WarrantyController {
    /**
     * GET /api/warranties/parts
     * Query: customerId (required), vehicle_id (optional)
     */
    async getWarrantiedPartsByCustomer(req: Request, res: Response) {
        try {
            /*  #swagger.tags = ['Warranty']
                #swagger.summary = 'Get warrantied parts by customer'
                #swagger.security = [{ "bearerAuth": [] }]
                #swagger.description = 'Return all active part warranties for a customer, optionally filtered by vehicle.'
                #swagger.parameters['customerId'] = { in: 'query', required: true, type: 'string' }
                #swagger.parameters['vehicle_id'] = { in: 'query', required: false, type: 'string' }
            */
            const { customerId, vehicle_id, status } = req.query as { customerId?: string; vehicle_id?: string; status?: string };
            if (!customerId) {
                return res.status(400).json({ success: false, message: 'customerId is required' });
            }

            const data = await getPartWarrantiesForCustomer(String(customerId), vehicle_id ? String(vehicle_id) : undefined, status);
            return res.status(200).json({ success: true, data });
        } catch (error: any) {
            return res.status(500).json({ success: false, message: error?.message || 'Internal server error' });
        }
    }

    /**
     * GET /api/warranties
     * Query: page, limit, vehicle_id
     */
    async getAllWarranties(req: Request, res: Response) {
        try {
            /*  #swagger.tags = ['Warranty']
                #swagger.summary = 'Get warranties (paginated)'
                #swagger.security = [{ "bearerAuth": [] }]
                #swagger.description = 'Return paginated list of warranties with optional vehicle filter.'
                #swagger.parameters['page'] = { in: 'query', type: 'integer', default: 1 }
                #swagger.parameters['limit'] = { in: 'query', type: 'integer', default: 10 }
                #swagger.parameters['vehicle_id'] = { in: 'query', type: 'string', required: false }
            */
            const page = req.query.page ? parseInt(String(req.query.page), 10) : undefined;
            const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;
            const vehicle_id = req.query.vehicle_id ? String(req.query.vehicle_id) : undefined;

            const result = await warrantyService.paginateWarranties({ page, limit, vehicle_id });
            return res.status(200).json({ success: true, data: result });
        } catch (error: any) {
            return res.status(500).json({ success: false, message: error?.message || 'Internal server error' });
        }
    }
}

export default new WarrantyController();
