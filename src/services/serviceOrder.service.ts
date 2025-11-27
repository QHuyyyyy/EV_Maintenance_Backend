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
    // Tạo order đơn lẻ với kiểm tra stock tự động (tính held từ SUFFICIENT orders)
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

            const centerPart = await CenterAutoPart.findOne({
                center_id: center_id,
                part_id: data.part_id
            }).lean();
            const stock = centerPart?.quantity || 0;

            const orders = await ServiceOrder.find({
                part_id: data.part_id,
            })
                .populate({
                    path: 'service_record_id',
                    match: { status: { $nin: ['completed', 'canceled'] } }
                })
                .lean() as any[];

            const held = orders
                .filter(o => o.service_record_id)
                .reduce((sum, o) => sum + (o.quantity || 0), 0);

            // Tính available và xác định stock_status
            const available = stock - held;
            const stockStatus = available >= data.quantity ? 'SUFFICIENT' : 'LACKING';

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

    // Update quantity và kiểm tra lại stock status
    async updateServiceOrderQuantity(
        id: string,
        quantity: number
    ): Promise<ServiceOrderDTO | null> {
        try {
            // Lấy order hiện tại
            const order = await ServiceOrder.findById(id)
                .populate('service_record_id')
                .lean() as any;

            if (!order) {
                throw new Error('Service order not found');
            }

            // Lấy center_id từ service_record
            const serviceRecord = await ServiceRecord.findById(order.service_record_id._id)
                .populate('appointment_id')
                .lean() as any;

            if (!serviceRecord) {
                throw new Error('Service record not found');
            }

            const center_id = serviceRecord.appointment_id.center_id;

            // Kiểm tra stock hiện tại
            const centerPart = await CenterAutoPart.findOne({
                center_id: center_id,
                part_id: order.part_id
            }).lean();

            const stock = centerPart?.quantity || 0;

            // Lấy tổng held từ các SUFFICIENT orders khác (loại trừ order này)
            const otherSufficientOrders = await ServiceOrder.find({
                _id: { $ne: id },
                part_id: order.part_id,
                stock_status: 'SUFFICIENT'
            })
                .populate({
                    path: 'service_record_id',
                    match: { appointment_id: serviceRecord.appointment_id._id }
                })
                .lean() as any[];

            const held = otherSufficientOrders
                .filter(o => o.service_record_id)
                .reduce((sum, o) => sum + (o.quantity || 0), 0);

            // Tính available và xác định stock_status
            const available = stock - held;
            const stockStatus = available >= quantity ? 'SUFFICIENT' : 'LACKING';

            return await ServiceOrder.findByIdAndUpdate(
                id,
                {
                    quantity,
                    stock_status: stockStatus
                },
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

            // FIX: Find all ServiceRecords that belong to this center
            const serviceRecords = await ServiceRecord.find()
                .populate('appointment_id')
                .lean() as any[];

            const centerServiceRecordIds = serviceRecords
                .filter(sr => sr.appointment_id && sr.appointment_id.center_id?.toString() === center_id)
                .map(sr => sr._id);

            console.log(`[Allocation] Part: ${part_id}, Center: ${center_id}, Current Stock: ${currentStock}, Service Records for this center: ${centerServiceRecordIds.length}`);

            // Lấy danh sách orders thiếu hàng của part này, sắp xếp theo thời gian cũ nhất trước
            // FIX: Filter by service_record_id to ensure we only allocate to the correct center
            const lackingOrders = await ServiceOrder.find({
                part_id: part_id,
                stock_status: 'LACKING',
                service_record_id: { $in: centerServiceRecordIds }
            })
                .sort({ createdAt: 1 })
                .populate({
                    path: 'service_record_id',
                    match: { status: { $nin: ['completed', 'canceled'] } }
                })
                .lean() as any[];

            // Filter out orders whose populated service_record_id did not match (i.e., completed or canceled)
            const filteredLackingOrders = lackingOrders.filter(o => o.service_record_id);

            console.log(`[Allocation] Found ${lackingOrders.length} lacking orders for this part and center, ${filteredLackingOrders.length} eligible after filtering completed/canceled`);

            // Phân bổ hàng từng order
            for (const order of filteredLackingOrders) {
                // Hết hàng thì dừng
                if (remainingStock <= 0) {
                    break;
                }

                // Nếu hàng không đủ cho order này -> bỏ qua, chuyển sang order tiếp theo
                if (remainingStock < order.quantity) {
                    console.log(`[Allocation] Order ${order._id} needs ${order.quantity} but only ${remainingStock} remaining`);
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
                    console.log(`[Allocation] Updated order ${order._id} to SUFFICIENT (qty: ${order.quantity}, remaining: ${remainingStock})`);
                }
            }

            console.log(`[Allocation] Complete - Updated ${updatedOrderIds.length} orders, remaining stock: ${remainingStock}`);

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
