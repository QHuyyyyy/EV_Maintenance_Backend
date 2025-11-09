import mongoose from 'mongoose';
import Slot, { ISlot } from '../models/slot.model';
import { WorkShift } from '../models/workshift.model';
import { ShiftAssignment } from '../models/shift-assignment.model';
import Appointment from '../models/appointment.model';
import ServiceRecord from '../models/serviceRecord.model';
import SystemUser from '../models/systemUser.model';

export class SlotService {
    async getSlotById(id: string): Promise<ISlot | null> {
        return await Slot.findById(id).lean() as any;
    }

    async listSlots(filters: { center_id?: string; date?: string; from?: Date; to?: Date; status?: string; }): Promise<ISlot[]> {
        const query: any = {};
        if (filters.center_id) {
            // Convert center_id string to ObjectId
            query.center_id = new mongoose.Types.ObjectId(filters.center_id);
        }
        if (filters.status) query.status = filters.status;

        // Date-based filtering
        if (filters.date) {
            const day = filters.date;
            const start = new Date(`${day}T00:00:00.000Z`);
            const end = new Date(`${day}T23:59:59.999Z`);
            query.slot_date = { $gte: start, $lte: end };
        } else if (filters.from || filters.to) {
            // Range query using slot_date
            query.slot_date = {};
            if (filters.from) query.slot_date.$gte = filters.from;
            if (filters.to) query.slot_date.$lte = filters.to;
        }

        return await Slot.find(query).sort({ start_time: 1 }).lean() as any;
    }


