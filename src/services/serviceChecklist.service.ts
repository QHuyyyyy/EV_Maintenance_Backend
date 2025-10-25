import ServiceChecklist from '../models/serviceChecklist.model';
import { CreateServiceChecklistRequest, UpdateServiceChecklistRequest, IServiceChecklist } from '../types/serviceChecklist.type';

export class ServiceChecklistService {
    async createServiceChecklist(checklistData: CreateServiceChecklistRequest): Promise<IServiceChecklist> {
        try {
            const checklist = new ServiceChecklist(checklistData);
            await checklist.save();
            return await ServiceChecklist.findById(checklist._id)
                .populate({
                    path: 'record_id',
                    populate: {
                        path: 'appointment_id',
                        populate: [
                            { path: 'customer_id', select: 'customerName dateOfBirth address' },
                            { path: 'vehicle_id', select: 'vehicleName model plateNumber mileage' },
                            { path: 'center_id', select: 'name address phone' }
                        ]
                    }
                })
                .lean() as any;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to create service checklist: ${error.message}`);
            }
            throw new Error('Failed to create service checklist: Unknown error');
        }
    }

    async getServiceChecklistById(checklistId: string): Promise<IServiceChecklist | null> {
        try {
            return await ServiceChecklist.findById(checklistId)
                .populate({
                    path: 'record_id',
                    populate: {
                        path: 'appointment_id',
                        populate: [
                            { path: 'customer_id', select: 'customerName dateOfBirth address' },
                            { path: 'vehicle_id', select: 'vehicleName model plateNumber mileage' },
                            { path: 'center_id', select: 'name address phone' }
                        ]
                    }
                })
                .lean() as any;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to get service checklist: ${error.message}`);
            }
            throw new Error('Failed to get service checklist: Unknown error');
        }
    }

    async getAllServiceChecklists(filters?: {
        status?: string;
        record_id?: string;
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
            if (filters?.status) {
                query.status = filters.status;
            }
            if (filters?.record_id) {
                query.record_id = filters.record_id;
            }

            const [checklists, total] = await Promise.all([
                ServiceChecklist.find(query)
                    .populate({
                        path: 'record_id',
                        populate: {
                            path: 'appointment_id',
                            populate: [
                                { path: 'customer_id', select: 'customerName dateOfBirth address' },
                                { path: 'vehicle_id', select: 'vehicleName model plateNumber mileage' },
                                { path: 'center_id', select: 'name address phone' }
                            ]
                        }
                    })
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
                .populate({
                    path: 'record_id',
                    populate: {
                        path: 'appointment_id',
                        populate: [
                            { path: 'customer_id', select: 'customerName dateOfBirth address' },
                            { path: 'vehicle_id', select: 'vehicleName model plateNumber mileage' },
                            { path: 'center_id', select: 'name address phone' }
                        ]
                    }
                })
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
