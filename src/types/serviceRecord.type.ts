import mongoose from 'mongoose';

export interface IServiceRecord {
    _id: string;
    record_id: string;
    appointment_id: mongoose.Types.ObjectId | string;
    technician_id: string;
    start_time: Date;
    end_time: Date;
    description: string;
    status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
    mileage: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateServiceRecordRequest {
    appointment_id: string;
    technician_id: string;
    start_time: Date;
    end_time: Date;
    description: string;
    status?: 'pending' | 'in-progress' | 'completed' | 'cancelled';
    mileage: number;
}

export interface UpdateServiceRecordRequest {
    appointment_id?: string;
    technician_id?: string;
    start_time?: Date;
    end_time?: Date;
    description?: string;
    status?: 'pending' | 'in-progress' | 'completed' | 'cancelled';
    mileage?: number;
}
