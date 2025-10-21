import ServiceRecord from '../models/serviceRecord.model';
import { CreateServiceRecordRequest, UpdateServiceRecordRequest, IServiceRecord } from '../types/serviceRecord.type';

export class ServiceRecordService {
    async createServiceRecord(recordData: CreateServiceRecordRequest): Promise<IServiceRecord> {
        try {
            const record = new ServiceRecord(recordData);
            return await record.save() as any;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to create service record: ${error.message}`);
            }
            throw new Error('Failed to create service record: Unknown error');
        }
    }

    async getServiceRecordById(recordId: string): Promise<IServiceRecord | null> {
        try {
            return await ServiceRecord.findById(recordId)
                .populate({
                    path: 'appointment_id',
                    populate: [
                        { path: 'customer_id', select: 'customerId fullName email phone' },
                        { path: 'vehicle_id', select: 'vehicleId brand model licensePlate' },
                        { path: 'center_id', select: 'center_id name address phone' }
                    ]
                })
                .lean() as any;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to get service record: ${error.message}`);
            }
            throw new Error('Failed to get service record: Unknown error');
        }
    }

    async getAllServiceRecords(filters?: {
        status?: string;
        appointment_id?: string;
        technician_id?: string;
        startDate?: Date;
        endDate?: Date;
        page?: number;
        limit?: number;
    }): Promise<{
        records: IServiceRecord[];
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
            if (filters?.appointment_id) {
                query.appointment_id = filters.appointment_id;
            }
            if (filters?.technician_id) {
                query.technician_id = filters.technician_id;
            }
            if (filters?.startDate || filters?.endDate) {
                query.start_time = {};
                if (filters.startDate) {
                    query.start_time.$gte = filters.startDate;
                }
                if (filters.endDate) {
                    query.start_time.$lte = filters.endDate;
                }
            }

            const [records, total] = await Promise.all([
                ServiceRecord.find(query)
                    .populate({
                        path: 'appointment_id',
                        populate: [
                            { path: 'customer_id', select: 'customerId fullName email phone' },
                            { path: 'vehicle_id', select: 'vehicleId brand model licensePlate' },
                            { path: 'center_id', select: 'center_id name address phone' }
                        ]
                    })
                    .sort({ start_time: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean() as any,
                ServiceRecord.countDocuments(query)
            ]);

            return {
                records,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            };
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to get service records: ${error.message}`);
            }
            throw new Error('Failed to get service records: Unknown error');
        }
    }

    async updateServiceRecord(recordId: string, updateData: UpdateServiceRecordRequest): Promise<IServiceRecord | null> {
        try {
            return await ServiceRecord.findByIdAndUpdate(
                recordId,
                updateData,
                { new: true, runValidators: true }
            )
                .populate({
                    path: 'appointment_id',
                    populate: [
                        { path: 'customer_id', select: 'customerId fullName email phone' },
                        { path: 'vehicle_id', select: 'vehicleId brand model licensePlate' },
                        { path: 'center_id', select: 'center_id name address phone' }
                    ]
                })
                .lean() as any;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to update service record: ${error.message}`);
            }
            throw new Error('Failed to update service record: Unknown error');
        }
    }

    async deleteServiceRecord(recordId: string): Promise<IServiceRecord | null> {
        try {
            return await ServiceRecord.findByIdAndDelete(recordId).lean() as any;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to delete service record: ${error.message}`);
            }
            throw new Error('Failed to delete service record: Unknown error');
        }
    }
}

export default new ServiceRecordService();
