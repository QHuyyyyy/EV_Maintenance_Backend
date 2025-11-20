export type InvoiceType = 'Subscription Package' | 'Service Completion';

export interface IInvoice {
    _id: string;
    payment_id: string;
    invoiceType: InvoiceType;
    minusAmount: number; // Discount percentage from package (0-100)
    totalAmount: number;
    status: 'pending' | 'issued' | 'cancelled';
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateInvoiceRequest {
    payment_id: string;
    invoiceType: InvoiceType;
    minusAmount?: number; // Optional: discount percentage (0-100), will be calculated if not provided
    totalAmount: number;
}

export interface UpdateInvoiceRequest {
    status?: 'pending' | 'issued' | 'cancelled';
    invoiceType?: InvoiceType;
    minusAmount?: number; // Discount percentage (0-100)
    totalAmount?: number;
}
