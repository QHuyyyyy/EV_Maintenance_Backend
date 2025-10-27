import Center from '../models/center.model';
import { CreateCenterRequest, UpdateCenterRequest, ICenter } from '../types/center.type';

export class CenterService {
    async createCenter(centerData: CreateCenterRequest): Promise<ICenter> {
        try {
            const center = new Center(centerData);
            return await center.save() as any;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to create center: ${error.message}`);
            }
            throw new Error('Failed to create center: Unknown error');
        }
    }

    async getCenterById(centerId: string): Promise<ICenter | null> {
        try {
            return await Center.findById(centerId).lean() as any;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to get center: ${error.message}`);
            }
            throw new Error('Failed to get center: Unknown error');
        }
    }

    async getAllCenters(filters?: {
        name?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        centers: ICenter[];
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

            const [centers, total] = await Promise.all([
                Center.find(query)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean() as any,
                Center.countDocuments(query)
            ]);

            return {
                centers,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            };
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to get centers: ${error.message}`);
            }
            throw new Error('Failed to get centers: Unknown error');
        }
    }

    async updateCenter(centerId: string, updateData: UpdateCenterRequest): Promise<ICenter | null> {
        try {
            const filteredUpdateData: any = {};

            for (const [key, value] of Object.entries(updateData)) {
                // Chỉ thêm vào filteredUpdateData nếu giá trị không phải là empty
                if (value !== null && value !== undefined && value !== '' &&
                    !(Array.isArray(value) && value.length === 0)) {
                    filteredUpdateData[key] = value;
                }
            }
            if (Object.keys(filteredUpdateData).length === 0) {
                return await this.getCenterById(centerId);
            }
            return await Center.findByIdAndUpdate(
                centerId,
                filteredUpdateData,
                { new: true, runValidators: true }
            ).lean() as any;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to update center: ${error.message}`);
            }
            throw new Error('Failed to update center: Unknown error');
        }
    }

    async deleteCenter(centerId: string): Promise<ICenter | null> {
        try {
            return await Center.findByIdAndDelete(centerId).lean() as any;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to delete center: ${error.message}`);
            }
            throw new Error('Failed to delete center: Unknown error');
        }
    }
}

export default new CenterService();
