import mongoose, { Schema, Document } from 'mongoose';

export interface IAppointment extends Document {
    appointment_id: string;
    staffId: string;
    customer_id: mongoose.Types.ObjectId;
    vehicle_id: mongoose.Types.ObjectId;
    center_id: mongoose.Types.ObjectId;
    startTime: Date;
    endTime: Date;
    status: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
    createdAt: Date;
    updatedAt: Date;
}

const AppointmentSchema: Schema = new Schema(
    {
        appointment_id: {
            type: String,
            required: true,
            unique: true,
            default: () => 'APT' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase()
        },
        staffId: {
            type: String,
            required: true
        },
        customer_id: {
            type: Schema.Types.ObjectId,
            ref: 'Customer',
            required: true
        },
        vehicle_id: {
            type: Schema.Types.ObjectId,
            ref: 'Vehicle',
            required: true
        },
        center_id: {
            type: Schema.Types.ObjectId,
            ref: 'Center',
            required: true
        },
        startTime: {
            type: Date,
            required: true
        },
        endTime: {
            type: Date,
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'],
            default: 'pending'
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.model<IAppointment>('Appointment', AppointmentSchema);
