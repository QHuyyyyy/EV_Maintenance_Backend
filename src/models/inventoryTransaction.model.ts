import mongoose, { Schema, Document } from 'mongoose';

export interface IInventoryTransactionItem {
    part_id: mongoose.Types.ObjectId;
    quantity_change: number;
    notes?: string;
}

export interface IInventoryTransactionDocument extends Document {
    center_id: mongoose.Types.ObjectId;
    ticket_id: mongoose.Types.ObjectId;
    transaction_type: 'IN' | 'OUT' | 'ADJUSTMENT';
    reference_type?: 'IMPORT_REQUEST' | 'SERVICE_USAGE' | 'INTERNAL_TRANSFER' | 'ADJUSTMENT';
    reference_id?: string;
    items: IInventoryTransactionItem[];
    created_by: mongoose.Types.ObjectId;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const InventoryTransactionItemSchema: Schema = new Schema(
    {
        part_id: {
            type: Schema.Types.ObjectId,
            ref: 'AutoPart',
            required: [true, 'Part reference is required']
        },
        quantity_change: {
            type: Number,
            required: [true, 'Quantity change is required']
            // Có thể âm (xuất) hoặc dương (nhập)
        },
        notes: {
            type: String,
            default: ''
        }
    },
    { _id: false }
);

const InventoryTransactionSchema: Schema = new Schema(
    {
        center_id: {
            type: Schema.Types.ObjectId,
            ref: 'Center',
            required: [true, 'Center reference is required']
        },
        ticket_id: {
            type: Schema.Types.ObjectId,
            ref: 'InventoryTicket',
            required: [true, 'Ticket reference is required']
        },
        transaction_type: {
            type: String,
            enum: ['IN', 'OUT', 'ADJUSTMENT'],
            required: [true, 'Transaction type is required']
        },
        reference_type: {
            type: String,
            enum: ['IMPORT_REQUEST', 'SERVICE_USAGE', 'INTERNAL_TRANSFER', 'ADJUSTMENT'],
            default: null
        },
        reference_id: {
            type: String,
            default: null
        },
        items: [InventoryTransactionItemSchema],
        created_by: {
            type: Schema.Types.ObjectId,
            ref: 'SystemUser',
            required: [true, 'Creator reference is required']
        },
        notes: {
            type: String,
            default: ''
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.model<IInventoryTransactionDocument>('InventoryTransaction', InventoryTransactionSchema);

