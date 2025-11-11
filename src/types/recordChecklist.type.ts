import mongoose from 'mongoose';

export interface SuggestItemDTO {
    part_id: string; // CenterAutoPart ID
    quantity: number; // >=1
}

export type SuggestInput = string | SuggestItemDTO; // backward compatible: accept plain ID or object with quantity

export interface IRecordChecklist {
    _id: string;
    checklist_id: mongoose.Types.ObjectId | string;
    record_id: mongoose.Types.ObjectId | string;
    status: 'pending' | 'completed' | 'skipped';
    note?: string;
    // Suggestions now include quantity per item
    suggest?: SuggestItemDTO[];
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
    // Accept either array of IDs or array of objects with quantity
    suggest?: SuggestInput[];
}

export interface UpdateRecordChecklistRequest {
    status?: 'pending' | 'completed' | 'skipped';
    note?: string;
    // Replace entire suggestion array (send full list). Accept IDs or objects.
    suggest?: SuggestInput[];
    // Optionally append new suggestions without replacing existing ones
    suggest_add?: SuggestInput[];
    // Optionally remove suggestions by CenterAutoPart ID
    suggest_remove?: string[];
    // Optionally update quantities for existing suggestions
    suggest_update_qty?: SuggestItemDTO[];
}
