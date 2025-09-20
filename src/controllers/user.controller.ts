import { Request, Response } from 'express';
import userService from '../services/user.service';
import { IUserUpdate } from '../types/user.types';

export class UserController {


    /**
     * Get user by ID
     * GET /api/users/:id
     */
    async getUserById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const user = await userService.getUserById(id);

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
        try {
            const { role, status, page, limit } = req.query;

            const filters = {
                role: role as string,
                status: status as string,
                page: page ? parseInt(page as string) : undefined,
                limit: limit ? parseInt(limit as string) : undefined
            };

            const result = await userService.getAllUsers(filters);

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
        try {
            const { id } = req.params;
            const updateData: IUserUpdate = req.body;

            // Remove fields that shouldn't be updated directly
            delete (updateData as any).user_id;
            delete (updateData as any).created_at;
            delete (updateData as any).updated_at;

            const user = await userService.updateUser(id, updateData);

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
        try {
            const { id } = req.params;
            const deleted = await userService.deleteUser(id);

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


    /**
     * Search users
     * GET /api/users/search?q=searchTerm
     */
    async searchUsers(req: Request, res: Response): Promise<void> {
        try {
            const { q } = req.query;

            if (!q || typeof q !== 'string') {
                res.status(400).json({
                    success: false,
                    message: 'Search query is required'
                });
                return;
            }

            const users = await userService.searchUsers(q);

            res.status(200).json({
                success: true,
                message: 'Search completed successfully',
                data: users
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