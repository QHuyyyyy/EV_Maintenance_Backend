import mongoose from 'mongoose';

export interface IServiceChecklist {
    _id: string;
    name: string;
    order?: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateServiceChecklistRequest {
    name: string;
    order?: number;
}

export interface UpdateServiceChecklistRequest {
    name?: string;
    order?: number;
}
