import Appointment from '../models/appointment.model';
import Slot from '../models/slot.model';
import moment from 'moment-timezone';
import { VIETNAM_TIMEZONE } from '../utils/time';
import { CreateAppointmentRequest, UpdateAppointmentRequest, IAppointment } from '../types/appointment.type';
import { Vehicle } from '../models/vehicle.model';
import mongoose from 'mongoose';
import systemUserModel from '../models/systemUser.model';

export class AppointmentService {
    async createAppointment(appointmentData: CreateAppointmentRequest): Promise<IAppointment> {
        try {
            // Vehicle ownership check
            if (appointmentData.vehicle_id && appointmentData.customer_id) {
                const vehicle = await Vehicle.findById(appointmentData.vehicle_id).select('customerId').lean();
                if (!vehicle) throw new Error('Vehicle not found');
                const ownerId = vehicle.customerId ? String(vehicle.customerId) : null;
                if (!ownerId || ownerId !== String(appointmentData.customer_id)) {
                    throw new Error('Vehicle does not belong to the specified customer');
                }
            }

            // Check if vehicle already has an appointment with this slot
            if (appointmentData.vehicle_id && appointmentData.slot_id) {
                const existingAppointment = await Appointment.findOne({
                    vehicle_id: appointmentData.vehicle_id,
                    slot_id: appointmentData.slot_id,
                    status: { $ne: 'cancelled' }
                }).lean();
                if (existingAppointment) {
                    throw new Error('Vehicle already has an appointment at this slot');
                }
            }

            // Slot validation
            const slot = await Slot.findById(appointmentData.slot_id);
            if (!slot) throw new Error('Slot not found');
            if (String(slot.center_id) !== String(appointmentData.center_id)) {
                throw new Error('Slot does not belong to the specified center');
            }
            if (appointmentData.staffId) {
                const staff = await systemUserModel.findById(appointmentData.staffId).select('centerId').lean();
                if (!staff) throw new Error('Staff not found');
                if (String(staff.centerId) !== String(appointmentData.center_id)) {
                    throw new Error('Staff does not belong to the specified center');
                }
            }
            // Expiry check
            const [endH, endM] = String((slot as any).end_time).split(':').map((n: string) => parseInt(n, 10));
            const slotEnd = moment(slot.slot_date).tz(VIETNAM_TIMEZONE).set({ hour: endH || 0, minute: endM || 0, second: 0, millisecond: 0 }).toDate();
            const now = moment().tz(VIETNAM_TIMEZONE).toDate();
            if (slotEnd < now || slot.status === 'expired') {
                throw new Error('Slot is expired');
            }
            if (slot.status === 'inactive' || slot.capacity === 0) {
                throw new Error('Slot is inactive');
            }
            const updatedSlot = await Slot.findOneAndUpdate(
                { _id: appointmentData.slot_id, $expr: { $lt: ['$booked_count', '$capacity'] }, status: { $in: ['active', 'full'] } },
                { $inc: { booked_count: 1 } },
                { new: true }
            );
            if (!updatedSlot) throw new Error('Slot is full');
            if (updatedSlot.booked_count >= updatedSlot.capacity && updatedSlot.status !== 'full') {
                await Slot.findByIdAndUpdate(updatedSlot._id, { $set: { status: 'full' } });
            }

            const appointment = new Appointment(appointmentData);
            const saved = await appointment.save();
            return await Appointment.findById(saved._id)
                .populate('customer_id', 'customerName address')
                .populate('vehicle_id', 'vehicleName model plateNumber mileage')
                .populate('center_id', 'name address phone')
                .populate('slot_id')
                .lean() as any;
        } catch (error) {
            if (error instanceof Error) throw new Error(`Failed to create appointment: ${error.message}`);
            throw new Error('Failed to create appointment: Unknown error');
        }
    }

