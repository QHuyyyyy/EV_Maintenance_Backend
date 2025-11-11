export interface IAutoPart {
    _id: string;
    name: string;
    cost_price: number;
    selling_price: number;
    warranty_time?: number;
    image: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateAutoPartRequest {
    name: string;
    cost_price: number;
    selling_price: number;
    warranty_time?: number;
    image: string; // URL uploaded to Firebase Storage
    // Inventory fields moved to CenterAutoPart
}

export interface UpdateAutoPartRequest {
    name?: string;
    cost_price?: number;
    selling_price?: number;
    warranty_time?: number;
    image?: string; // URL uploaded to Firebase Storage
    // Inventory fields moved to CenterAutoPart
}