import express from 'express';
import invoiceController from '../controllers/invoice.controller';
import { validate } from '../middlewares/auth';

const router = express.Router();

// Create invoice (protected)
router.post('/', validate, invoiceController.createInvoice);

// Preview invoice with discount calculation (protected)
router.post('/preview/:serviceRecordId', validate, invoiceController.previewInvoice);

// Revenue endpoints moved to /api/statistics

// Get all invoices with filters (protected)
router.get('/', validate, invoiceController.getAllInvoices);

// Get invoice by payment ID (protected)
router.get('/payment/:paymentId', validate, invoiceController.getInvoiceByPaymentId);

// Get invoice by MongoDB ID (protected)
router.get('/:id', validate, invoiceController.getInvoiceById);

// Update invoice (protected)
router.put('/:id', validate, invoiceController.updateInvoice);

// Delete invoice (protected)
router.delete('/:id', validate, invoiceController.deleteInvoice);

export default router;
