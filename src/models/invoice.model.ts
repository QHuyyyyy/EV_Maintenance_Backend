import mongoose, { Schema, Document } from 'mongoose';

export type InvoiceType = 'Subscription Package' | 'Service Completion';

export interface IInvoice extends Document {
    payment_id: mongoose.Types.ObjectId;
    invoiceType: InvoiceType;
    totalAmount: number;
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
            enum: ['Subscription Package', 'Service Completion'],
            required: true
        },
        totalAmount: {
            type: Number,
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'issued', 'cancelled'],
            default: 'pending'
        }
    },
    {
        timestamps: true,
        strict: true // Ensure only defined fields are saved
    }
);

const Invoice = mongoose.model<IInvoice>('Invoice', invoiceSchema);

export default Invoice;
