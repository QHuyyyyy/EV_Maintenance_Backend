import mongoose, { Schema, Document } from 'mongoose';

export interface IServiceRecord extends Document {
    record_id: string;
    appointment_id: mongoose.Types.ObjectId;
    technician_id: string;
    start_time: Date;
    end_time: Date;
    description: string;
    status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
    createdAt: Date;
    updatedAt: Date;
}

const ServiceRecordSchema: Schema = new Schema(
    {
        record_id: {
            type: String,
            required: true,
            unique: true,
            default: () => 'REC' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase()
        },
        appointment_id: {
            type: Schema.Types.ObjectId,
            ref: 'Appointment',
            required: true
        },
        technician_id: {
            type: String,
            required: true
        },
        start_time: {
            type: Date,
            required: true
        },
        end_time: {
            type: Date,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'in-progress', 'completed', 'cancelled'],
            default: 'pending'
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.model<IServiceRecord>('ServiceRecord', ServiceRecordSchema);
