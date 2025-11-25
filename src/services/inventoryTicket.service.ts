import InventoryTicket from '../models/inventoryTicket.model';
import InventoryTransaction from '../models/inventoryTransaction.model';
import CenterAutoPart from '../models/centerAutoPart.model';

export class InventoryTicketService {

    // Lấy tất cả InventoryTicket
    async getAllInventoryTickets(filters?: any) {
        try {
            const query: any = {};
            const page = filters?.page ? Number(filters.page) : 1;
            const limit = filters?.limit ? Number(filters.limit) : 10;
            const skip = (page - 1) * limit;

            if (filters?.center_id) {
                query.center_id = filters.center_id;
            }
            if (filters?.ticket_type) {
                query.ticket_type = filters.ticket_type;
            }
            if (filters?.status) {
                query.status = filters.status;
            }

            const [tickets, total] = await Promise.all([
                InventoryTicket.find(query)
                    .populate('center_id', 'name address phone')
                    .populate('created_by', 'name email')
                    .populate('approved_by', 'name email')
                    .populate({
                        path: 'items',
                        populate: { path: 'part_id', select: 'name category cost_price selling_price' }
                    })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit),
                InventoryTicket.countDocuments(query)
            ]);

            return {
                tickets,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit) || 1
            };
        } catch (error) {
            throw new Error(`Error fetching inventory tickets: ${error}`);
        }
    }

    // Lấy InventoryTicket theo ID
    async getInventoryTicketById(id: string) {
        try {
            const ticket = await InventoryTicket.findById(id)
                .populate('center_id', 'name address phone')
                .populate('created_by', 'name email')
                .populate('approved_by', 'name email')
                .populate({
                    path: 'items',
                    populate: { path: 'part_id', select: 'name category cost_price selling_price' }
                });

            return ticket;
        } catch (error) {
            throw new Error(`Error fetching inventory ticket: ${error}`);
        }
    }

    // Tạo InventoryTicket
    async createInventoryTicket(data: any) {
        try {
            // Generate ticket number
            const ticketNumber = `TICKET-${Date.now()}`;
            const ticketData = {
                ...data,
                ticket_number: ticketNumber
            };

            const ticket = new InventoryTicket(ticketData);
            const savedTicket = await ticket.save();

            return await this.getInventoryTicketById((savedTicket._id as any).toString());
        } catch (error) {
            throw new Error(`Error creating inventory ticket: ${error}`);
        }
    }

    // Cập nhật InventoryTicket
    async updateInventoryTicket(id: string, updateData: any) {
        try {
            // Load existing ticket to detect status transition
            const existing = await InventoryTicket.findById(id);
            if (!existing) {
                throw new Error('InventoryTicket not found');
            }

            const willComplete = updateData?.status === 'COMPLETED' && existing.status !== 'COMPLETED';

            // If completing, ensure completed_date is set
            if (willComplete) {
                updateData = {
                    ...updateData,
                    completed_date: updateData.completed_date || new Date()
                };
            }

            const updated = await InventoryTicket.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            ).populate('center_id', 'name address phone')
                .populate('created_by', 'name email')
                .populate('approved_by', 'name email')
                .populate({
                    path: 'items',
                    populate: { path: 'part_id', select: 'name category cost_price selling_price' }
                });

            if (!updated) {
                throw new Error('InventoryTicket not found after update');
            }

            // If we just moved to COMPLETED, create transaction and adjust stock
            if (willComplete) {
                // Build transaction items: quantity_change sign depends on ticket_type
                const transactionItems = (updated.items || []).map((it: any) => ({
                    part_id: it.part_id,
                    quantity_change: (updated.ticket_type === 'OUT' ? -1 : 1) * (it.quantity || it.quantity_change || 0),
                    notes: it.notes || ''
                }));

                const transactionData = {
                    center_id: updated.center_id,
                    ticket_id: updated._id,
                    transaction_type: updated.ticket_type,
                    reference_type: 'INTERNAL_TRANSFER',
                    reference_id: updated._id,
                    items: transactionItems,
                    created_by: (updated.created_by as any) || null,
                    notes: updated.notes || ''
                };

                // Create inventory transaction
                const transaction = new InventoryTransaction(transactionData);
                await transaction.save();

                // Update center stock for each item
                for (const it of transactionItems) {
                    try {
                        await CenterAutoPart.findOneAndUpdate(
                            { center_id: updated.center_id, part_id: it.part_id },
                            { $inc: { quantity: it.quantity_change } },
                            { new: true, upsert: true, setDefaultsOnInsert: true }
                        );
                    } catch (err) {
                        // Log and continue adjusting other items
                        console.error('Error updating CenterAutoPart for part', it.part_id, err);
                    }
                }
            }

            return updated;
        } catch (error) {
            throw new Error(`Error updating inventory ticket: ${error}`);
        }
    }


    // Xóa InventoryTicket
    async deleteInventoryTicket(id: string) {
        try {
            const deleted = await InventoryTicket.findByIdAndDelete(id);
            return deleted;
        } catch (error) {
            throw new Error(`Error deleting inventory ticket: ${error}`);
        }
    }

    // Thêm item vào ticket
    async addItemToTicket(ticketId: string, item: any) {
        try {
            const updated = await InventoryTicket.findByIdAndUpdate(
                ticketId,
                { $push: { items: item } },
                { new: true, runValidators: true }
            ).populate('center_id', 'name address phone')
                .populate('created_by', 'name email')
                .populate('approved_by', 'name email')
                .populate({
                    path: 'items',
                    populate: { path: 'part_id', select: 'name category cost_price selling_price' }
                });

            return updated;
        } catch (error) {
            throw new Error(`Error adding item to ticket: ${error}`);
        }
    }

    // Thêm nhiều items vào ticket
    async addMultipleItemsToTicket(ticketId: string, items: any[]) {
        try {
            const updated = await InventoryTicket.findByIdAndUpdate(
                ticketId,
                { $push: { items: { $each: items } } },
                { new: true, runValidators: true }
            ).populate('center_id', 'name address phone')
                .populate('created_by', 'name email')
                .populate('approved_by', 'name email')
                .populate({
                    path: 'items',
                    populate: { path: 'part_id', select: 'name category cost_price selling_price' }
                });

            return updated;
        } catch (error) {
            throw new Error(`Error adding items to ticket: ${error}`);
        }
    }

    // Xóa item khỏi ticket
    async removeItemFromTicket(ticketId: string, itemId: string) {
        try {
            const updated = await InventoryTicket.findByIdAndUpdate(
                ticketId,
                { $pull: { 'items._id': itemId } },
                { new: true, runValidators: true }
            ).populate('center_id', 'name address phone')
                .populate('created_by', 'name email')
                .populate('approved_by', 'name email')
                .populate({
                    path: 'items',
                    populate: { path: 'part_id', select: 'name category cost_price selling_price' }
                });

            return updated;
        } catch (error) {
            throw new Error(`Error removing item from ticket: ${error}`);
        }
    }
}

export default new InventoryTicketService();