    async generateSlots(params: {
        centerIds: string[];
        dates: string[];
        startTime: string;
        endTime: string;
        duration: number;
    }): Promise<{ created: number; skipped: number; slots: ISlot[]; errors: string[]; }> {
        const { centerIds, dates, startTime, endTime, duration } = params;
        const errors: string[] = [];
        if (!Array.isArray(centerIds) || centerIds.length === 0) {
            throw new Error('centerIds must be a non-empty array');
        }
        if (!Array.isArray(dates) || dates.length === 0) {
            throw new Error('dates must be a non-empty array');
        }
        if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
            throw new Error('startTime and endTime must be in HH:mm format');
        }
        if (duration <= 0) {
            throw new Error('duration must be > 0');
        }
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);
        const startTotal = startHour * 60 + startMinute;
        const endTotal = endHour * 60 + endMinute;
        if (endTotal <= startTotal) {
            throw new Error('endTime must be after startTime');
        }


        const estimatedPerDateCenter = Math.ceil((endTotal - startTotal) / duration);
        const totalEstimated = estimatedPerDateCenter * centerIds.length * dates.length;
        if (totalEstimated > 5000) {
            throw new Error(`Too many slots to create (estimated ${totalEstimated}). Reduce range or increase duration.`);
        }

        const toCreate: Partial<ISlot>[] = [];
        for (const centerId of centerIds) {
            for (const dateStr of dates) {
                const slotDate = new Date(`${dateStr}T00:00:00.000Z`);
                // Convert centerId string to ObjectId for querying
                const centerObjectId = new mongoose.Types.ObjectId(centerId);

                // Fetch all active shifts for this center/date with ANY overlap against requested window
                const shifts = await WorkShift.find({
                    center_id: centerObjectId,
                    shift_date: slotDate,
                    status: 'active'
                }).lean();

                if (!shifts || shifts.length === 0) {
                    errors.push(`No active shift for center ${centerId} on ${dateStr}, skipped.`);
                    continue;
                }

                // Map shift to minutes window and collect ids
                const shiftWindows = shifts.map(s => {
                    const [sh, sm] = (s.start_time as any as string).split(':').map(Number);
                    const [eh, em] = (s.end_time as any as string).split(':').map(Number);
                    return { id: (s as any)._id, start: sh * 60 + sm, end: eh * 60 + em };
                });

                // Filter shifts that have intersection with requested window
                const overlapping = shiftWindows.filter(w => Math.max(w.start, startTotal) < Math.min(w.end, endTotal));
                if (overlapping.length === 0) {
                    errors.push(`No overlapping shift window for center ${centerId} on ${dateStr}, skipped.`);
                    continue;
                }

                // Count assignments per shift in a single aggregation
                const agg = await ShiftAssignment.aggregate([
                    { $match: { workshift_id: { $in: overlapping.map(o => o.id) } } },
                    { $group: { _id: '$workshift_id', cnt: { $sum: 1 } } }
                ]);
                const capacityByShift = new Map<string, number>(agg.map((a: any) => [String(a._id), a.cnt]));

                // Generate slots: for each overlapping shift, generate slots across the requested window
                for (const overlappingShift of overlapping) {
                    const shiftCapacity = capacityByShift.get(String(overlappingShift.id)) || 0;
                    if (shiftCapacity <= 0) continue; // skip if no technicians assigned

                    // Find the shift object to get full details
                    const shiftObj = shifts.find(s => (s as any)._id.toString() === overlappingShift.id.toString());
                    if (!shiftObj) continue;

                    for (let current = startTotal; current + duration <= endTotal; current += duration) {
                        const slotStart = current;
                        const slotEnd = current + duration;

                        // Only create slot if it falls completely within the shift
                        if (overlappingShift.start <= slotStart && overlappingShift.end >= slotEnd) {
                            const slotStartHour = Math.floor(slotStart / 60);
                            const slotStartMinute = slotStart % 60;
                            const slotEndHour = Math.floor(slotEnd / 60);
                            const slotEndMinute = slotEnd % 60;

                            toCreate.push({
                                center_id: centerObjectId,
                                start_time: `${String(slotStartHour).padStart(2, '0')}:${String(slotStartMinute).padStart(2, '0')}`,
                                end_time: `${String(slotEndHour).padStart(2, '0')}:${String(slotEndMinute).padStart(2, '0')}`,
                                slot_date: slotDate,
                                capacity: shiftCapacity,
                                booked_count: 0,
                                status: 'active',
                                workshift_id: overlappingShift.id
                            });
                        }
                    }
                }
            }
        }

        if (toCreate.length === 0) {
            return { created: 0, skipped: 0, slots: [], errors };
        }

        // Fetch existing slots that would conflict (same center & slot_date & start_time & workshift_id)
        const minDate = toCreate.reduce((min, s) => !min || (s.slot_date! < min) ? s.slot_date! as Date : min as Date, toCreate[0].slot_date! as Date);
        const maxDate = toCreate.reduce((max, s) => !max || (s.slot_date! > max) ? s.slot_date! as Date : max as Date, toCreate[0].slot_date! as Date);

        // Convert centerIds to ObjectIds for query
        const centerObjectIds = centerIds.map(id => new mongoose.Types.ObjectId(id));

        const existing = await Slot.find({
            center_id: { $in: centerObjectIds },
            slot_date: { $gte: minDate, $lte: maxDate }
        }).select('center_id slot_date start_time workshift_id').lean();
        const existingKey = new Set(existing.map(e => `${e.center_id.toString()}|${new Date(e.slot_date as any).toISOString().slice(0, 10)}|${(e as any).start_time}|${(e as any).workshift_id.toString()}`));

        const createBatch = toCreate.filter(s => !existingKey.has(`${(s.center_id as any).toString()}|${(s.slot_date as Date).toISOString().slice(0, 10)}|${s.start_time}|${(s.workshift_id as any).toString()}`));

        let inserted: ISlot[] = [];
        if (createBatch.length > 0) {
            inserted = await Slot.insertMany(createBatch) as ISlot[];
        }

        return {
            created: inserted.length,
            skipped: toCreate.length - inserted.length,
            slots: inserted,
            errors
        };
    }

    /**
     * Get all staff and technician available for a specific slot with their assignment status
     * Simplified: uses workshift_id directly from slot
     * @param slotId - The slot ID
     * @returns Staff and technician list with assignment counts
     */
    async getStaffAndTechnicianForSlot(slotId: string): Promise<{
        slot: {
            id: string;
            center_id: string;
            date: string;
            startTime: string;
            endTime: string;
            capacity: number;
            totalAppointments: number;
        };
        staff: Array<{
            id: string;
            name: string;
            email: string;
            phone: string;
            assigned: boolean;
            shiftId: string;
            shiftTime: string;
        }>;
        technician: Array<{
            id: string;
            name: string;
            email: string;
            phone: string;
            assigned: boolean;
            shiftId: string;
            shiftTime: string;
        }>;
    }> {
        // Get slot details
        const slot = await Slot.findById(slotId).lean() as any;
        if (!slot) {
            throw new Error(`Slot ${slotId} not found`);
        }

        // Get all appointments in this slot
        const appointments = await Appointment.find({ slot_id: slotId }).lean() as any[];
        const totalAppointments = appointments.length;

        // Get the workshift directly using the workshift_id from slot
        const workshift = await WorkShift.findById(slot.workshift_id).lean() as any;
        if (!workshift) {
            throw new Error(`WorkShift ${slot.workshift_id} not found for slot`);
        }

        // Get all shift assignments for this workshift
        const shiftAssignments = await ShiftAssignment.find({
            workshift_id: slot.workshift_id
        }).lean() as any[];

        // Get unique system user IDs
        const systemUserIds = [...new Set(shiftAssignments.map(sa => sa.system_user_id))];

        // Populate system users with User details
        const systemUsers = await SystemUser.find({
            _id: { $in: systemUserIds }
        }).populate('userId').lean() as any[];

        // Build a map of system user ID to user details
        const userMap = new Map<string, any>();
        systemUsers.forEach(sysUser => {
            const userId = sysUser.userId;
            if (userId) {
                userMap.set(sysUser._id.toString(), {
                    id: sysUser._id.toString(),
                    name: userId.name || '',
                    email: userId.email || '',
                    phone: userId.phone || '',
                    role: userId.role
                });
            }
        });

        // Count assignments in current slot for each staff/technician
        const appointmentStaffMap = new Map<string, number>();
        const appointmentTechMap = new Map<string, number>();

        for (const appt of appointments) {
            if (appt.staffId) {
                const staffIdStr = appt.staffId.toString();
                appointmentStaffMap.set(staffIdStr, (appointmentStaffMap.get(staffIdStr) || 0) + 1);
            }
        }

        // Get technician assignments from ServiceRecords
        const serviceRecords = await ServiceRecord.find({
            appointment_id: { $in: appointments.map(a => a._id) }
        }).lean() as any[];

        for (const sr of serviceRecords) {
            if (sr.technician_id) {
                const techIdStr = sr.technician_id.toString();
                appointmentTechMap.set(techIdStr, (appointmentTechMap.get(techIdStr) || 0) + 1);
            }
        }

        // Build result arrays
        const staffArray: any[] = [];
        const technicianArray: any[] = [];

        userMap.forEach((user, sysUserId) => {
            const assignmentCount = (user.role === 'STAFF'
                ? appointmentStaffMap.get(sysUserId)
                : appointmentTechMap.get(sysUserId)) || 0;
            const isAssigned = assignmentCount > 0;
            const shiftId = slot.workshift_id.toString();
            const shiftTime = `${workshift.start_time}-${workshift.end_time}`;

            const staffData = {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                assigned: isAssigned,
                shiftId,
                shiftTime
            };

            if (user.role === 'STAFF') {
                staffArray.push(staffData);
            } else if (user.role === 'TECHNICIAN') {
                technicianArray.push(staffData);
            }
        });

        return {
            slot: {
                id: slot._id.toString(),
                center_id: slot.center_id.toString(),
                date: new Date(slot.slot_date).toISOString().split('T')[0],
                startTime: slot.start_time,
                endTime: slot.end_time,
                capacity: slot.capacity,
                totalAppointments
            },
            staff: staffArray,
            technician: technicianArray
        };
    }
}

export default new SlotService();