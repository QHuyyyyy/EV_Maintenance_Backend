import mongoose, { Schema, Document } from 'mongoose';

export interface ICenterAutoPartDocument extends Document {
    center_id: mongoose.Types.ObjectId;
    part_id: mongoose.Types.ObjectId;
    quantity: number;
    min_stock: number;
    recommended_min_stock: number;
    last_forecast_date?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const CenterAutoPartSchema: Schema = new Schema(
    {
        center_id: {
            type: Schema.Types.ObjectId,
            ref: 'Center',
            required: [true, 'Center reference is required']
        },
        part_id: {
            type: Schema.Types.ObjectId,
            ref: 'AutoPart',
            required: [true, 'Part reference is required']
        },
        quantity: {
            type: Number,
            default: 0,
            min: [0, 'Quantity cannot be negative']
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
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.model<ICenterAutoPartDocument>('CenterAutoPart', CenterAutoPartSchema);
