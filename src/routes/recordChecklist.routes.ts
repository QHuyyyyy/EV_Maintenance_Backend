import { Router } from 'express';
import recordChecklistController from '../controllers/recordChecklist.controller';
import { validate } from '../middlewares/auth';

const router = Router();

router.post('/', validate, recordChecklistController.createRecordChecklist);
router.get('/by-record/:recordId', validate, recordChecklistController.getByRecord);
router.put('/:id', validate, recordChecklistController.updateRecordChecklist);
router.delete('/:id', validate, recordChecklistController.deleteRecordChecklist);

export default router;
