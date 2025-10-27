import { Request, Response } from 'express';
import centerService from '../services/center.service';
import { FirebaseStorageService } from '../firebase/storage.service';

interface MulterRequest extends Request {
    file?: Express.Multer.File;
}

export class CenterController {
    private firebaseStorageService = new FirebaseStorageService();
    async createCenter(req: Request, res: Response) {
        /* #swagger.tags = ['Centers']
          #swagger.summary = 'Create a new center'
           #swagger.description = 'Create a new service center'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.requestBody = {
               required: true,
               content: {
                   "multipart/form-data": {
                       schema: {
                           type: "object",
                           required: ["name", "address", "phone"],
                           properties: {
                               name: { type: "string", example: "Service Center A" },
                               address: { type: "string", example: "123 Main St" },
                               phone: { type: "string", example: "+84901234567" },
                               image: { type: "string", format: "binary", description: "Center image" }
                           }
                       }
                   }
               }
           }
        */
        try {
            const centerData: any = req.body;

            // If multipart upload with image
            if ((req as MulterRequest).file) {
                const imageUrl = await this.firebaseStorageService.uploadFile(
                    (req as MulterRequest).file as Express.Multer.File,
                    undefined,
                    'centers'
                );
                centerData.image = imageUrl;
            }

            const center = await centerService.createCenter(centerData);
            res.status(201).json({
                success: true,
                message: 'Center created successfully',
                data: center
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
                    message: 'Failed to create center'
                });
            }
        }
    }

    async getCenterById(req: Request, res: Response) {
        /* #swagger.tags = ['Centers']
              #swagger.summary = 'Get center by ID'
           #swagger.description = 'Get center by ID'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['id'] = {
               in: 'path',
               description: 'Center ID',
               required: true,
               type: 'string'
           }
        */
        try {
            const center = await centerService.getCenterById(req.params.id);
            if (!center) {
                return res.status(404).json({
                    success: false,
                    message: 'Center not found'
                });
            }
            res.status(200).json({
                success: true,
                data: center
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
                    message: 'Failed to get center'
                });
            }
        }
    }

    async getAllCenters(req: Request, res: Response) {
        /* #swagger.tags = ['Centers']
           #swagger.summary = 'Get all service centers'
           #swagger.description = 'Get all service centers with optional filters'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['name'] = {
               in: 'query',
               description: 'Filter by center name (partial match)',
               required: false,
               type: 'string'
           }
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
                page: req.query.page ? parseInt(req.query.page as string) : undefined,
                limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
            };
            const result = await centerService.getAllCenters(filters);
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
                    message: 'Failed to get centers'
                });
            }
        }
    }

    async updateCenter(req: Request, res: Response) {
        /* #swagger.tags = ['Centers']
           #swagger.summary = 'Update a service center'
           #swagger.description = 'Update a service center'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['id'] = {
               in: 'path',
               description: 'Center ID',
               required: true,
               type: 'string'
           }
           #swagger.requestBody = {
               required: true,
               content: {
                   "multipart/form-data": {
                       schema: {
                           type: "object",
                           properties: {
                               name: { type: "string" },
                               address: { type: "string" },
                               phone: { type: "string" },
                               image: { type: "string", format: "binary", description: "Center image" }
                           }
                       }
                   }
               }
           }
        */
        try {
            const updateData: any = req.body;

            // If multipart upload with image
            if ((req as MulterRequest).file) {
                const imageUrl = await this.firebaseStorageService.uploadFile(
                    (req as MulterRequest).file as Express.Multer.File,
                    undefined,
                    'centers'
                );
                updateData.image = imageUrl;
            }

            const center = await centerService.updateCenter(req.params.id, updateData);
            if (!center) {
                return res.status(404).json({
                    success: false,
                    message: 'Center not found'
                });
            }
            res.status(200).json({
                success: true,
                message: 'Center updated successfully',
                data: center
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
                    message: 'Failed to update center'
                });
            }
        }
    }

    async deleteCenter(req: Request, res: Response) {
        /* #swagger.tags = ['Centers']
              #swagger.summary = 'Delete a service center'
           #swagger.description = 'Delete a service center'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['id'] = {
               in: 'path',
               description: 'Center ID',
               required: true,
               type: 'string'
           }
        */
        try {
            const center = await centerService.deleteCenter(req.params.id);
            if (!center) {
                return res.status(404).json({
                    success: false,
                    message: 'Center not found'
                });
            }
            res.status(200).json({
                success: true,
                message: 'Center deleted successfully',
                data: center
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
                    message: 'Failed to delete center'
                });
            }
        }
    }
}

export default new CenterController();
