import { Router } from 'express';
import { ConversationController } from '../controllers/conversation.controller';

const router = Router();

// User sends message (creates/reopens conversation)
router.post('/send', ConversationController.sendMessageByUser);

// Staff takes a waiting chat
router.post('/:conversationId/take', ConversationController.takeChat);

// Staff sends message
router.post('/:conversationId/staff-message', ConversationController.sendMessageByStaff);

// // Transfer conversation to another staff
// router.post('/:conversationId/transfer', ConversationController.transferChat);

// // Staff going offline
// router.post('/staff/:staffId/offline', ConversationController.handleStaffOffline);

// Close conversation
router.post('/:conversationId/close', ConversationController.closeConversation);

// Get waiting conversations
router.get('/waiting', ConversationController.getWaitingConversations);

// Get conversations assigned to staff
router.get('/staff/:staffId', ConversationController.getStaffConversations);

// Get conversation with full history
router.get('/:conversationId', ConversationController.getConversationWithHistory);

// Mark messages as read
router.post('/:conversationId/mark-read', ConversationController.markMessagesAsRead);

export default router;
