import { Schema, model, Types } from 'mongoose';

const WorkShiftSchema = new Schema({
    shift_id: { type: String, required: true, unique: true },
    shift_date: { type: Date, required: true },
    start_time: { type: String, required: true },
    end_time: { type: String, required: true },
    status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' },
    center_id: { type: String, required: true },
});

export const WorkShift = model('WorkShift', WorkShiftSchema);
