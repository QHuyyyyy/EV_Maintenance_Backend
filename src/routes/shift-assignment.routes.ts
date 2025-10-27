import { Router } from 'express';
import { validate } from '../../src/middlewares/auth';
import ShiftAssignmentController from '../../src/controllers/shift-assignment.controller';


const router = Router();

router.post('/assign', validate, ShiftAssignmentController.assignShifts.bind(ShiftAssignmentController));
router.get('/user/:system_user_id', validate, ShiftAssignmentController.getShiftsOfUser.bind(ShiftAssignmentController));
router.get('/shift/:shift_id', validate, ShiftAssignmentController.getUsersOfShift.bind(ShiftAssignmentController));
router.delete('/:id', validate, ShiftAssignmentController.deleteAssignment.bind(ShiftAssignmentController));

export default router;
