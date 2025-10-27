import mongoose, { Schema, Document } from 'mongoose';

export interface IServiceRecord extends Document {
    appointment_id: mongoose.Types.ObjectId;
    technician_id: mongoose.Types.ObjectId;
    start_time: Date;
    end_time: Date;
    description: string;
    status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
    createdAt: Date;
    updatedAt: Date;
}

const ServiceRecordSchema: Schema = new Schema(
    {
        appointment_id: {
            type: Schema.Types.ObjectId,
            ref: 'Appointment',
            required: true
        },
        technician_id: {
            type: Schema.Types.ObjectId,
            ref: 'SystemUser',
            required: true
        },
        start_time: {
            type: Date,
            required: false,
            default: null
        },
        end_time: {
            type: Date,
            required: false,
            default: null
        },
        description: {
            type: String,
            required: false,
            default: ''
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
