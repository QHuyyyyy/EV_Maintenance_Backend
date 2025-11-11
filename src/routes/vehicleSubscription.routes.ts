import express from 'express';
import VehicleSubscriptionController from '../controllers/vehicleSubscription.controller';
import { validate } from '../middlewares/auth';

const router = express.Router();

// GET /api/vehicle-subscriptions - Lấy danh sách tất cả đăng ký
router.get('/', validate, VehicleSubscriptionController.getAllSubscriptions.bind(VehicleSubscriptionController));

// GET /api/vehicle-subscriptions/:id - Lấy thông tin đăng ký theo ID
router.get('/:id', validate, VehicleSubscriptionController.getSubscriptionById.bind(VehicleSubscriptionController));

// GET /api/vehicle-subscriptions/vehicle/:vehicleId - Lấy đăng ký theo xe
router.get('/vehicle/:vehicleId', validate, VehicleSubscriptionController.getSubscriptionsByVehicle.bind(VehicleSubscriptionController));

// GET /api/vehicle-subscriptions/vehicle/:vehicleId/billing - Lấy thông tin subscription cho billing
router.get('/vehicle/:vehicleId/billing', validate, VehicleSubscriptionController.getSubscriptionForBilling.bind(VehicleSubscriptionController));

// GET /api/vehicle-subscriptions/customer/:customerId - Lấy đăng ký theo khách hàng
router.get('/customer/:customerId', validate, VehicleSubscriptionController.getSubscriptionsByCustomer.bind(VehicleSubscriptionController));

// POST /api/vehicle-subscriptions - Tạo đăng ký mới
router.post('/', validate, VehicleSubscriptionController.createSubscription.bind(VehicleSubscriptionController));

// PATCH /api/vehicle-subscriptions/:id - Cập nhật đăng ký
router.patch('/:id', validate, VehicleSubscriptionController.updateSubscription.bind(VehicleSubscriptionController));

// DELETE /api/vehicle-subscriptions/:id - Xóa đăng ký
router.delete('/:id', validate, VehicleSubscriptionController.deleteSubscription.bind(VehicleSubscriptionController));

// POST /api/vehicle-subscriptions/:id/renew - Gia hạn đăng ký
router.post('/:id/renew', validate, VehicleSubscriptionController.renewSubscription.bind(VehicleSubscriptionController));


export default router;