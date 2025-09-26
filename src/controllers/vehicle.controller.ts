import { Request, Response } from 'express';
import { VehicleService } from '../services/vehicle.service';

const vehicleService = new VehicleService();

export class VehicleController {
    /**
     * Create a new vehicle
     */
    async createVehicle(req: Request, res: Response): Promise<void> {
        try {
            const vehicle = await vehicleService.createVehicle(req.body);
            res.status(201).json({
                success: true,
                message: 'Vehicle created successfully',
                data: vehicle
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Get vehicle by ID
     */
    async getVehicleById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const vehicle = await vehicleService.getVehicleById(id);
            res.status(200).json({
                success: true,
                data: vehicle
            });
        } catch (error: any) {
            res.status(404).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Get vehicle by VIN
     */
    async getVehicleByVIN(req: Request, res: Response): Promise<void> {
        try {
            const { vin } = req.params;
            const vehicle = await vehicleService.getVehicleByVIN(vin);
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

    /**
     * Get vehicles by customer ID
     */
    async getVehiclesByCustomerId(req: Request, res: Response): Promise<void> {
        try {
            const { customerId } = req.params;
            const vehicles = await vehicleService.getVehiclesByCustomerId(customerId);
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

    /**
     * Get all vehicles with optional filtering
     */
    async getAllVehicles(req: Request, res: Response): Promise<void> {
        try {
            const filters = {
                vehicleName: req.query.vehicleName as string,
                model: req.query.model as string,
                customerId: req.query.customerId as string,
                isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
                page: req.query.page ? parseInt(req.query.page as string) : undefined,
                limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
            };

            const result = await vehicleService.getAllVehicles(filters);
            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Update vehicle
     */
    async updateVehicle(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const vehicle = await vehicleService.updateVehicle(id, req.body);
            if (!vehicle) {
                res.status(404).json({
                    success: false,
                    message: 'Vehicle not found'
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: 'Vehicle updated successfully',
                data: vehicle
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Delete vehicle (soft delete)
     */
    async deleteVehicle(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const vehicle = await vehicleService.deleteVehicle(id);
            res.status(200).json({
                success: true,
                message: 'Vehicle deleted successfully',
                data: vehicle
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Search vehicles
     */
    async searchVehicles(req: Request, res: Response): Promise<void> {
        try {
            const { q } = req.query;
            if (!q || typeof q !== 'string') {
                res.status(400).json({
                    success: false,
                    message: 'Search query is required'
                });
                return;
            }
            const vehicles = await vehicleService.searchVehicles(q);
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

    /**
     * Get vehicles due for service
     */
    async getVehiclesDueForService(req: Request, res: Response): Promise<void> {
        try {
            const vehicles = await vehicleService.getVehiclesDueForService();
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
}

export default new VehicleController();