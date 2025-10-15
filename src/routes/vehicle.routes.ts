import express from 'express';
import VehicleController from '../controllers/vehicle.controller';
import { validate } from '../middlewares/auth';

const router = express.Router();


router.get('/', validate, VehicleController.getAllVehicles.bind(VehicleController));

router.get('/:id', validate, VehicleController.getVehicleById.bind(VehicleController));
router.get('/customer/:customerId', validate, VehicleController.getVehiclesByCustomer.bind(VehicleController));
router.post('/', validate, VehicleController.createVehicle.bind(VehicleController));
router.put('/:id', validate, VehicleController.updateVehicle.bind(VehicleController));
router.delete('/:id', validate, VehicleController.deleteVehicle.bind(VehicleController));

export default router;