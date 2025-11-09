import { Router } from 'express';
import slotController from '../controllers/slot.controller';
import { validate } from '../middlewares/auth';

const router = Router();

// Bulk generate slots
router.post('/generate', validate, (req, res) => slotController.generateSlots(req, res));

// List slots
router.get('/', validate, (req, res) => slotController.listSlots(req, res));

export default router;
