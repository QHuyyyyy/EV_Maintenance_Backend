import mongoose, { Schema, Document } from 'mongoose';

export interface IPartWarrantyDocument extends Document {
    detail_id: mongoose.Types.ObjectId;        // ServiceDetail gốc (linh kiện được bán lần đầu)
    centerpart_id: mongoose.Types.ObjectId;    // CenterAutoPart
    part_id: mongoose.Types.ObjectId;          // AutoPart gốc (phi chuẩn hóa - để tìm kiếm nhanh)
    vehicle_id: mongoose.Types.ObjectId;       // Vehicle (phi chuẩn hóa - để tìm kiếm nhanh)
    start_date: Date;                           // Ngày bắt đầu bảo hành
    end_date: Date;                             // Ngày hết hạn bảo hành
    warranty_status: 'active' | 'expired';     // Trạng thái bảo hành
    createdAt: Date;
    updatedAt: Date;
}

const PartWarrantySchema: Schema = new Schema(
    {
        detail_id: {
            type: Schema.Types.ObjectId,
            ref: 'ServiceDetail',
            required: [true, 'Detail reference is required']
        },
        centerpart_id: {
            type: Schema.Types.ObjectId,
            ref: 'CenterAutoPart',
            required: [true, 'Center part reference is required']
        },
        part_id: {
            type: Schema.Types.ObjectId,
            ref: 'AutoPart',
            required: [true, 'Part reference is required (denormalized)'],
            index: true // Index để tìm kiếm nhanh
        },
        vehicle_id: {
            type: Schema.Types.ObjectId,
            ref: 'Vehicle',
            required: [true, 'Vehicle reference is required (denormalized)'],
            index: true // Index để tìm kiếm nhanh
        },
        start_date: {
            type: Date,
            required: [true, 'Start date is required']
        },
        end_date: {
            type: Date,
            required: [true, 'End date is required']
        },
        warranty_status: {
            type: String,
            enum: ['active', 'expired'],
            default: 'active'
        }
    },
    {
        timestamps: true,
    }
);

export default mongoose.model<IPartWarrantyDocument>('PartWarranty', PartWarrantySchema);
