import ServiceOrder from '../models/serviceOrder.model';
import CenterAutoPart from '../models/centerAutoPart.model';
import ServiceRecord from '../models/serviceRecord.model';
import {
    IServiceOrder,
    CreateServiceOrderRequest,
    UpdateServiceOrderRequest,
    ServiceOrderDTO
} from '../types/serviceOrder.type';

export class ServiceOrderService {
    // Tạo order đơn lẻ với kiểm tra stock tự động
    async createServiceOrder(
        data: CreateServiceOrderRequest
    ): Promise<ServiceOrderDTO> {
        try {
            // Lấy service record để get center_id
            const serviceRecord = await ServiceRecord.findById(data.service_record_id)
                .populate('appointment_id')
                .lean() as any;

            if (!serviceRecord) {
                throw new Error('Service record not found');
            }

            const center_id = serviceRecord.appointment_id.center_id;

            // Kiểm tra stock status từ CenterAutoPart
            const centerPart = await CenterAutoPart.findOne({
                center_id: center_id,
                part_id: data.part_id
            }).lean();

            const stockStatus = centerPart && centerPart.quantity >= data.quantity ? 'SUFFICIENT' : 'LACKING';

            const order = new ServiceOrder({
                service_record_id: data.service_record_id,
                checklist_defect_id: data.checklist_defect_id,
                part_id: data.part_id,
                quantity: data.quantity,
                stock_status: stockStatus
            });

            await order.save();

            return await ServiceOrder.findById(order._id)
                .populate('service_record_id')
                .populate('checklist_defect_id')
                .populate('part_id')
                .lean() as any;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to create service order: ${error.message}`);
            }
            throw new Error('Failed to create service order: Unknown error');
        }
    }

    // Tạo nhiều orders cùng lúc (khách chốt danh sách)
    async createMultipleServiceOrders(
        orders: CreateServiceOrderRequest[]
    ): Promise<ServiceOrderDTO[]> {
        try {
            if (orders.length === 0) return [];

            // Lấy service record đầu tiên để get center_id (tất cả orders cùng record)
            const serviceRecord = await ServiceRecord.findById(orders[0].service_record_id)
                .populate('appointment_id')
                .lean() as any;

            if (!serviceRecord) {
                throw new Error('Service record not found');
            }

            const center_id = serviceRecord.appointment_id.center_id;

            // Lấy tất cả center parts cần thiết
            const partIds = orders.map(o => o.part_id);
            const centerParts = await CenterAutoPart.find({
                center_id: center_id,
                part_id: { $in: partIds }
            }).lean();

            const centerPartMap = new Map();
            centerParts.forEach((cp: any) => {
                centerPartMap.set(cp.part_id.toString(), cp.quantity || 0);
            });

            // Tạo orders với stock status
            const ordersToCreate = orders.map(order => ({
                service_record_id: order.service_record_id,
                checklist_defect_id: order.checklist_defect_id,
                part_id: order.part_id,
                quantity: order.quantity,
                stock_status: (centerPartMap.get(order.part_id.toString()) || 0) >= order.quantity ? 'SUFFICIENT' : 'LACKING'
            }));

            const created = await ServiceOrder.insertMany(ordersToCreate);

            return await ServiceOrder.find({ _id: { $in: created.map(o => o._id) } })
                .populate('service_record_id')
                .populate('checklist_defect_id')
                .populate('part_id')
                .lean() as any;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to create service orders: ${error.message}`);
            }
            throw new Error('Failed to create service orders: Unknown error');
        }
    }

    // Lấy tất cả orders của service record
    async getServiceOrdersByRecord(recordId: string): Promise<ServiceOrderDTO[]> {
        try {
            return await ServiceOrder.find({ service_record_id: recordId })
                .populate('service_record_id')
                .populate('checklist_defect_id')
                .populate('part_id')
                .sort({ createdAt: 1 })
                .lean() as any;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to get service orders: ${error.message}`);
            }
            throw new Error('Failed to get service orders: Unknown error');
        }
    }

    // Lấy orders theo stock status
    async getServiceOrdersByStatus(
        recordId: string,
        status: 'SUFFICIENT' | 'LACKING'
    ): Promise<ServiceOrderDTO[]> {
        try {
            return await ServiceOrder.find({
                service_record_id: recordId,
                stock_status: status
            })
                .populate('service_record_id')
                .populate('checklist_defect_id')
                .populate('part_id')
                .lean() as any;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to get service orders by status: ${error.message}`);
            }
            throw new Error('Failed to get service orders by status: Unknown error');
        }
    }

    // Lấy order theo ID
    async getServiceOrderById(id: string): Promise<ServiceOrderDTO | null> {
        try {
            return await ServiceOrder.findById(id)
                .populate('service_record_id')
                .populate('checklist_defect_id')
                .populate('part_id')
                .lean() as any;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to get service order: ${error.message}`);
            }
            throw new Error('Failed to get service order: Unknown error');
        }
    }

    // Cập nhật stock status (khi hàng về)
    async updateServiceOrderStatus(
        id: string,
        status: 'SUFFICIENT' | 'LACKING'
    ): Promise<ServiceOrderDTO | null> {
        try {
            return await ServiceOrder.findByIdAndUpdate(
                id,
                { stock_status: status },
                { new: true }
            )
                .populate('service_record_id')
                .populate('checklist_defect_id')
                .populate('part_id')
                .lean() as any;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to update service order: ${error.message}`);
            }
            throw new Error('Failed to update service order: Unknown error');
        }
    }

    // Update quantity
    async updateServiceOrderQuantity(
        id: string,
        quantity: number
    ): Promise<ServiceOrderDTO | null> {
        try {
            return await ServiceOrder.findByIdAndUpdate(
                id,
                { quantity },
                { new: true }
            )
                .populate('service_record_id')
                .populate('checklist_defect_id')
                .populate('part_id')
                .lean() as any;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to update service order quantity: ${error.message}`);
            }
            throw new Error('Failed to update service order quantity: Unknown error');
        }
    }

    // Lấy danh sách hàng thiếu cho 1 shift/slot
    async getLackingPartsForShift(
        shiftId: string,
        slotId?: string
    ): Promise<{ part_id: string; orderQuantity: number; lackingQuantity: number; currentStock: number }[]> {
        try {

            const records = await ServiceRecord.find()
                .populate({
                    path: 'appointment_id',
                    populate: {
                        path: 'slot_id',
                        select: 'workshift_id center_id'
                    }
                })
                .select('_id appointment_id')
                .lean() as any[];

            console.log(`[getLackingPartsForShift] Total records found: ${records.length}`);

            const filteredRecords = records
                .filter(r => {
                    const appointment = r.appointment_id;
                    if (!appointment || !appointment.slot_id) return false;

                    const workshiftId = appointment.slot_id.workshift_id.toString();
                    const recordSlotId = appointment.slot_id._id?.toString();
                    if (workshiftId !== shiftId) return false;

                    if (slotId && recordSlotId !== slotId) return false;

                    return true;
                });

            if (filteredRecords.length === 0) {
                return [];
            }

            const filteredRecordIds = filteredRecords.map(r => r._id);
            const centerId = filteredRecords[0].appointment_id.slot_id.center_id;

            const lackingOrders = await ServiceOrder.find({
                service_record_id: { $in: filteredRecordIds },
                stock_status: 'LACKING'
            }).lean();

            const partMap = new Map<string, number>();
            lackingOrders.forEach((order: any) => {
                const partId = order.part_id.toString();
                const current = partMap.get(partId) || 0;
                partMap.set(partId, current + order.quantity);
            });

            const partIds = Array.from(partMap.keys());
            const centerParts = await CenterAutoPart.find({
                center_id: centerId,
                part_id: { $in: partIds }
            }).lean();


            const stockMap = new Map<string, number>();
            centerParts.forEach((cp: any) => {
                stockMap.set(cp.part_id.toString(), cp.quantity || 0);
            });

            const result = Array.from(partMap.entries()).map(([part_id, orderQuantity]) => {
                const currentStock = stockMap.get(part_id) || 0;
                const lackingQuantity = Math.max(0, orderQuantity - currentStock);
                return {
                    part_id,
                    orderQuantity,
                    currentStock,
                    lackingQuantity
                };
            });

            return result;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to get lacking parts for shift: ${error.message}`);
            }
            throw new Error('Failed to get lacking parts for shift: Unknown error');
        }
    }

    // Delete service order
    async deleteServiceOrder(id: string): Promise<ServiceOrderDTO | null> {
        try {
            return await ServiceOrder.findByIdAndDelete(id).lean() as any;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to delete service order: ${error.message}`);
            }
            throw new Error('Failed to delete service order: Unknown error');
        }
    }

    // Delete tất cả orders của 1 record
    async deleteServiceOrdersByRecord(recordId: string): Promise<number> {
        try {
            const result = await ServiceOrder.deleteMany({ service_record_id: recordId });
            return result.deletedCount || 0;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to delete service orders: ${error.message}`);
            }
            throw new Error('Failed to delete service orders: Unknown error');
        }
    }

    // Phân bổ hàng nhập kho cho các ServiceOrder thiếu hàng (FIFO)
    // Gọi khi ImportRequest hoàn thành - stock đã được update rồi!
    // Chỉ cần allocation dựa trên stock hiện tại
    async allocateImportedStock(
        part_id: string,
        center_id: string
    ): Promise<{ updatedOrders: string[]; remainingQuantity: number }> {
        try {
            // Lấy stock hiện tại (đã được update bởi InventoryTicket)
            const centerPart = await CenterAutoPart.findOne({
                center_id: center_id,
                part_id: part_id
            }).lean();
            const currentStock = centerPart?.quantity || 0;

            const updatedOrderIds: string[] = [];
            let remainingStock = currentStock;

            // Lấy danh sách orders thiếu hàng của part này, sắp xếp theo thời gian cũ nhất trước
            const lackingOrders = await ServiceOrder.find({
                part_id: part_id,
                stock_status: 'LACKING'
            })
                .sort({ createdAt: 1 })
                .lean();

            // Phân bổ hàng từng order
            for (const order of lackingOrders) {
                // Hết hàng thì dừng
                if (remainingStock <= 0) {
                    break;
                }

                // Nếu hàng không đủ cho order này -> bỏ qua, chuyển sang order tiếp theo
                if (remainingStock < order.quantity) {
                    continue;
                }

                // Nếu đủ thì cập nhật order thành SUFFICIENT
                if (remainingStock >= order.quantity) {
                    await ServiceOrder.findByIdAndUpdate(
                        order._id,
                        { stock_status: 'SUFFICIENT' },
                        { new: false }
                    );

                    remainingStock -= order.quantity;
                    updatedOrderIds.push(order._id.toString());
                }
            }

            return {
                updatedOrders: updatedOrderIds,
                remainingQuantity: remainingStock
            };
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to allocate imported stock: ${error.message}`);
            }
            throw new Error('Failed to allocate imported stock: Unknown error');
        }
    }

    // Phân bổ cho nhiều parts cùng lúc (khi import request có nhiều items)
    async allocateMultipleImportedStocks(
        partIds: string[],
        center_id: string
    ): Promise<Array<{ part_id: string; updatedOrders: string[]; remainingQuantity: number }>> {
        try {
            const results = [];

            for (const part_id of partIds) {
                const result = await this.allocateImportedStock(part_id, center_id);
                results.push({
                    part_id,
                    ...result
                });
            }

            return results;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to allocate multiple imported stocks: ${error.message}`);
            }
            throw new Error('Failed to allocate multiple imported stocks: Unknown error');
        }
    }
}

export default new ServiceOrderService();
