import { Request, Response } from 'express';
import { VehicleSubscriptionService } from '../services/vehicleSubcription.service';

export class VehicleSubscriptionController {
    private vehicleSubscriptionService = new VehicleSubscriptionService();

    async getAllSubscriptions(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['Vehicle Subscriptions']
        // #swagger.summary = 'Get all vehicle subscriptions'
        // #swagger.description = 'API to get all vehicle maintenance subscriptions'
        // #swagger.security = [{ "bearerAuth": [] }]
        /* #swagger.responses[200] = {
            description: 'Successfully retrieved subscriptions',
            schema: {
                success: true,
                data: [{
                    _id: "string",
                    vehicleId: {
                        _id: "string",
                        vehicleName: "Tesla Model 3",
                        model: "Model 3",
                        VIN: "1HGBH41JXMN109186"
                    },
                    package_id: {
                        _id: "string",
                        name: "Basic Maintenance",
                        description: "Basic maintenance package",
                        price: 100,
                        duration: 30,
                        km_interval: 10000
                    },
                    start_date: "2023-01-01T00:00:00.000Z",
                    end_date: "2024-01-01T00:00:00.000Z",
                    status: "ACTIVE"
                }]
            }
        } */
        try {
            const subscriptions = await this.vehicleSubscriptionService.getAllSubscriptions();
            res.status(200).json({
                success: true,
                data: subscriptions
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async getSubscriptionById(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['Vehicle Subscriptions']
        // #swagger.summary = 'Get subscription by ID'
        // #swagger.description = 'API to get a specific vehicle subscription by its ID'
        // #swagger.security = [{ "bearerAuth": [] }]
        // #swagger.parameters['id'] = { description: 'Subscription ID', required: true, type: 'string' }
        try {
            const { id } = req.params;
            const subscription = await this.vehicleSubscriptionService.getSubscriptionById(id);

            if (!subscription) {
                res.status(404).json({
                    success: false,
                    message: 'Subscription not found'
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: subscription
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async getSubscriptionsByVehicle(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['Vehicle Subscriptions']
        // #swagger.summary = 'Get subscriptions by vehicle ID'
        // #swagger.description = 'API to get all subscriptions for a specific vehicle'
        // #swagger.security = [{ "bearerAuth": [] }]
        // #swagger.parameters['vehicleId'] = { description: 'Vehicle ID', required: true, type: 'string' }
        try {
            const { vehicleId } = req.params;
            const subscriptions = await this.vehicleSubscriptionService.getSubscriptionsByVehicle(vehicleId);

            res.status(200).json({
                success: true,
                data: subscriptions
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async getSubscriptionsByCustomer(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['Vehicle Subscriptions']
        // #swagger.summary = 'Get subscriptions by customer ID'
        // #swagger.description = 'API to get all subscriptions for a specific customer'
        // #swagger.security = [{ "bearerAuth": [] }]
        // #swagger.parameters['customerId'] = { description: 'Customer ID', required: true, type: 'string' }
        try {
            const { customerId } = req.params;
            const subscriptions = await this.vehicleSubscriptionService.getSubscriptionsByCustomer(customerId);

            res.status(200).json({
                success: true,
                data: subscriptions
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async createSubscription(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['Vehicle Subscriptions']
        // #swagger.summary = 'Create new subscription'
        // #swagger.description = 'API to create a new vehicle maintenance subscription'
        // #swagger.security = [{ "bearerAuth": [] }]
        /* #swagger.requestBody = {
            required: true,
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        properties: {
                            vehicleId: { 
                                type: "string", 
                                example: "64f1b2c3d4e5f6789abcdef0",
                                description: "ID of the vehicle to subscribe"
                            },
                            package_id: { 
                                type: "string", 
                                example: "64f1b2c3d4e5f6789abcdef1",
                                description: "ID of the maintenance package"
                            },
                            start_date: { 
                                type: "string", 
                                format: "date", 
                                example: "2023-01-01",
                                description: "Start date of the subscription"
                            },
                            status: { 
                                type: "string", 
                                enum: ["ACTIVE", "INACTIVE", "EXPIRED", "CANCELLED"], 
                                example: "ACTIVE",
                                description: "Initial status of the subscription"
                            }
                        },
                        required: ["vehicleId", "package_id", "start_date", "end_date"]
                    }
                }
            }
        } */
        try {
            const subscriptionData = req.body;
            const newSubscription = await this.vehicleSubscriptionService.createSubscription(subscriptionData);

            res.status(201).json({
                success: true,
                message: 'Subscription created successfully',
                data: newSubscription
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async updateSubscription(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['Vehicle Subscriptions']
        // #swagger.summary = 'Update subscription'
        // #swagger.description = 'API to update a vehicle subscription'
        // #swagger.security = [{ "bearerAuth": [] }]
        // #swagger.parameters['id'] = { description: 'Subscription ID', required: true, type: 'string' }
        /* #swagger.requestBody = {
            required: true,
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        properties: {
                            vehicleId: { type: "string", example: "64f1b2c3d4e5f6789abcdef0" },
                            package_id: { type: "string", example: "64f1b2c3d4e5f6789abcdef1" },
                            start_date: { type: "string", format: "date", example: "2023-01-01" },
                            end_date: { type: "string", format: "date", example: "2024-01-01" },
                            status: { type: "string", enum: ["ACTIVE", "INACTIVE", "EXPIRED", "CANCELLED"], example: "ACTIVE" }
                        }
                    }
                }
            }
        } */
        try {
            const { id } = req.params;
            const updateData = req.body;
            const updatedSubscription = await this.vehicleSubscriptionService.updateSubscription(id, updateData);

            if (!updatedSubscription) {
                res.status(404).json({
                    success: false,
                    message: 'Subscription not found'
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: 'Subscription updated successfully',
                data: updatedSubscription
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async updateSubscriptionStatus(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['Vehicle Subscriptions']
        // #swagger.summary = 'Update subscription status'
        // #swagger.description = 'API to update the status of a vehicle subscription'
        // #swagger.security = [{ "bearerAuth": [] }]
        // #swagger.parameters['id'] = { description: 'Subscription ID', required: true, type: 'string' }
        /* #swagger.requestBody = {
            required: true,
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        properties: {
                            status: { 
                                type: "string", 
                                enum: ["ACTIVE", "INACTIVE", "EXPIRED", "CANCELLED"], 
                                example: "ACTIVE",
                                description: "The new status for the subscription"
                            }
                        },
                        required: ["status"]
                    }
                }
            }
        } */
        try {
            const { id } = req.params;
            const { status } = req.body;
            const updatedSubscription = await this.vehicleSubscriptionService.updateSubscriptionStatus(id, status);

            if (!updatedSubscription) {
                res.status(404).json({
                    success: false,
                    message: 'Subscription not found'
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: 'Subscription status updated successfully',
                data: updatedSubscription
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async deleteSubscription(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['Vehicle Subscriptions']
        // #swagger.summary = 'Delete subscription'
        // #swagger.description = 'API to delete a vehicle subscription'
        // #swagger.security = [{ "bearerAuth": [] }]
        // #swagger.parameters['id'] = { description: 'Subscription ID', required: true, type: 'string' }
        try {
            const { id } = req.params;
            const deleted = await this.vehicleSubscriptionService.deleteSubscription(id);

            if (!deleted) {
                res.status(404).json({
                    success: false,
                    message: 'Subscription not found'
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: 'Subscription deleted successfully'
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async getExpiringSubscriptions(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['Vehicle Subscriptions']
        // #swagger.summary = 'Get expiring subscriptions'
        // #swagger.description = 'API to get subscriptions that are expiring within specified days'
        // #swagger.security = [{ "bearerAuth": [] }]
        // #swagger.parameters['days'] = { description: 'Number of days to check for expiring subscriptions', required: true, type: 'string' }
        try {
            const { days } = req.params;
            const daysNumber = parseInt(days) || 30;
            const expiringSubscriptions = await this.vehicleSubscriptionService.getExpiringSubscriptions(daysNumber);

            res.status(200).json({
                success: true,
                data: expiringSubscriptions
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async renewSubscription(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['Vehicle Subscriptions']
        // #swagger.summary = 'Renew subscription'
        // #swagger.description = 'API to renew a vehicle subscription'
        // #swagger.security = [{ "bearerAuth": [] }]
        // #swagger.parameters['id'] = { description: 'Subscription ID', required: true, type: 'string' }
        try {
            const { id } = req.params;
            const { newPackageId } = req.body;
            const renewedSubscription = await this.vehicleSubscriptionService.renewSubscription(id, newPackageId);

            res.status(200).json({
                success: true,
                message: 'Subscription renewed successfully',
                data: renewedSubscription
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async updateExpiredSubscriptions(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['Vehicle Subscriptions']
        // #swagger.summary = 'Update expired subscriptions'
        // #swagger.description = 'API to automatically update expired subscriptions'
        // #swagger.security = [{ "bearerAuth": [] }]
        try {
            const result = await this.vehicleSubscriptionService.updateExpiredSubscriptions();

            res.status(200).json({
                success: true,
                message: 'Expired subscriptions updated successfully',
                data: {
                    updatedCount: result.modifiedCount
                }
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}
export default new VehicleSubscriptionController();