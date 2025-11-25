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
        data: CreateServiceOrderRequest,
        center_id: string
    ): Promise<ServiceOrderDTO> {
        try {
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
        orders: CreateServiceOrderRequest[],
        center_id: string
    ): Promise<ServiceOrderDTO[]> {
        try {
            if (orders.length === 0) return [];

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
    ): Promise<{ part_id: string; totalQuantity: number }[]> {
        try {
            // Tìm tất cả service records của shift (và slot nếu có)
            const query: any = { shift_id: shiftId };
            if (slotId) {
                query.slot_id = slotId;
            }

            const records = await ServiceRecord.find(query).select('_id').lean();
            const recordIds = records.map(r => r._id);

            if (recordIds.length === 0) {
                return [];
            }

            // Lấy tất cả lacking orders từ các records này
            const lackingOrders = await ServiceOrder.find({
                service_record_id: { $in: recordIds },
                stock_status: 'LACKING'
            }).lean();

            // Gom lại theo part_id
            const partMap = new Map<string, number>();
            lackingOrders.forEach((order: any) => {
                const partId = order.part_id.toString();
                const current = partMap.get(partId) || 0;
                partMap.set(partId, current + order.quantity);
            });

            return Array.from(partMap.entries()).map(([part_id, totalQuantity]) => ({
                part_id,
                totalQuantity
            }));
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
    // Gọi khi ImportRequest hoàn thành
    async allocateImportedStock(
        part_id: string,
        importedQuantity: number,
        center_id?: string
    ): Promise<{ updatedOrders: string[]; remainingQuantity: number; totalAvailable: number }> {
        try {
            // Lấy số lượng tồn kho hiện tại (nếu có center_id)
            let existingStock = 0;
            if (center_id) {
                const centerPart = await CenterAutoPart.findOne({
                    center_id: center_id,
                    part_id: part_id
                }).lean();
                existingStock = centerPart?.quantity || 0;
            }

            // Tổng hàng khả dụng = tồn kho + nhập mới
            let currentStock = existingStock + importedQuantity;
            const totalAvailable = currentStock;
            const updatedOrderIds: string[] = [];

            // Lấy danh sách orders thiếu hàng, sắp xếp theo thời gian cũ nhất trước
            const lackingOrders = await ServiceOrder.find({
                part_id: part_id,
                stock_status: 'LACKING'
            })
                .sort({ createdAt: 1 })
                .lean();

            // Phân bổ hàng từng order
            for (const order of lackingOrders) {
                // Hết hàng thì dừng
                if (currentStock <= 0) {
                    break;
                }

                // Nếu hàng không đủ cho order này -> bỏ qua, chuyển sang order tiếp theo
                if (currentStock < order.quantity) {
                    continue;
                }

                // Nếu đủ thì cập nhật order thành SUFFICIENT
                if (currentStock >= order.quantity) {
                    await ServiceOrder.findByIdAndUpdate(
                        order._id,
                        { stock_status: 'SUFFICIENT' },
                        { new: false }
                    );

                    currentStock -= order.quantity;
                    updatedOrderIds.push(order._id.toString());
                }
            }

            return {
                updatedOrders: updatedOrderIds,
                remainingQuantity: currentStock,
                totalAvailable: totalAvailable
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
        items: Array<{ part_id: string; quantity: number }>,
        center_id?: string
    ): Promise<Array<{ part_id: string; updatedOrders: string[]; remainingQuantity: number; totalAvailable: number }>> {
        try {
            const results = [];

            for (const item of items) {
                const result = await this.allocateImportedStock(item.part_id, item.quantity, center_id);
                results.push({
                    part_id: item.part_id,
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
