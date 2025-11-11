import mongoose, { Schema, Document } from 'mongoose';

export interface IAutoPartDocument extends Document {
    name: string;
    cost_price: number;
    selling_price: number;
    warranty_time?: number; // in months
    image?: string;
    createdAt: Date;
    updatedAt: Date;
}

const AutoPartSchema: Schema = new Schema(
    {
        name: {
            type: String,
            required: [true, 'Part name is required']
        },
        cost_price: {
            type: Number,
            required: [true, 'Cost price is required']
        },
        selling_price: {
            type: Number,
            required: [true, 'Selling price is required']
        },
        warranty_time: {
            type: Number,
            default: 0, //date
            min: [0, 'Warranty time cannot be negative']
        },
        image: {
            type: String,
        },
        // Inventory-specific fields have been moved to CenterAutoPart
    },
    {
        timestamps: true
    }
);

export default mongoose.model<IAutoPartDocument>('AutoPart', AutoPartSchema);
