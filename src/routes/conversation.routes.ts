import { Router } from 'express';
import { ConversationController } from '../controllers/conversation.controller';
import { validate } from '../middlewares/auth';


const router = Router();

// User sends message (creates/reopens conversation)
router.post('/send', validate, ConversationController.sendMessageByUser);

// Staff takes a waiting chat
router.post('/:conversationId/take', validate, ConversationController.takeChat);

// Staff sends message
router.post('/:conversationId/staff-message', validate, ConversationController.sendMessageByStaff);

// Close conversation
router.post('/:conversationId/close', validate, ConversationController.closeConversation);

// Get waiting conversations
router.get('/waiting', validate, ConversationController.getWaitingConversations);

// Get conversations assigned to staff
router.get('/staff/:staffId', validate, ConversationController.getStaffConversations);

// Get conversation with paginated history
router.get('/:conversationId', validate, ConversationController.getConversationWithHistory);
// Get latest conversation by customerId (use explicit path to avoid route collision)
router.get('/customer/:customerId', validate, ConversationController.getConversationByCustomer);

// Mark messages as read
router.post('/:conversationId/mark-read', validate, ConversationController.markMessagesAsRead);

export default router;
