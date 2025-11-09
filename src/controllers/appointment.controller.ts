import { Request, Response } from 'express';
import appointmentService from '../services/appointment.service';
import serviceRecordService from '../services/serviceRecord.service';
import { SystemUserService } from '../services/systemUser.service';
import { ShiftAssignmentService } from '../services/shiftAssignment.service';

const systemUserService = new SystemUserService();
const shiftAssignmentService = new ShiftAssignmentService();

function timeStringToMinutes(t?: string): number | null {
    if (!t) return null;
    const parts = t.split(':').map(p => parseInt(p, 10));
    if (parts.length < 2 || Number.isNaN(parts[0]) || Number.isNaN(parts[1])) return null;
    return parts[0] * 60 + parts[1];
}

function isSameDate(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isDateTimeWithinShifts(dt: Date, shifts: any[]): boolean {
    if (!dt || !Array.isArray(shifts)) return false;
    const dtMinutes = dt.getHours() * 60 + dt.getMinutes();
    for (const s of shifts) {
        try {
            const shiftDate = s.shift_date ? new Date(s.shift_date) : null;
            if (!shiftDate) continue;
            if (!isSameDate(dt, shiftDate)) continue;
            const startMin = timeStringToMinutes(s.start_time);
            const endMin = timeStringToMinutes(s.end_time);
            if (startMin === null || endMin === null) continue;
            if (startMin <= dtMinutes && dtMinutes <= endMin) return true;
        } catch (e) {
            continue;
        }
    }
    return false;
}

export class AppointmentController {
    async createAppointment(req: Request, res: Response) {
        /* #swagger.tags = ['Appointments']
           #swagger.summary = 'Create Appointment'
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
           #swagger.summary = 'Get Appointment by ID'
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
           #swagger.summary = 'Get all appointments with optional filters'
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
           #swagger.summary = 'Update an appointment'
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
              #swagger.summary = 'Delete an appointment'
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

    async assignStaff(req: Request, res: Response) {
        //  #swagger.tags = ['Appointments']
        //    #swagger.summary = 'Assign or remove staff for an appointment (admin only)'
        //    #swagger.description = 'Assign or remove staff for an appointment (admin only)'
        //    #swagger.security = [{ "bearerAuth": [] }]
        // #swagger.parameters['id'] = { in: 'path', required: true, type: 'string', description: 'Appointment ID' }
        /* #swagger.requestBody = {
      required: true,
      content: {
          "application/json": {
              schema: {
                  $ref: '#/definitions/StaffAppointment'
              }
          }
      }
  } */
        try {
            const user = req.user as any;
            if (!user || user.role !== 'ADMIN') {
                return res.status(403).json({ success: false, message: 'Forbidden: Admins only' });
            }
            const staffId = req.body.staffId;
            if (!staffId) {
                return res.status(400).json({ success: false, message: 'staffId is required' });
            }
            let systemUser;
            try {
                systemUser = await systemUserService.getSystemUserById(staffId);
            } catch (err: any) {
                return res.status(400).json({ success: false, message: 'Invalid staffId or system user not found' });
            }
            const role = (systemUser.userId as any)?.role;
            if (role !== 'STAFF') {
                return res.status(400).json({ success: false, message: `User role must be STAFF to be assigned as staff (current: ${role})` });
            }
            const appointmentObj = await appointmentService.getAppointmentById(req.params.id);
            if (!appointmentObj) {
                return res.status(404).json({ success: false, message: 'Appointment not found' });
            }

            const shifts = await shiftAssignmentService.getShiftsOfUser(staffId);
            // slot-based start time (legacy fallback removed)
            const apptStart = (appointmentObj as any)?.slot_id?.start_time ? new Date((appointmentObj as any).slot_id.start_time) : null;
            const inShift = apptStart ? isDateTimeWithinShifts(apptStart, shifts) : false;
            if (!inShift) {
                return res.status(400).json({ success: false, message: 'Staff is not scheduled for a shift covering the appointment time' });
            }

            const appointment = await appointmentService.assignStaff(req.params.id, staffId);
            if (!appointment) {
                return res.status(404).json({ success: false, message: 'Appointment not found' });
            }
            res.status(200).json({ success: true, message: 'Staff assigned successfully', data: appointment });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ success: false, message: error.message });
            } else {
                res.status(400).json({ success: false, message: 'Failed to assign staff' });
            }
        }
    }

    async assignTechnician(req: Request, res: Response) {
        /* #swagger.tags = ['Appointments']
              #swagger.summary = 'Assign Technician to Appointment and Create Service Record (admin only)'
           #swagger.description = 'Assign a technician to an appointment and create a service record (admin only)'
           #swagger.security = [{ "bearerAuth": [] }]
         #swagger.parameters['id'] = { in: 'path', required: true, type: 'string', description: 'Appointment ID' }
         #swagger.requestBody = {
      required: true,
      content: {
          "application/json": {
              schema: {
                  $ref: '#/definitions/TechnicianAppointment'
              }
          }
      }
  } */
        try {
            const user = req.user as any;

            if (!user || (user.role !== 'ADMIN' && user.role !== 'STAFF')) {
                return res.status(403).json({ success: false, message: 'Forbidden: Admins and Staff only' });
            }

            const appointmentId = req.params.id;
            const technician_id = req.body.technician_id;
            if (!technician_id) {
                return res.status(400).json({ success: false, message: 'technician_id is required' });
            }

            // Ensure appointment exists
            const appointment = await appointmentService.getAppointmentById(appointmentId);
            if (!appointment) {
                return res.status(404).json({ success: false, message: 'Appointment not found' });
            }

            // Validate technician system user and role
            let techUser;
            try {
                techUser = await systemUserService.getSystemUserById(technician_id);
            } catch (err: any) {
                return res.status(400).json({ success: false, message: 'Invalid technician_id or system user not found' });
            }
            const techRole = (techUser.userId as any)?.role;
            if (techRole !== 'TECHNICIAN') {
                return res.status(400).json({ success: false, message: `User role must be TECHNICIAN to be assigned as technician (current: ${techRole})` });
            }

            // Ensure technician has a shift covering the appointment time
            const techShifts = await shiftAssignmentService.getShiftsOfUser(technician_id);
            const apptStart = (appointment as any)?.slot_id?.start_time ? new Date((appointment as any).slot_id.start_time) : null;
            const techInShift = apptStart ? isDateTimeWithinShifts(apptStart, techShifts) : false;
            if (!techInShift) {
                return res.status(400).json({ success: false, message: 'Technician is not scheduled for a shift covering the appointment time' });
            }

            // Create minimal service record; technician will update remaining fields later
            const record = await serviceRecordService.createServiceRecord({
                appointment_id: appointmentId,
                technician_id,
                status: 'pending'
            } as any);

            res.status(201).json({ success: true, message: 'Technician assigned and service record created', data: record });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ success: false, message: error.message });
            } else {
                res.status(400).json({ success: false, message: 'Failed to assign technician' });
            }
        }
    }
}

export default new AppointmentController();
