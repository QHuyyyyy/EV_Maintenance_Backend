import { Request, Response } from 'express';
import inventoryTicketService from '../services/inventoryTicket.service';

export class InventoryTicketController {

    async getAllInventoryTickets(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['Inventory Tickets']
        // #swagger.summary = 'Get all inventory tickets'
        // #swagger.security = [{ "bearerAuth": [] }]
        // #swagger.parameters['center_id'] = { description: 'Filter by center ID', required: false, type: 'string', in: 'query' }
        // #swagger.parameters['ticket_type'] = { description: 'Filter by ticket type (IN, OUT, ADJUSTMENT)', required: false, type: 'string', in: 'query' }
        // #swagger.parameters['status'] = { description: 'Filter by status (DRAFT, APPROVED, COMPLETED)', required: false, type: 'string', in: 'query' }
        // #swagger.parameters['page'] = { description: 'Page number', required: false, type: 'number', in: 'query' }
        // #swagger.parameters['limit'] = { description: 'Limit per page', required: false, type: 'number', in: 'query' }
        try {
            const result = await inventoryTicketService.getAllInventoryTickets(req.query);
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

    async getInventoryTicketById(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['Inventory Tickets']
        // #swagger.summary = 'Get inventory ticket by ID'
        // #swagger.security = [{ "bearerAuth": [] }]
        // #swagger.parameters['id'] = { description: 'InventoryTicket ID', required: true, type: 'string', in: 'path' }
        try {
            const { id } = req.params;
            const ticket = await inventoryTicketService.getInventoryTicketById(id);

            if (!ticket) {
                res.status(404).json({
                    success: false,
                    message: 'Inventory ticket not found'
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: ticket
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async createInventoryTicket(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['Inventory Tickets']
        // #swagger.summary = 'Create inventory ticket'
        // #swagger.security = [{ "bearerAuth": [] }]
        /* #swagger.requestBody = {
            required: true,
            content: {
                'application/json': {
                    schema: { $ref: '#/components/schemas/CreateInventoryTicket' },
                    description: 'Create ticket with flow information (source_type/source_id for IN type, destination_type/destination_id for OUT type)'
                }
            }
        } */
        try {
            const ticket = await inventoryTicketService.createInventoryTicket(req.body);
            res.status(201).json({
                success: true,
                message: 'Inventory ticket created successfully',
                data: ticket
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async updateInventoryTicket(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['Inventory Tickets']
        // #swagger.summary = 'Update inventory ticket'
        // #swagger.security = [{ "bearerAuth": [] }]
        // #swagger.parameters['id'] = { description: 'InventoryTicket ID', required: true, type: 'string', in: 'path' }
        /* #swagger.requestBody = {
            required: true,
            content: {
                'application/json': {
                    schema: { $ref: '#/components/schemas/UpdateInventoryTicket' },
                    description: 'Update ticket status and/or flow information. When status becomes COMPLETED, transaction is auto-created with stock adjustment'
                }
            }
        } */
        try {
            const { id } = req.params;
            const ticket = await inventoryTicketService.updateInventoryTicket(id, req.body);

            res.status(200).json({
                success: true,
                message: 'Inventory ticket updated successfully',
                data: ticket
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async deleteInventoryTicket(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['Inventory Tickets']
        // #swagger.summary = 'Delete inventory ticket'
        // #swagger.security = [{ "bearerAuth": [] }]
        // #swagger.parameters['id'] = { description: 'InventoryTicket ID', required: true, type: 'string', in: 'path' }
        try {
            const { id } = req.params;
            const deleted = await inventoryTicketService.deleteInventoryTicket(id);

            if (!deleted) {
                res.status(404).json({
                    success: false,
                    message: 'Inventory ticket not found'
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: 'Inventory ticket deleted successfully',
                data: deleted
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async addItemToTicket(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['Inventory Tickets']
        // #swagger.summary = 'Add item(s) to inventory ticket'
        // #swagger.security = [{ "bearerAuth": [] }]
        // #swagger.parameters['id'] = { description: 'InventoryTicket ID', required: true, type: 'string', in: 'path' }
        /* #swagger.requestBody = {
            required: true,
            content: {
                'application/json': {
                    schema: { $ref: '#/components/schemas/AddInventoryTicketItems' }
                }
            }
        } */
        try {
            const { id } = req.params;
            const { items } = req.body;

            // Support both single item and multiple items
            let itemsToAdd: any[] = [];

            if (Array.isArray(items)) {
                // Multiple items format
                itemsToAdd = items.filter((item: any) => item.part_id && item.quantity);
                if (itemsToAdd.length === 0) {
                    res.status(400).json({
                        success: false,
                        message: 'At least one valid item is required'
                    });
                    return;
                }
            } else if (req.body.part_id && req.body.quantity) {
                // Single item format (backward compatibility)
                itemsToAdd = [{
                    part_id: req.body.part_id,
                    quantity: req.body.quantity,
                    notes: req.body.notes || ''
                }];
            } else {
                res.status(400).json({
                    success: false,
                    message: 'Invalid request format. Provide either items array or single item with part_id and quantity'
                });
                return;
            }

            const ticket = await inventoryTicketService.addMultipleItemsToTicket(id, itemsToAdd);

            res.status(200).json({
                success: true,
                message: `${itemsToAdd.length} item(s) added to ticket successfully`,
                data: ticket
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async removeItemFromTicket(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['Inventory Tickets']
        // #swagger.summary = 'Remove item from inventory ticket'
        // #swagger.security = [{ "bearerAuth": [] }]
        // #swagger.parameters['id'] = { description: 'InventoryTicket ID', required: true, type: 'string', in: 'path' }
        // #swagger.parameters['itemId'] = { description: 'Item ID', required: true, type: 'string', in: 'path' }
        try {
            const { id, itemId } = req.params;
            const ticket = await inventoryTicketService.removeItemFromTicket(id, itemId);

            res.status(200).json({
                success: true,
                message: 'Item removed from ticket successfully',
                data: ticket
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
}

export default new InventoryTicketController();
