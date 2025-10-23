// Chat System TypeScript Types and Interfaces
// For Frontend Integration

export enum ConversationStatus {
    WAITING = 'waiting',
    ACTIVE = 'active',
    CLOSED = 'closed',
}

export enum MessageSenderRole {
    USER = 'user',
    STAFF = 'staff',
    SYSTEM = 'system',
}

export enum SystemMessageType {
    STAFF_ASSIGNED = 'staff_assigned',
    STAFF_TRANSFERRED = 'staff_transferred',
    STAFF_OFFLINE = 'staff_offline',
    CONVERSATION_CLOSED = 'conversation_closed',
}

export enum UnassignReason {
    MANUAL_TRANSFER = 'manual_transfer',
    STAFF_OFFLINE = 'staff_offline',
    STAFF_LOGOUT = 'staff_logout',
}

/**
 * Assignment history entry
 */
export interface IAssignmentHistory {
    staffId: string;
    assignedAt: string;
    unassignedAt?: string | null;
    unassignReason?: UnassignReason | null;
}

/**
 * Conversation object
 */
export interface IConversation {
    _id: string;
    customerId: string;
    assignedStaffId?: string | null;
    lastAssignedStaff?: string | null;
    status: ConversationStatus;
    assignmentHistory: IAssignmentHistory[];
    createdAt: string;
    updatedAt: string;
}

/**
 * Conversation with populated fields
 */
export interface IConversationPopulated {
    _id: string;
    customerId: {
        _id: string;
        customerName: string;
    };
    assignedStaffId?: {
        _id: string;
        name: string;
    } | null;
    lastAssignedStaff?: {
        _id: string;
        name: string;
    } | null;
    status: ConversationStatus;
    assignmentHistory: (IAssignmentHistory & {
        staffId: {
            _id: string;
            name: string;
        };
    })[];
    createdAt: string;
    updatedAt: string;
}

/**
 * Message object
 */
export interface IMessage {
    _id: string;
    conversationId: string;
    senderId?: string | null;
    senderRole: MessageSenderRole;
    content: string;
    isRead: boolean;
    attachment?: string | null;
    systemMessageType?: SystemMessageType | null;
    createdAt: string;
    updatedAt: string;
}

/**
 * Message with populated sender
 */
export interface IMessagePopulated {
    _id: string;
    conversationId: string;
    senderId?: {
        _id: string;
        name: string;
    } | null;
    senderRole: MessageSenderRole;
    content: string;
    isRead: boolean;
    attachment?: string | null;
    systemMessageType?: SystemMessageType | null;
    createdAt: string;
    updatedAt: string;
}

/**
 * API Response wrapper
 */
export interface IApiResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
}

/**
 * Send message request
 */
export interface ISendMessageRequest {
    customerId: string;
    content: string;
    attachment?: string;
}

/**
 * Send message response
 */
export interface ISendMessageResponse {
    conversation: IConversation;
    message: IMessage;
    isNewConversation: boolean;
    isReopened: boolean;
}

/**
 * Take chat request
 */
export interface ITakeChatRequest {
    staffId: string;
}

/**
 * Staff message request
 */
export interface IStaffMessageRequest {
    staffId: string;
    content: string;
    attachment?: string;
}

/**
 * Transfer chat request
 */
export interface ITransferChatRequest {
    currentStaffId: string;
    newStaffId: string;
}

/**
 * Staff offline request
 */
export interface IStaffOfflineRequest {
    reason?: 'offline' | 'logout';
}

/**
 * Get waiting conversations response
 */
export interface IGetWaitingConversationsResponse {
    conversations: IConversationPopulated[];
    totalCount: number;
    currentPage: number;
    totalPages: number;
}

/**
 * Get messages response
 */
export interface IGetMessagesResponse {
    messages: IMessagePopulated[];
    totalCount: number;
    currentPage: number;
    totalPages: number;
}

/**
 * Get conversation with history response
 */
export interface IGetConversationWithHistoryResponse {
    conversation: IConversationPopulated;
    messages: IMessagePopulated[];
}

/**
 * Conversation with last message
 */
export interface IConversationWithPreview extends IConversationPopulated {
    lastMessage?: IMessagePopulated;
    unreadCount?: number;
}

/**
 * Chat service interface for TypeScript projects
 */
export interface IChatService {
    // User operations
    sendMessage(request: ISendMessageRequest): Promise<IApiResponse<ISendMessageResponse>>;
    getConversationHistory(conversationId: string): Promise<IApiResponse<IGetConversationWithHistoryResponse>>;
    markAsRead(conversationId: string): Promise<IApiResponse<void>>;

    // Staff operations
    getWaitingConversations(page?: number, limit?: number): Promise<IApiResponse<IGetWaitingConversationsResponse>>;
    takeChat(conversationId: string, staffId: string): Promise<IApiResponse<IConversation>>;
    sendStaffMessage(conversationId: string, staffId: string, content: string, attachment?: string): Promise<IApiResponse<IMessage>>;
    transferChat(conversationId: string, currentStaffId: string, newStaffId: string): Promise<IApiResponse<IConversation>>;
    getMyConversations(staffId: string, status?: ConversationStatus): Promise<IApiResponse<IConversationPopulated[]>>;
    closeConversation(conversationId: string): Promise<IApiResponse<IConversation>>;
    handleOffline(staffId: string, reason?: 'offline' | 'logout'): Promise<IApiResponse<void>>;
}

/**
 * Real-time chat event types for Socket.io
 */
