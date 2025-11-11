import { Router } from 'express';
import autoPartController from '../controllers/autoPart.controller';
import { validate } from '../middlewares/auth';
import upload from '../middlewares/upload';

const router = Router();

router.post('/', validate, upload.single('image'), autoPartController.createAutoPart.bind(autoPartController));
router.get('/', validate, autoPartController.getAllAutoParts);
router.get('/:id', validate, autoPartController.getAutoPartById);
router.put('/:id', validate, upload.single('image'), autoPartController.updateAutoPart.bind(autoPartController));
router.delete('/:id', validate, autoPartController.deleteAutoPart);

export default router;