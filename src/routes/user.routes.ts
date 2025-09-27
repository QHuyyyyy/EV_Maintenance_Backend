import { Router } from 'express';
import userController from '../controllers/user.controller';
import { validate } from '../middlewares/auth';

const router = Router();

// User CRUD routes

router.get('/:id', validate, userController.getUserById.bind(userController));
router.get('/', validate, userController.getAllUsers.bind(userController));
router.patch('/:id', validate, userController.updateUser.bind(userController));
router.delete('/:id', validate, userController.deleteUser.bind(userController));

export default router;