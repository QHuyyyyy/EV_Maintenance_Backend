import mongoose from 'mongoose';

export interface IServiceOrder {
    _id?: string;
    service_record_id: string | mongoose.Types.ObjectId;
    checklist_defect_id: string | mongoose.Types.ObjectId;
    part_id: string | mongoose.Types.ObjectId;
    quantity: number;
    stock_status: 'SUFFICIENT' | 'LACKING';
    createdAt?: Date;
    updatedAt?: Date;
}

export interface CreateServiceOrderRequest {
    service_record_id: string;
    checklist_defect_id: string;
    part_id: string;
    quantity: number;
}

export interface UpdateServiceOrderRequest {
    stock_status?: 'SUFFICIENT' | 'LACKING';
    quantity?: number;
}

export interface CreateMultipleServiceOrdersRequest {
    orders: CreateServiceOrderRequest[];
}

export interface ServiceOrderDTO extends IServiceOrder {
    _id: string;
    createdAt: Date;
    updatedAt: Date;
}
