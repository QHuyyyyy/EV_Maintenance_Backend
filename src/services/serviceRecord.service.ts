import ServiceRecord from '../models/serviceRecord.model';
import { CreateServiceRecordRequest, UpdateServiceRecordRequest, IServiceRecord } from '../types/serviceRecord.type';
import vehicleSubscriptionService from './vehicleSubcription.service';
import vehicleService from './vehicle.service';
import Appointment from '../models/appointment.model';
import RecordChecklist from '../models/recordChecklist.model';
import ChecklistDefect from '../models/checklistDefect.model';
import serviceDetailModel from '../models/serviceDetail.model';
import recordChecklistModel from '../models/recordChecklist.model';
import CenterAutoPart from '../models/centerAutoPart.model';
import { nowVN } from '../utils/time';

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

    // Kiểm tra technician có đang in-progress record nào không
    async checkTechnicianActiveRecord(technicianId: string): Promise<boolean> {
        try {
            const activeRecord = await ServiceRecord.findOne({
                technician_id: technicianId,
                status: 'in-progress'
            });
            return !!activeRecord;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to check technician active record: ${error.message}`);
            }
            throw new Error('Failed to check technician active record: Unknown error');
        }
    }

    // Lấy in-progress record của technician
    async getTechnicianActiveRecord(technicianId: string): Promise<IServiceRecord | null> {
        try {
            return await ServiceRecord.findOne({
                technician_id: technicianId,
                status: 'in-progress'
            })
                .populate({
                    path: 'appointment_id',
                    populate: [
                        { path: 'customer_id', select: 'customerName dateOfBirth address' },
                        { path: 'vehicle_id', select: 'vehicleName model plateNumber mileage' },
                        { path: 'center_id', select: 'center_id name address phone' }
                    ]
                })
                .populate({
                    path: 'technician_id',
                    select: 'name userId centerId isOnline certificates',
                    populate: { path: 'userId', select: 'email' }
                })
                .lean() as any;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to get technician active record: ${error.message}`);
            }
            throw new Error('Failed to get technician active record: Unknown error');
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
                .populate({
                    path: 'technician_id',
                    select: 'name userId centerId isOnline certificates',
                    populate: { path: 'userId', select: 'email' }
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
                    .populate({
                        path: 'technician_id',
                        select: 'name userId centerId isOnline certificates',
                        populate: { path: 'userId', select: 'email' }
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
            // Nếu status chuyển sang 'in-progress', kiểm tra technician không có in-progress record khác
            if (updateData.status === 'in-progress') {
                const currentRecord = await ServiceRecord.findById(recordId).select('technician_id').lean();
                if (currentRecord && currentRecord.technician_id) {
                    const existingActiveRecord = await ServiceRecord.findOne({
                        technician_id: currentRecord.technician_id,
                        status: 'in-progress',
                        _id: { $ne: recordId }
                    });

                    if (existingActiveRecord) {
                        throw new Error(`Kỹ thuật viên này đang có 1 service record đang in-progress khác. Không thể có 2 service record in-progress cùng lúc.`);
                    }
                }
            }

            const updatedRecord = await ServiceRecord.findByIdAndUpdate(
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
                .populate({
                    path: 'technician_id',
                    select: 'name userId centerId isOnline certificates',
                    populate: { path: 'userId', select: 'email' }
                })
                .lean() as any;

            if (updateData.status === 'completed' && updatedRecord) {
                try {
                    const appointment = updatedRecord.appointment_id;
                    if (appointment && appointment.vehicle_id) {
                        await vehicleService.updateLastServiceDate(appointment.vehicle_id.toString(), nowVN());
                    }
                } catch (err) {
                    console.log('[ServiceRecord] Failed to update vehicle last_service_date:', err);
                }
            }

            return updatedRecord;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to update service record: ${error.message}`);
            }
            throw new Error('Failed to update service record: Unknown error');
        }
    }

    async deleteServiceRecord(recordId: string): Promise<IServiceRecord | null> {
        try {
            // Guard: prevent deletion if has any ServiceDetail or RecordChecklist linked
            const [detailCount, checklistCount] = await Promise.all([
                serviceDetailModel.countDocuments({ record_id: recordId }),
                recordChecklistModel.countDocuments({ record_id: recordId })
            ]);

            if (detailCount > 0 || checklistCount > 0) {
                throw new Error('Không thể xóa service record vì đã có service detail hoặc record checklist liên quan');
            }

            return await ServiceRecord.findByIdAndDelete(recordId).lean() as any;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to delete service record: ${error.message}`);
            }
            throw new Error('Failed to delete service record: Unknown error');
        }
    }
    // Lấy tất cả suggested parts từ checklist defects (bao gồm tổng số lượng)
    async getAllSuggestedParts(recordId: string): Promise<any[]> {
        try {
            const record = await ServiceRecord.findById(recordId);
            if (!record) throw new Error('Service record not found');

            // Get all record checklists for this service record
            const recordChecklists = await RecordChecklist.find({ record_id: recordId }).lean();
            const checklistIds = recordChecklists.map(rc => rc._id);

            if (checklistIds.length === 0) return [];

            // Get all defects for these checklists and populate suggested_part_id
            const defects = await ChecklistDefect.find({ record_checklist_id: { $in: checklistIds } })
                .populate({
                    path: 'suggested_part_id',
                    select: '_id name cost_price selling_price warranty_time image'
                })
                .lean();

            interface AggItem {
                auto_part_id: any; // AutoPart _id
                name: string; // AutoPart name
                cost_price: number; // AutoPart cost price
                selling_price: number; // AutoPart selling price
                total_suggested_quantity: number; // tổng quantity được gợi ý
                warranty_time?: number;
                image?: string;
            }

            const aggMap = new Map<string, AggItem>();

            defects.forEach((defect: any) => {
                const autoPartDoc = defect.suggested_part_id;

                if (!autoPartDoc || !autoPartDoc._id) return;

                const quantity = defect.quantity && defect.quantity > 0 ? defect.quantity : 1;
                const key = autoPartDoc._id.toString();
                const existing = aggMap.get(key);

                if (existing) {
                    existing.total_suggested_quantity += quantity;
                } else {
                    aggMap.set(key, {
                        auto_part_id: autoPartDoc._id,
                        name: autoPartDoc.name || '',
                        cost_price: autoPartDoc.cost_price || 0,
                        selling_price: autoPartDoc.selling_price || 0,
                        total_suggested_quantity: quantity,
                        warranty_time: autoPartDoc.warranty_time,
                        image: autoPartDoc.image
                    });
                }
            });

            return Array.from(aggMap.values());
        } catch (error) {
            if (error instanceof Error) throw new Error(`Failed to get suggested parts: ${error.message}`);
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
