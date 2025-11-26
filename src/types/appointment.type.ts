import mongoose from 'mongoose';

export interface IAppointment {
    _id: string;
    staffId: string | null;
    customer_id: mongoose.Types.ObjectId | string;
    vehicle_id: mongoose.Types.ObjectId | string;
    center_id: mongoose.Types.ObjectId | string;
    slot_id: mongoose.Types.ObjectId | string; // reference to Slot
    status: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'waiting-for-parts';
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateAppointmentRequest {
    staffId?: string | null;
    customer_id: string;
    vehicle_id: string;
    center_id: string;
    slot_id: string; // required for creating appointment
    status?: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'waiting-for-parts';
}

export interface UpdateAppointmentRequest {
    staffId?: string | null;
    customer_id?: string;
    vehicle_id?: string;
    center_id?: string;
    slot_id?: string; // allow moving to another slot (capacity check needed)
    status?: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'waiting-for-parts';
}
