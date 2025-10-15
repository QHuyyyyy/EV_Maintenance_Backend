import { Request, Response } from 'express';
import { SystemUserService } from '../services/systemUser.service';

const systemUserService = new SystemUserService();

export class SystemUserController {
    /**
     * Get system user by ID
     * GET /api/system-users/:id
     */
    async getSystemUserById(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['System Users']
        // #swagger.summary = 'Get system user by ID'
        /* #swagger.security = [{
           "bearerAuth": []
   }] */
        // #swagger.description = 'Retrieve a specific system user by their ID'
        // #swagger.parameters['id'] = { in: 'path', required: true, type: 'string', description: 'System User ID' }
        /* #swagger.responses[200] = {
            description: 'System user retrieved successfully',
            schema: {
                success: true,
                data: { $ref: '#/definitions/SystemUser' }
            }
        } */
        /* #swagger.responses[404] = {
            description: 'System user not found',
            schema: { $ref: '#/definitions/ErrorResponse' }
        } */
        try {
            const { id } = req.params;
            const systemUser = await systemUserService.getSystemUserById(id);

            if (!systemUser) {
                res.status(404).json({
                    success: false,
                    message: 'System user not found'
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: systemUser
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Get system user by user ID
     * GET /api/system-users/user/:userId
     */
    async getSystemUserByUserId(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['System Users']
        // #swagger.summary = 'Get system user by user ID'
        /* #swagger.security = [{
           "bearerAuth": []
   }] */
        // #swagger.description = 'Retrieve system user information by their user ID'
        // #swagger.parameters['userId'] = { in: 'path', required: true, type: 'string', description: 'User ID' }
        /* #swagger.responses[200] = {
            description: 'System user retrieved successfully',
            schema: {
                success: true,
                data: { $ref: '#/definitions/SystemUser' }
            }
        } */
        /* #swagger.responses[404] = {
            description: 'System user not found',
            schema: { $ref: '#/definitions/ErrorResponse' }
        } */
        try {
            const { userId } = req.params;
            const systemUser = await systemUserService.getSystemUserByUserId(userId);

            if (!systemUser) {
                res.status(404).json({
                    success: false,
                    message: 'System user not found'
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: systemUser
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Get all system users with filtering and pagination
     * GET /api/system-users
     */
    async getAllSystemUsers(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['System Users']
        // #swagger.summary = 'Get all system users with filtering and pagination'
        /* #swagger.security = [{
           "bearerAuth": []
   }] */
        // #swagger.description = 'Retrieve all system users with optional filtering and pagination'
        // #swagger.parameters['name'] = { in: 'query', type: 'string', description: 'Filter by name' }
        // #swagger.parameters['phone'] = { in: 'query', type: 'string', description: 'Filter by phone number' }
        // #swagger.parameters['certification'] = { in: 'query', type: 'string', description: 'Filter by certification' }
        // #swagger.parameters['page'] = { in: 'query', type: 'integer', description: 'Page number (default: 1)' }
        // #swagger.parameters['limit'] = { in: 'query', type: 'integer', description: 'Items per page (default: 10)' }
        /* #swagger.responses[200] = {
            description: 'System users retrieved successfully',
            schema: {
                success: true,
                data: { type: 'array', items: { $ref: '#/definitions/SystemUser' } }
            }
        } */
        try {
            const { name, phone, certification, page, limit } = req.query;

            const filters = {
                name: name as string,
                phone: phone as string,
                certification: certification as string,
                page: page ? parseInt(page as string) : undefined,
                limit: limit ? parseInt(limit as string) : undefined
            };

            const systemUsers = await systemUserService.getAllSystemUsers(filters);
            res.status(200).json({
                success: true,
                data: systemUsers
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Update system user by ID
     * PUT /api/system-users/:id
     */
    async updateSystemUser(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['System Users']
        // #swagger.summary = 'Update system user by ID'
        /* #swagger.security = [{
           "bearerAuth": []
   }] */
        // #swagger.description = 'Update system user information'
        // #swagger.parameters['id'] = { in: 'path', required: true, type: 'string', description: 'System User ID' }
        /* #swagger.requestBody = {
            required: true,
            content: {
                "application/json": {
                    schema: {
                        $ref: '#/definitions/UpdateSystemUser'
                    }
                }
            }
        } */
        /* #swagger.responses[200] = {
            description: 'System user updated successfully',
            schema: {
                success: true,
                message: 'System user updated successfully',
                data: { $ref: '#/definitions/SystemUser' }
            }
        } */
        /* #swagger.responses[404] = {
            description: 'System user not found',
            schema: { $ref: '#/definitions/ErrorResponse' }
        } */
        try {
            const { id } = req.params;
            const systemUser = await systemUserService.updateSystemUser(id, req.body);

            if (!systemUser) {
                res.status(404).json({
                    success: false,
                    message: 'System user not found'
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: 'System user updated successfully',
                data: systemUser
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Delete system user by ID
     * DELETE /api/system-users/:id
     */
    async deleteSystemUser(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['System Users']
        // #swagger.summary = 'Delete system user by ID'
        /* #swagger.security = [{
           "bearerAuth": []
   }] */
        // #swagger.description = 'Delete a system user'
        // #swagger.parameters['id'] = { in: 'path', required: true, type: 'string', description: 'System User ID' }
        /* #swagger.responses[200] = {
            description: 'System user deleted successfully',
            schema: {
                success: true,
                message: 'System user deleted successfully'
            }
        } */
        /* #swagger.responses[404] = {
            description: 'System user not found',
            schema: { $ref: '#/definitions/ErrorResponse' }
        } */
        try {
            const { id } = req.params;
            const deleted = await systemUserService.deleteSystemUser(id);

            if (!deleted) {
                res.status(404).json({
                    success: false,
                    message: 'System user not found'
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: 'System user deleted successfully'
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
}

export default new SystemUserController();