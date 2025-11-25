import { Router } from 'express';
import inventoryTicketController from '../controllers/inventoryTicket.controller';
import { validate } from '../middlewares/auth';

const router = Router();

// Lấy tất cả inventory tickets
router.get('/', validate, (req, res) => {
    inventoryTicketController.getAllInventoryTickets(req, res);
});

// Lấy inventory ticket theo ID
router.get('/:id', validate, (req, res) => {
    inventoryTicketController.getInventoryTicketById(req, res);
});

// Tạo inventory ticket
router.post('/', validate, (req, res) => {
    inventoryTicketController.createInventoryTicket(req, res);
});

// Cập nhật inventory ticket
router.put('/:id', validate, (req, res) => {
    inventoryTicketController.updateInventoryTicket(req, res);
});

// Xóa inventory ticket
router.delete('/:id', validate, (req, res) => {
    inventoryTicketController.deleteInventoryTicket(req, res);
});

// Thêm item vào ticket
router.post('/:id/items', validate, (req, res) => {
    inventoryTicketController.addItemToTicket(req, res);
});

// Xóa item khỏi ticket
router.delete('/:id/items/:itemId', validate, (req, res) => {
    inventoryTicketController.removeItemFromTicket(req, res);
});

export default router;
