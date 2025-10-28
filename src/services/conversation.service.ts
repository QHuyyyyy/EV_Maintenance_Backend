import Conversation, { ConversationStatus } from '../models/conversation.model';
import Message, { MessageSenderRole } from '../models/message.model';
import Customer from '../models/customer.model';
import SystemUser from '../models/systemUser.model';
import { Types } from 'mongoose';
import chatSocketService from '../socket/chat.socket';

export class ConversationService {

    async getOrCreateConversation(customerId: string) {
        const customerObjectId = new Types.ObjectId(customerId);
        let conversation = await Conversation.findOne({
            customerId: customerObjectId,
        }).sort({ createdAt: -1 });

        if (!conversation) {
            conversation = new Conversation({
                customerId: customerObjectId,
                status: ConversationStatus.WAITING,
                assignmentHistory: [],
            });
            await conversation.save();

            // Emit socket event - new waiting chat
            const customer = await Customer.findById(customerObjectId);
            chatSocketService.emitNewWaitingChat((conversation._id as any).toString(), {
                customerId: customerObjectId,
                customerName: customer?.customerName || 'Unknown',
                status: ConversationStatus.WAITING,
                createdAt: conversation.createdAt,
            });

            return { conversation, isNew: true };
        }

        if (conversation.status === ConversationStatus.CLOSED) {
            conversation.status = ConversationStatus.WAITING;
            conversation.assignedStaffId = undefined;

            if (conversation.lastAssignedStaff) {
                const lastStaff = await SystemUser.findById(conversation.lastAssignedStaff);
                if (lastStaff && (lastStaff as any).isOnline) {
                    conversation.assignedStaffId = conversation.lastAssignedStaff;
                    conversation.status = ConversationStatus.ACTIVE;

                    conversation.assignmentHistory.push({
                        staffId: conversation.lastAssignedStaff,
                        assignedAt: new Date(),
                        unassignedAt: undefined,
                    });
                }
            }

            await conversation.save();

            // Emit socket event - conversation reopened
            chatSocketService.emitConversationUpdate((conversation._id as any).toString(), {
                conversationId: conversation._id,
                status: conversation.status,
                isReopened: true,
            });

            return { conversation, isNew: false, isReopened: true };
        }

        // If active or waiting, continue with same conversation
        return { conversation, isNew: false, isReopened: false };
    }

    /**
     * Flow 2: Staff takes chat
     * - Ensure only one staff can take it
     * - Set assignedStaffId = current staff, status = "active"
     * - Append a new record to assignmentHistory
     * - Send a system message announcing staff assignment
     */
    async takeChat(conversationId: string, staffId: string) {
        const convId = new Types.ObjectId(conversationId);
        const stfId = new Types.ObjectId(staffId);

        const conversation = await Conversation.findById(convId);
        if (!conversation) {
            throw new Error('Conversation not found');
        }

        // Check if already assigned
        if (conversation.status === ConversationStatus.ACTIVE && conversation.assignedStaffId) {
            throw new Error('This conversation is already assigned to another staff');
        }

        // Assign to this staff
        conversation.assignedStaffId = stfId;
        conversation.lastAssignedStaff = stfId;
        conversation.status = ConversationStatus.ACTIVE;

        // Append to assignment history
        conversation.assignmentHistory.push({
            staffId: stfId,
            assignedAt: new Date(),
            unassignedAt: undefined,
        });

        await conversation.save();

        // Send system message
        const systemMessage = await Message.create({
            conversationId: convId,
            senderId: stfId,
            senderRole: MessageSenderRole.SYSTEM,
            content: `Staff has taken this chat`,
            systemMessageType: 'staff_assigned',
            isRead: false,
        });

        // Get staff info
        const staff = await SystemUser.findById(stfId);

        // Emit socket events
        chatSocketService.emitStaffAssigned(conversationId, stfId.toString(), staff?.name);
        chatSocketService.emitChatAssigned(conversationId, stfId.toString());
        chatSocketService.emitSystemMessage(conversationId, {
            ...systemMessage.toObject(),
            senderRole: MessageSenderRole.SYSTEM,
        });

        return conversation;
    }

    /**
     * Flow 4: Staff transfers conversation
     * - Mark the previous staff's record in assignmentHistory with unassignedAt
     * - Add a new entry for the new staff
     * - Update assignedStaffId and send a system message about the transfer
     */
    async transferChat(conversationId: string, newStaffId: string, oldStaffId: string) {
        const convId = new Types.ObjectId(conversationId);
        const newStfId = new Types.ObjectId(newStaffId);
        const oldStfId = new Types.ObjectId(oldStaffId);

        const conversation = await Conversation.findById(convId);
        if (!conversation) {
            throw new Error('Conversation not found');
        }

        // Mark old staff as unassigned
        const lastAssignment = conversation.assignmentHistory[conversation.assignmentHistory.length - 1];
        if (lastAssignment && lastAssignment.staffId.equals(oldStfId)) {
            lastAssignment.unassignedAt = new Date();
            lastAssignment.unassignReason = 'manual_transfer';
        }

        // Add new staff
        conversation.assignmentHistory.push({
            staffId: newStfId,
            assignedAt: new Date(),
            unassignedAt: undefined,
        });

        conversation.assignedStaffId = newStfId;
        conversation.lastAssignedStaff = newStfId;

        await conversation.save();

        // Send system message about transfer
        const systemMessage = await Message.create({
            conversationId: convId,
            senderRole: MessageSenderRole.SYSTEM,
            content: `Chat has been transferred to another staff member`,
            systemMessageType: 'staff_transferred',
            isRead: false,
        });

        // Emit socket events
        chatSocketService.emitChatTransferred(conversationId, oldStfId.toString(), newStfId.toString());
        chatSocketService.emitSystemMessage(conversationId, {
            ...systemMessage.toObject(),
            senderRole: MessageSenderRole.SYSTEM,
        });

        return conversation;
    }

