import express from 'express';
import { CustomerController } from '../controllers/customer.controller';

const router = express.Router();
const customerController = new CustomerController();

router.post('/', customerController.createCustomer);
router.get('/', customerController.getAllCustomers);
router.get('/:id', customerController.getCustomerById);
router.get('/user/:userId', customerController.getCustomerByUserId);
router.put('/:id', customerController.updateCustomer);
router.delete('/:id', customerController.deleteCustomer);

export default router;