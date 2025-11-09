import { Schema, model } from 'mongoose';

const WorkShiftSchema = new Schema({
    shift_date: { type: Date, required: true },
    start_time: { type: String, required: true },
    end_time: { type: String, required: true },
    status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' },
    center_id: { type: String, required: true },
});

// Helpful indexes for lookups
WorkShiftSchema.index({ center_id: 1, shift_date: 1 });
// Prevent duplicate identical time range shifts per center & date
WorkShiftSchema.index({ center_id: 1, shift_date: 1, start_time: 1, end_time: 1 });

export const WorkShift = model('WorkShift', WorkShiftSchema);
