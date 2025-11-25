import { Request, Response } from 'express';
import importRequestService from '../services/importRequest.service';
import ImportRequestItem from '../models/importRequestItem.model';

export class ImportRequestController {

    async getAllImportRequests(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['Import Requests']
        // #swagger.summary = 'Get all import requests'
        // #swagger.description = 'Retrieve paginated list of import requests with optional filters (center_id, status, source_type)'
        // #swagger.security = [{ "bearerAuth": [] }]
        // #swagger.parameters['center_id'] = { description: 'Center ID to filter', required: false, type: 'string', in: 'query' }
        // #swagger.parameters['status'] = { description: 'Status filter', required: false, type: 'string', in: 'query' }
        // #swagger.parameters['source_type'] = { description: 'Source type filter', required: false, type: 'string', in: 'query' }
        // #swagger.parameters['page'] = { description: 'Page number', required: false, type: 'number', in: 'query' }
        // #swagger.parameters['limit'] = { description: 'Page size', required: false, type: 'number', in: 'query' }
        /* #swagger.responses[200] = {
            description: 'Successfully retrieved import requests',
            schema: { success: true, data: { requests: [], total: 0, page: 1, limit: 10, totalPages: 1 } }
        } */

        try {
            const result = await importRequestService.getAllImportRequests(req.query);
            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async getImportRequestById(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['Import Requests']
        // #swagger.summary = 'Get import request by ID'
        // #swagger.parameters['id'] = { description: 'ImportRequest ID', required: true, type: 'string', in: 'path' }
        // #swagger.security = [{ "bearerAuth": [] }]
        /* #swagger.responses[200] = { description: 'Import request found', schema: { success: true, data: {} } }
           #swagger.responses[404] = { description: 'Import request not found', schema: { success: false, message: 'Import request not found' } } */
        try {
            const { id } = req.params;
            const request = await importRequestService.getImportRequestById(id);

            if (!request) {
                res.status(404).json({
                    success: false,
                    message: 'Import request not found'
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: request
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async createImportRequest(req: Request, res: Response): Promise<void> {
        try {
            const request = await importRequestService.createImportRequest(req.body);
            res.status(201).json({
                success: true,
                message: 'Import request created successfully',
                data: request
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async updateImportRequest(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const request = await importRequestService.updateImportRequest(id, req.body);

            res.status(200).json({
                success: true,
                message: 'Import request updated successfully',
                data: request
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async deleteImportRequest(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['Import Requests']
        // #swagger.summary = 'Delete import request'
        // #swagger.parameters['id'] = { description: 'ImportRequest ID', required: true, type: 'string', in: 'path' }
        // #swagger.security = [{ "bearerAuth": [] }]
        try {
            const { id } = req.params;
            const deleted = await importRequestService.deleteImportRequest(id);

            if (!deleted) {
                res.status(404).json({
                    success: false,
                    message: 'Import request not found'
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: 'Import request deleted successfully',
                data: deleted
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }


    async getImportRequestItems(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['Import Requests']
        // #swagger.summary = 'Get items of an import request'
        // #swagger.parameters['request_id'] = { description: 'ImportRequest ID', required: true, type: 'string', in: 'path' }
        // #swagger.security = [{ "bearerAuth": [] }]
        try {
            const { request_id } = req.params;
            const items = await ImportRequestItem.find({ request_id })
                .populate('part_id', 'name category cost_price selling_price');

            res.status(200).json({
                success: true,
                data: items
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}

export default new ImportRequestController();
