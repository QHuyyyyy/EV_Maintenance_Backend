export interface IInvoice {
    _id: string;
    payment_id: string;
    invoiceType: string;
    minusAmount: number;
    totalAmount: number;
    status: 'pending' | 'issued' | 'cancelled';
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateInvoiceRequest {
    payment_id: string;
    invoiceType: string;
    minusAmount?: number;
    totalAmount: number;
}

export interface UpdateInvoiceRequest {
    status?: 'pending' | 'issued' | 'cancelled';
    minusAmount?: number;
    totalAmount?: number;
}
