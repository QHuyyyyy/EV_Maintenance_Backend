import { Server, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import ConversationService from '../services/conversation.service';
import moment from 'moment-timezone';
const VIETNAM_TIMEZONE = 'Asia/Ho_Chi_Minh';

const nowVN = () => moment().tz(VIETNAM_TIMEZONE).toDate();

interface SocketUser {
    userId: string;
    staffId?: string;
    socketId: string;
    role: string;
}

/**
 * ChatSocketService - Unified Socket.io service for real-time chat and notifications
 * Handles authentication, user connections, message broadcasting, and staff online status
 */
class ChatSocketService {
    private io: Server | null = null;
    private connectedUsers: Map<string, SocketUser> = new Map();
    private staffOnlineStatus: Map<string, boolean> = new Map();
    private userToConversation: Map<string, string> = new Map(); // userId -> conversationId

    /**
     * Initialize Socket.io
     */
    initializeSocket(httpServer: HTTPServer) {
        this.io = new Server(httpServer, {
            cors: {
                origin: '*',
                methods: ['GET', 'POST'],
            },
        });

        this.io.use((socket, next) => {
            this.authenticateSocket(socket, next);
        });

        this.io.on('connection', (socket: Socket) => {
            this.handleConnection(socket);
        });

        return this.io;
    }

    /**
     * Authenticate socket connection
     */
    private authenticateSocket(socket: Socket, next: any) {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication token missing'));
            }

            const SECRET_KEY = process.env.JWT_SECRET_KEY || 'your-secret-key';
            const decoded: any = jwt.verify(token, SECRET_KEY);
            socket.data.userId = decoded.sub;
            socket.data.role = decoded.role;
            next();
        } catch (error) {
            next(new Error('Invalid token'));
        }
    }

    /**
     * Handle new socket connection
     */
    private handleConnection(socket: Socket) {
        const userId = socket.data.userId;
        const role = socket.data.role;

        console.log(`User ${userId} connected with socket ${socket.id}`);

        // Store user connection
        const socketUser: SocketUser = {
            userId,
            socketId: socket.id,
            role,
        };
        this.connectedUsers.set(socket.id, socketUser);

        // If staff, mark as online
        if (['ADMIN', 'STAFF', 'TECHNICIAN'].includes(role)) {
            this.staffOnlineStatus.set(userId, true);
            this.io?.emit('staff:online', { staffId: userId, isOnline: true });
            console.log(`Staff ${userId} is now online`);
        }

        // Join user's personal room
        socket.join(`user:${userId}`);

        // Listen for events
        socket.on('chat:message', (data) => this.handleNewMessage(socket, data));
        socket.on('chat:typing', (data) => this.handleTyping(socket, data));
        socket.on('chat:read', (data) => this.handleRead(socket, data));
        socket.on('conversation:join', (data) => this.handleJoinConversation(socket, data));
        socket.on('conversation:leave', (data) => this.handleLeaveConversation(socket, data));
        socket.on('disconnect', () => this.handleDisconnection(socket));
    }

    /**
     * Handle new message
     */
    private handleNewMessage(socket: Socket, data: any) {
        const { conversationId, content, attachment } = data;
        const userId = socket.data.userId;
        const role = socket.data.role;

        const message = {
            id: new Types.ObjectId().toString(),
            conversationId,
            senderId: userId,
            senderRole: role === 'CUSTOMER' ? 'user' : 'staff',
            content,
            attachment,
            isRead: false,
            createdAt: nowVN(),
        };

        // Broadcast to conversation room
        this.io?.to(`conversation:${conversationId}`).emit('message:new', message);
        console.log(`Message in conversation ${conversationId}: ${content}`);
    }

    /**
     * Handle typing indicator
     */
    private handleTyping(socket: Socket, data: any) {
        const { conversationId } = data;
        const userId = socket.data.userId;

        // Broadcast typing indicator to conversation
        this.io?.to(`conversation:${conversationId}`).emit('chat:typing', {
            conversationId,
            userId,
            isTyping: true,
        });
    }

    /**
     * Handle message read
     */
    private handleRead(socket: Socket, data: any) {
        const { conversationId, messageIds } = data;

        this.io?.to(`conversation:${conversationId}`).emit('message:read', {
            conversationId,
            messageIds,
        });
    }

    /**
     * Handle join conversation
     */
    private handleJoinConversation(socket: Socket, data: any) {
        const { conversationId } = data;
        const userId = socket.data.userId;

        socket.join(`conversation:${conversationId}`);
        this.userToConversation.set(userId, conversationId);

        // Notify others in conversation
        this.io?.to(`conversation:${conversationId}`).emit('user:joined', {
            conversationId,
            userId,
            timestamp: nowVN(),
        });

        console.log(`User ${userId} joined conversation ${conversationId}`);
    }

    /**
     * Handle leave conversation
     */
    private handleLeaveConversation(socket: Socket, data: any) {
        const { conversationId } = data;
        const userId = socket.data.userId;

        socket.leave(`conversation:${conversationId}`);
        this.userToConversation.delete(userId);

        // Notify others in conversation
        this.io?.to(`conversation:${conversationId}`).emit('user:left', {
            conversationId,
            userId,
            timestamp: nowVN(),
        });

        console.log(`User ${userId} left conversation ${conversationId}`);
    }

    /**
     * Handle disconnection
     */
    private handleDisconnection(socket: Socket) {
        const userId = socket.data.userId;
        const role = socket.data.role;

        this.connectedUsers.delete(socket.id);

        // If staff, mark as offline
        if (['ADMIN', 'STAFF', 'TECHNICIAN'].includes(role)) {
            this.staffOnlineStatus.set(userId, false);
            this.io?.emit('staff:online', { staffId: userId, isOnline: false });
            console.log(`Staff ${userId} is now offline`);
            // Auto unassign conversations and notify
            ConversationService.handleStaffOffline(userId, 'offline');
        }

        // Leave all conversation rooms
        const conversationId = this.userToConversation.get(userId);
        if (conversationId) {
            this.io?.to(`conversation:${conversationId}`).emit('user:left', {
                conversationId,
                userId,
                timestamp: nowVN(),
            });
            this.userToConversation.delete(userId);
        }

        console.log(`User ${userId} disconnected`);
    }

    /**
     * Emit new message to conversation
     */
    emitNewMessage(conversationId: string, message: any) {
        this.io?.to(`conversation:${conversationId}`).emit('message:new', message);
    }

    /**
     * Emit system message to conversation
     */
    emitSystemMessage(conversationId: string, message: any) {
        this.io?.to(`conversation:${conversationId}`).emit('message:system', message);
    }

    /**
     * Emit conversation status update
     */
    emitConversationUpdate(conversationId: string, data: any) {
        this.io?.to(`conversation:${conversationId}`).emit('conversation:updated', data);
    }

    /**
     * Notify staff of new waiting conversation
     */
    emitNewWaitingChat(conversationId: string, conversationData: any) {
        this.io?.emit('chat:waiting', {
            conversationId,
            ...conversationData,
            timestamp: nowVN(),
        });
    }

    /**
     * Notify staff of chat assignment
     */
    emitChatAssigned(conversationId: string, staffId: string) {
        this.io?.to(`staff:${staffId}`).emit('chat:assigned', {
            conversationId,
            timestamp: nowVN(),
        });
    }

    /**
     * Notify user of staff assignment
     */
    emitStaffAssigned(conversationId: string, staffId: string, staffName?: string) {
        this.io?.to(`conversation:${conversationId}`).emit('staff:assigned', {
            conversationId,
            staffId,
            staffName,
            timestamp: nowVN(),
        });
    }

    /**
     * Notify of staff transfer
     */
    emitChatTransferred(conversationId: string, oldStaffId: string, newStaffId: string) {
        this.io?.to(`conversation:${conversationId}`).emit('chat:transferred', {
            conversationId,
            oldStaffId,
            newStaffId,
            timestamp: nowVN(),
        });
    }

    /**
     * Notify conversation closed
     */
    emitConversationClosed(conversationId: string) {
        this.io?.to(`conversation:${conversationId}`).emit('conversation:closed', {
            conversationId,
            timestamp: nowVN(),
        });
    }

    /**
     * Get online staff list
     */
    getOnlineStaff(): string[] {
        return Array.from(this.staffOnlineStatus.entries())
            .filter(([_, isOnline]) => isOnline)
            .map(([staffId]) => staffId);
    }

    /**
     * Get connected users count
     */
    getConnectedUsersCount(): number {
        return this.connectedUsers.size;
    }

    /**
     * Check if staff is online
     */
    isStaffOnline(staffId: string): boolean {
        return this.staffOnlineStatus.get(staffId) ?? false;
    }

    /**
     * Emit all staff online status
     */
    emitAllStaffStatus() {
        const staffStatus = Array.from(this.staffOnlineStatus.entries()).map(([staffId, isOnline]) => ({
            staffId,
            isOnline,
        }));

        this.io?.emit('staff:statusAll', {
            staffStatus,
            timestamp: nowVN(),
        });
    }

    /**
     * Join user to staff room for notifications
     */
    joinStaffRoom(socket: Socket, staffId: string) {
        socket.join(`staff:${staffId}`);
    }

    /**
     * Notify waiting staff of new conversation
     */
    notifyWaitingStaff(conversationId: string, customerId: string, customerName?: string) {
        this.io?.emit('chat:newWaiting', {
            conversationId,
            customerId,
            customerName,
            timestamp: nowVN(),
        });
    }

    /**
     * Notify when conversation is taken
     */
    notifyChatTaken(conversationId: string, staffId: string) {
        this.io?.emit('chat:taken', {
            conversationId,
            staffId,
            timestamp: nowVN(),
        });
    }

    /**
     * Notify when staff goes offline
     */
    notifyStaffOffline(staffId: string) {
        this.io?.emit('staff:offline', {
            staffId,
            isOnline: false,
            timestamp: nowVN(),
        });
        this.staffOnlineStatus.set(staffId, false);
        this.emitAllStaffStatus();
    }

    /**
     * Notify when staff comes online
     */
    notifyStaffOnline(staffId: string) {
        this.io?.emit('staff:online', {
            staffId,
            isOnline: true,
            timestamp: nowVN(),
        });
        this.staffOnlineStatus.set(staffId, true);
        this.emitAllStaffStatus();
    }

    /**
     * Send message to specific user
     */
    sendToUser(userId: string, event: string, data: any) {
        this.io?.to(`user:${userId}`).emit(event, data);
    }

    /**
     * Send message to specific staff
     */
    sendToStaff(staffId: string, event: string, data: any) {
        this.io?.to(`staff:${staffId}`).emit(event, data);
    }

    /**
     * Send message to conversation
     */
    sendToConversation(conversationId: string, event: string, data: any) {
        this.io?.to(`conversation:${conversationId}`).emit(event, data);
    }

    /**
     * Broadcast to all waiting staff
     */
    broadcastToWaitingStaff(event: string, data: any) {
        this.io?.emit(event, data);
    }

    /**
     * Get all staff status
     */
    getAllStaffStatus() {
        return Array.from(this.staffOnlineStatus.entries()).map(([staffId, isOnline]) => ({
            staffId,
            isOnline
        }));
    }

    /**
     * Get IO instance for advanced operations
     */
    getIO(): Server | null {
        return this.io;
    }

    /**
     * Emit a generic notification event
     */
    emitNotification(data: any) {
        this.io?.emit('notification:new', data);
    }

    /**
     * Emit when a new forecast analysis is created for a part
     */
    emitForecastNew(data: { center_id: string; part_id: string; analysisId?: string; createdAt?: Date }) {
        this.io?.emit('forecast:new', { ...data, timestamp: nowVN() });
        // also emit via generic notification channel for UI notification list
        this.emitNotification({
            type: 'forecast',
            title: 'Dữ liệu dự báo mới',
            message: 'Đã có phân tích mới cho phụ tùng',
            meta: data,
            createdAt: nowVN(),
        });
    }

    /**
     * Emit when a batch forecast job completed for a center
     */
    emitForecastBatchComplete(data: { center_id: string; totalResults: number }) {
        this.emitNotification({
            type: 'forecast_batch',
            title: 'Hoàn tất phân tích dự báo',
            message: 'Dự báo đã được cập nhật',
            meta: data,
            createdAt: nowVN(),
        });
    }

    /**
     * Check if user is currently connected via socket
     * Used to determine if customer is online/offline
     * @param userId 
     * @returns true if user has active socket connection
     */
    isUserConnected(userId: string): boolean {
        for (const [, socketUser] of this.connectedUsers) {
            if (socketUser.userId === userId) {
                return true;
            }
        }
        return false;
    }
}

export default new ChatSocketService();
