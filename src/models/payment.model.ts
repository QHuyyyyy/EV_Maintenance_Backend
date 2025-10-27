
import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
    service_record_id?: mongoose.Types.ObjectId;  // For completed service payments
    subscription_id?: mongoose.Types.ObjectId;  // For subscription/package payments
    customer_id: mongoose.Types.ObjectId;
    order_code: number;
    amount: number;
    description: string;
    payment_type: 'service_record' | 'subscription';  // Track which type of payment
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
        service_record_id: {
            type: Schema.Types.ObjectId,
            ref: 'ServiceRecord',
            required: false  // Optional - only for service record payments
        },
        subscription_id: {
            type: Schema.Types.ObjectId,
            ref: 'VehicleSubscription',
            required: false  // Optional - only for subscription payments
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
        payment_type: {
            type: String,
            enum: ['service_record', 'subscription'],
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

// Validation: Must have exactly one of: service_record_id or subscription_id
PaymentSchema.pre('save', function(next) {
    const hasServiceRecord = !!this.service_record_id;
    const hasSubscription = !!this.subscription_id;
    const count = [hasServiceRecord, hasSubscription].filter(Boolean).length;
    if (count === 0) {
        next(new Error('Payment must have either service_record_id or subscription_id'));
    } else if (count > 1) {
        next(new Error('Payment cannot have both service_record_id and subscription_id'));
    } else {
        next();
    }
});

export default mongoose.model<IPayment>('Payment', PaymentSchema);
