import mongoose, { Schema, Document } from 'mongoose';

export interface IInvoice extends Document {
    payment_id: mongoose.Types.ObjectId;
    invoiceType: string;
    minusAmount: number;
    totalAmount: number;
    payment_method: string;
    transaction_code: string;
    status: 'pending' | 'issued' | 'cancelled';
    createdAt: Date;
    updatedAt: Date;
}

const invoiceSchema = new Schema<IInvoice>(
    {
        payment_id: {
            type: Schema.Types.ObjectId,
            ref: 'Payment',
            required: true
        },
        invoiceType: {
            type: String,
            required: true
        },
        minusAmount: {
            type: Number,
            required: true,
            default: 0
        },
        totalAmount: {
            type: Number,
            required: true
        },
        payment_method: {
            type: String,
            required: true
        },
        transaction_code: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'issued', 'cancelled'],
            default: 'pending'
        }
    },
    {
        timestamps: true
    }
);

const Invoice = mongoose.model<IInvoice>('Invoice', invoiceSchema);

export default Invoice;
