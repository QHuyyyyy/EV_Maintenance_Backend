import mongoose, { Schema, Document } from 'mongoose';

export interface IImportRequestDocument extends Document {
    center_id: mongoose.Types.ObjectId;
    staff_id: mongoose.Types.ObjectId;
    source_type?: 'SUPPLIER' | 'INTERNAL_CENTER';
    source_center_id?: mongoose.Types.ObjectId;
    status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'COMPLETED' | 'CANCELLED';
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}

const ImportRequestSchema: Schema = new Schema(
    {
        center_id: {
            type: Schema.Types.ObjectId,
            ref: 'Center',
            required: [true, 'Center reference is required']
        },
        staff_id: {
            type: Schema.Types.ObjectId,
            ref: 'SystemUser',
            required: [true, 'Staff reference is required']
        },
        source_type: {
            type: String,
            enum: ['SUPPLIER', 'INTERNAL_CENTER'],
            default: null
        },
        source_center_id: {
            type: Schema.Types.ObjectId,
            ref: 'Center',
            default: null
        },
        status: {
            type: String,
            enum: ['DRAFT', 'PENDING', 'APPROVED', 'COMPLETED', 'CANCELLED'],
            default: 'DRAFT'
        },
        description: {
            type: String,
            default: ''
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.model<IImportRequestDocument>('ImportRequest', ImportRequestSchema);
