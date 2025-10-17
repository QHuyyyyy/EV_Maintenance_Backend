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
    customerId?: string | null; // Có thể null khi xe chưa có chủ
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
    customerId?: string | null; // Có thể null khi xe chưa có chủ
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
    customerId?: string | null; // Có thể null hoặc string
}