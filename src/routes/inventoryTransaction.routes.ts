import { Router } from 'express';
import inventoryTransactionController from '../controllers/inventoryTransaction.controller';
import { validate } from '../middlewares/auth';

const router = Router();

// Lấy tất cả inventory transactions
router.get('/', validate, (req, res) => {
    inventoryTransactionController.getAllInventoryTransactions(req, res);
});

export default router;
