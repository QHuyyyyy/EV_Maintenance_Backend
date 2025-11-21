import ServiceDetail from '../models/serviceDetail.model';
import PartWarranty from '../models/partWarranty.model';
import CenterAutoPart from '../models/centerAutoPart.model';
import AutoPart from '../models/autoPart.model';
import ServiceRecord from '../models/serviceRecord.model';
import Appointment from '../models/appointment.model';
import { Vehicle } from '../models/vehicle.model';
import { nowVN } from '../utils/time';

export async function createWarrantiesForServiceRecord(serviceRecordId: string): Promise<void> {
    try {
        console.log(`🔄 Bắt đầu tạo bảo hành cho ServiceRecord: ${serviceRecordId}`);

        // 1. Lấy ServiceRecord và populate appointment để có vehicle_id
        const serviceRecord = await ServiceRecord.findById(serviceRecordId).populate('appointment_id');

        if (!serviceRecord) {
            throw new Error(`ServiceRecord không tìm thấy: ${serviceRecordId}`);
        }

        const appointment = serviceRecord.appointment_id as any;
        const vehicleId = appointment.vehicle_id;

        console.log(`📍 Xe ID: ${vehicleId}`);

        const serviceDetails = await ServiceDetail.find({ record_id: serviceRecordId });

        if (serviceDetails.length === 0) {
            console.log(`⚠️ Không có chi tiết dịch vụ nào, bỏ qua tạo bảo hành`);
            return;
        }

        console.log(`📦 Tìm thấy ${serviceDetails.length} linh kiện để xử lý`);

        for (const detail of serviceDetails) {
            try {
                const centerPart = await CenterAutoPart.findById(detail.centerpart_id).populate('part_id');

                if (!centerPart) {
                    console.warn(`⚠️ CenterAutoPart không tìm thấy: ${detail.centerpart_id}`);
                    continue;
                }

                const autoPart = centerPart.part_id as any;

                const warrantyDays = autoPart.warranty_time || 0;
                const quantity = detail.paid_qty || 0;

                console.log(`   📝 Linh kiện: ${autoPart.name}, Số lượng: ${quantity}, Bảo hành: ${warrantyDays} ngày`);

                if (warrantyDays > 0 && quantity > 0) {
                    const startDate = new Date();
                    const endDate = new Date();
                    endDate.setDate(startDate.getDate() + warrantyDays);

                    for (let i = 0; i < quantity; i++) {
                        const warranty = await PartWarranty.create({
                            detail_id: detail._id,
                            centerpart_id: detail.centerpart_id,
                            part_id: autoPart._id,
                            vehicle_id: vehicleId,
                            start_date: startDate,
                            end_date: endDate,
                            warranty_status: 'active'
                        });
                    }

                    console.log(` Bảo hành tạo thành công (${quantity} cái)`);
                    console.log(` Ngày bắt đầu: ${startDate.toLocaleDateString()}`);
                    console.log(`  Ngày hết hạn: ${endDate.toLocaleDateString()}`);
                } else {
                    console.log(` Linh kiện này không có bảo hành hoặc số lượng 0, bỏ qua`);
                }
            } catch (error) {
                console.error(`Lỗi xử lý chi tiết linh kiện:`, error);
            }
        }

        console.log(`Hoàn tất tạo bảo hành cho ServiceRecord: ${serviceRecordId}`);

    } catch (error) {
        console.error('Lỗi trong createWarrantiesForServiceRecord:', error);
        throw error;
    }
}

export default {
    createWarrantiesForServiceRecord
};


export async function getPartWarrantiesForCustomer(
    customerId: string,
    vehicleId?: string,
    status?: string,
): Promise<Array<{
    warranty_id: string;
    part_id: string;
    part_name: string;
    part_image?: string;
    vehicle_id: Object;
    start_date: Date;
    end_date: Date;
    days_remaining: number;
    status: string;
}>> {
    try {
        const today = nowVN();
        today.setHours(0, 0, 0, 0);

        // 1. Lấy danh sách xe của customer
        let vehicleIds: string[] = [];
        if (vehicleId) {
            // Kiểm tra xe có thuộc customer không
            const vehicle = await Vehicle.findById(vehicleId).select('_id customerId');
            if (!vehicle) throw new Error('Vehicle không tồn tại');
            if (String(vehicle.customerId) !== String(customerId)) {
                throw new Error('Vehicle không thuộc customer');
            }
            vehicleIds = [vehicleId];
        } else {
            const vehicles = await Vehicle.find({ customerId }).select('_id');
            vehicleIds = vehicles.map(v => String(v._id));
        }

        if (vehicleIds.length === 0) {
            return []; // Không có xe => không có bảo hành
        }

        // 2. Query bảo hành còn hạn
        const warranties = await PartWarranty.find({
            vehicle_id: { $in: vehicleIds },
            end_date: { $gte: today },
        })
            .populate('part_id')
            .populate('vehicle_id');

        // 3. Map dữ liệu trả về
        return warranties.map(w => {
            const part: any = w.part_id;
            const end = w.end_date as Date;
            const daysRemaining = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            return {
                warranty_id: String(w._id),
                part_id: String(part?._id),
                part_name: part?.name,
                part_image: part?.image,
                vehicle_id: w.vehicle_id,
                start_date: w.start_date,
                end_date: w.end_date,
                days_remaining: daysRemaining,
                status: w.warranty_status
            };
        });
    } catch (error) {
        console.error('Lỗi trong getActivePartWarrantiesForCustomer:', error);
        throw error;
    }
}

export const warrantyQueryService = {
    getPartWarrantiesForCustomer
};

export async function paginateWarranties(params?: {
    page?: number;
    limit?: number;
    vehicle_id?: string;
}): Promise<{
    warranties: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}> {
    try {
        const page = params?.page || 1;
        const limit = params?.limit || 10;
        const skip = (page - 1) * limit;

        const query: any = {};
        if (params?.vehicle_id) {
            query.vehicle_id = params.vehicle_id;
        }

        const [warranties, total] = await Promise.all([
            PartWarranty.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('part_id')
                .populate('vehicle_id')
                .populate('centerpart_id')
                .lean(),
            PartWarranty.countDocuments(query)
        ]);

        return {
            warranties,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    } catch (error) {
        console.error('Lỗi trong paginateWarranties:', error);
        throw error;
    }
}

export const warrantyService = {
    paginateWarranties,
};
