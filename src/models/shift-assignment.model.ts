import { Schema, model, Document, Types, model as mongooseModel } from 'mongoose';
import Slot from './slot.model';
export interface IShiftAssignment extends Document {
    system_user_id: Types.ObjectId;
    workshift_id: Types.ObjectId;
}


const ShiftAssignmentSchema = new Schema<IShiftAssignment>({
    system_user_id: { type: Schema.Types.ObjectId, ref: 'SystemUser', required: true, index: true },
    workshift_id: { type: Schema.Types.ObjectId, ref: 'WorkShift', required: true, index: true },
});

ShiftAssignmentSchema.index({ system_user_id: 1, workshift_id: 1 });

async function syncSlotCapacity(workshiftId: Types.ObjectId | string) {
    if (!workshiftId) return;
    try {
        const ShiftAssignmentModel = mongooseModel('ShiftAssignment');
        const wid = typeof workshiftId === 'string' ? new Types.ObjectId(workshiftId) : workshiftId;

        // Count only assignments whose linked User has role TECHNICIAN
        const technicianCountAgg = await ShiftAssignmentModel.aggregate([
            { $match: { workshift_id: wid } },
            {
                $lookup: {
                    from: 'systemusers',
                    localField: 'system_user_id',
                    foreignField: '_id',
                    as: 'su'
                }
            },
            { $unwind: '$su' },
            {
                $lookup: {
                    from: 'users',
                    localField: 'su.userId',
                    foreignField: '_id',
                    as: 'u'
                }
            },
            { $unwind: '$u' },
            { $match: { 'u.role': 'TECHNICIAN' } },
            { $count: 'cnt' }
        ]);
        const newCapacity = technicianCountAgg[0]?.cnt || 0;

        const filter: any = { workshift_id: wid };
        await Slot.updateMany(filter, { $set: { capacity: newCapacity } });
        await Slot.updateMany({ ...filter, $expr: { $gte: ['$booked_count', newCapacity] } }, { $set: { status: 'full' } });
        await Slot.updateMany({ ...filter, $expr: { $lt: ['$booked_count', newCapacity] }, capacity: { $gt: 0 } }, { $set: { status: 'active' } });
        await Slot.updateMany({ ...filter, capacity: 0 }, { $set: { status: 'inactive' } });
    } catch (err) {
        console.error('Failed to sync slot capacity for', workshiftId, err);
    }
}

ShiftAssignmentSchema.post('save', async function (doc: any) {
    await syncSlotCapacity(doc.workshift_id);
});

ShiftAssignmentSchema.post('findOneAndDelete', async function (doc: any) {
    if (doc) await syncSlotCapacity(doc.workshift_id);
});

export const ShiftAssignment = model<IShiftAssignment>('ShiftAssignment', ShiftAssignmentSchema);
