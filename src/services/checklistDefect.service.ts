import ChecklistDefect from '../models/checklistDefect.model';
import {
    IChecklistDefect,
    CreateChecklistDefectRequest,
    UpdateChecklistDefectRequest,
    ChecklistDefectDTO
} from '../types/checklistDefect.type';

export class ChecklistDefectService {
    async createChecklistDefect(
        data: CreateChecklistDefectRequest
    ): Promise<ChecklistDefectDTO> {
        try {
            const defect = new ChecklistDefect({
                record_checklist_id: data.record_checklist_id,
                vehicle_part_id: data.vehicle_part_id,
                suggested_part_id: data.suggested_part_id,
                quantity: data.quantity,
                failure_type: data.failure_type,
                description: data.description ?? ''
            });

            await defect.save();

            return await ChecklistDefect.findById(defect._id)
                .populate('record_checklist_id')
                .populate('vehicle_part_id')
                .populate('suggested_part_id')
                .lean() as any;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to create checklist defect: ${error.message}`);
            }
            throw new Error('Failed to create checklist defect: Unknown error');
        }
    }

    async createMultiple(
        defects: CreateChecklistDefectRequest[]
    ): Promise<ChecklistDefectDTO[]> {
        try {
            if (defects.length === 0) return [];

            const created = await ChecklistDefect.insertMany(defects);

            return await ChecklistDefect.find({ _id: { $in: created.map(d => d._id) } })
                .populate('record_checklist_id')
                .populate('vehicle_part_id')
                .populate('suggested_part_id')
                .lean() as any;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to create checklist defects: ${error.message}`);
            }
            throw new Error('Failed to create checklist defects: Unknown error');
        }
    }

    async getDefectsByRecordChecklist(recordChecklistId: string): Promise<ChecklistDefectDTO[]> {
        try {
            return await ChecklistDefect.find({ record_checklist_id: recordChecklistId })
                .populate('record_checklist_id')
                .populate('vehicle_part_id')
                .populate('suggested_part_id')
                .sort({ createdAt: 1 })
                .lean() as any;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to get checklist defects: ${error.message}`);
            }
            throw new Error('Failed to get checklist defects: Unknown error');
        }
    }

    async getChecklistDefectById(id: string): Promise<ChecklistDefectDTO | null> {
        try {
            return await ChecklistDefect.findById(id)
                .populate('record_checklist_id')
                .populate('vehicle_part_id')
                .populate('suggested_part_id')
                .lean() as any;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to get checklist defect: ${error.message}`);
            }
            throw new Error('Failed to get checklist defect: Unknown error');
        }
    }

    async updateChecklistDefect(
        id: string,
        updateData: UpdateChecklistDefectRequest
    ): Promise<ChecklistDefectDTO | null> {
        try {
            const defect = await ChecklistDefect.findByIdAndUpdate(
                id,
                { $set: updateData },
                { new: true }
            )
                .populate('record_checklist_id')
                .populate('vehicle_part_id')
                .populate('suggested_part_id')
                .lean() as any;

            return defect;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to update checklist defect: ${error.message}`);
            }
            throw new Error('Failed to update checklist defect: Unknown error');
        }
    }

    async deleteChecklistDefect(id: string): Promise<ChecklistDefectDTO | null> {
        try {
            return await ChecklistDefect.findByIdAndDelete(id).lean() as any;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to delete checklist defect: ${error.message}`);
            }
            throw new Error('Failed to delete checklist defect: Unknown error');
        }
    }

    async deleteByRecordChecklist(recordChecklistId: string): Promise<number> {
        try {
            const result = await ChecklistDefect.deleteMany({ record_checklist_id: recordChecklistId });
            return result.deletedCount || 0;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to delete checklist defects: ${error.message}`);
            }
            throw new Error('Failed to delete checklist defects: Unknown error');
        }
    }
}

export default new ChecklistDefectService();
