import mongoose, { Schema, Document } from 'mongoose';

export interface IServiceChecklist extends Document {
    name: string;
    order?: number;
    createdAt: Date;
    updatedAt: Date;
}

const ServiceChecklistSchema: Schema = new Schema(
    {
        name: {
            type: String,
            required: true
        },
        order: {
            type: Number,
            required: false,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.model<IServiceChecklist>('ServiceChecklist', ServiceChecklistSchema);
