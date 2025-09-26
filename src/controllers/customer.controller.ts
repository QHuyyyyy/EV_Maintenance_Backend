import { Request, Response } from 'express';
import { CustomerService } from '../services/customer.service';

const customerService = new CustomerService();

export class CustomerController {
    /**
     * @swagger
     * /api/customers:
     *   post:
     *     tags: [Customers]
     *     summary: Create a new customer
     *     description: Creates a new customer profile
     */
    async createCustomer(req: Request, res: Response): Promise<void> {
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

    async getCustomerById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const customer = await customerService.getCustomerById(id);
            res.status(200).json({
                success: true,
                data: customer
            });
        } catch (error: any) {
            res.status(404).json({
                success: false,
                message: error.message
            });
        }
    }

    async getCustomerByUserId(req: Request, res: Response): Promise<void> {
        try {
            const { userId } = req.params;
            const customer = await customerService.getCustomerByUserId(userId);
            res.status(200).json({
                success: true,
                data: customer
            });
        } catch (error: any) {
            res.status(404).json({
                success: false,
                message: error.message
            });
        }
    }

    async getAllCustomers(req: Request, res: Response): Promise<void> {
        try {
            const customers = await customerService.getAllCustomers();
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

    async updateCustomer(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const customer = await customerService.updateCustomer(id, req.body);
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

    async deleteCustomer(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            await customerService.deleteCustomer(id);
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