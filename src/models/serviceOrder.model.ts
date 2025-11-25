import mongoose, { Schema, Document } from 'mongoose';

export interface IServiceOrder extends Document {
    service_record_id: mongoose.Types.ObjectId;
    checklist_defect_id: mongoose.Types.ObjectId;
    part_id: mongoose.Types.ObjectId;
    quantity: number;
    stock_status: 'SUFFICIENT' | 'LACKING';
    createdAt: Date;
    updatedAt: Date;
}

const ServiceOrderSchema: Schema = new Schema(
    {
        service_record_id: {
            type: Schema.Types.ObjectId,
            ref: 'ServiceRecord',
            required: true
        },
        checklist_defect_id: {
            type: Schema.Types.ObjectId,
            ref: 'ChecklistDefect',
            required: true
        },
        part_id: {
            type: Schema.Types.ObjectId,
            ref: 'AutoPart',
            required: true
        },
        quantity: {
            type: Number,
            min: 1,
            required: true
        },
        stock_status: {
            type: String,
            enum: ['SUFFICIENT', 'LACKING'],
            default: 'SUFFICIENT'
        }
    },
    {
        timestamps: true
    }
);

// Indexes for efficient querying
ServiceOrderSchema.index({ service_record_id: 1 });
ServiceOrderSchema.index({ checklist_defect_id: 1 });
ServiceOrderSchema.index({ stock_status: 1 });

export default mongoose.model<IServiceOrder>('ServiceOrder', ServiceOrderSchema);
