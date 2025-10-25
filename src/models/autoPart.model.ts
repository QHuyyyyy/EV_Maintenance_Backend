import mongoose, { Schema, Document } from 'mongoose';

export interface IAutoPartDocument extends Document {
    name: string;
    quantity: number;
    cost_price: number;
    selling_price: number;
    min_stock: number;
    recommended_min_stock: number;
    last_forecast_date?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const AutoPartSchema: Schema = new Schema(
    {
        name: {
            type: String,
            required: [true, 'Part name is required']
        },
        quantity: {
            type: Number,
            default: 0
        },
        cost_price: {
            type: Number,
            required: [true, 'Cost price is required']
        },
        selling_price: {
            type: Number,
            required: [true, 'Selling price is required']
        },
        min_stock: {
            type: Number,
            default: 0
        },
        recommended_min_stock: {
            type: Number,
            default: 0
        },
        last_forecast_date: {
            type: Date
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.model<IAutoPartDocument>('AutoPart', AutoPartSchema);
