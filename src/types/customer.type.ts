export interface ICustomer {
    _id?: string;
    userId: string;
    customerName?: string;
    dateOfBirth?: Date;
    address?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface CreateCustomerRequest {
    userId: string;
    customerName?: string;
    dateOfBirth?: Date;
    address?: string;
}

export interface UpdateCustomerRequest {
    customerName?: string;
    dateOfBirth?: Date;
    address?: string;
}