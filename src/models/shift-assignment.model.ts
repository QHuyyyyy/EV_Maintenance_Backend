import { Schema, model, Document, Types } from 'mongoose';

export interface IShiftAssignment extends Document {
    system_user_id: Types.ObjectId;
    workshift_id: Types.ObjectId;
}

const ShiftAssignmentSchema = new Schema<IShiftAssignment>({
    system_user_id: { type: Schema.Types.ObjectId, ref: 'SystemUser', required: true, index: true },
    workshift_id: { type: Schema.Types.ObjectId, ref: 'WorkShift', required: true, index: true },
});

// Prevent duplicate assignments for the same user and workshift
ShiftAssignmentSchema.index({ system_user_id: 1, workshift_id: 1 });

export const ShiftAssignment = model<IShiftAssignment>('ShiftAssignment', ShiftAssignmentSchema);
