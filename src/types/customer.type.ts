export interface ICustomer {
    _id?: string;
    userId: string;
    customerName?: string;
    dateOfBirth?: Date;
    phone?: string;
    address?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface CreateCustomerRequest {
    userId: string;
    customerName?: string;
    dateOfBirth?: Date;
    phone?: string;
    address?: string;
}

export interface UpdateCustomerRequest {
    customerName?: string;
    dateOfBirth?: Date;
    phone?: string;
    address?: string;
}