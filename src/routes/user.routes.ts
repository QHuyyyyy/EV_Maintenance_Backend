import { Router } from 'express';
import userController from '../controllers/user.controller';

const router = Router();

// User CRUD routes
router.get('/search', userController.searchUsers.bind(userController)); // Must come before /:id
router.get('/:id', userController.getUserById.bind(userController));
router.get('/', userController.getAllUsers.bind(userController));
router.patch('/:id', userController.updateUser.bind(userController));
router.delete('/:id', userController.deleteUser.bind(userController));

export default router;