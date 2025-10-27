
export interface Certificate {
    name?: string;
    issuingOrganization?: string;
    issueDate?: Date;
    expirationDate?: Date;
    credentialUrl?: string;
}

export interface ISystemUser {
    _id?: string;
    userId: string | {
        email?: string;
        phone?: string;
        role?: string;
    };
    name?: string;
    dateOfBirth?: Date;
    centerId?: string;
    certificates?: Certificate[];
    createdAt?: Date;
    updatedAt?: Date;
}


export interface CreateSystemUserRequest {
    userId: string;
    name?: string;
    dateOfBirth?: Date;
    centerId?: string;
    certificates?: Certificate[];
}


export interface UpdateSystemUserRequest {
    name?: string;
    dateOfBirth?: Date;
    centerId?: string;
    certificates?: Certificate[];
}