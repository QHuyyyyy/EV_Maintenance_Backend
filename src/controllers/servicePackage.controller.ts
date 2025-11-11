import { Request, Response } from 'express';
import { ServicePackageService } from '../services/servicePackage.service';

export class ServicePackageController {
    private servicePackageService = new ServicePackageService();

    async getAllServicePackages(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['Service Packages']
        // #swagger.summary = 'Get all service packages'
        // #swagger.description = 'API to get all available service packages'
        /* #swagger.responses[200] = {
            description: 'Successfully retrieved service packages',
            schema: {
                success: true,
                data: [{
                    _id: "string",
                    name: "Basic Maintenance",
                    description: "Basic maintenance package for electric vehicles",
                    price: 100,
                    duration: 30,
                    km_interval: 10000
                }]
            }
        } */
        try {
            const packages = await this.servicePackageService.getAllServicePackages();
            res.status(200).json({
                success: true,
                data: packages
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async getServicePackageById(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['Service Packages']
        // #swagger.summary = 'Get service package by ID'
        // #swagger.description = 'API to get a specific service package by its ID'
        // #swagger.parameters['id'] = { description: 'Service Package ID', required: true, type: 'string' }
        /* #swagger.responses[200] = {
            description: 'Successfully retrieved service package',
            schema: {
                success: true,
                data: {
                    _id: "string",
                    name: "Basic Maintenance",
                    description: "Basic maintenance package for electric vehicles",
                    price: 100,
                    duration: 30,
                    km_interval: 10000
                }
            }
        } */
        /* #swagger.responses[404] = {
            description: 'Service package not found',
            schema: {
                success: false,
                message: 'Service package not found'
            }
        } */
        try {
            const { id } = req.params;
            const servicePackage = await this.servicePackageService.getServicePackageById(id);

            if (!servicePackage) {
                res.status(404).json({
                    success: false,
                    message: 'Service package not found'
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: servicePackage
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async createServicePackage(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['Service Packages']
        // #swagger.summary = 'Create new service package'
        // #swagger.description = 'API to create a new service package'
        // #swagger.security = [{ "bearerAuth": [] }]
        /* #swagger.requestBody = {
            required: true,
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        required: ["name", "price", "duration", "km_interval"],
                        properties: {
                            name: { type: "string", example: "Basic Maintenance" },
                            description: { type: "string", example: "Basic maintenance package for electric vehicles" },
                            price: { type: "number", example: 100 },
                            duration: { type: "number", example: 30, description: "Subscription active period (days)" },
                            km_interval: { type: "number", example: 10000, description: "Mileage interval for maintenance" },
                            service_interval_days: { type: "number", example: 60, description: "Maintenance frequency in days (default: 365)" }
                        }
                    }
                }
            }
        } */
        /* #swagger.responses[201] = {
            description: 'Service package created successfully',
            schema: {
                success: true,
                message: 'Service package created successfully',
                data: {
                    _id: "string",
                    name: "Basic Maintenance",
                    description: "Basic maintenance package for electric vehicles",
                    price: 100,
                    duration: 30,
                    km_interval: 10000,
                    service_interval_days: 365
                }
            }
        } */
        try {
            const packageData = req.body;
            const newPackage = await this.servicePackageService.createServicePackage(packageData);

            res.status(201).json({
                success: true,
                message: 'Service package created successfully',
                data: newPackage
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async updateServicePackage(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['Service Packages']
        // #swagger.summary = 'Update service package'
        // #swagger.description = 'API to update a service package'
        // #swagger.security = [{ "bearerAuth": [] }]
        // #swagger.parameters['id'] = { description: 'Service Package ID', required: true, type: 'string' }
        /* #swagger.requestBody = {
            required: true,
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        properties: {
                            name: { type: "string", example: "Basic Maintenance" },
                            description: { type: "string", example: "Basic maintenance package for electric vehicles" },
                            price: { type: "number", example: 100 },
                            duration: { type: "number", example: 30, description: "Subscription active period (days)" },
                            km_interval: { type: "number", example: 10000, description: "Mileage interval for maintenance" },
                            service_interval_days: { type: "number", example: 365, description: "Maintenance frequency in days" }
                        }
                    }
                }
            }
        } */
        try {
            const { id } = req.params;
            const updateData = req.body;
            const updatedPackage = await this.servicePackageService.updateServicePackage(id, updateData);

            if (!updatedPackage) {
                res.status(404).json({
                    success: false,
                    message: 'Service package not found'
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: 'Service package updated successfully',
                data: updatedPackage
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async deleteServicePackage(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['Service Packages']
        // #swagger.summary = 'Delete service package'
        // #swagger.description = 'API to delete a service package'
        // #swagger.security = [{ "bearerAuth": [] }]
        // #swagger.parameters['id'] = { description: 'Service Package ID', required: true, type: 'string' }
        /* #swagger.responses[200] = {
            description: 'Service package deleted successfully',
            schema: {
                success: true,
                message: 'Service package deleted successfully'
            }
        } */
        /* #swagger.responses[404] = {
            description: 'Service package not found',
            schema: {
                success: false,
                message: 'Service package not found'
            }
        } */
        try {
            const { id } = req.params;
            const deleted = await this.servicePackageService.deleteServicePackage(id);

            if (!deleted) {
                res.status(404).json({
                    success: false,
                    message: 'Service package not found'
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: 'Service package deleted successfully'
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // async getPopularPackages(req: Request, res: Response): Promise<void> {
    //     // #swagger.tags = ['Service Packages']
    //     // #swagger.summary = 'Get popular service packages'
    //     // #swagger.description = 'API to get the most popular service packages'
    //     try {
    //         const popularPackages = await this.servicePackageService.getPopularPackages();

    //         res.status(200).json({
    //             success: true,
    //             data: popularPackages
    //         });
    //     } catch (error: any) {
    //         res.status(500).json({
    //             success: false,
    //             message: error.message
    //         });
    //     }
    // }
}
export default new ServicePackageController();