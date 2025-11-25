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
                        note: data.note ?? ''
                    }));

                    if (toCreate.length > 0) {
                        await RecordChecklist.insertMany(toCreate);
                    }
                    return await RecordChecklist.find({ record_id: data.record_id })
                        .populate({ path: 'checklist_id' })
                        .sort({ createdAt: 1 })
                        .lean() as any;
                }
            }

            const rc = new RecordChecklist({
                checklist_id: data.checklist_id,
                record_id: data.record_id,
                status: data.status ?? 'pending',
                note: data.note ?? ''
            });
            await rc.save();
            return await RecordChecklist.findById(rc._id)
                .populate({ path: 'checklist_id' })
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
            const doc = await RecordChecklist.findByIdAndUpdate(
                id,
                { $set: updateData },
                { new: true }
            )
                .populate({ path: 'checklist_id' })
                .lean() as any;

            return doc;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to update record checklist: ${error.message}`);
            }
            throw new Error('Failed to update record checklist: Unknown error');
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