    /**
     * Flow 5: Staff goes offline or logged out
     * - Mark them unassigned, set assignedStaffId = null, status = "waiting"
     * - Send a system message notifying other staff
     */
    async handleStaffOffline(staffId: string, reason: 'offline' | 'logout' = 'offline') {
        const stfId = new Types.ObjectId(staffId);

        // Find all active conversations assigned to this staff
        const conversations = await Conversation.find({
            assignedStaffId: stfId,
            status: ConversationStatus.ACTIVE,
        });

        for (const conversation of conversations) {
            // Mark as unassigned in assignment history
            const lastAssignment = conversation.assignmentHistory[conversation.assignmentHistory.length - 1];
            if (lastAssignment && lastAssignment.staffId.equals(stfId)) {
                lastAssignment.unassignedAt = new Date();
                lastAssignment.unassignReason = reason === 'logout' ? 'staff_logout' : 'staff_offline';
            }

            // Reset conversation to waiting
            conversation.assignedStaffId = undefined;
            conversation.status = ConversationStatus.WAITING;

            await conversation.save();

            // Send system message
            await Message.create({
                conversationId: conversation._id,
                senderRole: MessageSenderRole.SYSTEM,
                content: `Staff member went ${reason}. This chat is now available for other staff.`,
                systemMessageType: 'staff_offline',
                isRead: false,
            });
        }
    }

    /**
     * Flow 6: When conversation ends
     * - Set status = "closed", update assignmentHistory for the last staff
     * - Send a system message "Conversation closed"
     */
    async closeConversation(conversationId: string) {
        const convId = new Types.ObjectId(conversationId);

        const conversation = await Conversation.findById(convId);
        if (!conversation) {
            throw new Error('Conversation not found');
        }

        // Mark last staff as unassigned
        if (conversation.assignmentHistory.length > 0) {
            const lastAssignment = conversation.assignmentHistory[conversation.assignmentHistory.length - 1];
            if (!lastAssignment.unassignedAt) {
                lastAssignment.unassignedAt = new Date();
            }
        }

        conversation.status = ConversationStatus.CLOSED;
        conversation.assignedStaffId = undefined;

        await conversation.save();

        // Send system message
        await Message.create({
            conversationId: convId,
            senderRole: MessageSenderRole.SYSTEM,
            content: `Conversation closed`,
            systemMessageType: 'conversation_closed',
            isRead: false,
        });

        return conversation;
    }

    /**
     * Get all waiting conversations for staff dashboard
     */
    async getWaitingConversations(page: number = 1, limit: number = 20) {
        const skip = (page - 1) * limit;

        const conversations = await Conversation.find({
            status: ConversationStatus.WAITING,
        })
            .populate('customerId', 'customerName')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalCount = await Conversation.countDocuments({
            status: ConversationStatus.WAITING,
        });

        return {
            conversations,
            totalCount,
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
        };
    }

    /**
     * Get conversations assigned to a staff member
     */
    async getStaffConversations(staffId: string, status?: ConversationStatus) {
        const stfId = new Types.ObjectId(staffId);

        const query: any = {
            assignedStaffId: stfId,
        };

        if (status) {
            query.status = status;
        }

        const conversations = await Conversation.find(query)
            .populate('customerId', 'customerName')
            .populate('assignmentHistory.staffId', 'name')
            .sort({ updatedAt: -1 });

        return conversations;
    }

    /**
     * Get conversation details with paginated chat history (Lazy Loading)
     * @param conversationId - Conversation ID
     * @param page - Page number (default: 1, load newest messages first)
     * @param limit - Number of messages per page (default: 20)
     */
    async getConversationWithHistory(conversationId: string, page: number = 1, limit: number = 20) {
        const convId = new Types.ObjectId(conversationId);

        const conversation = await Conversation.findById(convId)
            .populate('customerId')
            .populate('assignedStaffId', 'name')
            .populate('assignmentHistory.staffId', 'name');

        if (!conversation) {
            throw new Error('Conversation not found');
        }

        // Get total message count
        const totalMessages = await Message.countDocuments({
            conversationId: convId,
        });

        // Calculate skip - load from newest first, then paginate backward
        // Page 1 = most recent messages
        const skip = Math.max(0, totalMessages - page * limit);

        // Get paginated messages in ascending order
        const messages = await Message.find({
            conversationId: convId,
        })
            .populate('senderId', 'name')
            .sort({ createdAt: 1 })
            .skip(skip)
            .limit(limit);

        return {
            conversation,
            messages,
            pagination: {
                currentPage: page,
                limit,
                totalMessages,
                totalPages: Math.ceil(totalMessages / limit),
                hasMoreMessages: skip > 0, // true if there are older messages
            },
        };
    }

    /**
     * Get latest conversation by customerId
     * - Returns the most recent conversation document for the given customerId
     */
    async getConversationByCustomer(customerId: string) {
        const customerObjectId = new Types.ObjectId(customerId);

        const conversation = await Conversation.findOne({ customerId: customerObjectId })
            .populate('customerId', 'customerName')
            .populate('assignedStaffId', 'name')
            .populate('assignmentHistory.staffId', 'name')
            .sort({ createdAt: -1 });

        return conversation;
    }


}
export default new ConversationService();
