export interface ISystemUser {
    _id?: string;
    userId: string;
    name?: string;
    dateOfBirth?: Date;
    certification?: string;
    phone?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface CreateSystemUserRequest {
    userId: string;
    name?: string;
    dateOfBirth?: Date;
    certification?: string;
    phone?: string;
}

export interface UpdateSystemUserRequest {
    name?: string;
    dateOfBirth?: Date;
    certification?: string;
    phone?: string;
}