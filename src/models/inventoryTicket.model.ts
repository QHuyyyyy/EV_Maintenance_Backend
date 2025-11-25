import mongoose, { Schema, Document } from 'mongoose';

export interface IInventoryTicketItem {
    part_id: mongoose.Types.ObjectId;
    quantity: number;
    notes?: string;
}

export interface IInventoryTicketDocument extends Document {
    center_id: mongoose.Types.ObjectId;
    ticket_number: string;
    ticket_type: 'IN' | 'OUT' | 'ADJUSTMENT';
    status: 'PENDING' | 'IN-PROGRESS' | 'COMPLETED';
    items: IInventoryTicketItem[];
    created_by: mongoose.Types.ObjectId;
    approved_by?: mongoose.Types.ObjectId;
    completed_date?: Date;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const InventoryTicketItemSchema: Schema = new Schema(
    {
        part_id: {
            type: Schema.Types.ObjectId,
            ref: 'AutoPart',
            required: [true, 'Part reference is required']
        },
        quantity: {
            type: Number,
            required: [true, 'Quantity is required'],
            min: [1, 'Quantity must be at least 1']
        },
        notes: {
            type: String,
            default: ''
        }
    },
    { _id: false }
);

const InventoryTicketSchema: Schema = new Schema(
    {
        center_id: {
            type: Schema.Types.ObjectId,
            ref: 'Center',
            required: [true, 'Center reference is required']
        },
        ticket_number: {
            type: String,
            required: [true, 'Ticket number is required'],
            unique: true
        },
        ticket_type: {
            type: String,
            enum: ['IN', 'OUT', 'ADJUSTMENT'],
            required: [true, 'Ticket type is required']
        },
        status: {
            type: String,
            enum: ['DRAFT', 'APPROVED', 'COMPLETED'],
            default: 'DRAFT'
        },
        items: [InventoryTicketItemSchema],
        created_by: {
            type: Schema.Types.ObjectId,
            ref: 'SystemUser',
            required: [true, 'Creator reference is required']
        },
        completed_date: {
            type: Date,
            default: null
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

export default mongoose.model<IInventoryTicketDocument>('InventoryTicket', InventoryTicketSchema);

