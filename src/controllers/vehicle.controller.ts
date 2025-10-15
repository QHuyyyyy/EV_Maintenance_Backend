import { Request, Response } from 'express';
import { VehicleService } from '../services/vehicle.service';
import { FirebaseStorageService } from '../firebase/storage.service';

interface MulterRequest extends Request {
    file?: Express.Multer.File;
}

export class VehicleController {
    private vehicleService = new VehicleService();
    private firebaseStorageService = new FirebaseStorageService();

    async getAllVehicles(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['Vehicles']
        // #swagger.summary = 'Get all vehicles'
        // #swagger.description = 'API to get all electric vehicles in the system'
        // #swagger.security = [{ "bearerAuth": [] }]
        /* #swagger.responses[200] = {
            description: 'Successfully retrieved vehicles list',
            schema: {
                success: true,
            
            }
        } */
        try {
            const vehicles = await this.vehicleService.getAllVehicles();
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
                    _id: "string",
                    vehicleName: "Tesla Model 3",
                    model: "Model 3",
                    VIN: "1HGBH41JXMN109186",
                    price: 50000,
                    customerId: {
                        _id: "string",
                        customerName: "John Doe",
                        phone: "0123456789",
                        address: "123 ABC Street, Ho Chi Minh City"
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
                    _id: "string",
                    vehicleName: "Tesla Model 3",
                    model: "Model 3",
                    VIN: "1HGBH41JXMN109186",
                    price: 50000,
                    customerId: "string"
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
                        required: ["vehicleName", "customerId"],
                        properties: {
                            vehicleName: { type: "string", example: "Tesla Model 3" },
                            model: { type: "string", example: "Model 3" },
                            VIN: { type: "string", example: "1HGBH41JXMN109186" },
                            price: { type: "number", example: 50000 },
                            customerId: { type: "string", example: "60f1b2b3c4e5f6g7h8i9j0k1" },
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
                    vehicleName: "Tesla Model 3",
                    model: "Model 3",
                    VIN: "1HGBH41JXMN109186",
                    price: 50000,
                    image: "https://storage.googleapis.com/...",
                    customerId: "string"
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
                            vehicleName: { type: "string", example: "Tesla Model 3" },
                            model: { type: "string", example: "Model 3" },
                            VIN: { type: "string", example: "1HGBH41JXMN109186" },
                            price: { type: "number", example: 50000 },
                            customerId: { type: "string", example: "60f1b2b3c4e5f6g7h8i9j0k1" },
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
}
export default new VehicleController();