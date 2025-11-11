import express from 'express';
import paymentController from '../controllers/payment.controller';
import { validate } from '../middlewares/auth';

const router = express.Router();

// PayOS webhook (public - no auth) - MUST BE FIRST to avoid route conflicts
router.post('/webhook', paymentController.handleWebhook);

// [DEV ONLY] Simulate payment success (protected)
router.post('/simulate/:orderCode', validate, paymentController.simulatePaymentSuccess);

// Create payment (protected)
router.post('/', validate, paymentController.createPayment);

// Get payment by order code (protected) - Specific route before generic /:id
router.get('/order/:orderCode', validate, paymentController.getPaymentByOrderCode);

// Get payment info from PayOS (protected)
router.get('/info/:orderCode', validate, paymentController.getPaymentInfo);

// Get all payments with filters (protected) - Must be before /:id to avoid conflict
router.get('/', validate, paymentController.getAllPayments);

// Get payment by ID (protected)
router.get('/:id', validate, paymentController.getPaymentById);

// Cancel payment (protected)
router.put('/cancel/:orderCode', validate, paymentController.cancelPayment);

export default router;
