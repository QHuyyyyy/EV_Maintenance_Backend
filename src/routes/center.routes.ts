
import { Router } from 'express';
import centerController from '../controllers/center.controller';
import { validate } from '../middlewares/auth';
import upload from '../middlewares/upload';

const router = Router();

// Use multer upload.single('image') so multipart/form-data with file + fields is parsed
router.post('/', validate, upload.single('image'), centerController.createCenter.bind(centerController));
router.get('/', validate, centerController.getAllCenters.bind(centerController));
router.get('/:id', validate, centerController.getCenterById.bind(centerController));
router.put('/:id', validate, upload.single('image'), centerController.updateCenter.bind(centerController));
router.delete('/:id', validate, centerController.deleteCenter.bind(centerController));

export default router;
