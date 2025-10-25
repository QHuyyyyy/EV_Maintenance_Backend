import mongoose, { Schema, Document } from 'mongoose';

export interface IServiceDetailDocument extends Document {
    record_id: mongoose.Types.ObjectId;
    part_id: mongoose.Types.ObjectId;
    description?: string;
    quantity: number;
    unit_price: number;
    createdAt: Date;
    updatedAt: Date;
}

const ServiceDetailSchema: Schema = new Schema(
    {
        record_id: {
            type: Schema.Types.ObjectId,
            ref: 'ServiceRecord',
            required: [true, 'Record reference is required']
        },
        part_id: {
            type: Schema.Types.ObjectId,
            ref: 'AutoPart',
            required: [true, 'Part reference is required']
        },
        description: {
            type: String,
            default: ''
        },
        quantity: {
            type: Number,
            required: [true, 'Quantity is required'],
            min: [0, 'Quantity cannot be negative']
        },
        unit_price: {
            type: Number,
            required: [true, 'Unit price is required'],
            min: [0, 'Unit price cannot be negative']
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.model<IServiceDetailDocument>('ServiceDetail', ServiceDetailSchema);
