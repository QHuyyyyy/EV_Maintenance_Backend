import mongoose from 'mongoose';


export interface IPayment {
    _id: string;
    service_record_id?: mongoose.Types.ObjectId | string;
    subscription_id?: mongoose.Types.ObjectId | string;
    customer_id: mongoose.Types.ObjectId | string;
    order_code: number;
    amount: number;
    description: string;
    payment_type: 'service_record' | 'subscription';
    status: 'pending' | 'paid' | 'cancelled' | 'expired';
    payment_url?: string;
    transaction_id?: string;
    payment_method?: string;
    paid_at?: Date;
    createdAt: Date;
    updatedAt: Date;
}


export interface CreatePaymentRequest {
    service_record_id?: string;  // Optional - for service record payments
    subscription_id?: string;  // Optional - for subscription payments
    customer_id: string;
    amount: number;
    description: string;
    payment_type: 'service_record' | 'subscription';
}

export interface PaymentWebhookData {
    order_code: number;
    amount: number;
    description: string;
    transaction_id?: string;
    payment_method?: string;
    status: string;
}
