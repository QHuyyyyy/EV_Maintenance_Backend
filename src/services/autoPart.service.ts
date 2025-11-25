import AutoPart from '../models/autoPart.model';
import { CreateAutoPartRequest, UpdateAutoPartRequest, IAutoPart } from '../types/autoPart.type';

export class AutoPartService {
    async createAutoPart(partData: CreateAutoPartRequest): Promise<IAutoPart> {
        try {
            const autoPart = new AutoPart(partData);
            return await autoPart.save() as any;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to create auto part: ${error.message}`);
            }
            throw new Error('Failed to create auto part: Unknown error');
        }
    }

    async getAutoPartById(id: string): Promise<IAutoPart | null> {
        try {
            return await AutoPart.findById(id).lean() as any;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to get auto part: ${error.message}`);
            }
            throw new Error('Failed to get auto part: Unknown error');
        }
    }

    async getAllAutoParts(filters?: {
        name?: string;
        category?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        parts: IAutoPart[];
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
            if (filters?.name) {
                query.name = { $regex: filters.name, $options: 'i' };
            }
            if (filters?.category) {
                query.category = filters.category;
            }
            // lowStock is now handled at CenterAutoPart level (per center)

            const [parts, total] = await Promise.all([
                AutoPart.find(query)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean() as any,
                AutoPart.countDocuments(query)
            ]);

            return {
                parts,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            };
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to get auto parts: ${error.message}`);
            }
            throw new Error('Failed to get auto parts: Unknown error');
        }
    }

    async updateAutoPart(id: string, updateData: UpdateAutoPartRequest): Promise<IAutoPart | null> {
        try {
            return await AutoPart.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).lean() as any;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to update auto part: ${error.message}`);
            }
            throw new Error('Failed to update auto part: Unknown error');
        }
    }

    async deleteAutoPart(id: string): Promise<IAutoPart | null> {
        try {
            return await AutoPart.findByIdAndDelete(id).lean() as any;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to delete auto part: ${error.message}`);
            }
            throw new Error('Failed to delete auto part: Unknown error');
        }
    }
}

export default new AutoPartService();