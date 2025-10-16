export interface IVehicleSubscription {
    _id?: string;
    vehicleId: string;
    package_id: string;
    start_date: Date;
    end_date: Date;
    status: "ACTIVE" | "EXPIRED" | "PENDING";
    createdAt?: Date;
    updatedAt?: Date;
}

export interface CreateVehicleSubscriptionInput {
    vehicleId: string;
    package_id: string;
    start_date: Date;
    end_date: Date;
    status?: "ACTIVE" | "EXPIRED" | "PENDING";
}

export interface UpdateVehicleSubscriptionInput {
    vehicleId?: string;
    package_id?: string;
    start_date?: Date;
    end_date?: Date;
    status?: "ACTIVE" | "EXPIRED" | "PENDING";
}