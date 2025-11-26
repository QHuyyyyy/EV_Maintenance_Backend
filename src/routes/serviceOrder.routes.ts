import { Router } from 'express';
import serviceOrderController from '../controllers/serviceOrder.controller';
import { validate } from '../middlewares/auth';

const router = Router();



router.post('/', validate, serviceOrderController.createServiceOrder);

router.post('/lacking-parts', validate, serviceOrderController.getLackingPartsForShift);

router.get('/record/:recordId', validate, serviceOrderController.getServiceOrdersByRecord);


router.get('/record/:recordId/status/:status', validate, serviceOrderController.getServiceOrdersByStatus);


router.get('/:id', validate, serviceOrderController.getServiceOrderById);


router.put('/:id/status', validate, serviceOrderController.updateServiceOrderStatus);


router.delete('/:id', validate, serviceOrderController.deleteServiceOrder);

export default router;
