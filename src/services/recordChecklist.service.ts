import RecordChecklist from '../models/recordChecklist.model';
import { CreateRecordChecklistRequest, UpdateRecordChecklistRequest, IRecordChecklist } from '../types/recordChecklist.type';

export class RecordChecklistService {
    async createRecordChecklist(data: CreateRecordChecklistRequest): Promise<IRecordChecklist | IRecordChecklist[]> {
        try {
            if (data.checklist_ids && Array.isArray(data.checklist_ids) && data.checklist_ids.length > 0) {
                if (data.checklist_ids.length === 1) {
                    data.checklist_id = data.checklist_ids[0];
                } else {
                    const existing = await RecordChecklist.find({
                        record_id: data.record_id,
                        checklist_id: { $in: data.checklist_ids }
                    }).select('checklist_id').lean();

                    const existingIds = new Set(existing.map((e: any) => String(e.checklist_id)));
                    const toCreate = data.checklist_ids.filter(id => !existingIds.has(String(id))).map(id => ({
                        checklist_id: id,
                        record_id: data.record_id,
                        status: data.status ?? 'pending',
                        note: data.note ?? '',
                        suggest: Array.isArray(data.suggest) ? data.suggest : []
                    }));

                    if (toCreate.length > 0) {
                        await RecordChecklist.insertMany(toCreate);
                    }
                    return await RecordChecklist.find({ record_id: data.record_id })
                        .populate({ path: 'checklist_id' })
                        .populate({ path: 'suggest', populate: { path: 'part_id' } })
                        .sort({ createdAt: 1 })
                        .lean() as any;
                }
            }

            const rc = new RecordChecklist({
                checklist_id: data.checklist_id,
                record_id: data.record_id,
                status: data.status ?? 'pending',
                note: data.note ?? '',
                suggest: Array.isArray(data.suggest) ? data.suggest : []
            });
            await rc.save();
            return await RecordChecklist.findById(rc._id)
                .populate({ path: 'checklist_id' })
                .populate({ path: 'suggest', populate: { path: 'part_id' } })
                .lean() as any;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to create record checklist: ${error.message}`);
            }
            throw new Error('Failed to create record checklist: Unknown error');
        }
    }

    async getRecordChecklistsByRecord(recordId: string): Promise<IRecordChecklist[]> {
        try {
            return await RecordChecklist.find({ record_id: recordId })
                .populate({ path: 'checklist_id' })
                .populate({ path: 'suggest', populate: { path: 'part_id' } })
                .sort({ createdAt: 1 })
                .lean() as any;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to get record checklists: ${error.message}`);
            }
            throw new Error('Failed to get record checklists: Unknown error');
        }
    }

    async updateRecordChecklist(id: string, updateData: UpdateRecordChecklistRequest): Promise<IRecordChecklist | null> {
        try {
            // Build update object to support suggest add/remove semantics
            const updateOps: any = {};
            const setOps: any = {};

            if (typeof updateData.status !== 'undefined') setOps.status = updateData.status;
            if (typeof updateData.note !== 'undefined') setOps.note = updateData.note;
            if (Array.isArray(updateData.suggest)) setOps.suggest = updateData.suggest;

            if (Object.keys(setOps).length) updateOps.$set = setOps;

            if (Array.isArray(updateData.suggest_add) && updateData.suggest_add.length) {
                updateOps.$addToSet = { ...(updateOps.$addToSet || {}), suggest: { $each: updateData.suggest_add } };
            }
            if (Array.isArray(updateData.suggest_remove) && updateData.suggest_remove.length) {
                updateOps.$pull = { ...(updateOps.$pull || {}), suggest: { $in: updateData.suggest_remove } };
            }

            return await RecordChecklist.findByIdAndUpdate(id, updateOps, { new: true, runValidators: true })
                .populate({ path: 'checklist_id' })
                .populate({ path: 'suggest', populate: { path: 'part_id' } })
                .lean() as any;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to update record checklist: ${error.message}`);
            }
            throw new Error('Failed to update record checklist: Unknown error');
        }
    }

    async addSuggestions(id: string, suggest: string[]): Promise<IRecordChecklist | null> {
        try {
            return await RecordChecklist.findByIdAndUpdate(
                id,
                { $addToSet: { suggest: { $each: suggest } } },
                { new: true, runValidators: true }
            ).populate({ path: 'checklist_id' })
                .populate({ path: 'suggest', populate: { path: 'part_id' } })
                .lean() as any;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to add suggestions: ${error.message}`);
            }
            throw new Error('Failed to add suggestions: Unknown error');
        }
    }

    async deleteRecordChecklist(id: string): Promise<IRecordChecklist | null> {
        try {
            return await RecordChecklist.findByIdAndDelete(id).lean() as any;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to delete record checklist: ${error.message}`);
            }
            throw new Error('Failed to delete record checklist: Unknown error');
        }
    }
}

export default new RecordChecklistService();
