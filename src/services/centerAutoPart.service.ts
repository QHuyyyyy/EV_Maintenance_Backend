import CenterAutoPart from '../models/centerAutoPart.model';
import { CreateCenterAutoPartRequest, UpdateCenterAutoPartRequest, ICenterAutoPart } from '../types/centerAutoPart.type';

export class CenterAutoPartService {
    async createCenterAutoPart(data: CreateCenterAutoPartRequest): Promise<ICenterAutoPart> {
        try {
            const item = new CenterAutoPart(data);
            return await item.save() as any;
        } catch (error) {
            if (error instanceof Error) throw new Error(`Failed to create center auto part: ${error.message}`);
            throw new Error('Failed to create center auto part: Unknown error');
        }
    }

    async getCenterAutoPartById(id: string): Promise<ICenterAutoPart | null> {
        try {
            return await CenterAutoPart.findById(id).populate('center_id').populate('part_id').lean() as any;
        } catch (error) {
            if (error instanceof Error) throw new Error(`Failed to get center auto part: ${error.message}`);
            throw new Error('Failed to get center auto part: Unknown error');
        }
    }

    async getAllCenterAutoParts(filters?: { center_id?: string; part_id?: string; lowStock?: boolean; page?: number; limit?: number }) {
        try {
            const page = filters?.page || 1;
            const limit = filters?.limit || 10;
            const skip = (page - 1) * limit;

            const query: any = {};
            if (filters?.center_id) query.center_id = filters.center_id;
            if (filters?.part_id) query.part_id = filters.part_id;


            const [items, total] = await Promise.all([
                CenterAutoPart.find(query).populate('center_id').populate('part_id').sort({ createdAt: -1 }).skip(skip).limit(limit).lean() as any,
                CenterAutoPart.countDocuments(query)
            ]);

            return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
        } catch (error) {
            if (error instanceof Error) throw new Error(`Failed to get center auto parts: ${error.message}`);
            throw new Error('Failed to get center auto parts: Unknown error');
        }
    }

    async updateCenterAutoPart(id: string, updateData: UpdateCenterAutoPartRequest): Promise<ICenterAutoPart | null> {
        try {
            return await CenterAutoPart.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).lean() as any;
        } catch (error) {
            if (error instanceof Error) throw new Error(`Failed to update center auto part: ${error.message}`);
            throw new Error('Failed to update center auto part: Unknown error');
        }
    }

    async deleteCenterAutoPart(id: string): Promise<ICenterAutoPart | null> {
        try {
            return await CenterAutoPart.findByIdAndDelete(id).lean() as any;
        } catch (error) {
            if (error instanceof Error) throw new Error(`Failed to delete center auto part: ${error.message}`);
            throw new Error('Failed to delete center auto part: Unknown error');
        }
    }
}

export default new CenterAutoPartService();
