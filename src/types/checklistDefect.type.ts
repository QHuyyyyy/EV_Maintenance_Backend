import mongoose from 'mongoose';

export interface IChecklistDefect {
    _id?: string;
    record_checklist_id: string | mongoose.Types.ObjectId;
    vehicle_part_id: string | mongoose.Types.ObjectId;
    suggested_part_id?: string | mongoose.Types.ObjectId;
    quantity: number;
    failure_type: string;
    description?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface CreateChecklistDefectRequest {
    record_checklist_id: string;
    vehicle_part_id: string;
    suggested_part_id?: string;
    quantity: number;
    failure_type: string;
    description?: string;
}

export interface UpdateChecklistDefectRequest {
    vehicle_part_id?: string;
    suggested_part_id?: string;
    quantity?: number;
    failure_type?: string;
    description?: string;
}

export interface ChecklistDefectDTO extends IChecklistDefect {
    _id: string;
    createdAt: Date;
    updatedAt: Date;
}
