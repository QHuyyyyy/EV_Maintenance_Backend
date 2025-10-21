import mongoose from 'mongoose';

export interface IAppointment {
    _id: string;
    appointment_id: string;
    staffId: string;
    customer_id: mongoose.Types.ObjectId | string;
    vehicle_id: mongoose.Types.ObjectId | string;
    center_id: mongoose.Types.ObjectId | string;
    startTime: Date;
    endTime: Date;
    status: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateAppointmentRequest {
    staffId: string;
    customer_id: string;
    vehicle_id: string;
    center_id: string;
    startTime: Date;
    endTime: Date;
    status?: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
}

export interface UpdateAppointmentRequest {
    staffId?: string;
    customer_id?: string;
    vehicle_id?: string;
    center_id?: string;
    startTime?: Date;
    endTime?: Date;
    status?: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
}
