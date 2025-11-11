import { Request, Response } from 'express';
import paymentService from '../services/payment.service';

export class PaymentController {
    async createPayment(req: Request, res: Response) {
        /* #swagger.tags = ['Payments']
           #swagger.description = 'Create a new payment link'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.requestBody = {
               required: true,
               content: {
                   'application/json': {
                       schema: { $ref: '#/components/schemas/CreatePayment' }
                   }
               }
           }
        */
        try {
            const result = await paymentService.createPayment(req.body);
            res.status(201).json({
                success: true,
                message: 'Payment created successfully',
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
                    message: 'Failed to create payment'
                });
            }
        }
    }

    async getPaymentById(req: Request, res: Response) {
        /* #swagger.tags = ['Payments']
           #swagger.description = 'Get payment by ID'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['id'] = {
               in: 'path',
               description: 'Payment ID',
               required: true,
               type: 'string'
           }
        */
        try {
            const payment = await paymentService.getPaymentById(req.params.id);
            if (!payment) {
                return res.status(404).json({
                    success: false,
                    message: 'Payment not found'
                });
            }
            res.status(200).json({
                success: true,
                data: payment
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
                    message: 'Failed to get payment'
                });
            }
        }
    }

    async getPaymentByOrderCode(req: Request, res: Response) {
        /* #swagger.tags = ['Payments']
           #swagger.description = 'Get payment by order code'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['orderCode'] = {
               in: 'path',
               description: 'Order Code',
               required: true,
               type: 'number'
           }
        */
        try {
            const payment = await paymentService.getPaymentByOrderCode(Number(req.params.orderCode));
            if (!payment) {
                return res.status(404).json({
                    success: false,
                    message: 'Payment not found'
                });
            }
            res.status(200).json({
                success: true,
                data: payment
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
                    message: 'Failed to get payment'
                });
            }
        }
    }

    async getAllPayments(req: Request, res: Response) {
        /* #swagger.tags = ['Payments']
           #swagger.description = 'Get all payments with optional filters'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['status'] = {
               in: 'query',
               description: 'Filter by status',
               required: false,
               type: 'string',
               enum: ['pending', 'paid', 'cancelled', 'expired']
           }
           #swagger.parameters['customer_id'] = {
               in: 'query',
               description: 'Filter by customer ID',
               required: false,
               type: 'string'
           }
           #swagger.parameters['service_record_id'] = {
               in: 'query',
               description: 'Filter by service record ID',
               required: false,
               type: 'string'
           }
           #swagger.parameters['subscription_id'] = {
               in: 'query',
               description: 'Filter by subscription ID',
               required: false,
               type: 'string'
           }
           #swagger.parameters['payment_type'] = {
               in: 'query',
               description: 'Filter by payment type',
               required: false,
               type: 'string',
               enum: ['service_record', 'subscription']
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
                customer_id: req.query.customer_id as string,
                service_record_id: req.query.service_record_id as string,
                subscription_id: req.query.subscription_id as string,
                payment_type: req.query.payment_type as string,
                page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
                limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined
            };
            const result = await paymentService.getAllPayments(filters);
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
                    message: 'Failed to get payments'
                });
            }
        }
    }

    async handleWebhook(req: Request, res: Response) {
        /* #swagger.tags = ['Payments']
           #swagger.description = 'Handle PayOS webhook'
           #swagger.requestBody = {
               required: true,
               content: {
                   'application/json': {
                       schema: { $ref: '#/components/schemas/PaymentWebhook' }
                   }
               }
           }
        */
        try {
            const payment = await paymentService.handlePaymentWebhook(req.body);
            res.status(200).json({
                success: true,
                message: 'Webhook processed successfully',
                data: payment
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
                    message: 'Failed to process webhook'
                });
            }
        }
    }

    async cancelPayment(req: Request, res: Response) {
        /* #swagger.tags = ['Payments']
           #swagger.description = 'Cancel a payment'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['orderCode'] = {
               in: 'path',
               description: 'Order Code',
               required: true,
               type: 'number'
           }
        */
        try {
            const payment = await paymentService.cancelPayment(Number(req.params.orderCode));
            if (!payment) {
                return res.status(404).json({
                    success: false,
                    message: 'Payment not found'
                });
            }
            res.status(200).json({
                success: true,
                message: 'Payment cancelled successfully',
                data: payment
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
                    message: 'Failed to cancel payment'
                });
            }
        }
    }

    async getPaymentInfo(req: Request, res: Response) {
        /* #swagger.tags = ['Payments']
           #swagger.description = 'Get payment information from PayOS'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['orderCode'] = {
               in: 'path',
               description: 'Order Code',
               required: true,
               type: 'number'
           }
        */
        try {
            const info = await paymentService.getPaymentInfo(Number(req.params.orderCode));
            res.status(200).json({
                success: true,
                data: info
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
                    message: 'Failed to get payment info'
                });
            }
        }
    }

    async simulatePaymentSuccess(req: Request, res: Response) {
        /* #swagger.tags = ['Payments']
           #swagger.description = '[DEV ONLY] Simulate payment success for testing'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['orderCode'] = {
               in: 'path',
               description: 'Order Code',
               required: true,
               type: 'number'
           }
        */
        try {
            const payment = await paymentService.simulatePaymentSuccess(Number(req.params.orderCode));
            res.status(200).json({
                success: true,
                message: 'Payment simulated successfully (DEV MODE)',
                data: payment
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
                    message: 'Failed to simulate payment'
                });
            }
        }
    }
}

export default new PaymentController();
