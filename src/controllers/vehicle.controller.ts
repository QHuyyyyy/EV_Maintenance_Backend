import { Request, Response } from 'express';
import { VehicleService } from '../services/vehicle.service';
import { FirebaseStorageService } from '../firebase/storage.service';
import { assignVehicleToCustomer } from '../services/auth.service';

interface MulterRequest extends Request {
    file?: Express.Multer.File;
}

export class VehicleController {
    private vehicleService = new VehicleService();
    private firebaseStorageService = new FirebaseStorageService();

    async getAllVehicles(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['Vehicles']
        // #swagger.summary = 'Get all vehicles with filters'
        // #swagger.description = 'API to get all electric vehicles with optional filters'
        // #swagger.security = [{ "bearerAuth": [] }]
        // #swagger.parameters['customerId'] = { description: 'Filter by customer ID', required: false, type: 'string', in: 'query' }
        // #swagger.parameters['year'] = { description: 'Filter by manufacturing year', required: false, type: 'number', in: 'query' }
        // #swagger.parameters['model'] = { description: 'Filter by vehicle model', required: false, type: 'string', in: 'query' }
        // #swagger.parameters['vehicleName'] = { description: 'Filter by vehicle name', required: false, type: 'string', in: 'query' }
        // #swagger.parameters['plateNumber'] = { description: 'Filter by plate number', required: false, type: 'string', in: 'query' }
        // #swagger.parameters['VIN'] = { description: 'Filter by VIN', required: false, type: 'string', in: 'query' }
        // #swagger.parameters['minMileage'] = { description: 'Filter by minimum mileage', required: false, type: 'number', in: 'query' }
        // #swagger.parameters['maxMileage'] = { description: 'Filter by maximum mileage', required: false, type: 'number', in: 'query' }
        // #swagger.parameters['minPrice'] = { description: 'Filter by minimum price', required: false, type: 'number', in: 'query' }
        // #swagger.parameters['maxPrice'] = { description: 'Filter by maximum price', required: false, type: 'number', in: 'query' }
        /* #swagger.responses[200] = {
            description: 'Successfully retrieved vehicles list',
            schema: {
                success: true,
                data: [{
                    _id: "string",
                    vehicleName: "string",
                    model: "string",
                    year: "number",
                    VIN: "string",
                    price: "number",
                    mileage: "number",
                    plateNumber: "string",
                    last_service_date: "string",
                    image: "string",
                    customerId: "object",
                    createdAt: "string",
                    updatedAt: "string"
                }]
            }
        } */
        try {
            const filters = req.query;
            const vehicles = await this.vehicleService.getAllVehicles(filters);
            res.status(200).json({
                success: true,
                data: vehicles
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async getVehicleById(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['Vehicles']
        // #swagger.summary = 'Get vehicle by ID'
        // #swagger.description = 'API to get a specific vehicle by its ID'
        // #swagger.security = [{ "bearerAuth": [] }]
        // #swagger.parameters['id'] = { description: 'Vehicle ID', required: true, type: 'string' }
        /* #swagger.responses[200] = {
            description: 'Successfully retrieved vehicle',
            schema: {
                success: true,
                data: {
                    
                    }
                }
            }
        } */
        /* #swagger.responses[404] = {
            description: 'Vehicle not found',
            schema: {
                success: false,
                message: 'Vehicle not found'
            }
        } */
        try {
            const { id } = req.params;
            const vehicle = await this.vehicleService.getVehicleById(id);

            if (!vehicle) {
                res.status(404).json({
                    success: false,
                    message: 'Vehicle not found'
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: vehicle
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async getVehiclesByCustomer(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['Vehicles']
        // #swagger.summary = 'Get vehicles by customer ID'
        // #swagger.description = 'API to get all vehicles belonging to a specific customer'
        // #swagger.security = [{ "bearerAuth": [] }]
        // #swagger.parameters['customerId'] = { description: 'Customer ID', required: true, type: 'string' }
        /* #swagger.responses[200] = {
            description: 'Successfully retrieved customer vehicles',
            schema: {
                success: true,
                data: [{
                    
                }]
            }
        } */
        try {
            const { customerId } = req.params;
            const vehicles = await this.vehicleService.getVehiclesByCustomer(customerId);

            res.status(200).json({
                success: true,
                data: vehicles
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async createVehicle(req: MulterRequest, res: Response): Promise<void> {
        // #swagger.tags = ['Vehicles']
        // #swagger.summary = 'Create new vehicle'
        // #swagger.description = 'API to create a new electric vehicle'
        // #swagger.security = [{ "bearerAuth": [] }]
        /* #swagger.requestBody = {
            required: true,
            content: {
                "multipart/form-data": {
                    schema: {
                        type: "object",
                        required: ["vehicleName", "model", "year", "VIN", "price", "plateNumber","image"],
                        properties: {
                            vehicleName: { type: "string", example: "Tesla Model 3" },
                            model: { type: "string", example: "Model 3" },
                            year: { type: "number", example: 2021 },
                            mileage: { type: "number", example: 15000 },
                            plateNumber: { type: "string", example: "ABC1234" },
                            last_service_date: { type: "string", format: "date", example: "2023-10-01" },
                            VIN: { type: "string", example: "1HGBH41JXMN109186" },
                            price: { type: "number", example: 50000 },
                            customerId: { type: "string", description: "Customer ID - leave empty if vehicle has no owner" },
                            image: { type: "string", format: "binary", description: "Vehicle image" }
                        }
                    }
                }
            }
        } */
        /* #swagger.responses[201] = {
            description: 'Vehicle created successfully',
            schema: {
                success: true,
                message: 'Vehicle created successfully',
                data: {
                      _id: "string",
                    vehicleName: "string",
                    model: "string",
                    year: "number",
                    VIN: "string",
                    price: "number",
                    mileage: "number",
                    plateNumber: "string",
                    last_service_date: "string",
                    last_alert_mileage: "number",
                    image: "string",
                    customerId: "object",
                    createdAt: "string",
                    updatedAt: "string"
                }
            }
        } */
        try {
            const vehicleData = req.body;

            // Upload image if provided
            if (req.file) {
                const imageUrl = await this.firebaseStorageService.uploadFile(
                    req.file,
                    undefined,
                    'vehicles'
                );
                vehicleData.image = imageUrl;
            }

            const newVehicle = await this.vehicleService.createVehicle(vehicleData);

            res.status(201).json({
                success: true,
                message: 'Vehicle created successfully',
                data: newVehicle
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async updateVehicle(req: MulterRequest, res: Response): Promise<void> {
        // #swagger.tags = ['Vehicles']
        // #swagger.summary = 'Update vehicle'
        // #swagger.description = 'API to update vehicle information'
        // #swagger.security = [{ "bearerAuth": [] }]
        // #swagger.parameters['id'] = { description: 'Vehicle ID', required: true, type: 'string' }
        /* #swagger.requestBody = {
            required: true,
            content: {
                "multipart/form-data": {
                    schema: {
                        type: "object",
                        properties: {
                             vehicleName: { type: "string" },
                            model: { type: "string" },
                            year: { type: "number" },
                            mileage: { type: "number" },
                            plateNumber: { type: "string" },
                            last_service_date: { type: "string" },
                            last_alert_mileage: { type: "number" },
                            VIN: { type: "string" },
                            price: { type: "number" },
                            image: { type: "string", format: "binary", description: "Vehicle image" }
                        }
                    }
                }
            }
        } */
        try {
            const { id } = req.params;
            const updateData = req.body;

            // Upload image if provided
            if (req.file) {
                const imageUrl = await this.firebaseStorageService.uploadFile(
                    req.file,
                    undefined,
                    'vehicles'
                );
                updateData.image = imageUrl;
            }

            const updatedVehicle = await this.vehicleService.updateVehicle(id, updateData);

            if (!updatedVehicle) {
                res.status(404).json({
                    success: false,
                    message: 'Vehicle not found'
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: 'Vehicle updated successfully',
                data: updatedVehicle
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async deleteVehicle(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['Vehicles']
        // #swagger.summary = 'Delete vehicle'
        // #swagger.description = 'API to delete a vehicle'
        // #swagger.security = [{ "bearerAuth": [] }]
        // #swagger.parameters['id'] = { description: 'Vehicle ID', required: true, type: 'string' }
        /* #swagger.responses[200] = {
            description: 'Vehicle deleted successfully',
            schema: {
                success: true,
                message: 'Vehicle deleted successfully'
            }
        } */
        /* #swagger.responses[404] = {
            description: 'Vehicle not found',
            schema: {
                success: false,
                message: 'Vehicle not found'
            }
        } */
        try {
            const { id } = req.params;
            const deleted = await this.vehicleService.deleteVehicle(id);

            if (!deleted) {
                res.status(404).json({
                    success: false,
                    message: 'Vehicle not found'
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: 'Vehicle deleted successfully'
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async getMyVehicles(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['Vehicles']
        // #swagger.summary = 'Get current customer vehicles'
        // #swagger.description = 'API for customer to get their own vehicles'
        // #swagger.security = [{ "bearerAuth": [] }]
        /* #swagger.responses[200] = {
            description: 'Successfully retrieved customer vehicles',
            schema: {
                success: true,
                data: []
            }
        } */
        try {
            const user = req.user;

            if (user.role !== 'CUSTOMER') {
                res.status(403).json({
                    success: false,
                    message: 'Only customers can access this endpoint'
                });
                return;
            }

            // Get customer profile first
            const { CustomerService } = await import('../services/customer.service');
            const customerService = new CustomerService();
            const customer = await customerService.getCustomerByUserId(user._id.toString());

            if (!customer || !customer._id) {
                res.status(404).json({
                    success: false,
                    message: 'Customer profile not found'
                });
                return;
            }

            const vehicles = await this.vehicleService.getVehiclesByCustomer(customer._id.toString());

            res.status(200).json({
                success: true,
                data: vehicles
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async updateMileage(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['Vehicles']
        // #swagger.summary = 'Update vehicle mileage'
        // #swagger.description = 'API to update the mileage of a vehicle'
        // #swagger.security = [{ "bearerAuth": [] }]
        // #swagger.parameters['id'] = { description: 'Vehicle ID', required: true, type: 'string' }
        /* #swagger.parameters['body'] = {
            in: 'body',
            description: 'Mileage data',
            required: true,
            schema: {
                mileage: 'number'
            }
        } */
        /* #swagger.responses[200] = {
            description: 'Successfully updated vehicle mileage',
            schema: {
                success: true,
                data: {}
            }
        } */
        try {
            const { id } = req.params;
            const { mileage } = req.body;

            if (!mileage && mileage !== 0) {
                res.status(400).json({
                    success: false,
                    message: 'Mileage is required'
                });
                return;
            }

            const updatedVehicle = await this.vehicleService.updateMileage(id, mileage);

            if (!updatedVehicle) {
                res.status(404).json({
                    success: false,
                    message: 'Vehicle not found'
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: updatedVehicle,
                message: 'Vehicle mileage updated successfully'
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async assignVehicleToCustomer(req: Request, res: Response) {
        // #swagger.tags = ['Vehicles']
        // #swagger.summary = 'Assign vehicle to customer by phone'
        // #swagger.security = [{ "bearerAuth": [] }]
        /* #swagger.requestBody = {
            required: true,
            content: {
                "application/json": {
                    schema: {
                        $ref: '#/definitions/AssignVehicle'
                    }
                }
            }
        } */
        try {
            const { vehicleId, phone } = req.body;

            if (!vehicleId || !phone) {
                return res.status(400).json({
                    success: false,
                    message: "Vehicle ID and phone number are required"
                });
            }

            // Validate phone format (should be in +84xxxxxxxxx, 0xxxxxxxxx, or 84xxxxxxxxx format)
            const phoneRegex = /^(\+84|0|84)[1-9][0-9]{8}$/;
            if (!phoneRegex.test(phone)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid phone number format. Expected format: +84xxxxxxxxx, 0xxxxxxxxx, or 84xxxxxxxxx"
                });
            }

            const result = await assignVehicleToCustomer(vehicleId, phone);

            return res.status(200).json({
                success: true,
                message: result.message,
                data: {
                    customerId: result.customerId,
                    userId: result.userId
                }
            });
        } catch (error: any) {
            console.error("Assign vehicle error:", error);
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to assign vehicle to customer"
            });
        }
    }
}
export default new VehicleController();