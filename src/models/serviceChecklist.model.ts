import mongoose, { Schema, Document } from 'mongoose';

export interface IServiceChecklist extends Document {
    checklist_id: string;
    record_id: mongoose.Types.ObjectId;
    name: string;
    status: 'pending' | 'completed' | 'skipped';
    note: string;
    createdAt: Date;
    updatedAt: Date;
}

const ServiceChecklistSchema: Schema = new Schema(
    {
        checklist_id: {
            type: String,
            required: true,
            unique: true,
            default: () => 'CHK' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase()
        },
        record_id: {
            type: Schema.Types.ObjectId,
            ref: 'ServiceRecord',
            required: true
        },
        name: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'completed', 'skipped'],
            default: 'pending'
        },
        note: {
            type: String,
            default: ''
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.model<IServiceChecklist>('ServiceChecklist', ServiceChecklistSchema);
