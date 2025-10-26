import mongoose from 'mongoose';

export interface IPayment {
    _id: string;
    appointment_id: mongoose.Types.ObjectId | string;
    customer_id: mongoose.Types.ObjectId | string;
    order_code: number;
    amount: number;
    description: string;
    status: 'pending' | 'paid' | 'cancelled' | 'expired';
    payment_url?: string;
    transaction_id?: string;
    payment_method?: string;
    paid_at?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreatePaymentRequest {
    appointment_id: string;
    customer_id: string;
    amount: number;
    description: string;
}

export interface PaymentWebhookData {
    order_code: number;
    amount: number;
    description: string;
    transaction_id?: string;
    payment_method?: string;
    status: string;
}
