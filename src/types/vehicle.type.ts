export interface IVehicle {
    _id?: string;
    vehicleId: string;
    customerId: string;
    vehicleName: string;
    model: string;
    VIN: string;
    price?: number;
    batteryCapacity?: number;
    manufacturingYear?: number;
    lastServiceDate?: Date;
    nextServiceDue?: Date;
    warrantyExpiry?: Date;
    isActive?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface CreateVehicleRequest {
    vehicleId: string;
    customerId: string;
    vehicleName: string;
    model: string;
    VIN: string;
    price?: number;
    batteryCapacity?: number;
    manufacturingYear?: number;
    lastServiceDate?: Date;
    nextServiceDue?: Date;
    warrantyExpiry?: Date;
}

export interface UpdateVehicleRequest {
    vehicleName?: string;
    model?: string;
    price?: number;
    batteryCapacity?: number;
    manufacturingYear?: number;
    lastServiceDate?: Date;
    nextServiceDue?: Date;
    warrantyExpiry?: Date;
    isActive?: boolean;
}