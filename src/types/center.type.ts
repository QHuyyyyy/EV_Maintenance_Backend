export interface ICenter {
    _id?: string;
    center_id: string;
    name: string;
    address: string;
    phone: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface CreateCenterRequest {
    name: string;
    address: string;
    phone: string;
}

export interface UpdateCenterRequest {
    name?: string;
    address?: string;
    phone?: string;
}
