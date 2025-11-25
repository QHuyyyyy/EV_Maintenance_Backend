import ImportRequest from '../models/importRequest.model';
import ImportRequestItem from '../models/importRequestItem.model';
import serviceOrderService from './serviceOrder.service';

export class ImportRequestService {

    // Lấy tất cả ImportRequest
    async getAllImportRequests(filters?: any) {
        try {
            const query: any = {};
            const page = filters?.page ? Number(filters.page) : 1;
            const limit = filters?.limit ? Number(filters.limit) : 10;
            const skip = (page - 1) * limit;

            if (filters?.center_id) {
                query.center_id = filters.center_id;
            }
            if (filters?.status) {
                query.status = filters.status;
            }
            if (filters?.source_type) {
                query.source_type = filters.source_type;
            }

            const [requests, total] = await Promise.all([
                ImportRequest.find(query)
                    .populate('center_id', 'name address phone')
                    .populate('staff_id', 'name email')
                    .populate('source_center_id', 'name address')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit),
                ImportRequest.countDocuments(query)
            ]);

            return {
                requests,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit) || 1
            };
        } catch (error) {
            throw new Error(`Error fetching import requests: ${error}`);
        }
    }

    // Lấy ImportRequest theo ID
    async getImportRequestById(id: string) {
        try {
            const request = await ImportRequest.findById(id)
                .populate('center_id', 'name address phone')
                .populate('staff_id', 'name email')
                .populate('source_center_id', 'name address');

            // Lấy items của request
            const items = await ImportRequestItem.find({ request_id: id })
                .populate('part_id', 'name category cost_price selling_price');

            return {
                ...request?.toObject(),
                items
            };
        } catch (error) {
            throw new Error(`Error fetching import request: ${error}`);
        }
    }

    // Tạo ImportRequest (staff không điền source_type, source_center_id)
    async createImportRequest(data: any) {
        try {
            // Staff không được tự điền source_type và source_center_id
            const { items = [], ...importData } = data;

            importData.source_type = null;
            importData.source_center_id = null;

            const request = new ImportRequest(importData);
            const savedRequest = await request.save();
            const requestId = (savedRequest._id as any).toString();

            // Tạo items nếu có
            if (items && Array.isArray(items) && items.length > 0) {
                const itemsToCreate = items.map((item: any) => ({
                    ...item,
                    request_id: requestId
                }));
                await ImportRequestItem.insertMany(itemsToCreate);
            }

            return await this.getImportRequestById(requestId);
        } catch (error) {
            throw new Error(`Error creating import request: ${error}`);
        }
    }

    // Cập nhật ImportRequest (admin có thể điền source_type, source_center_id)
    async updateImportRequest(id: string, updateData: any) {
        try {
            const updated = await ImportRequest.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            ).populate('center_id', 'name address phone')
                .populate('staff_id', 'name email')
                .populate('source_center_id', 'name address');

            if (!updated) {
                throw new Error('ImportRequest not found');
            }

            // Lấy items của request
            const items = await ImportRequestItem.find({ request_id: id })
                .populate('part_id', 'name category cost_price selling_price');

            const result = {
                ...updated.toObject(),
                items
            };

            // AUTO: Nếu status thay đổi thành COMPLETED, tự động phân bổ hàng cho ServiceOrders
            if (updateData.status === 'COMPLETED' && updated.status === 'COMPLETED') {
                try {
                    // Chuẩn bị items cho allocation
                    const allocateItems = items.map((item: any) => ({
                        part_id: item.part_id._id.toString(),
                        quantity: item.quantity_imported || item.quantity_requested
                    }));

                    // Auto allocate stock FIFO (với center_id để tính tồn kho)
                    const allocationResults = await serviceOrderService.allocateMultipleImportedStocks(
                        allocateItems,
                        updated.center_id.toString()
                    );

                    // Attach kết quả allocation vào response
                    (result as any).allocationResults = allocationResults;
                } catch (allocationError: any) {
                    console.error(`[ImportRequest] Auto-allocation failed for request ${id}:`, allocationError.message);
                    // Không throw error - import vẫn được completed, chỉ log lại
                }
            }

            return result;
        } catch (error) {
            throw new Error(`Error updating import request: ${error}`);
        }
    }

    // Xóa ImportRequest
    async deleteImportRequest(id: string) {
        try {
            // Xóa items trước
            await ImportRequestItem.deleteMany({ request_id: id });

            const deleted = await ImportRequest.findByIdAndDelete(id);
            return deleted;
        } catch (error) {
            throw new Error(`Error deleting import request: ${error}`);
        }
    }
}

export default new ImportRequestService();
