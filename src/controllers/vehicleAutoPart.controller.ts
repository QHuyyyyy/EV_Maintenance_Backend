import { Request, Response } from 'express';
import vehicleAutoPartService from '../services/vehicleAutoPart.service';
import serviceRecordService from '../services/serviceRecord.service';

export class VehicleAutoPartController {

    async getVehicleAutoPartsByVehicleId(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['Vehicle Auto Parts']
        // #swagger.summary = 'Get all auto parts of a vehicle'
        // #swagger.description = 'Get all auto parts (linh kiện) currently attached to a vehicle, used by technicians to check available parts'
        // #swagger.security = [{ "bearerAuth": [] }]
        // #swagger.parameters['vehicleId'] = { description: 'Vehicle ID', required: true, type: 'string', in: 'path' }
        /* #swagger.responses[200] = {
            description: 'Successfully retrieved vehicle auto parts',
            schema: {
                success: true,
                data: [{
                    _id: "string",
                    serial_number: "string",
                    vehicle_id: "object",
                    autopart_id: "object",
                    quantity: "number",
                    isPlaced: "boolean",
                    placed_date: "string",
                    isWarranty: "boolean",
                    createdAt: "string",
                    updatedAt: "string"
                }]
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
            const { vehicleId } = req.params;
            const vehicleAutoParts = await vehicleAutoPartService.getVehicleAutoPartsByVehicleId(vehicleId);

            res.status(200).json({
                success: true,
                data: vehicleAutoParts
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async getVehicleAutoPartById(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['Vehicle Auto Parts']
        // #swagger.summary = 'Get vehicle auto part by ID'
        // #swagger.security = [{ "bearerAuth": [] }]
        // #swagger.parameters['id'] = { description: 'VehicleAutoPart ID', required: true, type: 'string', in: 'path' }
        try {
            const { id } = req.params;
            const vehicleAutoPart = await vehicleAutoPartService.getVehicleAutoPartById(id);

            if (!vehicleAutoPart) {
                res.status(404).json({
                    success: false,
                    message: 'Vehicle auto part not found'
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: vehicleAutoPart
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async createVehicleAutoPart(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['Vehicle Auto Parts']
        // #swagger.summary = 'Create vehicle auto part'
        // #swagger.security = [{ "bearerAuth": [] }]
        /* #swagger.requestBody = {
            required: true,
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        required: ['vehicle_id', 'autopart_id', 'quantity', 'isWarranty'],
                        properties: {
                            vehicle_id: { type: 'string', example: '507f1f77bcf86cd799439011' },
                            autopart_id: { type: 'string', example: '507f1f77bcf86cd799439012' },
                            quantity: { type: 'number', example: 2 },
                            isPlaced: { type: 'boolean', example: true },
                            placed_date: { type: 'string', format: 'date-time' },
                            isWarranty: { type: 'boolean', example: true }
                        }
                    }
                }
            }
        } */
        try {
            const vehicleAutoPart = await vehicleAutoPartService.createVehicleAutoPart(req.body);

            res.status(201).json({
                success: true,
                message: 'Vehicle auto part created successfully',
                data: vehicleAutoPart
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async updateVehicleAutoPart(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['Vehicle Auto Parts']
        // #swagger.summary = 'Update vehicle auto part'
        // #swagger.security = [{ "bearerAuth": [] }]
        // #swagger.parameters['id'] = { description: 'VehicleAutoPart ID', required: true, type: 'string', in: 'path' }
        try {
            const { id } = req.params;
            const vehicleAutoPart = await vehicleAutoPartService.updateVehicleAutoPart(id, req.body);

            if (!vehicleAutoPart) {
                res.status(404).json({
                    success: false,
                    message: 'Vehicle auto part not found'
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: 'Vehicle auto part updated successfully',
                data: vehicleAutoPart
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async deleteVehicleAutoPart(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['Vehicle Auto Parts']
        // #swagger.summary = 'Delete vehicle auto part'
        // #swagger.security = [{ "bearerAuth": [] }]
        // #swagger.parameters['id'] = { description: 'VehicleAutoPart ID', required: true, type: 'string', in: 'path' }
        try {
            const { id } = req.params;
            const deletedVehicleAutoPart = await vehicleAutoPartService.deleteVehicleAutoPart(id);

            if (!deletedVehicleAutoPart) {
                res.status(404).json({
                    success: false,
                    message: 'Vehicle auto part not found'
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: 'Vehicle auto part deleted successfully',
                data: deletedVehicleAutoPart
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async getTotalQuantityByCategory(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['Vehicle Auto Parts']
        // #swagger.summary = 'Get total quantity by category'
        // #swagger.description = 'Get total quantity of parts in a specific category for a vehicle'
        // #swagger.security = [{ "bearerAuth": [] }]
        // #swagger.parameters['vehicleId'] = { description: 'Vehicle ID', required: true, type: 'string', in: 'path' }
        // #swagger.parameters['category'] = { description: 'Part category (TIRE, BATTERY, BRAKE, etc)', required: true, type: 'string', in: 'query' }
        try {
            const { vehicleId } = req.params;
            const { category } = req.query;

            if (!category || typeof category !== 'string') {
                res.status(400).json({
                    success: false,
                    message: 'Category is required'
                });
                return;
            }

            const totalQuantity = await vehicleAutoPartService.getTotalQuantityByCategory(vehicleId, category);

            res.status(200).json({
                success: true,
                data: {
                    vehicleId,
                    category,
                    total_quantity: totalQuantity
                }
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async getVehicleAutoPartsByRecordId(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['Vehicle Auto Parts']
        // #swagger.summary = 'Get vehicle auto parts by service record'
        // #swagger.security = [{ "bearerAuth": [] }]
        // #swagger.description = 'Fetch vehicle auto parts for the vehicle referenced by a given service record'
        // #swagger.parameters['recordId'] = { description: 'Service record ID', required: true, type: 'string', in: 'path' }
        try {
            const { recordId } = req.params;

            const record = await serviceRecordService.getServiceRecordById(recordId);
            if (!record) {
                res.status(404).json({ success: false, message: 'Service record not found' });
                return;
            }

            const appointment = (record as any).appointment_id;
            if (!appointment || !appointment.vehicle_id) {
                res.status(400).json({ success: false, message: 'Vehicle information not found for this record' });
                return;
            }

            const vehicleId = appointment.vehicle_id._id ? appointment.vehicle_id._id.toString() : appointment.vehicle_id.toString();

            const parts = await vehicleAutoPartService.getVehicleAutoPartsByVehicleId(vehicleId);

            res.status(200).json({ success: true, data: parts });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

export default new VehicleAutoPartController();
