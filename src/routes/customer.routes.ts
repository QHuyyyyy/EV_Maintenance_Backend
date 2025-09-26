import express from 'express';
import { CustomerController } from '../controllers/customer.controller';

const router = express.Router();
const customerController = new CustomerController();

/**
 * @swagger
 * /api/customers:
 *   post:
 *     tags: [Customers]
 *     summary: Create a new customer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/definitions/CreateCustomerRequest'
 *     responses:
 *       201:
 *         description: Customer created successfully
 *       400:
 *         description: Bad request
 */
router.post('/', 
    // #swagger.tags = ['Customers']
    // #swagger.summary = 'Create a new customer'
    // #swagger.description = 'Creates a new customer profile'
    customerController.createCustomer
);

router.get('/', 
    // #swagger.tags = ['Customers']
    // #swagger.summary = 'Get all customers'
    // #swagger.description = 'Retrieve all customers with optional filtering and pagination'
    customerController.getAllCustomers
);

router.get('/:id', 
    // #swagger.tags = ['Customers']
    // #swagger.summary = 'Get customer by ID'
    // #swagger.description = 'Retrieve a specific customer by their ID'
    customerController.getCustomerById
);

router.get('/user/:userId', 
    // #swagger.tags = ['Customers']
    // #swagger.summary = 'Get customer by user ID'
    // #swagger.description = 'Retrieve customer information by their user ID'
    customerController.getCustomerByUserId
);

router.put('/:id', 
    // #swagger.tags = ['Customers']
    // #swagger.summary = 'Update customer'
    // #swagger.description = 'Update customer information'
    customerController.updateCustomer
);

router.delete('/:id', 
    // #swagger.tags = ['Customers']
    // #swagger.summary = 'Delete customer'
    // #swagger.description = 'Delete a customer (soft delete)'
    customerController.deleteCustomer
);

export default router;