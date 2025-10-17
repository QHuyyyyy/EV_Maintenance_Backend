export interface ISystemUser {
    _id?: string;
    userId: string | {
        email?: string;
        phone?: string;
        role?: string;
    };
    name?: string;
    dateOfBirth?: Date;
    certification?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface CreateSystemUserRequest {
    userId: string;
    name?: string;
    dateOfBirth?: Date;
    certification?: string;
}

export interface UpdateSystemUserRequest {
    name?: string;
    dateOfBirth?: Date;
    certification?: string;
}