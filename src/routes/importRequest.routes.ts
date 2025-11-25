import { Router } from 'express';
import importRequestController from '../controllers/importRequest.controller';
import { validate } from '../middlewares/auth';

const router = Router();

// Lấy tất cả import requests
router.get('/', validate, (req, res) => {

    return importRequestController.getAllImportRequests.bind(importRequestController)(req, res)
});

// Lấy import request theo ID
router.get('/:id', validate, (req, res) => {

    return importRequestController.getImportRequestById.bind(importRequestController)(req, res)
});

// Tạo import request
router.post('/', validate, (req, res) => {

    return importRequestController.createImportRequest.bind(importRequestController)(req, res)
});

// Cập nhật import request
router.put('/:id', validate, (req, res) => {

    return importRequestController.updateImportRequest.bind(importRequestController)(req, res)
});

// Xóa import request
router.delete('/:id', validate, (req, res) => {

    return importRequestController.deleteImportRequest.bind(importRequestController)(req, res)
});

// Lấy items của import request
router.get('/:request_id/items', validate, (req, res) => {

    return importRequestController.getImportRequestItems.bind(importRequestController)(req, res)
});

export default router;
