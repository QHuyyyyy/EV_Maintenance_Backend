import { Router } from 'express';
import recordChecklistController from '../controllers/recordChecklist.controller';
import { validate } from '../middlewares/auth';

const router = Router();

// Record Checklist endpoints
router.post('/', validate, recordChecklistController.createRecordChecklist);
router.get('/by-record/:recordId', validate, recordChecklistController.getByRecord);
router.put('/:id', validate, recordChecklistController.updateRecordChecklist);
router.delete('/:id', validate, recordChecklistController.deleteRecordChecklist);

// Checklist Defect endpoints
router.post('/:recordChecklistId/defects', validate, recordChecklistController.createChecklistDefect);
router.post('/:recordChecklistId/defects/bulk', validate, recordChecklistController.createMultipleDefects);
router.get('/:recordChecklistId/defects', validate, recordChecklistController.getDefectsByRecordChecklist);
router.get('/defects/:defectId', validate, recordChecklistController.getChecklistDefectById);
router.put('/defects/:defectId', validate, recordChecklistController.updateChecklistDefect);
router.delete('/defects/:defectId', validate, recordChecklistController.deleteChecklistDefect);

export default router;
