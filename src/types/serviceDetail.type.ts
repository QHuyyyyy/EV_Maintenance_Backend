import mongoose from 'mongoose';

export interface IServiceDetail {
    _id: string;
    record_id: mongoose.Types.ObjectId | string;
    part_id: mongoose.Types.ObjectId | string;
    description?: string;
    quantity: number;
    unit_price: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateServiceDetailRequest {
    record_id: string;
    part_id: string;
    description?: string;
    quantity: number;
    unit_price: number;
}

export interface UpdateServiceDetailRequest {
    record_id?: string;
    part_id?: string;
    description?: string;
    quantity?: number;
    unit_price?: number;
}