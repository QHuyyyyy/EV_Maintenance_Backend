import { Request, Response } from 'express';
import invoiceService from '../services/invoice.service';

export class InvoiceController {
    async createInvoice(req: Request, res: Response) {
        /* #swagger.tags = ['Invoices']
           #swagger.description = 'Create a new invoice'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.requestBody = {
               required: true,
               content: {
                   'application/json': {
                       schema: { $ref: '#/components/schemas/CreateInvoice' }
                   }
               }
           }
        */
        try {
            const invoice = await invoiceService.createInvoice(req.body);
            res.status(201).json({
                success: true,
                message: 'Invoice created successfully',
                data: invoice
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
                    message: 'Failed to create invoice'
                });
            }
        }
    }

    async getInvoiceById(req: Request, res: Response) {
        /* #swagger.tags = ['Invoices']
           #swagger.description = 'Get invoice by ID'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['id'] = {
               in: 'path',
               description: 'Invoice ID',
               required: true,
               type: 'string'
           }
        */
        try {
            const invoice = await invoiceService.getInvoiceById(req.params.id);
            if (!invoice) {
                return res.status(404).json({
                    success: false,
                    message: 'Invoice not found'
                });
            }
            res.status(200).json({
                success: true,
                data: invoice
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
                    message: 'Failed to get invoice'
                });
            }
        }
    }

    async getInvoiceByPaymentId(req: Request, res: Response) {
        /* #swagger.tags = ['Invoices']
           #swagger.description = 'Get invoice by payment ID'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['paymentId'] = {
               in: 'path',
               description: 'Payment ID',
               required: true,
               type: 'string'
           }
        */
        try {
            const invoice = await invoiceService.getInvoiceByPaymentId(req.params.paymentId);
            if (!invoice) {
                return res.status(404).json({
                    success: false,
                    message: 'Invoice not found'
                });
            }
            res.status(200).json({
                success: true,
                data: invoice
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
                    message: 'Failed to get invoice'
                });
            }
        }
    }

    async getAllInvoices(req: Request, res: Response) {
        /* #swagger.tags = ['Invoices']
           #swagger.description = 'Get all issued invoices with pagination and optional payment filter'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['payment_id'] = {
               in: 'query',
               description: 'Filter by payment ID',
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
                payment_id: req.query.payment_id as string,
                page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
                limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined
            };
            const result = await invoiceService.getAllInvoices(filters);
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
                    message: 'Failed to get invoices'
                });
            }
        }
    }

    async updateInvoice(req: Request, res: Response) {
        /* #swagger.tags = ['Invoices']
           #swagger.description = 'Update an invoice'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['id'] = {
               in: 'path',
               description: 'Invoice ID',
               required: true,
               type: 'string'
           }
           #swagger.requestBody = {
               required: true,
               content: {
                   'application/json': {
                       schema: { $ref: '#/components/schemas/UpdateInvoice' }
                   }
               }
           }
        */
        try {
            const invoice = await invoiceService.updateInvoice(req.params.id, req.body);
            if (!invoice) {
                return res.status(404).json({
                    success: false,
                    message: 'Invoice not found'
                });
            }
            res.status(200).json({
                success: true,
                message: 'Invoice updated successfully',
                data: invoice
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
                    message: 'Failed to update invoice'
                });
            }
        }
    }

    async deleteInvoice(req: Request, res: Response) {
        /* #swagger.tags = ['Invoices']
           #swagger.description = 'Delete an invoice'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['id'] = {
               in: 'path',
               description: 'Invoice ID',
               required: true,
               type: 'string'
           }
        */
        try {
            const invoice = await invoiceService.deleteInvoice(req.params.id);
            if (!invoice) {
                return res.status(404).json({
                    success: false,
                    message: 'Invoice not found'
                });
            }
            res.status(200).json({
                success: true,
                message: 'Invoice deleted successfully',
                data: invoice
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
                    message: 'Failed to delete invoice'
                });
            }
        }
    }

    async previewInvoice(req: Request, res: Response) {
        /* #swagger.tags = ['Invoices']
           #swagger.description = 'Preview invoice with discount calculation before payment'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['serviceRecordId'] = {
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
                               totalAmount: { type: 'number', description: 'Total amount before discount' }
                           },
                           required: ['totalAmount']
                       }
                   }
               }
           }
        */
        try {
            const { totalAmount } = req.body;

            if (!totalAmount || typeof totalAmount !== 'number') {
                return res.status(400).json({
                    success: false,
                    message: 'totalAmount is required and must be a number'
                });
            }

            const preview = await invoiceService.previewInvoiceForServiceRecord(
                req.params.serviceRecordId,
                totalAmount
            );

            res.status(200).json({
                success: true,
                data: preview
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
                    message: 'Failed to preview invoice'
                });
            }
        }
    }
}

export default new InvoiceController();
