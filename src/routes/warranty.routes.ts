import { Router } from 'express';
import warrantyController from '../controllers/warranty.controller';
import { validate } from '../middlewares/auth';

const router = Router();


router.get('/parts', validate, warrantyController.getWarrantiedPartsByCustomer.bind(warrantyController));
router.get('/', validate, warrantyController.getAllWarranties.bind(warrantyController));

export default router;
