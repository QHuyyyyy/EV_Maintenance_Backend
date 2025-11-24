import mongoose, { Schema, Document } from 'mongoose';

// Subdocument interface for suggestion items with quantity
export interface ISuggestItem {
    part_id: mongoose.Types.ObjectId; // references CenterAutoPart
    quantity: number; // requested / suggested quantity (>=1)
}

export interface IRecordChecklist extends Document {
    checklist_id: mongoose.Types.ObjectId;
    record_id: mongoose.Types.ObjectId;
    status: 'pending' | 'completed' | 'skipped';
    note?: string;
    // Array of suggested center auto parts (each with quantity)
    suggest?: ISuggestItem[] | mongoose.Types.ObjectId[]; // keep backward compat with existing ObjectId arrays
    createdAt: Date;
    updatedAt: Date;
}

const SuggestItemSchema = new Schema<ISuggestItem>(
    {
        part_id: { type: Schema.Types.ObjectId, ref: 'AutoPart', required: true },
        quantity: { type: Number, min: 1, default: 1 }
    },
    { _id: false }
);

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
        // Suggestions of center-specific auto parts for resolving this checklist item (now with quantity)
        suggest: {
            type: [SuggestItemSchema],
            default: []
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.model<IRecordChecklist>('RecordChecklist', RecordChecklistSchema);
