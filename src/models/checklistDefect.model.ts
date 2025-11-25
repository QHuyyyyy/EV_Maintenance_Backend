import mongoose, { Schema, Document } from 'mongoose';

export interface IChecklistDefect extends Document {
    record_checklist_id: mongoose.Types.ObjectId;
    vehicle_part_id: mongoose.Types.ObjectId;
    suggested_part_id?: mongoose.Types.ObjectId;
    quantity: number;
    failure_type: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}

const ChecklistDefectSchema: Schema = new Schema(
    {
        record_checklist_id: {
            type: Schema.Types.ObjectId,
            ref: 'RecordChecklist',
            required: true
        },
        vehicle_part_id: {
            type: Schema.Types.ObjectId,
            ref: 'VehicleAutoPart',
            required: true
        },
        suggested_part_id: {
            type: Schema.Types.ObjectId,
            ref: 'AutoPart',
            required: false
        },
        quantity: {
            type: Number,
            min: 1,
            default: 1,
            required: true
        },
        failure_type: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: false,
            default: ''
        }
    },
    {
        timestamps: true
    }
);

// Index for efficient querying by record_checklist_id
ChecklistDefectSchema.index({ record_checklist_id: 1 });

export default mongoose.model<IChecklistDefect>('ChecklistDefect', ChecklistDefectSchema);
