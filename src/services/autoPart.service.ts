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

    // Lấy danh sách centers có sẵn stock để OUT (có sẵn, không có LACKING)
    async getAvailableStockByCenters(part_id: string): Promise<Array<{
        center_id: string;
        center_name: string;
        stock: number;
        held: number;
        available: number;
    }>> {
        try {
            const CenterAutoPart = require('../models/centerAutoPart.model').default;
            const ServiceOrder = require('../models/serviceOrder.model').default;
            const ServiceRecord = require('../models/serviceRecord.model').default;
            const Center = require('../models/center.model').default;

            const centers = await Center.find().lean();

            const results = [];
            for (const center of centers) {
                // Lấy stock hiện tại
                const stock = (await CenterAutoPart.findOne({
                    center_id: center._id,
                    part_id: part_id
                }).lean())?.quantity || 0;

                // Lấy SUFFICIENT orders của service records chưa completed
                const sufficientOrders = await ServiceOrder.find({
                    part_id: part_id,
                    stock_status: 'SUFFICIENT'
                })
                    .populate({
                        path: 'service_record_id',
                        match: { status: { $ne: 'completed' } }
                    })
                    .lean() as any[];

                // Tính held (chỉ những order có service record chưa complete)
                const held = sufficientOrders
                    .filter(o => o.service_record_id)
                    .reduce((sum, o) => sum + (o.quantity || 0), 0);

                // Kiểm tra xem part này có LACKING không
                const hasLacking = await ServiceOrder.findOne({
                    part_id: part_id,
                    stock_status: 'LACKING'
                }).lean();

                const available = stock - held;

                // Chỉ trả về nếu: có sẵn AND không có LACKING
                if (available > 0 && !hasLacking) {
                    results.push({
                        center_id: center._id.toString(),
                        center_name: center.name,
                        stock,
                        held,
                        available
                    });
                }
            }

            return results;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to get available stock by centers: ${error.message}`);
            }
            throw new Error('Failed to get available stock by centers: Unknown error');
        }
    }
}

export default new AutoPartService();