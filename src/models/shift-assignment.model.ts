import { Schema, model, Document } from 'mongoose';

export interface IShiftAssignment extends Document {
    system_user_id: string;
    shift_id: string;
}

const ShiftAssignmentSchema = new Schema<IShiftAssignment>({
    system_user_id: { type: String, required: true },
    shift_id: { type: String, required: true },
});

export const ShiftAssignment = model<IShiftAssignment>('ShiftAssignment', ShiftAssignmentSchema);
