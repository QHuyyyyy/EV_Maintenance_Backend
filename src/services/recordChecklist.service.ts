import RecordChecklist from '../models/recordChecklist.model';
import { CreateRecordChecklistRequest, UpdateRecordChecklistRequest, IRecordChecklist, SuggestInput, SuggestItemDTO } from '../types/recordChecklist.type';

// Normalize suggest input (string id or {part_id, quantity}) to consistent DTO
function normalizeSuggestArray(arr?: SuggestInput[]): SuggestItemDTO[] {
    if (!Array.isArray(arr)) return [];
    return arr
        .map((item) => {
            if (!item) return undefined as any;
            if (typeof item === 'string') {
                return { part_id: item, quantity: 1 } as SuggestItemDTO;
            }
            const qty = item.quantity && item.quantity > 0 ? item.quantity : 1;
            return { part_id: item.part_id, quantity: qty } as SuggestItemDTO;
        })
        .filter((v): v is SuggestItemDTO => !!v && !!v.part_id);
}

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
                        suggest: normalizeSuggestArray(data.suggest)
                    }));

                    if (toCreate.length > 0) {
                        await RecordChecklist.insertMany(toCreate);
                    }
                    return await RecordChecklist.find({ record_id: data.record_id })
                        .populate({ path: 'checklist_id' })
                        .populate({ path: 'suggest.part_id' })
                        .sort({ createdAt: 1 })
                        .lean() as any;
                }
            }

            const rc = new RecordChecklist({
                checklist_id: data.checklist_id,
                record_id: data.record_id,
                status: data.status ?? 'pending',
                note: data.note ?? '',
                suggest: normalizeSuggestArray(data.suggest)
            });
            await rc.save();
            return await RecordChecklist.findById(rc._id)
                .populate({ path: 'checklist_id' })
                .populate({ path: 'suggest.part_id' })
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
                .populate({
                    path: 'suggest.part_id',
                    populate: { path: '_id' }
                })
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
            const doc = await RecordChecklist.findById(id);
            if (!doc) return null;

            if (typeof updateData.status !== 'undefined') (doc as any).status = updateData.status;
            if (typeof updateData.note !== 'undefined') (doc as any).note = updateData.note;

            // Backward compatibility: convert existing array
            let current: SuggestItemDTO[] = Array.isArray((doc as any).suggest)
                ? (doc as any).suggest.map((s: any) => {
                    if (s && s.part_id) return { part_id: s.part_id.toString(), quantity: s.quantity || 1 };
                    return { part_id: s.toString(), quantity: 1 };
                })
                : [];

            // Replace entirely
            if (Array.isArray(updateData.suggest)) {
                current = normalizeSuggestArray(updateData.suggest);
            }
            // Add semantics
            if (Array.isArray(updateData.suggest_add)) {
                const toAdd = normalizeSuggestArray(updateData.suggest_add);
                const idxMap = new Map(current.map((c, i) => [c.part_id.toString(), i]));
                toAdd.forEach(add => {
                    const key = add.part_id.toString();
                    if (idxMap.has(key)) {
                        const i = idxMap.get(key)!;
                        current[i].quantity += add.quantity; // accumulate
                    } else {
                        current.push(add);
                        idxMap.set(key, current.length - 1);
                    }
                });
            }
            // Update quantities specifically
            if (Array.isArray(updateData.suggest_update_qty)) {
                const qtyMap = new Map(updateData.suggest_update_qty.map(u => [u.part_id.toString(), u.quantity]));
                current = current.map(c => {
                    const q = qtyMap.get(c.part_id.toString());
                    if (q && q > 0) return { ...c, quantity: q };
                    return c;
                });
            }
            // Remove
            if (Array.isArray(updateData.suggest_remove) && updateData.suggest_remove.length) {
                const removeSet = new Set(updateData.suggest_remove.map(id => id.toString()));
                current = current.filter(c => !removeSet.has(c.part_id.toString()));
            }

            (doc as any).suggest = current.map(c => ({ part_id: c.part_id, quantity: c.quantity }));
            await doc.save();

            return await RecordChecklist.findById(id)
                .populate({ path: 'checklist_id' })
                .populate({ path: 'suggest.part_id' })
                .lean() as any;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to update record checklist: ${error.message}`);
            }
            throw new Error('Failed to update record checklist: Unknown error');
        }
    }

    async addSuggestions(id: string, suggest: SuggestInput[]): Promise<IRecordChecklist | null> {
        try {
            const doc = await RecordChecklist.findById(id);
            if (!doc) return null;
            let current: SuggestItemDTO[] = Array.isArray((doc as any).suggest)
                ? (doc as any).suggest.map((s: any) => {
                    if (s && s.part_id) return { part_id: s.part_id.toString(), quantity: s.quantity || 1 };
                    return { part_id: s.toString(), quantity: 1 };
                })
                : [];
            const toAdd = normalizeSuggestArray(suggest);
            const idxMap = new Map(current.map((c, i) => [c.part_id.toString(), i]));
            toAdd.forEach(add => {
                const key = add.part_id.toString();
                if (idxMap.has(key)) {
                    const i = idxMap.get(key)!;
                    current[i].quantity += add.quantity;
                } else {
                    current.push(add);
                    idxMap.set(key, current.length - 1);
                }
            });
            (doc as any).suggest = current.map(c => ({ part_id: c.part_id, quantity: c.quantity }));
            await doc.save();
            return await RecordChecklist.findById(id)
                .populate({ path: 'checklist_id' })
                .populate({ path: 'suggest.part_id' })
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
