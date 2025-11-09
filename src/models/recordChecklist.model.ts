import mongoose, { Schema, Document } from 'mongoose';

export interface IRecordChecklist extends Document {
    checklist_id: mongoose.Types.ObjectId;
    record_id: mongoose.Types.ObjectId;
    status: 'pending' | 'completed' | 'skipped';
    note?: string;
    // Array of suggested center auto part IDs related to this checklist item
    suggest?: mongoose.Types.ObjectId[]; // references CenterAutoPart
    createdAt: Date;
    updatedAt: Date;
}

const RecordChecklistSchema: Schema = new Schema(
    {
        checklist_id: {
            type: Schema.Types.ObjectId,
            ref: 'ServiceChecklist',
            required: true
        },
        record_id: {
            type: Schema.Types.ObjectId,
            ref: 'ServiceRecord',
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
        },
        // Suggestions of center-specific auto parts for resolving this checklist item
        suggest: [
            {
                type: Schema.Types.ObjectId,
                ref: 'CenterAutoPart',
                default: []
            }
        ]
    },
    {
        timestamps: true
    }
);

export default mongoose.model<IRecordChecklist>('RecordChecklist', RecordChecklistSchema);
