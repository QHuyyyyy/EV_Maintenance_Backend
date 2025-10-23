import mongoose, { Document, Schema } from 'mongoose';

export enum MessageSenderRole {
    USER = 'user',
    STAFF = 'staff',
    SYSTEM = 'system',
}

interface IMessage extends Document {
    conversationId: mongoose.Types.ObjectId;
    senderId?: mongoose.Types.ObjectId;
    senderRole: MessageSenderRole;
    content: string;
    isRead: boolean;
    attachment?: string;
    systemMessageType?: 'staff_assigned' | 'staff_transferred' | 'staff_offline' | 'conversation_closed';
    createdAt: Date;
    updatedAt: Date;
}

const messageSchema = new Schema({
    conversationId: {
        type: Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true,
    },
    senderId: {
        type: Schema.Types.ObjectId,
        ref: 'SystemUser',
        default: null,
    },
    senderRole: {
        type: String,
        enum: Object.values(MessageSenderRole),
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    isRead: {
        type: Boolean,
        default: false,
    },
    attachment: {
        type: String,
        default: null,
    },
    systemMessageType: {
        type: String,
        enum: ['staff_assigned', 'staff_transferred', 'staff_offline', 'conversation_closed'],
        default: null,
    },
}, {
    timestamps: true,
});

// Index for efficient queries
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, createdAt: -1 });

export default mongoose.model<IMessage>('Message', messageSchema);
