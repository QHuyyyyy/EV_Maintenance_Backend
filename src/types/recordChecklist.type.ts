import mongoose from 'mongoose';

export interface IRecordChecklist {
    _id: string;
    checklist_id: mongoose.Types.ObjectId | string;
    record_id: mongoose.Types.ObjectId | string;
    status: 'pending' | 'completed' | 'skipped';
    note?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateRecordChecklistRequest {
    // Either provide a single checklist_id or checklist_ids (array) to link multiple checklist templates to the record
    checklist_id?: string;
    checklist_ids?: string[];
    record_id: string;
    status?: 'pending' | 'completed' | 'skipped';
    note?: string;
}

export interface UpdateRecordChecklistRequest {
    status?: 'pending' | 'completed' | 'skipped';
    note?: string;
}
