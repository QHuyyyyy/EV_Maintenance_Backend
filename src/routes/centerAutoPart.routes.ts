import { Router } from 'express';
import centerAutoPartController from '../controllers/centerAutoPart.controller';

const router = Router();

router.post('/', centerAutoPartController.createCenterAutoPart.bind(centerAutoPartController));
router.get('/', centerAutoPartController.getAllCenterAutoParts.bind(centerAutoPartController));
router.get('/:id', centerAutoPartController.getCenterAutoPartById.bind(centerAutoPartController));
router.put('/:id', centerAutoPartController.updateCenterAutoPart.bind(centerAutoPartController));
router.delete('/:id', centerAutoPartController.deleteCenterAutoPart.bind(centerAutoPartController));

export default router;
