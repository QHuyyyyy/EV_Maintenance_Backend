import ServiceChecklist from '../models/serviceChecklist.model';
import RecordChecklist from '../models/recordChecklist.model';
import { CreateServiceChecklistRequest, UpdateServiceChecklistRequest, IServiceChecklist } from '../types/serviceChecklist.type';

export class ServiceChecklistService {
    async createServiceChecklist(checklistData: CreateServiceChecklistRequest): Promise<IServiceChecklist> {
        try {
            const checklist = new ServiceChecklist(checklistData);
            await checklist.save();
            return await ServiceChecklist.findById(checklist._id).lean() as any;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to create service checklist: ${error.message}`);
            }
            throw new Error('Failed to create service checklist: Unknown error');
        }
    }

    async getServiceChecklistById(checklistId: string): Promise<IServiceChecklist | null> {
        try {
            return await ServiceChecklist.findById(checklistId).lean() as any;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to get service checklist: ${error.message}`);
            }
            throw new Error('Failed to get service checklist: Unknown error');
        }
    }

    async getAllServiceChecklists(filters?: {
        page?: number;
        limit?: number;
    }): Promise<{
        checklists: IServiceChecklist[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> {
        try {
            const page = filters?.page || 1;
            const limit = filters?.limit || 10;
            const skip = (page - 1) * limit;

            const query: any = {};

            const [checklists, total] = await Promise.all([
                ServiceChecklist.find(query)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean() as any,
                ServiceChecklist.countDocuments(query)
            ]);

            return {
                checklists,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            };
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to get service checklists: ${error.message}`);
            }
            throw new Error('Failed to get service checklists: Unknown error');
        }
    }

    async updateServiceChecklist(checklistId: string, updateData: UpdateServiceChecklistRequest): Promise<IServiceChecklist | null> {
        try {
            return await ServiceChecklist.findByIdAndUpdate(
                checklistId,
                updateData,
                { new: true, runValidators: true }
            )
                .lean() as any;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to update service checklist: ${error.message}`);
            }
            throw new Error('Failed to update service checklist: Unknown error');
        }
    }

    async deleteServiceChecklist(checklistId: string): Promise<IServiceChecklist | null> {
        try {
            // Guard: prevent deletion if any record checklist references this checklist
            const inUseCount = await RecordChecklist.countDocuments({ checklist_id: checklistId });
            if (inUseCount > 0) {
                throw new Error('Không thể xóa checklist vì đang được sử dụng trong record checklist');
            }
            return await ServiceChecklist.findByIdAndDelete(checklistId).lean() as any;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to delete service checklist: ${error.message}`);
            }
            throw new Error('Failed to delete service checklist: Unknown error');
        }
    }
}

export default new ServiceChecklistService();
