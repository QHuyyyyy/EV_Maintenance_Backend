import { Request, Response } from 'express';
import { IUserUpdate } from '../types/user.type';
import { deleteUser, getAllUsers, getUserById, updateUser } from '../services/user.service';

export class UserController {


    /**
     * Get user by ID
     * GET /api/users/:id
     */
    async getUserById(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['Users']
        // #swagger.summary = 'Get user by ID'
        /* #swagger.security = [{
                   "bearerAuth": []
           }] */
        // #swagger.parameters['id'] = { in: 'path', required: true, type: 'string', description: 'User ID' }
        /* #swagger.responses[200] = {
            description: 'User retrieved successfully',
            schema: {
                success: true,
                message: 'User retrieved successfully',
                data: { $ref: '#/definitions/User' }
            }
        } */
        /* #swagger.responses[404] = {
            description: 'User not found',
            schema: { $ref: '#/definitions/ErrorResponse' }
        } */
        try {
            const { id } = req.params;
            const user = await getUserById(id);

            if (!user) {
                res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: 'User retrieved successfully',
                data: user
            });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({
                    success: false,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
            }
        }
    }

    /**
     * Get all users with filtering and pagination
     * GET /api/users
     */
    async getAllUsers(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['Users']
        // #swagger.summary = 'Get all users with filtering and pagination'
        /* #swagger.security = [{
           "bearerAuth": []
   }] */
        // #swagger.parameters['role'] = { in: 'query', type: 'string', enum: ['admin', 'mechanic', 'customer'], description: 'Filter by user role' }
        // #swagger.parameters['status'] = { in: 'query', type: 'string', enum: ['active', 'inactive', 'suspended'], description: 'Filter by user status' }
        // #swagger.parameters['page'] = { in: 'query', type: 'integer', description: 'Page number (default: 1)' }
        // #swagger.parameters['limit'] = { in: 'query', type: 'integer', description: 'Items per page (default: 10)' }
        /* #swagger.responses[200] = {
            description: 'Users retrieved successfully',
            schema: { $ref: '#/definitions/UsersListResponse' }
        } */
        try {
            const { role, status, page, limit } = req.query;

            const filters = {
                role: role as string,
                status: status as string,
                page: page ? parseInt(page as string) : undefined,
                limit: limit ? parseInt(limit as string) : undefined
            };

            const result = await getAllUsers(filters);
            console.log(result);
            res.status(200).json({
                success: true,
                message: 'Users retrieved successfully',
                data: result.users,
                pagination: {
                    current_page: result.page,
                    total_pages: result.totalPages,
                    total_count: result.total,
                    per_page: result.limit
                }
            });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({
                    success: false,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
            }
        }
    }

    /**
     * Update user by ID
     * PUT /api/users/:id
     */
    async updateUser(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['Users']
        // #swagger.summary = 'Update user by ID'
        /* #swagger.security = [{
           "bearerAuth": []
   }] */
        // #swagger.parameters['id'] = { in: 'path', required: true, type: 'string', description: 'User ID' }
        // #swagger.parameters['body'] = { in: 'body', required: true, schema: { $ref: '#/definitions/UserUpdate' } }
        /* #swagger.responses[200] = {
            description: 'User updated successfully',
            schema: {
                success: true,
                message: 'User updated successfully',
                data: { $ref: '#/definitions/User' }
            }
        } */
        /* #swagger.responses[404] = {
            description: 'User not found',
            schema: { $ref: '#/definitions/ErrorResponse' }
        } */
        try {
            const { id } = req.params;
            const updateData: IUserUpdate = req.body;

            // Remove fields that shouldn't be updated directly
            delete (updateData as any).user_id;
            delete (updateData as any).created_at;
            delete (updateData as any).updated_at;

            const user = await updateUser(id, updateData);

            if (!user) {
                res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: 'User updated successfully',
                data: user
            });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({
                    success: false,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
            }
        }
    }

    /**
     * Delete user by ID
     * DELETE /api/users/:id
     */
    async deleteUser(req: Request, res: Response): Promise<void> {
        // #swagger.tags = ['Users']
        // #swagger.summary = 'Delete user by ID'
        /* #swagger.security = [{
           "bearerAuth": []
   }] */
        // #swagger.parameters['id'] = { in: 'path', required: true, type: 'string', description: 'User ID' }
        /* #swagger.responses[200] = {
            description: 'User deleted successfully',
            schema: {
                success: true,
                message: 'User deleted successfully'
            }
        } */
        /* #swagger.responses[404] = {
            description: 'User not found',
            schema: { $ref: '#/definitions/ErrorResponse' }
        } */
        try {
            const { id } = req.params;
            const deleted = await deleteUser(id);

            if (!deleted) {
                res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: 'User deleted successfully'
            });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({
                    success: false,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
            }
        }
    }


}

export default new UserController();