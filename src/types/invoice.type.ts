export interface IInvoice {
    _id: string;
    payment_id: string;
    invoiceType: string;
    minusAmount: number;
    totalAmount: number;
    payment_method: string;
    transaction_code: string;
    status: 'pending' | 'issued' | 'cancelled';
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateInvoiceRequest {
    payment_id: string;
    invoiceType: string;
    minusAmount?: number;
    totalAmount: number;
    payment_method?: string; // Optional, will use from payment if not provided
    // transaction_code is auto-populated from payment
}

export interface UpdateInvoiceRequest {
    status?: 'pending' | 'issued' | 'cancelled';
    minusAmount?: number;
    totalAmount?: number;
}
