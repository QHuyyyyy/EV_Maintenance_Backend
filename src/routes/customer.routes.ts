import { Router } from 'express';
import customerController from '../controllers/customer.controller';
import { validate } from '../middlewares/auth';

const router = Router();

// Customer CRUD routes
router.post('/', validate, customerController.createCustomer.bind(customerController));
router.get('/', validate, customerController.getAllCustomers.bind(customerController));
router.get('/user/:userId', validate, customerController.getCustomerByUserId.bind(customerController));
router.get('/:id', validate, customerController.getCustomerById.bind(customerController));
router.put('/:id', validate, customerController.updateCustomer.bind(customerController));
router.delete('/:id', validate, customerController.deleteCustomer.bind(customerController));

export default router;