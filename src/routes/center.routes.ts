import { Router } from 'express';
import centerController from '../controllers/center.controller';
import { validate } from '../middlewares/auth';

const router = Router();

router.post('/', validate, centerController.createCenter);
router.get('/', validate, centerController.getAllCenters);
router.get('/:id', validate, centerController.getCenterById);
router.put('/:id', validate, centerController.updateCenter);
router.delete('/:id', validate, centerController.deleteCenter);

export default router;
