import { Router } from 'express';
import serviceRecordController from '../controllers/serviceRecord.controller';
import { validate } from '../middlewares/auth';

const router = Router();

router.post('/', validate, serviceRecordController.createServiceRecord);
router.get('/', validate, serviceRecordController.getAllServiceRecords);
router.get('/:id', validate, serviceRecordController.getServiceRecordById);
router.put('/:id', validate, serviceRecordController.updateServiceRecord);
router.delete('/:id', validate, serviceRecordController.deleteServiceRecord);

export default router;
