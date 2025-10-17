import { Router } from 'express';
import systemUserController from '../controllers/systemUser.controller';
import { validate } from '../middlewares/auth';

const router = Router();

// SystemUser CRUD routes (without create route)
router.get('/', validate, systemUserController.getAllSystemUsers.bind(systemUserController));
router.get('/user/:userId', validate, systemUserController.getSystemUserByUserId.bind(systemUserController));
router.get('/:id', validate, systemUserController.getSystemUserById.bind(systemUserController));
router.patch('/:id', validate, systemUserController.updateSystemUser.bind(systemUserController));
router.delete('/:id', validate, systemUserController.deleteSystemUser.bind(systemUserController));

export default router;