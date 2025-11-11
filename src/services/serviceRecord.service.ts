import ServiceRecord from '../models/serviceRecord.model';
import { CreateServiceRecordRequest, UpdateServiceRecordRequest, IServiceRecord } from '../types/serviceRecord.type';
import vehicleSubscriptionService from './vehicleSubcription.service';
import Appointment from '../models/appointment.model';
import RecordChecklist from '../models/recordChecklist.model';

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
                        { path: 'customer_id', select: 'customerName dateOfBirth address' },
                        { path: 'vehicle_id', select: 'vehicleName model plateNumber mileage' },
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
                            { path: 'customer_id', select: 'customerName dateOfBirth address' },
                            { path: 'vehicle_id', select: 'vehicleName model plateNumber mileage' },
                            { path: 'center_id', select: 'name address phone' }
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
                        { path: 'customer_id', select: 'customerName dateOfBirth address' },
                        { path: 'vehicle_id', select: 'vehicleName model plateNumber mileage' },
                        { path: 'center_id', select: 'name address phone' }
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

    // Lấy tất cả suggested parts từ record checklist
    async getAllSuggestedParts(recordId: string): Promise<any> {
        try {
            const record = await ServiceRecord.findById(recordId);
            if (!record) {
                throw new Error('Service record not found');
            }

            // Lấy tất cả record checklist items cho service record này
            const checklistItems = await RecordChecklist.find({ record_id: recordId })
                .populate('suggested_part', 'part_name price stock')
                .lean();

            // Group và đếm các parts
            const partsMap = new Map();
            
            checklistItems.forEach((item: any) => {
                if (item.suggested_part) {
                    const partId = item.suggested_part._id.toString();
                    if (partsMap.has(partId)) {
                        const existing = partsMap.get(partId);
                        existing.count += 1;
                    } else {
                        partsMap.set(partId, {
                            part_id: item.suggested_part._id,
                            part_name: item.suggested_part.part_name,
                            price: item.suggested_part.price,
                            stock: item.suggested_part.stock,
                            count: 1
                        });
                    }
                }
            });

            return Array.from(partsMap.values());
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to get suggested parts: ${error.message}`);
            }
            throw new Error('Failed to get suggested parts: Unknown error');
        }
    }

    // Tính bill/invoice với subscription discount
    async calculateBillWithSubscription(recordId: string, serviceCharges: number, partsTotal: number): Promise<{
        serviceCharges: number;
        partsTotal: number;
        subtotal: number;
        subscriptionDiscount: {
            hasSubscription: boolean;
            discount: number;
            discountPercent: number;
            subscriptionId?: string;
            packageName?: string;
        };
        finalTotal: number;
        vehicleId?: string;
    }> {
        try {
            // Lấy service record
            const record = await ServiceRecord.findById(recordId)
                .populate({
                    path: 'appointment_id',
                    populate: { path: 'vehicle_id' }
                });

            if (!record) {
                throw new Error('Service record not found');
            }

            const appointment = record.appointment_id as any;
            if (!appointment || !appointment.vehicle_id) {
                throw new Error('Vehicle information not found');
            }

            const vehicleId = appointment.vehicle_id._id.toString();
            const subtotal = serviceCharges + partsTotal;

            // Tính discount từ subscription
            const discountInfo = await vehicleSubscriptionService.calculateSubscriptionDiscount(
                vehicleId,
                subtotal
            );

            return {
                serviceCharges,
                partsTotal,
                subtotal,
                subscriptionDiscount: discountInfo,
                finalTotal: discountInfo.finalAmount,
                vehicleId
            };
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to calculate bill: ${error.message}`);
            }
            throw new Error('Failed to calculate bill: Unknown error');
        }
    }
}

export default new ServiceRecordService();
