import express from 'express';
import VehicleController from '../controllers/vehicle.controller';
import { validate } from '../middlewares/auth';
import upload from '../middlewares/upload';

const router = express.Router();


router.get('/', validate, VehicleController.getAllVehicles.bind(VehicleController));
router.get('/my-vehicles', validate, VehicleController.getMyVehicles.bind(VehicleController));
router.get('/:id', validate, VehicleController.getVehicleById.bind(VehicleController));
router.get('/customer/:customerId', validate, VehicleController.getVehiclesByCustomer.bind(VehicleController));
router.post('/', validate, upload.single('image'), VehicleController.createVehicle.bind(VehicleController));
router.put('/:id', validate, upload.single('image'), VehicleController.updateVehicle.bind(VehicleController));
// router.patch('/:id/mileage', validate, VehicleController.updateMileage.bind(VehicleController));
router.delete('/:id', validate, VehicleController.deleteVehicle.bind(VehicleController));
router.post("/assign-vehicle", validate, VehicleController.assignVehicleToCustomer.bind(VehicleController));
export default router;