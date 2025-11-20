import { Request, Response } from 'express';
import serviceDetailService from '../services/serviceDetail.service';
import { checkAndApplyWarranty } from '../services/warrantyCheck.service';

export class ServiceDetailController {
    async createServiceDetail(req: Request, res: Response) {

        /* #swagger.tags = ['Service Details']
           #swagger.summary = 'Create a new service detail entry'
           #swagger.description = 'Create a new service detail entry with automatic warranty check'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.requestBody = {
               required: true,
               content: {
                   'application/json': {
                       schema: { $ref: '#/components/schemas/CreateServiceDetail' }
                   }
               }
           }
        */
        try {
            const { record_id, centerpart_id, quantity, description } = req.body;

            const warrantyResult = await checkAndApplyWarranty(
                record_id,
                centerpart_id,
                quantity
            );

            // Tính tổng giá
            const totalPrice = warrantyResult.paidQty * warrantyResult.unitPrice;

            console.log(`   - Bảo hành: ${warrantyResult.warrantyQty} cái`);
            console.log(`   - Bán mới: ${warrantyResult.paidQty} cái`);
            console.log(`   - Giá/cái: ${warrantyResult.unitPrice} đ`);
            console.log(`   - Tổng tiền linh kiện: ${totalPrice} đ`);

            // Tạo ServiceDetail với thông tin đã tính toán + lưu warranty_qty & paid_qty để refresh vẫn giữ logic giá
            const detail = await serviceDetailService.createServiceDetail({
                record_id,
                centerpart_id,
                quantity,
                description: warrantyResult.description,
                unit_price: warrantyResult.unitPrice,
                warranty_qty: warrantyResult.warrantyQty,
                paid_qty: warrantyResult.paidQty
            });

            // Trả về đơn giản: data chứa các trường đã lưu + totalPrice tính nhanh
            res.status(201).json({
                success: true,
                message: 'Service detail created successfully',
                data: {
                    ...detail,
                    totalPrice
                }
            });
        } catch (error) {
            console.error(`❌ [CREATE SERVICE DETAIL] Lỗi:`, error);
            if (error instanceof Error) {
                res.status(400).json({
                    success: false,
                    message: error.message
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: 'Failed to create service detail'
                });
            }
        }
    }

    async getServiceDetailById(req: Request, res: Response) {
        /* #swagger.tags = ['Service Details']
           #swagger.summary = 'Get service detail by ID'
           #swagger.description = 'Get service detail by ID'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['id'] = {
               in: 'path',
               description: 'Service Detail ID',
               required: true,
               type: 'string'
           }
        */
        try {
            const detail = await serviceDetailService.getServiceDetailById(req.params.id);
            if (!detail) {
                return res.status(404).json({
                    success: false,
                    message: 'Service detail not found'
                });
            }
            const d: any = detail;
            const warrantyQty = typeof d.warranty_qty === 'number' ? d.warranty_qty : 0;
            const paidQty = typeof d.paid_qty === 'number' ? d.paid_qty : (d.quantity || 0);
            const unitPrice = d.unit_price || 0;
            const totalPriceId = paidQty * unitPrice;
            res.status(200).json({
                success: true,
                data: {
                    ...detail,
                    totalPrice: totalPriceId,
                    warranty_qty: warrantyQty,
                    paid_qty: paidQty
                }
            });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({
                    success: false,
                    message: error.message
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: 'Failed to get service detail'
                });
            }
        }
    }

    async getAllServiceDetails(req: Request, res: Response) {
        /* #swagger.tags = ['Service Details']
           #swagger.summary = 'Get all service details with optional filters'
           #swagger.description = 'Get all service details with optional filters'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['record_id'] = {
               in: 'query',
               description: 'Filter by service record ID',
               required: false,
               type: 'string'
           }
             #swagger.parameters['centerpart_id'] = {
               in: 'query',
               description: 'Filter by center auto part ID (CenterAutoPart _id)',
               required: false,
               type: 'string'
           }
           #swagger.parameters['page'] = {
               in: 'query',
               description: 'Page number',
               required: false,
               type: 'integer',
               default: 1
           }
           #swagger.parameters['limit'] = {
               in: 'query',
               description: 'Items per page',
               required: false,
               type: 'integer',
               default: 10
           }
        */
        try {
            const filters = {
                record_id: req.query.record_id as string,
                centerpart_id: req.query.centerpart_id as string,
                page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
                limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined
            };
            const result = await serviceDetailService.getAllServiceDetails(filters);

            // Chuẩn hóa thêm totalPrice vào từng phần tử để FE dùng trực tiếp
            const normalized = (result.details || []).map((d: any) => {
                const warrantyQty = typeof d.warranty_qty === 'number' ? d.warranty_qty : 0;
                const paidQty = typeof d.paid_qty === 'number' ? d.paid_qty : (d.quantity || 0);
                const unitPrice = d.unit_price || 0;
                return {
                    ...d,
                    warranty_qty: warrantyQty,
                    paid_qty: paidQty,
                    totalPrice: paidQty * unitPrice
                };
            });
            res.status(200).json({
                success: true,
                data: {
                    details: normalized,
                    total: result.total,
                    page: result.page,
                    limit: result.limit,
                    totalPages: result.totalPages
                }
            });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({
                    success: false,
                    message: error.message
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: 'Failed to get service details'
                });
            }
        }
    }

    async updateServiceDetail(req: Request, res: Response) {
        /* #swagger.tags = ['Service Details']
           #swagger.summary = 'Update a service detail entry'
           #swagger.description = 'Update a service detail entry'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['id'] = {
               in: 'path',
               description: 'Service Detail ID',
               required: true,
               type: 'string'
           }
           #swagger.requestBody = {
               required: true,
               content: {
                   'application/json': {
                       schema: { $ref: '#/components/schemas/UpdateServiceDetail' }
                   }
               }
           }
        */
        try {
            const detail = await serviceDetailService.updateServiceDetail(req.params.id, req.body);
            if (!detail) {
                return res.status(404).json({
                    success: false,
                    message: 'Service detail not found'
                });
            }
            res.status(200).json({
                success: true,
                message: 'Service detail updated successfully',
                data: detail
            });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({
                    success: false,
                    message: error.message
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: 'Failed to update service detail'
                });
            }
        }
    }

    async deleteServiceDetail(req: Request, res: Response) {
        /* #swagger.tags = ['Service Details']
              #swagger.summary = 'Delete a service detail entry'
           #swagger.description = 'Delete a service detail entry'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['id'] = {
               in: 'path',
               description: 'Service Detail ID',
               required: true,
               type: 'string'
           }
        */
        try {
            const detail = await serviceDetailService.deleteServiceDetail(req.params.id);
            if (!detail) {
                return res.status(404).json({
                    success: false,
                    message: 'Service detail not found'
                });
            }
            res.status(200).json({
                success: true,
                message: 'Service detail deleted successfully',
                data: detail
            });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({
                    success: false,
                    message: error.message
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: 'Failed to delete service detail'
                });
            }
        }
    }
}

export default new ServiceDetailController();