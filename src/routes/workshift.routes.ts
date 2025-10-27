import { Router } from 'express';
import { createWorkShift, getAllWorkShifts, updateWorkShift, deleteWorkShift } from '../controllers/workshift.controller';
import { validate } from '../../src/middlewares/auth';

const router = Router();

router.post('/', validate, createWorkShift);
router.get('/', validate, getAllWorkShifts);
router.put('/:id', validate, updateWorkShift);
router.delete('/:id', validate, deleteWorkShift);

export default router;
