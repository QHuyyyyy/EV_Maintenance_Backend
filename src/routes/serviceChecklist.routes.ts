import { Router } from 'express';
import serviceChecklistController from '../controllers/serviceChecklist.controller';
import { validate } from '../middlewares/auth';

const router = Router();

router.post('/', validate, serviceChecklistController.createServiceChecklist);
router.get('/', validate, serviceChecklistController.getAllServiceChecklists);
router.get('/:id', validate, serviceChecklistController.getServiceChecklistById);
router.put('/:id', validate, serviceChecklistController.updateServiceChecklist);
router.delete('/:id', validate, serviceChecklistController.deleteServiceChecklist);

export default router;
