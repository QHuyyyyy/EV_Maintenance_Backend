import mongoose, { Schema, Document } from 'mongoose';

export interface IPartAnalysisDocument extends Document {
    center_id: mongoose.Types.ObjectId;
    part_id: mongoose.Types.ObjectId;
    analysis: {
        riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
        title: string;
        content: string;
        suggestedOrderQty?: number;
    };
    createdAt: Date;
    updatedAt: Date;
}

const PartAnalysisSchema: Schema = new Schema(
    {
        center_id: { type: Schema.Types.ObjectId, ref: 'Center', required: true },
        part_id: { type: Schema.Types.ObjectId, ref: 'AutoPart', required: true },
        analysis: {
            riskLevel: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], required: true },
            title: { type: String, required: true },
            content: { type: String, required: true },
            suggestedOrderQty: { type: Number, default: 0 }
        },
    },
    { timestamps: true }
);

export default mongoose.model<IPartAnalysisDocument>('PartAnalysis', PartAnalysisSchema);
