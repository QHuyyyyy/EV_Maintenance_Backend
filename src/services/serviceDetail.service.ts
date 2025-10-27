import ServiceDetail from '../models/serviceDetail.model';
import { CreateServiceDetailRequest, UpdateServiceDetailRequest, IServiceDetail } from '../types/serviceDetail.type';

export class ServiceDetailService {
    async createServiceDetail(detailData: CreateServiceDetailRequest): Promise<IServiceDetail> {
        try {
            const detail = new ServiceDetail(detailData);
            return await detail.save() as any;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to create service detail: ${error.message}`);
            }
            throw new Error('Failed to create service detail: Unknown error');
        }
    }

    async getServiceDetailById(id: string): Promise<IServiceDetail | null> {
        try {
            return await ServiceDetail.findById(id)
                .lean() as any;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to get service detail: ${error.message}`);
            }
            throw new Error('Failed to get service detail: Unknown error');
        }
    }

    async getAllServiceDetails(filters?: {
        record_id?: string;
        centerpart_id?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        details: IServiceDetail[];
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
            if (filters?.record_id) {
                query.record_id = filters.record_id;
            }
            if (filters?.centerpart_id) {
                query.centerpart_id = filters.centerpart_id;
            }

            const [details, total] = await Promise.all([
                ServiceDetail.find(query)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean() as any,
                ServiceDetail.countDocuments(query)
            ]);

            return {
                details,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            };
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to get service details: ${error.message}`);
            }
            throw new Error('Failed to get service details: Unknown error');
        }
    }

    async updateServiceDetail(id: string, updateData: UpdateServiceDetailRequest): Promise<IServiceDetail | null> {
        try {
            return await ServiceDetail.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
                .lean() as any;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to update service detail: ${error.message}`);
            }
            throw new Error('Failed to update service detail: Unknown error');
        }
    }

    async deleteServiceDetail(id: string): Promise<IServiceDetail | null> {
        try {
            return await ServiceDetail.findByIdAndDelete(id).lean() as any;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to delete service detail: ${error.message}`);
            }
            throw new Error('Failed to delete service detail: Unknown error');
        }
    }
}

export default new ServiceDetailService();