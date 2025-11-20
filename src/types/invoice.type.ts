export type InvoiceType = 'Subscription Package' | 'Service Completion';

export interface IInvoice {
    _id: string;
    payment_id: string;
    invoiceType: InvoiceType;
    totalAmount: number;
    status: 'pending' | 'issued' | 'cancelled';
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateInvoiceRequest {
    payment_id: string;
    invoiceType: InvoiceType;
    totalAmount: number;
}

export interface UpdateInvoiceRequest {
    status?: 'pending' | 'issued' | 'cancelled';
    invoiceType?: InvoiceType;
    totalAmount?: number;
}
