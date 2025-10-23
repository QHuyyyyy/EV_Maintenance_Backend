import Message, { MessageSenderRole } from '../models/message.model';
import { Types } from 'mongoose';

export class MessageService {
    /**
     * Save message in conversation
     */
    async sendMessage(
        conversationId: string,
        senderId: string | null,
        senderRole: MessageSenderRole,
        content: string,
        attachment?: string
    ) {
        const convId = new Types.ObjectId(conversationId);
        const sdrId = senderId ? new Types.ObjectId(senderId) : null;

        const message = new Message({
            conversationId: convId,
            senderId: sdrId,
            senderRole,
            content,
            attachment: attachment || null,
            isRead: false,
        });

        await message.save();
        await message.populate('senderId', 'name');

        return message;
    }

    /**
     * Get messages for a conversation
     */
    async getMessages(conversationId: string, page: number = 1, limit: number = 50) {
        const convId = new Types.ObjectId(conversationId);
        const skip = (page - 1) * limit;

        const messages = await Message.find({
            conversationId: convId,
        })
            .populate('senderId', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalCount = await Message.countDocuments({
            conversationId: convId,
        });

        return {
            messages: messages.reverse(),
            totalCount,
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
        };
    }

    /**
     * Mark messages as read
     */
    async markAsRead(conversationId: string, userId?: string) {
        const convId = new Types.ObjectId(conversationId);

        await Message.updateMany(
            {
                conversationId: convId,
                isRead: false,
            },
            {
                isRead: true,
            }
        );
    }

    /**
     * Get unread message count for user
     */
    async getUnreadCount(conversationId: string) {
        const convId = new Types.ObjectId(conversationId);

        const unreadCount = await Message.countDocuments({
            conversationId: convId,
            isRead: false,
        });

        return unreadCount;
    }

    /**
     * Get last message in conversation
     */
    async getLastMessage(conversationId: string) {
        const convId = new Types.ObjectId(conversationId);

        const lastMessage = await Message.findOne({
            conversationId: convId,
        })
            .populate('senderId', 'name')
            .sort({ createdAt: -1 });

        return lastMessage;
    }
}
