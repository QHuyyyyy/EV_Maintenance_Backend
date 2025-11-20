import mongoose from 'mongoose';

export interface SuggestItemDTO {
    part_id: string;
    quantity: number;
}

export type SuggestInput = string | SuggestItemDTO;

export interface IRecordChecklist {
    _id: string;
    checklist_id: mongoose.Types.ObjectId | string;
    record_id: mongoose.Types.ObjectId | string;
    status: 'pending' | 'completed' | 'skipped';
    note?: string;
    suggest?: SuggestItemDTO[];
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateRecordChecklistRequest {
    checklist_id?: string;
    checklist_ids?: string[];
    record_id: string;
    status?: 'pending' | 'completed' | 'skipped';
    note?: string;
    suggest?: SuggestInput[];
}

export interface UpdateRecordChecklistRequest {
    status?: 'pending' | 'completed' | 'skipped';
    note?: string;
    suggest?: SuggestInput[];
    suggest_add?: SuggestInput[];
    suggest_remove?: string[];
    suggest_update_qty?: SuggestItemDTO[];
}
