import { Request, Response } from 'express';
import appointmentService from '../services/appointment.service';

export class AppointmentController {
    async createAppointment(req: Request, res: Response) {
        /* #swagger.tags = ['Appointments']
           #swagger.description = 'Create a new appointment'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.requestBody = {
               required: true,
               content: {
                   'application/json': {
                       schema: { $ref: '#/components/schemas/CreateAppointment' }
                   }
               }
           }
        */
        try {
            const appointment = await appointmentService.createAppointment(req.body);
            res.status(201).json({
                success: true,
                message: 'Appointment created successfully',
                data: appointment
            });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({
                    success: false,
                    message: error.message
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: 'Failed to create appointment'
                });
            }
        }
    }

    async getAppointmentById(req: Request, res: Response) {
        /* #swagger.tags = ['Appointments']
           #swagger.description = 'Get appointment by ID'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['id'] = {
               in: 'path',
               description: 'Appointment ID',
               required: true,
               type: 'string'
           }
        */
        try {
            const appointment = await appointmentService.getAppointmentById(req.params.id);
            if (!appointment) {
                return res.status(404).json({
                    success: false,
                    message: 'Appointment not found'
                });
            }
            res.status(200).json({
                success: true,
                data: appointment
            });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({
                    success: false,
                    message: error.message
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: 'Failed to get appointment'
                });
            }
        }
    }

    async getAllAppointments(req: Request, res: Response) {
        /* #swagger.tags = ['Appointments']
           #swagger.description = 'Get all appointments with optional filters'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['status'] = {
               in: 'query',
               description: 'Filter by status',
               required: false,
               type: 'string',
               enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled']
           }
           #swagger.parameters['customer_id'] = {
               in: 'query',
               description: 'Filter by customer ID',
               required: false,
               type: 'string'
           }
           #swagger.parameters['center_id'] = {
               in: 'query',
               description: 'Filter by center ID',
               required: false,
               type: 'string'
           }
           #swagger.parameters['startDate'] = {
               in: 'query',
               description: 'Filter by start date (from)',
               required: false,
               type: 'string',
               format: 'date-time'
           }
           #swagger.parameters['endDate'] = {
               in: 'query',
               description: 'Filter by end date (to)',
               required: false,
               type: 'string',
               format: 'date-time'
           }
           #swagger.parameters['page'] = {
               in: 'query',
               description: 'Page number',
               required: false,
               type: 'integer',
               default: 1
           }
           #swagger.parameters['limit'] = {
               in: 'query',
               description: 'Items per page',
               required: false,
               type: 'integer',
               default: 10
           }
        */
        try {
            const filters = {
                status: req.query.status as string,
                customer_id: req.query.customer_id as string,
                center_id: req.query.center_id as string,
                startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
                endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
                page: req.query.page ? parseInt(req.query.page as string) : undefined,
                limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
            };
            const result = await appointmentService.getAllAppointments(filters);
            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({
                    success: false,
                    message: error.message
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: 'Failed to get appointments'
                });
            }
        }
    }

    async updateAppointment(req: Request, res: Response) {
        /* #swagger.tags = ['Appointments']
           #swagger.description = 'Update an appointment'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['id'] = {
               in: 'path',
               description: 'Appointment ID',
               required: true,
               type: 'string'
           }
           #swagger.requestBody = {
               required: true,
               content: {
                   'application/json': {
                       schema: { $ref: '#/components/schemas/UpdateAppointment' }
                   }
               }
           }
        */
        try {
            const appointment = await appointmentService.updateAppointment(req.params.id, req.body);
            if (!appointment) {
                return res.status(404).json({
                    success: false,
                    message: 'Appointment not found'
                });
            }
            res.status(200).json({
                success: true,
                message: 'Appointment updated successfully',
                data: appointment
            });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({
                    success: false,
                    message: error.message
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: 'Failed to update appointment'
                });
            }
        }
    }

    async deleteAppointment(req: Request, res: Response) {
        /* #swagger.tags = ['Appointments']
           #swagger.description = 'Delete an appointment'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['id'] = {
               in: 'path',
               description: 'Appointment ID',
               required: true,
               type: 'string'
           }
        */
        try {
            const appointment = await appointmentService.deleteAppointment(req.params.id);
            if (!appointment) {
                return res.status(404).json({
                    success: false,
                    message: 'Appointment not found'
                });
            }
            res.status(200).json({
                success: true,
                message: 'Appointment deleted successfully',
                data: appointment
            });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({
                    success: false,
                    message: error.message
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: 'Failed to delete appointment'
                });
            }
        }
    }
}

export default new AppointmentController();
