import { Router } from 'express';
import autoPartController from '../controllers/autoPart.controller';
import { validate } from '../middlewares/auth';

const router = Router();

router.post('/', validate, autoPartController.createAutoPart);
router.get('/', validate, autoPartController.getAllAutoParts);
router.get('/:id', validate, autoPartController.getAutoPartById);
router.put('/:id', validate, autoPartController.updateAutoPart);
router.delete('/:id', validate, autoPartController.deleteAutoPart);

export default router;