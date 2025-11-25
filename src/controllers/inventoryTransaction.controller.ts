import { Request, Response } from 'express';
import inventoryTransactionService from '../services/inventoryTransaction.service';

export class InventoryTransactionController {

    async getAllInventoryTransactions(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['Inventory Transactions']
        // #swagger.summary = 'Get all inventory transactions'
        // #swagger.security = [{ "bearerAuth": [] }]
        // #swagger.parameters['center_id'] = { description: 'Filter by center ID', required: false, type: 'string', in: 'query' }
        // #swagger.parameters['transaction_type'] = { description: 'Filter by type (IN, OUT, ADJUSTMENT)', required: false, type: 'string', in: 'query' }
        // #swagger.parameters['status'] = { description: 'Filter by status (PENDING, COMPLETED, CANCELLED)', required: false, type: 'string', in: 'query' }
        // #swagger.parameters['reference_type'] = { description: 'Filter by reference type', required: false, type: 'string', in: 'query' }
        // #swagger.parameters['page'] = { description: 'Page number', required: false, type: 'number', in: 'query' }
        // #swagger.parameters['limit'] = { description: 'Limit per page', required: false, type: 'number', in: 'query' }
        try {
            const result = await inventoryTransactionService.getAllInventoryTransactions(req.query);
            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}

export default new InventoryTransactionController();
