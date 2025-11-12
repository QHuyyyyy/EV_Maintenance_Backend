import mongoose, { Schema, Document } from 'mongoose';

export interface IServiceDetailDocument extends Document {
    record_id: mongoose.Types.ObjectId;
    centerpart_id: mongoose.Types.ObjectId;
    description?: string;
    quantity: number;
    unit_price: number;
    // Số lượng miễn phí do bảo hành áp dụng (0đ)
    warranty_qty?: number;
    // Số lượng phải trả tiền (đã tính tiền)
    paid_qty?: number;
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
        centerpart_id: {
            type: Schema.Types.ObjectId,
            ref: 'CenterAutoPart',
            required: [true, 'Center part reference is required']
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
        },
        warranty_qty: {
            type: Number,
            default: 0,
            min: [0, 'Warranty quantity cannot be negative']
        },
        paid_qty: {
            type: Number,
            default: 0,
            min: [0, 'Paid quantity cannot be negative']
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.model<IServiceDetailDocument>('ServiceDetail', ServiceDetailSchema);
