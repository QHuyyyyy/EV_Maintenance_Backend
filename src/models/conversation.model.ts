import mongoose, { Document, Schema } from 'mongoose';

export enum ConversationStatus {
    WAITING = 'waiting',
    ACTIVE = 'active',
    CLOSED = 'closed',
}

interface IAssignmentHistory {
    staffId: mongoose.Types.ObjectId;
    assignedAt: Date;
    unassignedAt?: Date;
    unassignReason?: 'manual_transfer' | 'staff_offline' | 'staff_logout';
}

interface IConversation extends Document {
    customerId: mongoose.Types.ObjectId;
    assignedStaffId?: mongoose.Types.ObjectId;
    lastAssignedStaff?: mongoose.Types.ObjectId;
    status: ConversationStatus;
    assignmentHistory: IAssignmentHistory[];
    createdAt: Date;
    updatedAt: Date;
}

const assignmentHistorySchema = new Schema({
    staffId: {
        type: Schema.Types.ObjectId,
        ref: 'SystemUser',
        required: true,
    },
    assignedAt: {
        type: Date,
        required: true,
    },
    unassignedAt: {
        type: Date,
        default: null,
    },
    unassignReason: {
        type: String,
        enum: ['manual_transfer', 'staff_offline', 'staff_logout'],
        default: null,
    },
}, { _id: false });

const conversationSchema = new Schema({
    customerId: {
        type: Schema.Types.ObjectId,
        ref: 'Customer',
        required: true,
    },
    assignedStaffId: {
        type: Schema.Types.ObjectId,
        ref: 'SystemUser',
        default: null,
    },
    lastAssignedStaff: {
        type: Schema.Types.ObjectId,
        ref: 'SystemUser',
        default: null,
    },
    status: {
        type: String,
        enum: Object.values(ConversationStatus),
        default: ConversationStatus.WAITING,
    },
    assignmentHistory: {
        type: [assignmentHistorySchema],
        default: [],
    },
}, {
    timestamps: true,
});

// Index for efficient queries
conversationSchema.index({ customerId: 1, status: 1 });
conversationSchema.index({ assignedStaffId: 1, status: 1 });
conversationSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model<IConversation>('Conversation', conversationSchema);
