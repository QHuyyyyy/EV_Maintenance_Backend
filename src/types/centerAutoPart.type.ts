import mongoose from 'mongoose';

export interface ICenterAutoPart {
    _id: string;
    center_id: mongoose.Types.ObjectId | string;
    part_id: mongoose.Types.ObjectId | string;
    quantity: number;
    min_stock: number;
    recommended_min_stock: number;
    last_forecast_date?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateCenterAutoPartRequest {
    center_id: string;
    part_id: string;
    quantity?: number;
    min_stock?: number;
    recommended_min_stock?: number;
    last_forecast_date?: Date;
}

export interface UpdateCenterAutoPartRequest {
    center_id?: string;
    part_id?: string;
    quantity?: number;
    min_stock?: number;
    recommended_min_stock?: number;
    last_forecast_date?: Date | null;
}
