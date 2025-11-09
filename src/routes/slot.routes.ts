import { Router } from 'express';
import slotController from '../controllers/slot.controller';
import { validate } from '../middlewares/auth';

const router = Router();

// Bulk generate slots
router.post('/generate', validate, (req, res) => slotController.generateSlots(req, res));

// List slots
router.get('/', validate, (req, res) => slotController.listSlots(req, res));

// Get staff and technician for slot assignment
router.get('/:slotId/staff-and-technician', validate, (req, res) => slotController.getStaffAndTechnicianForSlot(req, res));

export default router;
