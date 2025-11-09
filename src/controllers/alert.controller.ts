import { Request, Response } from "express";
import { AlertService } from "../services/alert.service";
import { CreateAlertRequest, UpdateAlertRequest, AlertQueryParams } from "../types/alert.type";
import { Vehicle } from "../models/vehicle.model";
import Customer from "../models/customer.model";
import { firebaseNotificationService } from "../firebase/fcm.service";
import moment from 'moment-timezone';
const alertService = new AlertService();

export class AlertController {

    // GET /api/alerts - Lấy tất cả alerts
    static async getAllAlerts(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['Alerts']
        // #swagger.summary = 'Get all alerts with filtering and pagination'
        // #swagger.description = 'API to get all alerts with optional filtering and pagination'
        // #swagger.parameters['vehicleId'] = { description: 'Filter by vehicle ID', required: false, type: 'string' }
        // #swagger.parameters['isRead'] = { description: 'Filter by read status', required: false, type: 'boolean' }
        // #swagger.parameters['type'] = { description: 'Filter by alert type', required: false, type: 'string' }
        // #swagger.parameters['priority'] = { description: 'Filter by priority', required: false, type: 'string' }
        // #swagger.parameters['page'] = { description: 'Page number', required: false, type: 'integer' }
        // #swagger.parameters['limit'] = { description: 'Number of items per page', required: false, type: 'integer' }
        /* #swagger.responses[200] = {
            description: 'Alerts retrieved successfully',
            schema: {
                success: true,
                message: 'Alerts retrieved successfully',
                data: {
                    alerts: [],
                    totalCount: 0,
                    currentPage: 1,
                    totalPages: 1
                }
            }
        } */
        try {
            const queryParams: AlertQueryParams = {
                vehicleId: req.query.vehicleId as string,
                isRead: req.query.isRead ? req.query.isRead === 'true' : undefined,
                type: req.query.type as any,
                priority: req.query.priority as any,
                page: req.query.page ? parseInt(req.query.page as string) : 1,
                limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
                sortBy: req.query.sortBy as string || 'createdAt',
                sortOrder: req.query.sortOrder as 'asc' | 'desc' || 'desc'
            };

            const result = await alertService.getAllAlerts(queryParams);

            res.status(200).json({
                success: true,
                message: "Alerts retrieved successfully",
                data: result
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : "Internal server error"
            });
        }
    }


    // GET /api/alerts/:id - Lấy alert theo ID
    static async getAlertById(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['Alerts']
        // #swagger.summary = 'Get alert by ID'
        // #swagger.description = 'API to get a specific alert by its ID'
        // #swagger.parameters['id'] = { description: 'Alert ID', required: true, type: 'string' }
        /* #swagger.responses[200] = {
            description: 'Alert retrieved successfully',
            schema: {
                success: true,
                message: 'Alert retrieved successfully',
                data: {
                    _id: 'string',
                    title: 'Alert title',
                    content: 'Alert content',
                    isRead: false,
                    vehicleId: 'string',
                    type: 'SYSTEM',
                    priority: 'MEDIUM',
                    createdAt: '2023-01-01T00:00:00.000Z',
                    updatedAt: '2023-01-01T00:00:00.000Z'
                }
            }
        } */
        /* #swagger.responses[404] = {
            description: 'Alert not found',
            schema: {
                success: false,
                message: 'Alert not found'
            }
        } */
        try {
            const { id } = req.params;
            const alert = await alertService.getAlertById(id);

            res.status(200).json({
                success: true,
                message: "Alert retrieved successfully",
                data: alert
            });
        } catch (error) {
            const statusCode = error instanceof Error && error.message.includes("not found") ? 404 : 500;
            res.status(statusCode).json({
                success: false,
                message: error instanceof Error ? error.message : "Internal server error"
            });
        }
    }

