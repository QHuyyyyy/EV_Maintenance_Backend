import mongoose from 'mongoose';

export interface IServiceChecklist {
    _id: string;
    record_id: mongoose.Types.ObjectId | string;
    name: string;
    status: 'pending' | 'completed' | 'skipped';
    note: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateServiceChecklistRequest {
    record_id: string;
    name: string;
    status?: 'pending' | 'completed' | 'skipped';
    note?: string;
}

export interface UpdateServiceChecklistRequest {
    record_id?: string;
    name?: string;
    status?: 'pending' | 'completed' | 'skipped';
    note?: string;
}
