import express from 'express';
import ServicePackageController from '../controllers/servicePackage.controller';
import { validate } from '../middlewares/auth';

const router = express.Router();


router.get('/', ServicePackageController.getAllServicePackages.bind(ServicePackageController));
router.get('/:id', ServicePackageController.getServicePackageById.bind(ServicePackageController));
router.post('/', validate, ServicePackageController.createServicePackage.bind(ServicePackageController));
router.patch('/:id', validate, ServicePackageController.updateServicePackage.bind(ServicePackageController));
router.delete('/:id', validate, ServicePackageController.deleteServicePackage.bind(ServicePackageController));

export default router;