    // POST /api/alerts - Tạo alert mới
    static async createAlert(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['Alerts']
        // #swagger.summary = 'Create a new alert'
        /* #swagger.security = [{ "bearerAuth": [] }] */
        // #swagger.description = 'API to create a new alert for a vehicle'
        /* #swagger.requestBody = {
               required: true,
               content: {
                   'application/json': {
                       schema: { $ref: '#/components/schemas/CreateAlert' }
                   }
               }
           } */
        /* #swagger.responses[201] = {
            description: 'Alert created successfully',
            schema: {
                success: true,
                message: 'Alert created successfully',
                data: {
                    _id: 'string',
                    title: 'Alert title',
                    content: 'Alert content',
                    isRead: false,
                    vehicleId: 'string',
                    type: 'SYSTEM',
                    priority: 'MEDIUM'
                }
            }
        } */
        try {
            const alertData: CreateAlertRequest = req.body;

            // Validation
            if (!alertData.title || !alertData.content || !alertData.vehicleId) {
                res.status(400).json({
                    success: false,
                    message: "Title, content and vehicleId are required"
                });
                return;
            }

            // Check if vehicle exists and has customerId before creating alert
            const vehicle = await Vehicle.findById(alertData.vehicleId);
            if (!vehicle || !vehicle.customerId) {
                res.status(400).json({
                    success: false,
                    message: "Vehicle not found or vehicle does not have a customerId"
                });
                return;
            }

            const newAlert = await alertService.createAlert(alertData);
            try {
                if (newAlert && newAlert._id) {
                    // vehicle is already verified above, so we can use it directly
                    const customer = await Customer.findById(vehicle.customerId);
                    if (customer && customer.deviceTokens && customer.deviceTokens.length > 0) {
                        const notificationPayload = {
                            tokens: customer.deviceTokens,
                            notification: {
                                title: alertData.title,
                                body: alertData.content.substring(0, 200),
                            },
                            data: {
                                type: 'alert',
                                id: newAlert._id.toString(),  // Use alert._id
                                vehicleId: alertData.vehicleId,
                                alertType: alertData.type || 'SYSTEM',
                                priority: alertData.priority || 'MEDIUM',
                                timestamp: moment().tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DDTHH:mm:ss.SSSZ"),
                                fullContent: alertData.content,
                            }
                        };
                        await firebaseNotificationService.sendMulticast(notificationPayload);
                        console.log(`✅ Notification sent for alert ${newAlert._id}`);
                    } else {
                        console.log('ℹ️ No device tokens found for customer, skipping notification.');
                    }
                }
            } catch (notificationError) {
                console.error('⚠️ Failed to send notification:', notificationError);
                // Don't fail the request if notification fails
            }

            res.status(201).json({
                success: true,
                message: "Alert created successfully",
                data: newAlert
            });
        } catch (error) {
            const statusCode = error instanceof Error && error.message.includes("not found") ? 404 : 500;
            res.status(statusCode).json({
                success: false,
                message: error instanceof Error ? error.message : "Internal server error"
            });
        }
    }


    // PUT /api/alerts/:id - Cập nhật alert
    static async updateAlert(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['Alerts']
        // #swagger.summary = 'Update alert'
        /* #swagger.security = [{ "bearerAuth": [] }] */
        // #swagger.description = 'API to update an existing alert'
        // #swagger.parameters['id'] = { description: 'Alert ID', required: true, type: 'string' }
        /* #swagger.parameters['body'] = {
            in: 'body',
            description: 'Alert update data',
            schema: {
                title: 'Updated alert title',
                content: 'Updated alert content',
                isRead: true,
                type: 'MAINTENANCE',
                priority: 'HIGH'
            }
        } */
        /* #swagger.responses[200] = {
            description: 'Alert updated successfully',
            schema: {
                success: true,
                message: 'Alert updated successfully',
                data: {
                    _id: 'string',
                    title: 'Updated alert title',
                    content: 'Updated alert content',
                    isRead: true,
                    vehicleId: 'string',
                    type: 'MAINTENANCE',
                    priority: 'HIGH'
                }
            }
        } */
        try {
            const { id } = req.params;
            const updateData: UpdateAlertRequest = req.body;

            const updatedAlert = await alertService.updateAlert(id, updateData);

            res.status(200).json({
                success: true,
                message: "Alert updated successfully",
                data: updatedAlert
            });
        } catch (error) {
            const statusCode = error instanceof Error && error.message.includes("not found") ? 404 : 500;
            res.status(statusCode).json({
                success: false,
                message: error instanceof Error ? error.message : "Internal server error"
            });
        }
    }


    // PATCH /api/alerts/:id/read - Đánh dấu alert là đã đọc
    static async markAsRead(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['Alerts']
        // #swagger.summary = 'Mark alert as read'
        /* #swagger.security = [{ "bearerAuth": [] }] */
        // #swagger.description = 'API to mark a specific alert as read'
        // #swagger.parameters['id'] = { description: 'Alert ID', required: true, type: 'string' }
        /* #swagger.responses[200] = {
            description: 'Alert marked as read',
            schema: {
                success: true,
                message: 'Alert marked as read',
                data: {
                    _id: 'string',
                    title: 'Alert title',
                    content: 'Alert content',
                    isRead: true,
                    vehicleId: 'string',
                    type: 'SYSTEM',
                    priority: 'MEDIUM'
                }
            }
        } */
        try {
            const { id } = req.params;
            const updatedAlert = await alertService.markAsRead(id);

            res.status(200).json({
                success: true,
                message: "Alert marked as read",
                data: updatedAlert
            });
        } catch (error) {
            const statusCode = error instanceof Error && error.message.includes("not found") ? 404 : 500;
            res.status(statusCode).json({
                success: false,
                message: error instanceof Error ? error.message : "Internal server error"
            });
        }
    }




}

export default AlertController;