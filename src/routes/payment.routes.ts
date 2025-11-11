import express from 'express';
import paymentController from '../controllers/payment.controller';
import { validate } from '../middlewares/auth';

const router = express.Router();

// Create payment (protected)
router.post('/', validate, paymentController.createPayment);

// Get payment by ID (protected)
router.get('/:id', validate, paymentController.getPaymentById);

// Get payment by order code (protected)
router.get('/order/:orderCode', validate, paymentController.getPaymentByOrderCode);

// Get all payments with filters (protected)
router.get('/', validate, paymentController.getAllPayments);

// PayOS webhook (public - no auth)
router.post('/webhook', paymentController.handleWebhook);

// Cancel payment (protected)
router.put('/cancel/:orderCode', validate, paymentController.cancelPayment);

// Get payment info from PayOS (protected)
router.get('/info/:orderCode', validate, paymentController.getPaymentInfo);

// [DEV ONLY] Simulate payment success (protected)
router.post('/simulate/:orderCode', validate, paymentController.simulatePaymentSuccess);

export default router;
