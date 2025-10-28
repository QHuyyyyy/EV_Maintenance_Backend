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

    /**
     * Return aggregated daily consumption for a given centerpart_id for the last `days` days.
     * Output: [{ date: 'YYYY-MM-DD', qty: number }, ...] ordered by date asc
     */
    async getPartHistory(centerpart_id: string, days = 180): Promise<{ date: string; qty: number }[]> {
        try {
            const from = new Date();
            from.setDate(from.getDate() - days + 1);

            // Find service details linked to the centerpart within date range
            const details = await ServiceDetail.find({
                centerpart_id,
                createdAt: { $gte: from }
            })
                .select('quantity createdAt')
                .lean() as any[];

            const map: Record<string, number> = {};
            for (const d of details) {
                const dt = new Date(d.createdAt);
                const day = dt.toISOString().slice(0, 10);
                map[day] = (map[day] || 0) + (d.quantity || 0);
            }

            // build array for each day in range
            const result: { date: string; qty: number }[] = [];
            const now = new Date();
            for (let i = days - 1; i >= 0; i--) {
                const d = new Date(now);
                d.setDate(now.getDate() - i);
                const day = d.toISOString().slice(0, 10);
                result.push({ date: day, qty: map[day] || 0 });
            }

            return result;
        } catch (error) {
            if (error instanceof Error) throw new Error(`Failed to get part history: ${error.message}`);
            throw new Error('Failed to get part history: Unknown error');
        }
    }
}

export default new ServiceDetailService();