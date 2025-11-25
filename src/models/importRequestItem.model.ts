import mongoose, { Schema, Document } from 'mongoose';

export interface IImportRequestItemDocument extends Document {
    request_id: mongoose.Types.ObjectId;
    part_id: mongoose.Types.ObjectId;
    quantity_needed: number;
    createdAt: Date;
    updatedAt: Date;
}

const ImportRequestItemSchema: Schema = new Schema(
    {
        request_id: {
            type: Schema.Types.ObjectId,
            ref: 'ImportRequest',
            required: [true, 'ImportRequest reference is required']
        },
        part_id: {
            type: Schema.Types.ObjectId,
            ref: 'AutoPart',
            required: [true, 'AutoPart reference is required']
        },
        quantity_needed: {
            type: Number,
            required: [true, 'Quantity needed is required'],
            min: [1, 'Quantity needed must be at least 1']
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.model<IImportRequestItemDocument>('ImportRequestItem', ImportRequestItemSchema);
