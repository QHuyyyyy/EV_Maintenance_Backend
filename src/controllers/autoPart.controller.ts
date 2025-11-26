import { Request, Response } from 'express';
import autoPartService from '../services/autoPart.service';
import { FirebaseStorageService } from '../firebase/storage.service';

interface MulterRequest extends Request {
    file?: Express.Multer.File;
}

export class AutoPartController {
    private firebaseStorageService = new FirebaseStorageService();
    async createAutoPart(req: Request, res: Response) {
        /* #swagger.tags = ['Auto Parts']
           #swagger.summary = 'Create a new auto part'
           #swagger.description = 'Create a new auto part'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.requestBody = {
               required: true,
               content: {
                   'multipart/form-data': {
                       schema: {
                           type: 'object',
                           required: ['name','cost_price','selling_price','category'],
                           properties: {
                               name: { type: 'string', example: 'Brake Pad' },
                               cost_price: { type: 'number', example: 50 },
                               selling_price: { type: 'number', example: 80 },
                               category: { type: 'string', enum: ['TIRE', 'BATTERY', 'BRAKE', 'FLUID', 'SUSPENSION', 'ACCESSORY', 'ELECTRICAL'], example: 'BRAKE' },
                               warranty_time: { type: 'number', example: 12 },
                               image: { type: 'string', format: 'binary', description: 'Auto part image' }
                           }
                       }
                   }
               }
           }
        */
        try {
            const payload: any = req.body;

            if ((req as MulterRequest).file) {
                const imageUrl = await this.firebaseStorageService.uploadFile(
                    (req as MulterRequest).file as Express.Multer.File,
                    undefined,
                    'autoParts'
                );
                payload.image = imageUrl;
            }

            const part = await autoPartService.createAutoPart(payload);
            res.status(201).json({
                success: true,
                message: 'Auto part created successfully',
                data: part
            });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({
                    success: false,
                    message: error.message
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: 'Failed to create auto part'
                });
            }
        }
    }

    async getAutoPartById(req: Request, res: Response) {
        /* #swagger.tags = ['Auto Parts']
              #swagger.summary = 'Get auto part by ID'
           #swagger.description = 'Get auto part by ID'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['id'] = {
               in: 'path',
               description: 'Auto Part ID',
               required: true,
               type: 'string'
           }
        */
        try {
            const part = await autoPartService.getAutoPartById(req.params.id);
            if (!part) {
                return res.status(404).json({
                    success: false,
                    message: 'Auto part not found'
                });
            }
            res.status(200).json({
                success: true,
                data: part
            });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({
                    success: false,
                    message: error.message
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: 'Failed to get auto part'
                });
            }
        }
    }

    async getAllAutoParts(req: Request, res: Response) {
        /* #swagger.tags = ['Auto Parts']
           #swagger.summary = 'Get all auto parts with optional filters'
           #swagger.description = 'Get all auto parts with optional filters'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['name'] = {
               in: 'query',
               description: 'Filter by part name',
               required: false,
               type: 'string'
           }
           #swagger.parameters['category'] = {
               in: 'query',
               description: 'Filter by category (TIRE, BATTERY, BRAKE, FLUID, SUSPENSION, ACCESSORY, ELECTRICAL)',
               required: false,
               type: 'string'
           }
           // Inventory-level filters are provided by center scoped endpoints (CenterAutoPart)
           #swagger.parameters['page'] = {
               in: 'query',
               description: 'Page number',
               required: false,
               type: 'integer',
               default: 1
           }
           #swagger.parameters['limit'] = {
               in: 'query',
               description: 'Items per page',
               required: false,
               type: 'integer',
               default: 10
           }
        */
        try {
            const filters = {
                name: req.query.name as string,
                category: req.query.category as string,
                page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
                limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined
            };
            const result = await autoPartService.getAllAutoParts(filters);
            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({
                    success: false,
                    message: error.message
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: 'Failed to get auto parts'
                });
            }
        }
    }

    async updateAutoPart(req: Request, res: Response) {
        /* #swagger.tags = ['Auto Parts']
           #swagger.summary = 'Update an auto part'
           #swagger.description = 'Update an auto part'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['id'] = {
               in: 'path',
               description: 'Auto Part ID',
               required: true,
               type: 'string'
           }
           #swagger.requestBody = {
               required: true,
               content: {
                   'multipart/form-data': {
                       schema: {
                           type: 'object',
                           properties: {
                               name: { type: 'string' },
                               cost_price: { type: 'number' },
                               selling_price: { type: 'number' },
                               category: { type: 'string', enum: ['TIRE', 'BATTERY', 'BRAKE', 'FLUID', 'SUSPENSION', 'ACCESSORY', 'ELECTRICAL'] },
                               warranty_time: { type: 'number' },
                               image: { type: 'string', format: 'binary', description: 'Auto part image' }
                           }
                       }
                   }
               }
           }
        */
        try {
            const updateData: any = req.body;


            // If no new file uploaded and image field is empty / undefined -> keep old image (do not overwrite)
            if (!(req as MulterRequest).file) {
                if ('image' in updateData && (updateData.image === '' || updateData.image === undefined || updateData.image === null)) {
                    delete updateData.image; // prevent clearing existing image accidentally
                }
            }

            if ((req as MulterRequest).file) {
                const imageUrl = await this.firebaseStorageService.uploadFile(
                    (req as MulterRequest).file as Express.Multer.File,
                    undefined,
                    'autoParts'
                );
                updateData.image = imageUrl;
            }

            const part = await autoPartService.updateAutoPart(req.params.id, updateData);
            if (!part) {
                return res.status(404).json({
                    success: false,
                    message: 'Auto part not found'
                });
            }
            res.status(200).json({
                success: true,
                message: 'Auto part updated successfully',
                data: part
            });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({
                    success: false,
                    message: error.message
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: 'Failed to update auto part'
                });
            }
        }
    }

    async deleteAutoPart(req: Request, res: Response) {
        /* #swagger.tags = ['Auto Parts']
              #swagger.summary = 'Delete an auto part'
           #swagger.description = 'Delete an auto part'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['id'] = {
               in: 'path',
               description: 'Auto Part ID',
               required: true,
               type: 'string'
           }
        */
        try {
            const part = await autoPartService.deleteAutoPart(req.params.id);
            if (!part) {
                return res.status(404).json({
                    success: false,
                    message: 'Auto part not found'
                });
            }
            res.status(200).json({
                success: true,
                message: 'Auto part deleted successfully',
                data: part
            });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({
                    success: false,
                    message: error.message
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: 'Failed to delete auto part'
                });
            }
        }
    }

    async getAvailableStockByCenters(req: Request, res: Response) {
        /* #swagger.tags = ['Auto Parts']
           #swagger.summary = 'Get available stock by centers for distribution'
           #swagger.description = 'Get centers that have available stock (stock - held) for a part without LACKING orders'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['part_id'] = {
               in: 'query',
               description: 'Auto part ID',
               required: true,
               type: 'string'
           }
           #swagger.responses[200] = {
               description: 'List of centers with available stock',
               schema: {
                   type: 'object',
                   properties: {
                       success: { type: 'boolean' },
                       data: {
                           type: 'array',
                           items: {
                               type: 'object',
                               properties: {
                                   center_id: { type: 'string' },
                                   center_name: { type: 'string' },
                                   stock: { type: 'number' },
                                   held: { type: 'number' },
                                   available: { type: 'number' }
                               }
                           }
                       }
                   }
               }
           }
        */
        try {
            const { part_id } = req.query;

            if (!part_id) {
                return res.status(400).json({
                    success: false,
                    message: 'part_id is required'
                });
            }

            const centers = await autoPartService.getAvailableStockByCenters(part_id as string);

            res.status(200).json({
                success: true,
                message: 'Available stock by centers retrieved',
                data: centers
            });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({
                    success: false,
                    message: error.message
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: 'Failed to get available stock by centers'
                });
            }
        }
    }
}

export default new AutoPartController();