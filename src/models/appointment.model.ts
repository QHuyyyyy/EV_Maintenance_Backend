import mongoose, { Schema, Document } from 'mongoose';

export interface IAppointment extends Document {
    staffId: mongoose.Types.ObjectId | null;
    customer_id: mongoose.Types.ObjectId;
    vehicle_id: mongoose.Types.ObjectId;
    center_id: mongoose.Types.ObjectId;
    slot_id: mongoose.Types.ObjectId; // reference to Slot instead of raw start/end time
    status: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
    createdAt: Date;
    updatedAt: Date;
}

const AppointmentSchema: Schema = new Schema(
    {
        staffId: {
            type: Schema.Types.ObjectId,
            ref: 'SystemUser',
            required: false,
            default: null
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
        slot_id: {
            type: Schema.Types.ObjectId,
            ref: 'Slot',
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
