import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
    appointment_id: mongoose.Types.ObjectId;
    customer_id: mongoose.Types.ObjectId;
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

const PaymentSchema: Schema = new Schema(
    {
        appointment_id: {
            type: Schema.Types.ObjectId,
            ref: 'Appointment',
            required: true
        },
        customer_id: {
            type: Schema.Types.ObjectId,
            ref: 'Customer',
            required: true
        },
        order_code: {
            type: Number,
            required: true,
            unique: true
        },
        amount: {
            type: Number,
            required: true,
            min: 0
        },
        description: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'paid', 'cancelled', 'expired'],
            default: 'pending'
        },
        payment_url: {
            type: String
        },
        transaction_id: {
            type: String
        },
        payment_method: {
            type: String
        },
        paid_at: {
            type: Date
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.model<IPayment>('Payment', PaymentSchema);
