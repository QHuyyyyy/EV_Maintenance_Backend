export interface IServicePackage {
    _id?: string;
    name: string;
    description: string;
    price: number;
    duration: number; // Duration in days
    km_interval: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface CreateServicePackageInput {
    name: string;
    description: string;
    price: number;
    duration: number;
    km_interval: number;
}

export interface UpdateServicePackageInput {
    name?: string;
    description?: string;
    price?: number;
    duration?: number;
    km_interval?: number;
}