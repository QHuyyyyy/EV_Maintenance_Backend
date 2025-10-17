export interface IVehicle {
    _id?: string;
    vehicleName: string;
    model?: string;
    year?: number;
    VIN?: string;
    price?: number;
    mileage?: number;
    plateNumber?: string;
    last_service_date?: Date;
    image?: string;
    customerId: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface CreateVehicleInput {
    vehicleName: string;
    model?: string;
    year?: number;
    VIN?: string;
    price?: number;
    mileage?: number;
    plateNumber?: string;
    last_service_date?: Date;
    image?: string;
    customerId: string;
}

export interface UpdateVehicleInput {
    vehicleName?: string;
    model?: string;
    year?: number;
    VIN?: string;
    price?: number;
    mileage?: number;
    plateNumber?: string;
    last_service_date?: Date;
    image?: string;
    customerId?: string;
}