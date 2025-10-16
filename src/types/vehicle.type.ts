export interface IVehicle {
    _id?: string;
    vehicleName: string;
    model?: string;
    VIN?: string;
    price?: number;
    image?: string;
    customerId: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface CreateVehicleInput {
    vehicleName: string;
    model?: string;
    VIN?: string;
    price?: number;
    image?: string;
    customerId: string;
}

export interface UpdateVehicleInput {
    vehicleName?: string;
    model?: string;
    VIN?: string;
    price?: number;
    image?: string;
    customerId?: string;
}