    async getAppointmentById(appointmentId: string): Promise<IAppointment | null> {
        try {
            return await Appointment.findById(appointmentId)
                .populate('customer_id', 'customerName dateOfBirth address')
                .populate('vehicle_id', 'vehicleName model plateNumber mileage')
                .populate('center_id', 'name address phone')
                .populate('slot_id')
                .lean() as any;
        } catch (error) {
            if (error instanceof Error) throw new Error(`Failed to get appointment: ${error.message}`);
            throw new Error('Failed to get appointment: Unknown error');
        }
    }

    async getAllAppointments(filters?: {
        status?: string;
        customer_id?: string;
        center_id?: string;
        page?: number;
        limit?: number;
    }): Promise<{ appointments: IAppointment[]; total: number; page: number; limit: number; totalPages: number; }> {
        try {
            const page = filters?.page || 1;
            const limit = filters?.limit || 10;
            const skip = (page - 1) * limit;

            const match: any = {};
            if (filters?.status) match.status = filters.status;
            if (filters?.customer_id && mongoose.Types.ObjectId.isValid(filters.customer_id)) match.customer_id = new mongoose.Types.ObjectId(filters.customer_id);
            if (filters?.center_id && mongoose.Types.ObjectId.isValid(filters.center_id)) match.center_id = new mongoose.Types.ObjectId(filters.center_id);

            const pipeline: any[] = [
                { $match: match },
                {
                    $lookup: {
                        from: 'slots',
                        localField: 'slot_id',
                        foreignField: '_id',
                        as: 'slot'
                    }
                },
                { $unwind: '$slot' },
                // Replace slot_id (ObjectId) bằng full slot object để giữ nguyên tên field
                { $addFields: { slot_id: '$slot' } },
                { $project: { slot: 0 } },
                // Populate customer
                {
                    $lookup: {
                        from: 'customers',
                        localField: 'customer_id',
                        foreignField: '_id',
                        as: 'customer'
                    }
                },
                { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } },
                { $addFields: { customer_id: '$customer' } },
                { $project: { customer: 0 } },
                // Populate vehicle
                {
                    $lookup: {
                        from: 'vehicles',
                        localField: 'vehicle_id',
                        foreignField: '_id',
                        as: 'vehicle'
                    }
                },
                { $unwind: { path: '$vehicle', preserveNullAndEmptyArrays: true } },
                { $addFields: { vehicle_id: '$vehicle' } },
                { $project: { vehicle: 0 } },
                // Populate center
                {
                    $lookup: {
                        from: 'centers',
                        localField: 'center_id',
                        foreignField: '_id',
                        as: 'center'
                    }
                },
                { $unwind: { path: '$center', preserveNullAndEmptyArrays: true } },
                { $addFields: { center_id: '$center' } },
                { $project: { center: 0 } },
                { $sort: { 'slot.slot_date': -1, 'slot.start_time': -1 } },
                {
                    $facet: {
                        data: [{ $skip: skip }, { $limit: limit }],
                        total: [{ $count: 'count' }]
                    }
                }
            ]
            const aggRes: any[] = await (Appointment as any).aggregate(pipeline).exec();
            const data = aggRes[0] || { data: [], total: [] };
            const appointments = data.data as IAppointment[];
            const total = (data.total[0]?.count || 0) as number;

            return { appointments, total, page, limit, totalPages: Math.ceil(total / limit) };
        } catch (error) {
            if (error instanceof Error) throw new Error(`Failed to get appointments: ${error.message}`);
            throw new Error('Failed to get appointments: Unknown error');
        }
    }

    async updateAppointment(appointmentId: string, updateData: UpdateAppointmentRequest): Promise<IAppointment | null> {
        try {
            const current = await Appointment.findById(appointmentId).lean();
            if (!current) return null;

            // Status transition without slot change
            if (updateData.status && !updateData.slot_id) {
                const fromStatus = (current as any).status as string;
                const toStatus = updateData.status as string;
                if (fromStatus !== toStatus) {
                    if (toStatus === 'cancelled' && (current as any).slot_id) {
                        await Slot.findByIdAndUpdate((current as any).slot_id, { $inc: { booked_count: -1 }, $set: { status: 'active' } });
                    }
                    if (fromStatus === 'cancelled' && toStatus !== 'cancelled' && (current as any).slot_id) {
                        const incRes = await Slot.findOneAndUpdate(
                            { _id: (current as any).slot_id, $expr: { $lt: ['$booked_count', '$capacity'] }, status: { $in: ['active', 'full'] } },
                            { $inc: { booked_count: 1 } },
                            { new: true }
                        );
                        if (!incRes) throw new Error('Slot is full, cannot re-activate appointment');
                        if (incRes.booked_count >= incRes.capacity && incRes.status !== 'full') {
                            await Slot.findByIdAndUpdate(incRes._id, { $set: { status: 'full' } });
                        }
                    }
                }
            }

            // Slot move
            if (updateData.slot_id && String(updateData.slot_id) !== String((current as any).slot_id)) {
                const slotDoc = await Slot.findById(updateData.slot_id);
                if (!slotDoc) throw new Error('New slot not found');
                if (String(slotDoc.center_id) !== String((current as any).center_id)) {
                    throw new Error('New slot does not belong to the same center');
                }
                const [endH, endM] = String((slotDoc as any).end_time).split(':').map((n: string) => parseInt(n, 10));
                const slotEnd = moment(slotDoc.slot_date).tz(VIETNAM_TIMEZONE).set({ hour: endH || 0, minute: endM || 0, second: 0, millisecond: 0 }).toDate();
                const now = moment().tz(VIETNAM_TIMEZONE).toDate();
                if (slotEnd < now || slotDoc.status === 'expired') throw new Error('New slot is expired');

                const newSlot = await Slot.findOneAndUpdate(
                    { _id: updateData.slot_id, $expr: { $lt: ['$booked_count', '$capacity'] }, status: { $in: ['active', 'full'] } },
                    { $inc: { booked_count: 1 } },
                    { new: true }
                );
                if (!newSlot) throw new Error('New slot is full or not available');

                const updated = await Appointment.findByIdAndUpdate(
                    appointmentId,
                    updateData,
                    { new: true, runValidators: true }
                )
                    .populate('customer_id', 'customerName dateOfBirth address')
                    .populate('vehicle_id', 'vehicleName model plateNumber mileage')
                    .populate('center_id', 'name address phone')
                    .populate('slot_id')
                    .lean() as any;

                await Slot.findByIdAndUpdate((current as any).slot_id, { $inc: { booked_count: -1 }, $set: { status: 'active' } });
                return updated;
            }

            return await Appointment.findByIdAndUpdate(
                appointmentId,
                updateData,
                { new: true, runValidators: true }
            )
                .populate('customer_id', 'customerName dateOfBirth address')
                .populate('vehicle_id', 'vehicleName model plateNumber mileage')
                .populate('center_id', 'name address phone')
                .populate('slot_id')
                .lean() as any;
        } catch (error) {
            if (error instanceof Error) throw new Error(`Failed to update appointment: ${error.message}`);
            throw new Error('Failed to update appointment: Unknown error');
        }
    }

    async assignStaff(appointmentId: string, staffId: string | null): Promise<IAppointment | null> {
        try {
            return await Appointment.findByIdAndUpdate(
                appointmentId,
                { staffId },
                { new: true, runValidators: true }
            )
                .populate('customer_id', 'customerName dateOfBirth address')
                .populate('vehicle_id', 'vehicleName model plateNumber mileage')
                .populate('center_id', 'name address phone')
                .lean() as any;
        } catch (error) {
            if (error instanceof Error) throw new Error(`Failed to assign staff: ${error.message}`);
            throw new Error('Failed to assign staff: Unknown error');
        }
    }

    async deleteAppointment(appointmentId: string): Promise<IAppointment | null> {
        try {
            const appt = await Appointment.findByIdAndDelete(appointmentId).lean() as any;
            if (appt && appt.slot_id) {
                await Slot.findByIdAndUpdate(appt.slot_id, { $inc: { booked_count: -1 }, $set: { status: 'active' } });
            }
            return appt as any;
        } catch (error) {
            if (error instanceof Error) throw new Error(`Failed to delete appointment: ${error.message}`);
            throw new Error('Failed to delete appointment: Unknown error');
        }
    }
}

export default new AppointmentService();
