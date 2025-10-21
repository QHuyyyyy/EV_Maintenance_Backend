import { Router } from 'express';
import appointmentController from '../controllers/appointment.controller';
import { validate } from '../middlewares/auth';

const router = Router();

router.post('/', validate, appointmentController.createAppointment);
router.get('/', validate, appointmentController.getAllAppointments);
router.get('/:id', validate, appointmentController.getAppointmentById);
router.put('/:id', validate, appointmentController.updateAppointment);
router.delete('/:id', validate, appointmentController.deleteAppointment);

export default router;
