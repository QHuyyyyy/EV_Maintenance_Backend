import { Router } from 'express';
import vehicleAutoPartController from '../controllers/vehicleAutoPart.controller';
import { validate } from '../middlewares/auth';

const router = Router();

// Lấy tất cả auto parts của một vehicle
router.get('/vehicle/:vehicleId', validate, (req, res) => {
    vehicleAutoPartController.getVehicleAutoPartsByVehicleId(req, res);
});

// Lấy auto parts của vehicle theo service record
router.get('/record/:recordId', validate, (req, res) => {
    vehicleAutoPartController.getVehicleAutoPartsByRecordId(req, res);
});

// Lấy tổng quantity theo category
router.get('/vehicle/:vehicleId/quantity-by-category', validate, (req, res) => {
    vehicleAutoPartController.getTotalQuantityByCategory(req, res);
});

// Lấy auto part theo ID
router.get('/:id', validate, (req, res) => {
    vehicleAutoPartController.getVehicleAutoPartById(req, res);
});

// Tạo auto part mới
router.post('/', validate, (req, res) => {
    vehicleAutoPartController.createVehicleAutoPart(req, res);
});

// Cập nhật auto part
router.put('/:id', validate, (req, res) => {
    vehicleAutoPartController.updateVehicleAutoPart(req, res);
});

// Xóa auto part
router.delete('/:id', validate, (req, res) => {
    vehicleAutoPartController.deleteVehicleAutoPart(req, res);
});

export default router;
