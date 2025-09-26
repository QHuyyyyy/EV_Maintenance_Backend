import express from 'express';
import { VehicleController } from '../controllers/vehicle.controller';

const router = express.Router();
const vehicleController = new VehicleController();

/**
 * @swagger
 * components:
 *   schemas:
 *     Vehicle:
 *       type: object
 *       required:
 *         - vehicleId
 *         - customerId
 *         - vehicleName
 *         - model
 *         - VIN
 *       properties:
 *         vehicleId:
 *           type: string
 *           description: Unique vehicle identifier
 *         customerId:
 *           type: string
 *           description: Reference to Customer ID
 *         vehicleName:
 *           type: string
 *           description: Name of the vehicle
 *         model:
 *           type: string
 *           description: Vehicle model
 *         VIN:
 *           type: string
 *           description: Vehicle Identification Number (17 characters)
 *         price:
 *           type: number
 *           description: Vehicle price
 *         batteryCapacity:
 *           type: number
 *           description: Battery capacity in kWh
 *         manufacturingYear:
 *           type: number
 *           description: Year the vehicle was manufactured
 *         lastServiceDate:
 *           type: string
 *           format: date
 *           description: Date of last service
 *         nextServiceDue:
 *           type: string
 *           format: date
 *           description: Date when next service is due
 *         warrantyExpiry:
 *           type: string
 *           format: date
 *           description: Warranty expiry date
 *         isActive:
 *           type: boolean
 *           description: Whether the vehicle is active
 */

/**
 * @swagger
 * /api/vehicles:
 *   post:
 *     summary: Create a new vehicle
 *     tags: [Vehicles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Vehicle'
 *     responses:
 *       201:
 *         description: Vehicle created successfully
 *       400:
 *         description: Bad request
 */
router.post('/', 
    // #swagger.tags = ['Vehicles']
    // #swagger.summary = 'Create a new vehicle'
    // #swagger.description = 'Creates a new vehicle profile'
    vehicleController.createVehicle
);

/**
 * @swagger
 * /api/vehicles:
 *   get:
 *     summary: Get all vehicles with optional filtering
 *     tags: [Vehicles]
 *     parameters:
 *       - in: query
 *         name: vehicleName
 *         schema:
 *           type: string
 *         description: Filter by vehicle name
 *       - in: query
 *         name: model
 *         schema:
 *           type: string
 *         description: Filter by model
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *         description: Filter by customer ID
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of vehicles with pagination
 */
router.get('/', 
    // #swagger.tags = ['Vehicles']
    // #swagger.summary = 'Get all vehicles'
    // #swagger.description = 'Retrieve all vehicles with optional filtering and pagination'
    vehicleController.getAllVehicles
);

/**
 * @swagger
 * /api/vehicles/search:
 *   get:
 *     summary: Search vehicles by name, model, VIN, or vehicle ID
 *     tags: [Vehicles]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *     responses:
 *       200:
 *         description: Search results
 *       400:
 *         description: Search query is required
 */
router.get('/search', 
    // #swagger.tags = ['Vehicles']
    // #swagger.summary = 'Search vehicles'
    // #swagger.description = 'Search vehicles by name, model, VIN, or vehicle ID'
    vehicleController.searchVehicles
);

/**
 * @swagger
 * /api/vehicles/due-for-service:
 *   get:
 *     summary: Get vehicles that are due for service
 *     tags: [Vehicles]
 *     responses:
 *       200:
 *         description: List of vehicles due for service
 */
router.get('/due-for-service', 
    // #swagger.tags = ['Vehicles']
    // #swagger.summary = 'Get vehicles due for service'
    // #swagger.description = 'Retrieve vehicles that are due for maintenance service'
    vehicleController.getVehiclesDueForService
);

/**
 * @swagger
 * /api/vehicles/{id}:
 *   get:
 *     summary: Get vehicle by ID
 *     tags: [Vehicles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Vehicle ID
 *     responses:
 *       200:
 *         description: Vehicle found
 *       404:
 *         description: Vehicle not found
 */
router.get('/:id', 
    // #swagger.tags = ['Vehicles']
    // #swagger.summary = 'Get vehicle by ID'
    // #swagger.description = 'Retrieve a specific vehicle by its ID'
    vehicleController.getVehicleById
);

/**
 * @swagger
 * /api/vehicles/vin/{vin}:
 *   get:
 *     summary: Get vehicle by VIN
 *     tags: [Vehicles]
 *     parameters:
 *       - in: path
 *         name: vin
 *         required: true
 *         schema:
 *           type: string
 *         description: Vehicle VIN
 *     responses:
 *       200:
 *         description: Vehicle found
 *       404:
 *         description: Vehicle not found
 */
router.get('/vin/:vin', 
    // #swagger.tags = ['Vehicles']
    // #swagger.summary = 'Get vehicle by VIN'
    // #swagger.description = 'Retrieve a vehicle by its VIN number'
    vehicleController.getVehicleByVIN
);

/**
 * @swagger
 * /api/vehicles/customer/{customerId}:
 *   get:
 *     summary: Get vehicles by customer ID
 *     tags: [Vehicles]
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: List of customer's vehicles
 */
router.get('/customer/:customerId', 
    // #swagger.tags = ['Vehicles']
    // #swagger.summary = 'Get vehicles by customer ID'
    // #swagger.description = 'Retrieve all vehicles owned by a specific customer'
    vehicleController.getVehiclesByCustomerId
);

/**
 * @swagger
 * /api/vehicles/{id}:
 *   put:
 *     summary: Update vehicle
 *     tags: [Vehicles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Vehicle ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               vehicleName:
 *                 type: string
 *               model:
 *                 type: string
 *               price:
 *                 type: number
 *               batteryCapacity:
 *                 type: number
 *               manufacturingYear:
 *                 type: number
 *               lastServiceDate:
 *                 type: string
 *                 format: date
 *               nextServiceDue:
 *                 type: string
 *                 format: date
 *               warrantyExpiry:
 *                 type: string
 *                 format: date
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Vehicle updated successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Vehicle not found
 */
router.put('/:id', 
    // #swagger.tags = ['Vehicles']
    // #swagger.summary = 'Update vehicle'
    // #swagger.description = 'Update vehicle information'
    vehicleController.updateVehicle
);

/**
 * @swagger
 * /api/vehicles/{id}:
 *   delete:
 *     summary: Delete vehicle (soft delete)
 *     tags: [Vehicles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Vehicle ID
 *     responses:
 *       200:
 *         description: Vehicle deleted successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Vehicle not found
 */
router.delete('/:id', 
    // #swagger.tags = ['Vehicles']
    // #swagger.summary = 'Delete vehicle'
    // #swagger.description = 'Delete a vehicle (soft delete)'
    vehicleController.deleteVehicle
);

export default router;