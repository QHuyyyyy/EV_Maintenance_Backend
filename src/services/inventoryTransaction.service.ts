import InventoryTransaction from '../models/inventoryTransaction.model';

export class InventoryTransactionService {

    // Lấy tất cả InventoryTransaction
    async getAllInventoryTransactions(filters?: any) {
        try {
            const query: any = {};
            const page = filters?.page ? Number(filters.page) : 1;
            const limit = filters?.limit ? Number(filters.limit) : 10;
            const skip = (page - 1) * limit;

            if (filters?.center_id) {
                query.center_id = filters.center_id;
            }
            if (filters?.transaction_type) {
                query.transaction_type = filters.transaction_type;
            }
            if (filters?.status) {
                query.status = filters.status;
            }
            if (filters?.reference_type) {
                query.reference_type = filters.reference_type;
            }

            const [transactions, total] = await Promise.all([
                InventoryTransaction.find(query)
                    .populate('center_id', 'name address phone')
                    .populate('ticket_id', 'ticket_number ticket_type status')
                    .populate('created_by', 'name email')
                    .populate({
                        path: 'items',
                        populate: { path: 'part_id', select: 'name category cost_price selling_price' }
                    })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit),
                InventoryTransaction.countDocuments(query)
            ]);

            return {
                transactions,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit) || 1
            };
        } catch (error) {
            throw new Error(`Error fetching inventory transactions: ${error}`);
        }
    }

    // Lấy InventoryTransaction theo ID
    async getInventoryTransactionById(id: string) {
        try {
            const transaction = await InventoryTransaction.findById(id)
                .populate('center_id', 'name address phone')
                .populate('ticket_id', 'ticket_number ticket_type status')
                .populate('created_by', 'name email')
                .populate({
                    path: 'items',
                    populate: { path: 'part_id', select: 'name category cost_price selling_price' }
                });

            return transaction;
        } catch (error) {
            throw new Error(`Error fetching inventory transaction: ${error}`);
        }
    }

    // Tạo InventoryTransaction
    async createInventoryTransaction(data: any) {
        try {
            const transaction = new InventoryTransaction(data);
            const savedTransaction = await transaction.save();

            return await this.getInventoryTransactionById((savedTransaction._id as any).toString());
        } catch (error) {
            throw new Error(`Error creating inventory transaction: ${error}`);
        }
    }

    // Cập nhật InventoryTransaction
    async updateInventoryTransaction(id: string, updateData: any) {
        try {
            const updated = await InventoryTransaction.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            ).populate('center_id', 'name address phone')
                .populate('ticket_id', 'ticket_number ticket_type status')
                .populate('created_by', 'name email')
                .populate({
                    path: 'items',
                    populate: { path: 'part_id', select: 'name category cost_price selling_price' }
                });

            if (!updated) {
                throw new Error('InventoryTransaction not found');
            }

            return updated;
        } catch (error) {
            throw new Error(`Error updating inventory transaction: ${error}`);
        }
    }

    // Hoàn thành InventoryTransaction
    async completeInventoryTransaction(id: string) {
        try {
            const updated = await InventoryTransaction.findByIdAndUpdate(
                id,
                { status: 'COMPLETED' },
                { new: true, runValidators: true }
            ).populate('center_id', 'name address phone')
                .populate('ticket_id', 'ticket_number ticket_type status')
                .populate('created_by', 'name email')
                .populate({
                    path: 'items',
                    populate: { path: 'part_id', select: 'name category cost_price selling_price' }
                });

            return updated;
        } catch (error) {
            throw new Error(`Error completing inventory transaction: ${error}`);
        }
    }

    // Hủy InventoryTransaction
    async cancelInventoryTransaction(id: string) {
        try {
            const updated = await InventoryTransaction.findByIdAndUpdate(
                id,
                { status: 'CANCELLED' },
                { new: true, runValidators: true }
            ).populate('center_id', 'name address phone')
                .populate('ticket_id', 'ticket_number ticket_type status')
                .populate('created_by', 'name email')
                .populate({
                    path: 'items',
                    populate: { path: 'part_id', select: 'name category cost_price selling_price' }
                });

            return updated;
        } catch (error) {
            throw new Error(`Error cancelling inventory transaction: ${error}`);
        }
    }

    // Xóa InventoryTransaction
    async deleteInventoryTransaction(id: string) {
        try {
            const deleted = await InventoryTransaction.findByIdAndDelete(id);
            return deleted;
        } catch (error) {
            throw new Error(`Error deleting inventory transaction: ${error}`);
        }
    }

    // Thêm item vào transaction
    async addItemToTransaction(transactionId: string, item: any) {
        try {
            const updated = await InventoryTransaction.findByIdAndUpdate(
                transactionId,
                { $push: { items: item } },
                { new: true, runValidators: true }
            ).populate('center_id', 'name address phone')
                .populate('ticket_id', 'ticket_number ticket_type status')
                .populate('created_by', 'name email')
                .populate({
                    path: 'items',
                    populate: { path: 'part_id', select: 'name category cost_price selling_price' }
                });

            return updated;
        } catch (error) {
            throw new Error(`Error adding item to transaction: ${error}`);
        }
    }

    // Xóa item khỏi transaction
    async removeItemFromTransaction(transactionId: string, itemId: string) {
        try {
            const updated = await InventoryTransaction.findByIdAndUpdate(
                transactionId,
                { $pull: { 'items._id': itemId } },
                { new: true, runValidators: true }
            ).populate('center_id', 'name address phone')
                .populate('ticket_id', 'ticket_number ticket_type status')
                .populate('created_by', 'name email')
                .populate({
                    path: 'items',
                    populate: { path: 'part_id', select: 'name category cost_price selling_price' }
                });

            return updated;
        } catch (error) {
            throw new Error(`Error removing item from transaction: ${error}`);
        }
    }
}

export default new InventoryTransactionService();
