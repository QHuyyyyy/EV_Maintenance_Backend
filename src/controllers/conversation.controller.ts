import { Request, Response } from 'express';
import { ConversationService } from '../services/conversation.service';
import { MessageService } from '../services/message.service';
import { MessageSenderRole } from '../models/message.model';
import Conversation, { ConversationStatus } from '../models/conversation.model';
import chatSocketService from '../socket/chat.socket';

const conversationService = new ConversationService();
const messageService = new MessageService();

export class ConversationController {
    /**
     * Flow 1: User sends message
     * POST /api/chat/send
     * Body: { customerId, content, attachment? }
     */
    static async sendMessageByUser(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['Chat']
        // #swagger.summary = 'User sends a message'
        // #swagger.description = 'User sends a message. Creates or reopens conversation if needed'
        /* #swagger.requestBody = {
            required: true,
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        properties: {
                            customerId: { type: "string" },
                            content: { type: "string" },
                            attachment: { type: "string" }
                        },
                        required: ["customerId", "content"]
                    }
                }
            }
        } */
        /* #swagger.responses[201] = {
          description: 'Message sent successfully',
          schema: {
            success: true,
            message: 'Message sent successfully',
            data: {
              conversation: {},
              message: {},
              isNewConversation: false,
              isReopened: false
            }
          }
        } */
        try {
            const { customerId, content, attachment } = req.body;

            if (!customerId || !content) {
                res.status(400).json({
                    success: false,
                    message: 'customerId and content are required',
                });
                return;
            }

            // Get or create conversation
            const { conversation, isNew, isReopened } = await conversationService.getOrCreateConversation(customerId);

            // Send user message
            const message = await messageService.sendMessage(
                (conversation._id as any).toString(),
                customerId,
                MessageSenderRole.USER,
                content,
                attachment
            );

            res.status(201).json({
                success: true,
                message: 'Message sent successfully',
                data: {
                    conversation,
                    message,
                    isNewConversation: isNew,
                    isReopened,
                },
            });

            // Emit socket events
            if (isNew) {
                // Notify waiting staff of new conversation
                chatSocketService.notifyWaitingStaff(
                    (conversation._id as any).toString(),
                    customerId,
                    'Customer'
                );
            } else if (isReopened) {
                // Notify waiting staff of reopened conversation
                chatSocketService.notifyWaitingStaff(
                    (conversation._id as any).toString(),
                    customerId,
                    'Customer'
                );
            } else {
                // Emit message to conversation room
                chatSocketService.emitNewMessage((conversation._id as any).toString(), {
                    ...message.toObject?.() || message,
                    timestamp: new Date(),
                });
            }
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message || 'Error sending message',
            });
        }
    }

    /**
     * Flow 2: Staff takes chat
     * POST /api/chat/:conversationId/take
     * Body: { staffId }
     */
    static async takeChat(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['Chat']
        // #swagger.summary = 'Staff takes a waiting chat'
        // #swagger.description = 'Assign conversation to the requesting staff member'
        // #swagger.parameters['conversationId'] = { in: 'path', required: true, type: 'string' }
        /* #swagger.requestBody = {
            required: true,
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        properties: {
                            staffId: { type: "string" }
                        },
                        required: ["staffId"]
                    }
                }
            }
        } */
        /* #swagger.responses[200] = {
          description: 'Chat taken successfully',
          schema: {
            success: true,
            message: 'Chat taken successfully',
            data: {}
          }
        } */
        try {
            const { conversationId } = req.params;
            const { staffId } = req.body;

            if (!staffId) {
                res.status(400).json({
                    success: false,
                    message: 'staffId is required',
                });
                return;
            }

            const conversation = await conversationService.takeChat(conversationId, staffId);

            res.status(200).json({
                success: true,
                message: 'Chat taken successfully',
                data: conversation,
            });

            // Emit socket events
            chatSocketService.notifyChatTaken(conversationId, staffId);
            chatSocketService.emitStaffAssigned(conversationId, staffId);
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message || 'Error taking chat',
            });
        }
    }

    /**
     * Flow 3: Only assigned staff can send messages
     * POST /api/chat/:conversationId/staff-message
     * Body: { staffId, content, attachment? }
     */
    static async sendMessageByStaff(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['Chat']
        // #swagger.summary = 'Staff sends a message'
        // #swagger.description = 'Only assigned staff can send messages in a conversation'
        // #swagger.parameters['conversationId'] = { in: 'path', required: true, type: 'string' }
        /* #swagger.requestBody = {
            required: true,
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        properties: {
                            staffId: { type: "string" },
                            content: { type: "string" },
                            attachment: { type: "string" }
                        },
                        required: ["staffId", "content"]
                    }
                }
            }
        } */
        /* #swagger.responses[201] = {
          description: 'Message sent successfully',
          schema: {
            success: true,
            message: 'Message sent successfully',
            data: {}
          }
        } */
        try {
            const { conversationId } = req.params;
            const { staffId, content, attachment } = req.body;

            if (!staffId || !content) {
                res.status(400).json({
                    success: false,
                    message: 'staffId and content are required',
                });
                return;
            }

            // Check if staff is assigned to this conversation
            const conversation = await Conversation.findById(conversationId);
            if (!conversation) {
                res.status(404).json({
                    success: false,
                    message: 'Conversation not found',
                });
                return;
            }

            if (!conversation.assignedStaffId?.equals(staffId)) {
                res.status(403).json({
                    success: false,
                    message: 'Only assigned staff can send messages',
                });
                return;
            }

            // Send message
            const message = await messageService.sendMessage(
                conversationId,
                staffId,
                MessageSenderRole.STAFF,
                content,
                attachment
            );

            res.status(201).json({
                success: true,
                message: 'Message sent successfully',
                data: message,
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message || 'Error sending message',
            });
        }
    }

    /**
     * Flow 4: Transfer conversation to another staff
     * POST /api/chat/:conversationId/transfer
     * Body: { currentStaffId, newStaffId }
     */
    static async transferChat(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['Chat']
        // #swagger.summary = 'Transfer conversation to another staff'
        // #swagger.description = 'Current staff transfers conversation to another staff member'
        // #swagger.parameters['conversationId'] = { in: 'path', required: true, type: 'string' }
        /* #swagger.requestBody = {
            required: true,
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        properties: {
                            currentStaffId: { type: "string" },
                            newStaffId: { type: "string" }
                        },
                        required: ["currentStaffId", "newStaffId"]
                    }
                }
            }
        } */
        /* #swagger.responses[200] = {
          description: 'Conversation transferred successfully',
          schema: {
            success: true,
            message: 'Conversation transferred successfully',
            data: {}
          }
        } */
        try {
            const { conversationId } = req.params;
            const { currentStaffId, newStaffId } = req.body;

            if (!currentStaffId || !newStaffId) {
                res.status(400).json({
                    success: false,
                    message: 'currentStaffId and newStaffId are required',
                });
                return;
            }

            // Verify current staff is assigned
            const conversation = await Conversation.findById(conversationId);
            if (!conversation) {
                res.status(404).json({
                    success: false,
                    message: 'Conversation not found',
                });
                return;
            }

            if (!conversation.assignedStaffId?.equals(currentStaffId)) {
                res.status(403).json({
                    success: false,
                    message: 'Only current assigned staff can transfer',
                });
                return;
            }

            const updatedConversation = await conversationService.transferChat(
                conversationId,
                newStaffId,
                currentStaffId
            );

            res.status(200).json({
                success: true,
                message: 'Conversation transferred successfully',
                data: updatedConversation,
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message || 'Error transferring conversation',
            });
        }
    }

    /**
     * Flow 5: Handle staff going offline
     * POST /api/chat/staff/:staffId/offline
     * Body: { reason: 'offline' | 'logout' }
     */
    static async handleStaffOffline(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['Chat']
        // #swagger.summary = 'Handle staff going offline'
        // #swagger.description = 'Release all assigned conversations when staff goes offline'
        // #swagger.parameters['staffId'] = { in: 'path', required: true, type: 'string' }
        /* #swagger.requestBody = {
            required: false,
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        properties: {
                            reason: { type: "string", enum: ["offline", "logout"] }
                        }
                    }
                }
            }
        } */
        /* #swagger.responses[200] = {
          description: 'Staff marked as offline',
          schema: {
            success: true,
            message: 'Staff marked as offline'
          }
        } */
        try {
            const { staffId } = req.params;
            const { reason = 'offline' } = req.body;

            await conversationService.handleStaffOffline(staffId, reason);

            res.status(200).json({
                success: true,
                message: 'Staff marked as offline',
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message || 'Error handling staff offline',
            });
        }
    }

    /**
     * Flow 6: Close conversation
     * POST /api/chat/:conversationId/close
     */
    static async closeConversation(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['Chat']
        // #swagger.summary = 'Close a conversation'
        // #swagger.description = 'Mark conversation as closed'
        // #swagger.parameters['conversationId'] = { in: 'path', required: true, type: 'string' }
        /* #swagger.responses[200] = {
          description: 'Conversation closed successfully',
          schema: {
            success: true,
            message: 'Conversation closed successfully',
            data: {}
          }
        } */
        try {
            const { conversationId } = req.params;

            const conversation = await conversationService.closeConversation(conversationId);

            res.status(200).json({
                success: true,
                message: 'Conversation closed successfully',
                data: conversation,
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message || 'Error closing conversation',
            });
        }
    }

    /**
     * Get waiting conversations for staff dashboard
     * GET /api/chat/waiting?page=1&limit=20
     */
    static async getWaitingConversations(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['Chat']
        // #swagger.summary = 'Get waiting conversations'
        // #swagger.description = 'Get list of all waiting conversations for staff'
        // #swagger.parameters['page'] = { description: 'Page number', type: 'integer', default: 1 }
        // #swagger.parameters['limit'] = { description: 'Items per page', type: 'integer', default: 20 }
        /* #swagger.responses[200] = {
          description: 'Waiting conversations retrieved',
          schema: {
            success: true,
            data: {
              conversations: [],
              totalCount: 0,
              currentPage: 1,
              totalPages: 1
            }
          }
        } */
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;

            const result = await conversationService.getWaitingConversations(page, limit);

            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message || 'Error fetching conversations',
            });
        }
    }

    /**
     * Get conversations assigned to staff
     * GET /api/chat/staff/:staffId?status=active
     */
    static async getStaffConversations(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['Chat']
        // #swagger.summary = 'Get staff conversations'
        // #swagger.description = 'Get all conversations assigned to a specific staff member'
        // #swagger.parameters['staffId'] = { in: 'path', required: true, type: 'string' }
        // #swagger.parameters['status'] = { description: 'Filter by status', type: 'string' }
        /* #swagger.responses[200] = {
          description: 'Staff conversations retrieved',
          schema: {
            success: true,
            data: []
          }
        } */
        try {
            const { staffId } = req.params;
            const status = req.query.status as ConversationStatus;

            const conversations = await conversationService.getStaffConversations(staffId, status);

            res.status(200).json({
                success: true,
                data: conversations,
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message || 'Error fetching conversations',
            });
        }
    }

    /**
     * Get conversation with full chat history
     * GET /api/chat/:conversationId
     */
    static async getConversationWithHistory(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['Chat']
        // #swagger.summary = 'Get conversation with chat history'
        // #swagger.description = 'Get full conversation details and all messages'
        // #swagger.parameters['conversationId'] = { in: 'path', required: true, type: 'string' }
        /* #swagger.responses[200] = {
          description: 'Conversation details with history',
          schema: {
            success: true,
            data: {
              conversation: {},
              messages: []
            }
          }
        } */
        try {
            const { conversationId } = req.params;

            const result = await conversationService.getConversationWithHistory(conversationId);

            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error: any) {
            res.status(404).json({
                success: false,
                message: error.message || 'Conversation not found',
            });
        }
    }

    /**
     * Mark messages as read
     * POST /api/chat/:conversationId/mark-read
     */
    static async markMessagesAsRead(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['Chat']
        // #swagger.summary = 'Mark messages as read'
        // #swagger.description = 'Mark all messages in a conversation as read'
        // #swagger.parameters['conversationId'] = { in: 'path', required: true, type: 'string' }
        /* #swagger.responses[200] = {
          description: 'Messages marked as read',
          schema: {
            success: true,
            message: 'Messages marked as read'
          }
        } */
        try {
            const { conversationId } = req.params;

            await messageService.markAsRead(conversationId);

            res.status(200).json({
                success: true,
                message: 'Messages marked as read',
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message || 'Error marking messages as read',
            });
        }
    }
}
