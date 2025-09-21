import { Router } from 'express';
import userController from '../controllers/user.controller';

const router = Router();

// User CRUD routes
router.get('/users/search', userController.searchUsers.bind(userController)); // Must come before /:id
router.get('/users/:id', userController.getUserById.bind(userController));
router.get('/users', userController.getAllUsers.bind(userController));
router.patch('/users/:id', userController.updateUser.bind(userController));
router.delete('/users/:id', userController.deleteUser.bind(userController));

export default router;