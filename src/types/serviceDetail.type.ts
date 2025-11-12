import mongoose from 'mongoose';

export interface IServiceDetail {
    _id: string;
    record_id: mongoose.Types.ObjectId | string;
    centerpart_id: mongoose.Types.ObjectId | string;
    description?: string;
    quantity: number;
    unit_price: number;
    warranty_qty?: number;
    paid_qty?: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateServiceDetailRequest {
    record_id: string;
    centerpart_id: string;
    description?: string;
    quantity: number;
    unit_price?: number;
    warranty_qty?: number;
    paid_qty?: number;
}

export interface UpdateServiceDetailRequest {
    record_id?: string;
    centerpart_id?: string;
    description?: string;
    quantity?: number;
    unit_price?: number;
    warranty_qty?: number;
    paid_qty?: number;
}