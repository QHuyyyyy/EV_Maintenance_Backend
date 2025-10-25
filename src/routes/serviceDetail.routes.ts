import { Router } from 'express';
import serviceDetailController from '../controllers/serviceDetail.controller';
import { validate } from '../middlewares/auth';

const router = Router();

router.post('/', validate, serviceDetailController.createServiceDetail);
router.get('/', validate, serviceDetailController.getAllServiceDetails);
router.get('/:id', validate, serviceDetailController.getServiceDetailById);
router.put('/:id', validate, serviceDetailController.updateServiceDetail);
router.delete('/:id', validate, serviceDetailController.deleteServiceDetail);

export default router;