import { Request, Response } from 'express';
import { CustomerService } from '../services/customer.service';

const customerService = new CustomerService();

export class CustomerController {
    /**
     * Create a new customer
     * POST /api/customers
     */
    async createCustomer(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['Customers']
        // #swagger.summary = 'Create a new customer'
        /* #swagger.security = [{
           "bearerAuth": []
   }]
        // #swagger.description = 'Creates a new customer profile'
        /* #swagger.requestBody = {
            required: true,
            content: {
                "application/json": {
                    schema: {
                        $ref: '#/definitions/CreateCustomer'
                    }
                }
            }
        } */
        /* #swagger.responses[201] = {
            description: 'Customer created successfully',
            schema: {
                success: true,
                message: 'Customer created successfully',
                data: { $ref: '#/definitions/Customer' }
            }
        } */
        /* #swagger.responses[400] = {
            description: 'Bad request',
            schema: { $ref: '#/definitions/ErrorResponse' }
        } */
        try {
            const customer = await customerService.createCustomer(req.body);
            res.status(201).json({
                success: true,
                message: 'Customer created successfully',
                data: customer
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Get customer by ID
     * GET /api/customers/:id
     */
    async getCustomerById(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['Customers']
        // #swagger.summary = 'Get customer by ID'
        /* #swagger.security = [{
           "bearerAuth": []
   }]
        // #swagger.description = 'Retrieve a specific customer by their ID'
        // #swagger.parameters['id'] = { in: 'path', required: true, type: 'string', description: 'Customer ID' }
        /* #swagger.responses[200] = {
            description: 'Customer retrieved successfully',
            schema: {
                success: true,
                data: { $ref: '#/definitions/Customer' }
            }
        } */
        /* #swagger.responses[404] = {
            description: 'Customer not found',
            schema: { $ref: '#/definitions/ErrorResponse' }
        } */
        try {
            const { id } = req.params;
            const customer = await customerService.getCustomerById(id);
            
            if (!customer) {
                res.status(404).json({
                    success: false,
                    message: 'Customer not found'
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: customer
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Get customer by user ID
     * GET /api/customers/user/:userId
     */
    async getCustomerByUserId(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['Customers']
        // #swagger.summary = 'Get customer by user ID'
        /* #swagger.security = [{
           "bearerAuth": []
   }]
        // #swagger.description = 'Retrieve customer information by their user ID'
        // #swagger.parameters['userId'] = { in: 'path', required: true, type: 'string', description: 'User ID' }
        /* #swagger.responses[200] = {
            description: 'Customer retrieved successfully',
            schema: {
                success: true,
                data: { $ref: '#/definitions/Customer' }
            }
        } */
        /* #swagger.responses[404] = {
            description: 'Customer not found',
            schema: { $ref: '#/definitions/ErrorResponse' }
        } */
        try {
            const { userId } = req.params;
            const customer = await customerService.getCustomerByUserId(userId);
            
            if (!customer) {
                res.status(404).json({
                    success: false,
                    message: 'Customer not found'
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: customer
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Get all customers with filtering and pagination
     * GET /api/customers
     */
    async getAllCustomers(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['Customers']
        // #swagger.summary = 'Get all customers with filtering and pagination'
        /* #swagger.security = [{
           "bearerAuth": []
   }]
        // #swagger.description = 'Retrieve all customers with optional filtering and pagination'
        // #swagger.parameters['customerName'] = { in: 'query', type: 'string', description: 'Filter by customer name' }
        // #swagger.parameters['phone'] = { in: 'query', type: 'string', description: 'Filter by phone number' }
        // #swagger.parameters['address'] = { in: 'query', type: 'string', description: 'Filter by address' }
        // #swagger.parameters['page'] = { in: 'query', type: 'integer', description: 'Page number (default: 1)' }
        // #swagger.parameters['limit'] = { in: 'query', type: 'integer', description: 'Items per page (default: 10)' }
        /* #swagger.responses[200] = {
            description: 'Customers retrieved successfully',
            schema: {
                success: true,
                data: { type: 'array', items: { $ref: '#/definitions/Customer' } }
            }
        } */
        try {
            const { customerName, phone, address, page, limit } = req.query;
            
            const filters = {
                customerName: customerName as string,
                phone: phone as string,
                address: address as string,
                page: page ? parseInt(page as string) : undefined,
                limit: limit ? parseInt(limit as string) : undefined
            };

            const customers = await customerService.getAllCustomers(filters);
            res.status(200).json({
                success: true,
                data: customers
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Update customer by ID
     * PUT /api/customers/:id
     */
    async updateCustomer(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['Customers']
        // #swagger.summary = 'Update customer by ID'
        /* #swagger.security = [{
           "bearerAuth": []
   }]
        // #swagger.description = 'Update customer information'
        // #swagger.parameters['id'] = { in: 'path', required: true, type: 'string', description: 'Customer ID' }
        /* #swagger.requestBody = {
            required: true,
            content: {
                "application/json": {
                    schema: {
                        $ref: '#/definitions/UpdateCustomer'
                    }
                }
            }
        } */
        /* #swagger.responses[200] = {
            description: 'Customer updated successfully',
            schema: {
                success: true,
                message: 'Customer updated successfully',
                data: { $ref: '#/definitions/Customer' }
            }
        } */
        /* #swagger.responses[404] = {
            description: 'Customer not found',
            schema: { $ref: '#/definitions/ErrorResponse' }
        } */
        try {
            const { id } = req.params;
            const customer = await customerService.updateCustomer(id, req.body);
            
            if (!customer) {
                res.status(404).json({
                    success: false,
                    message: 'Customer not found'
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: 'Customer updated successfully',
                data: customer
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Delete customer by ID
     * DELETE /api/customers/:id
     */
    async deleteCustomer(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['Customers']
        // #swagger.summary = 'Delete customer by ID'
        /* #swagger.security = [{
           "bearerAuth": []
   }]
        // #swagger.description = 'Delete a customer (soft delete)'
        // #swagger.parameters['id'] = { in: 'path', required: true, type: 'string', description: 'Customer ID' }
        /* #swagger.responses[200] = {
            description: 'Customer deleted successfully',
            schema: {
                success: true,
                message: 'Customer deleted successfully'
            }
        } */
        /* #swagger.responses[404] = {
            description: 'Customer not found',
            schema: { $ref: '#/definitions/ErrorResponse' }
        } */
        try {
            const { id } = req.params;
            const deleted = await customerService.deleteCustomer(id);
            
            if (!deleted) {
                res.status(404).json({
                    success: false,
                    message: 'Customer not found'
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: 'Customer deleted successfully'
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
}

export default new CustomerController();