import mongoose from 'mongoose';
import ServiceDetail from '../models/serviceDetail.model';
import CenterAutoPart from '../models/centerAutoPart.model';
import { CreateServiceDetailRequest, UpdateServiceDetailRequest, IServiceDetail } from '../types/serviceDetail.type';
import moment from 'moment-timezone';
import { VIETNAM_TIMEZONE } from '../utils/time';

export class ServiceDetailService {
    async createServiceDetail(detailData: CreateServiceDetailRequest): Promise<IServiceDetail> {
        const session = await mongoose.startSession();
        try {
            await session.withTransaction(async () => {
                const qty = detailData.quantity || 0;
                if (qty < 0) {
                    throw new Error('Quantity cannot be negative');
                }

                if (qty > 0) {
                    const updated = await CenterAutoPart.findOneAndUpdate(
                        { _id: detailData.centerpart_id, quantity: { $gte: qty } },
                        { $inc: { quantity: -qty } },
                        { session, new: true }
                    );
                    if (!updated) {
                        throw new Error('Insufficient stock for the selected center part');
                    }
                }

                const detail = new ServiceDetail(detailData);
                await detail.save({ session });
            });

            // Re-fetch created doc without session to return populated structure if needed by callers later
            // Keep original lean-less behavior to mirror previous return type
            const created = await ServiceDetail.findOne({
                record_id: detailData.record_id,
                centerpart_id: detailData.centerpart_id
            }) as any;
            return created as any;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to create service detail: ${error.message}`);
            }
            throw new Error('Failed to create service detail: Unknown error');
        } finally {
            session.endSession();
        }
    }

    async getServiceDetailById(id: string): Promise<IServiceDetail | null> {
        try {
            return await ServiceDetail.findById(id)
                .populate({
                    path: 'centerpart_id',
                    populate: { path: 'part_id' }
                })
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
                    .populate({
                        path: 'centerpart_id',
                        populate: { path: 'part_id' }
                    })
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
                .populate({
                    path: 'centerpart_id',
                    populate: { path: 'part_id' }
                })
                .lean() as any;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to update service detail: ${error.message}`);
            }
            throw new Error('Failed to update service detail: Unknown error');
        }
    }

    async deleteServiceDetail(id: string): Promise<IServiceDetail | null> {
        const session = await mongoose.startSession();
        try {
            let deleted: any = null;
            await session.withTransaction(async () => {
                const existing = await ServiceDetail.findById(id).session(session);
                if (!existing) {
                    deleted = null;
                    return;
                }
                const centerPartId = existing.centerpart_id.toString();
                const qty = existing.quantity || 0;

                if (qty > 0) {
                    await CenterAutoPart.findByIdAndUpdate(
                        centerPartId,
                        { $inc: { quantity: qty } },
                        { session }
                    );
                }

                deleted = await ServiceDetail.findByIdAndDelete(id, { session });
            });

            return deleted ? (deleted.toObject ? deleted.toObject() : deleted) : null;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to delete service detail: ${error.message}`);
            }
            throw new Error('Failed to delete service detail: Unknown error');
        } finally {
            session.endSession();
        }
    }

    async getPartHistory(centerpart_id: string, days = 180): Promise<{ date: string; qty: number }[]> {
        try {
            const from = moment().tz(VIETNAM_TIMEZONE).subtract(days - 1, 'days').startOf('day').toDate();

            const details = await ServiceDetail.find({
                centerpart_id,
                createdAt: { $gte: from }
            })
                .select('quantity createdAt')
                .lean() as any[];

            const map: Record<string, number> = {};
            for (const d of details) {
                const day = moment(d.createdAt).tz(VIETNAM_TIMEZONE).format('YYYY-MM-DD');
                map[day] = (map[day] || 0) + (d.quantity || 0);
            }

            // build array for each day in range
            const result: { date: string; qty: number }[] = [];
            for (let i = days - 1; i >= 0; i--) {
                const day = moment().tz(VIETNAM_TIMEZONE).subtract(i, 'days').format('YYYY-MM-DD');
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