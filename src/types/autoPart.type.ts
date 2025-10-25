export interface IAutoPart {
    _id: string;
    name: string;
    quantity: number;
    cost_price: number;
    selling_price: number;
    min_stock: number;
    recommended_min_stock: number;
    last_forecast_date?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateAutoPartRequest {
    name: string;
    quantity?: number;
    cost_price: number;
    selling_price: number;
    min_stock?: number;
    recommended_min_stock?: number;
    last_forecast_date?: Date;
}

export interface UpdateAutoPartRequest {
    name?: string;
    quantity?: number;
    cost_price?: number;
    selling_price?: number;
    min_stock?: number;
    recommended_min_stock?: number;
    last_forecast_date?: Date | null;
}