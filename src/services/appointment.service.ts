import Appointment from '../models/appointment.model';
import { CreateAppointmentRequest, UpdateAppointmentRequest, IAppointment } from '../types/appointment.type';

export class AppointmentService {
    async createAppointment(appointmentData: CreateAppointmentRequest): Promise<IAppointment> {
        try {
            const appointment = new Appointment(appointmentData);
            return await appointment.save() as any;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to create appointment: ${error.message}`);
            }
            throw new Error('Failed to create appointment: Unknown error');
        }
    }

    async getAppointmentById(appointmentId: string): Promise<IAppointment | null> {
        try {
            return await Appointment.findById(appointmentId)
                .populate('customer_id', 'customerName dateOfBirth address')
                .populate('vehicle_id', 'vehicleName model plateNumber mileage')
                .populate('center_id', 'center_id name address phone')
                .lean() as any;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to get appointment: ${error.message}`);
            }
            throw new Error('Failed to get appointment: Unknown error');
        }
    }

    async getAllAppointments(filters?: {
        status?: string;
        customer_id?: string;
        center_id?: string;
        startDate?: Date;
        endDate?: Date;
        page?: number;
        limit?: number;
    }): Promise<{
        appointments: IAppointment[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> {
        try {
            const page = filters?.page || 1;
            const limit = filters?.limit || 10;
            const skip = (page - 1) * limit;

            const query: any = {};
            if (filters?.status) {
                query.status = filters.status;
            }
            if (filters?.customer_id) {
                query.customer_id = filters.customer_id;
            }
            if (filters?.center_id) {
                query.center_id = filters.center_id;
            }
            if (filters?.startDate || filters?.endDate) {
                query.startTime = {};
                if (filters.startDate) {
                    query.startTime.$gte = filters.startDate;
                }
                if (filters.endDate) {
                    query.startTime.$lte = filters.endDate;
                }
            }

            const [appointments, total] = await Promise.all([
                Appointment.find(query)
                    .populate('customer_id', 'customerName dateOfBirth address')
                    .populate('vehicle_id', 'vehicleName model plateNumber mileage')
                    .populate('center_id', 'center_id name address phone')
                    .sort({ startTime: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean() as any,
                Appointment.countDocuments(query)
            ]);

            return {
                appointments,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            };
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to get appointments: ${error.message}`);
            }
            throw new Error('Failed to get appointments: Unknown error');
        }
    }

    async updateAppointment(appointmentId: string, updateData: UpdateAppointmentRequest): Promise<IAppointment | null> {
        try {
            return await Appointment.findByIdAndUpdate(
                appointmentId,
                updateData,
                { new: true, runValidators: true }
            )
                .populate('customer_id', 'customerName dateOfBirth address')
                .populate('vehicle_id', 'vehicleName model plateNumber mileage')
                .populate('center_id', 'center_id name address phone')
                .lean() as any;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to update appointment: ${error.message}`);
            }
            throw new Error('Failed to update appointment: Unknown error');
        }
    }

    async deleteAppointment(appointmentId: string): Promise<IAppointment | null> {
        try {
            return await Appointment.findByIdAndDelete(appointmentId).lean() as any;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to delete appointment: ${error.message}`);
            }
            throw new Error('Failed to delete appointment: Unknown error');
        }
    }
}

export default new AppointmentService();
