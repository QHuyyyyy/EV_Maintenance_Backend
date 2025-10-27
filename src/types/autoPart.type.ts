export interface IAutoPart {
    _id: string;
    name: string;
    cost_price: number;
    selling_price: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateAutoPartRequest {
    name: string;
    cost_price: number;
    selling_price: number;
    // Inventory fields moved to CenterAutoPart
}

export interface UpdateAutoPartRequest {
    name?: string;
    cost_price?: number;
    selling_price?: number;
    // Inventory fields moved to CenterAutoPart
}