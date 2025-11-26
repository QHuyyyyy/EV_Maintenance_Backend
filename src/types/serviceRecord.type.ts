import mongoose from 'mongoose';

export interface IServiceRecord {
    _id: string;
    appointment_id: mongoose.Types.ObjectId | string;
    technician_id: string;
    start_time?: Date | null;
    end_time?: Date | null;
    description?: string;
    status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
    defects_finished?: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateServiceRecordRequest {
    appointment_id: string;
    technician_id: string;
    start_time?: Date | null;
    end_time?: Date | null;
    description?: string;
    status?: 'pending' | 'in-progress' | 'completed' | 'cancelled';
}

export interface UpdateServiceRecordRequest {
    appointment_id?: string;
    technician_id?: string;
    start_time?: Date;
    end_time?: Date;
    description?: string;
    status?: 'pending' | 'in-progress' | 'completed' | 'cancelled';
    defects_finished?: boolean;
}
