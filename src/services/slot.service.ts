import Slot, { ISlot } from '../models/slot.model';
import { WorkShift } from '../models/workshift.model';
import { ShiftAssignment } from '../models/shift-assignment.model';

export class SlotService {
    async getSlotById(id: string): Promise<ISlot | null> {
        return await Slot.findById(id).lean() as any;
    }

    async listSlots(filters: { center_id?: string; date?: string; from?: Date; to?: Date; status?: string; }): Promise<ISlot[]> {
        const query: any = {};
        if (filters.center_id) query.center_id = filters.center_id;
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
                // Fetch all active shifts for this center/date with ANY overlap against requested window
                const shifts = await WorkShift.find({
                    center_id: centerId,
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

                // Generate slots across requested window; capacity is sum across shifts that fully cover the slot interval
                for (let current = startTotal; current + duration <= endTotal; current += duration) {
                    const slotStart = current;
                    const slotEnd = current + duration;
                    // Compute capacity as sum of capacities of overlapping shifts that contain the entire slot
                    let capacityForSlot = 0;
                    for (const w of overlapping) {
                        if (w.start <= slotStart && w.end >= slotEnd) {
                            capacityForSlot += capacityByShift.get(String(w.id)) || 0;
                        }
                    }
                    if (capacityForSlot <= 0) continue; // no technicians cover this slot interval

                    const slotStartHour = Math.floor(slotStart / 60);
                    const slotStartMinute = slotStart % 60;
                    const slotEndHour = Math.floor(slotEnd / 60);
                    const slotEndMinute = slotEnd % 60;

                    toCreate.push({
                        center_id: centerId as any,
                        start_time: `${String(slotStartHour).padStart(2, '0')}:${String(slotStartMinute).padStart(2, '0')}`,
                        end_time: `${String(slotEndHour).padStart(2, '0')}:${String(slotEndMinute).padStart(2, '0')}`,
                        slot_date: slotDate,
                        capacity: capacityForSlot,
                        booked_count: 0,
                        status: 'active'
                    });
                }
            }
        }

        if (toCreate.length === 0) {
            return { created: 0, skipped: 0, slots: [], errors };
        }

        // Fetch existing slots that would conflict (same center & slot_date & start_time)
        const minDate = toCreate.reduce((min, s) => !min || (s.slot_date! < min) ? s.slot_date! as Date : min as Date, toCreate[0].slot_date! as Date);
        const maxDate = toCreate.reduce((max, s) => !max || (s.slot_date! > max) ? s.slot_date! as Date : max as Date, toCreate[0].slot_date! as Date);
        const existing = await Slot.find({
            center_id: { $in: centerIds },
            slot_date: { $gte: minDate, $lte: maxDate }
        }).select('center_id slot_date start_time').lean();
        const existingKey = new Set(existing.map(e => `${e.center_id.toString()}|${new Date(e.slot_date as any).toISOString().slice(0, 10)}|${(e as any).start_time}`));

        const createBatch = toCreate.filter(s => !existingKey.has(`${(s.center_id as any).toString()}|${(s.slot_date as Date).toISOString().slice(0, 10)}|${s.start_time}`));

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
}

export default new SlotService();