export interface IChatEvents {
    // Server -> Client
    'message:new': (message: IMessagePopulated) => void;
    'message:read': (messageIds: string[]) => void;
    'conversation:assigned': (conversation: IConversationPopulated, staff: { _id: string; name: string }) => void;
    'conversation:transferred': (conversation: IConversationPopulated, newStaff: { _id: string; name: string }) => void;
    'conversation:offline': (conversation: IConversationPopulated) => void;
    'conversation:closed': (conversation: IConversationPopulated) => void;
    'typing:start': (userId: string, userName: string) => void;
    'typing:end': (userId: string) => void;

    // Client -> Server
    'join_conversation': (conversationId: string) => void;
    'leave_conversation': (conversationId: string) => void;
    'typing:indicator': (conversationId: string, isTyping: boolean) => void;
}

/**
 * Example usage for customer component
 */
export class ChatClient implements IChatService {
    private baseUrl: string;

    constructor(apiUrl: string) {
        this.baseUrl = apiUrl;
    }

    async sendMessage(request: ISendMessageRequest): Promise<IApiResponse<ISendMessageResponse>> {
        const response = await fetch(`${this.baseUrl}/api/chat/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request),
        });
        return (await response.json()) as IApiResponse<ISendMessageResponse>;
    }

    async getConversationHistory(conversationId: string): Promise<IApiResponse<IGetConversationWithHistoryResponse>> {
        const response = await fetch(`${this.baseUrl}/api/chat/${conversationId}`);
        return (await response.json()) as IApiResponse<IGetConversationWithHistoryResponse>;
    }

    async markAsRead(conversationId: string): Promise<IApiResponse<void>> {
        const response = await fetch(`${this.baseUrl}/api/chat/${conversationId}/mark-read`, {
            method: 'POST',
        });
        return (await response.json()) as IApiResponse<void>;
    }

    async getWaitingConversations(
        page: number = 1,
        limit: number = 20
    ): Promise<IApiResponse<IGetWaitingConversationsResponse>> {
        const response = await fetch(
            `${this.baseUrl}/api/chat/waiting?page=${page}&limit=${limit}`
        );
        return (await response.json()) as IApiResponse<IGetWaitingConversationsResponse>;
    }

    async takeChat(conversationId: string, staffId: string): Promise<IApiResponse<IConversation>> {
        const response = await fetch(`${this.baseUrl}/api/chat/${conversationId}/take`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ staffId }),
        });
        return (await response.json()) as IApiResponse<IConversation>;
    }

    async sendStaffMessage(
        conversationId: string,
        staffId: string,
        content: string,
        attachment?: string
    ): Promise<IApiResponse<IMessage>> {
        const response = await fetch(
            `${this.baseUrl}/api/chat/${conversationId}/staff-message`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ staffId, content, attachment }),
            }
        );
        return (await response.json()) as IApiResponse<IMessage>;
    }

    async transferChat(
        conversationId: string,
        currentStaffId: string,
        newStaffId: string
    ): Promise<IApiResponse<IConversation>> {
        const response = await fetch(`${this.baseUrl}/api/chat/${conversationId}/transfer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentStaffId, newStaffId }),
        });
        return (await response.json()) as IApiResponse<IConversation>;
    }

    async getMyConversations(
        staffId: string,
        status?: ConversationStatus
    ): Promise<IApiResponse<IConversationPopulated[]>> {
        const url = status
            ? `${this.baseUrl}/api/chat/staff/${staffId}?status=${status}`
            : `${this.baseUrl}/api/chat/staff/${staffId}`;
        const response = await fetch(url);
        return (await response.json()) as IApiResponse<IConversationPopulated[]>;
    }

    async closeConversation(conversationId: string): Promise<IApiResponse<IConversation>> {
        const response = await fetch(`${this.baseUrl}/api/chat/${conversationId}/close`, {
            method: 'POST',
        });
        return (await response.json()) as IApiResponse<IConversation>;
    }

    async handleOffline(
        staffId: string,
        reason?: 'offline' | 'logout'
    ): Promise<IApiResponse<void>> {
        const response = await fetch(`${this.baseUrl}/api/chat/staff/${staffId}/offline`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason: reason || 'offline' }),
        });
        return (await response.json()) as IApiResponse<void>;
    }
}

/**
 * Usage Example
 */
export class ChatExample {
    private chatClient: IChatService;

    constructor() {
        this.chatClient = new ChatClient('http://localhost:3000');
    }

    // Customer sends message
    async customerSendMessage(customerId: string, content: string) {
        const response = await this.chatClient.sendMessage({
            customerId,
            content,
        });

        if (response.success) {
            console.log('Conversation:', response.data?.conversation);
            console.log('Message:', response.data?.message);
        }
    }

    // Staff views waiting chats
    async staffViewWaitingChats() {
        const response = await this.chatClient.getWaitingConversations(1, 20);

        if (response.success) {
            response.data?.conversations.forEach((conv) => {
                console.log(`Waiting: ${conv.customerId.customerName}`);
            });
        }
    }

    // Staff takes chat
    async staffTakeChat(conversationId: string, staffId: string) {
        const response = await this.chatClient.takeChat(conversationId, staffId);

        if (response.success) {
            console.log('Chat taken!', response.data);
        }
    }

    // Get full conversation
    async getFullConversation(conversationId: string) {
        const response = await this.chatClient.getConversationHistory(conversationId);

        if (response.success) {
            console.log('Conversation:', response.data?.conversation);
            console.log('Messages:', response.data?.messages);
        }
    }
}
