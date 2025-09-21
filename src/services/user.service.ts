import User from '../models/user.model';
import { IUserUpdate, IUserResponse } from '../types/user.type';

export class UserService {


    /**
     * Get user by ID
     */
    async getUserById(userId: string): Promise<IUserResponse> {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }
            return user;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to get user: ${error.message}`);
            }
            throw new Error('Failed to get user: Unknown error');
        }
    }

    /**
     * Get user by email
     */
    async getUserByEmail(email: string): Promise<IUserResponse | null> {
        try {
            return await User.findOne({ email: email.toLowerCase() });
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to get user by email: ${error.message}`);
            }
            throw new Error('Failed to get user by email: Unknown error');
        }
    }

    /**
     * Get all users with optional filtering
     */
    async getAllUsers(filters?: {
        role?: string;
        status?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        users: IUserResponse[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> {
        try {
            const page = filters?.page || 1;
            const limit = filters?.limit || 10;
            const skip = (page - 1) * limit;

            // Build query object
            const query: any = {};
            if (filters?.role) {
                query.role = filters.role;
            }
            if (filters?.status) {
                query.status = filters.status;
            }

            // Execute queries
            const [users, total] = await Promise.all([
                User.find(query)
                    .select('-password')
                    .sort({ created_at: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                User.countDocuments(query)
            ]);



            return {
                users,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            };
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to get users: ${error.message}`);
            }
            throw new Error('Failed to get users: Unknown error');
        }
    }

    /**
     * Update user by ID
     */
    async updateUser(userId: string, updateData: IUserUpdate): Promise<IUserResponse | null> {
        try {
            // Check if email is being updated and if it already exists
            if (updateData.email) {
                const existingUser = await User.findOne({
                    email: updateData.email.toLowerCase(),
                    _id: { $ne: userId }
                });
                if (existingUser) {
                    throw new Error('User with this email already exists');
                }
            }

            const user = await User.findByIdAndUpdate(
                userId,
                { ...updateData },
                { new: true, runValidators: true }
            );

            return user;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to update user: ${error.message}`);
            }
            throw new Error('Failed to update user: Unknown error');
        }
    }

    /**
     * Delete user by ID
     */
    async deleteUser(userId: string): Promise<IUserResponse> {
        try {
            const user = await User.findByIdAndUpdate(
                userId,
                { isDeleted: true },
                { new: true, runValidators: true }
            );
            if (!user) {
                throw new Error('User not found');
            }
            return user;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to delete user: ${error.message}`);
            }
            throw new Error('Failed to delete user: Unknown error');
        }
    }

    /**
     * Search users by email or role
     */
    async searchUsers(searchTerm: string): Promise<IUserResponse[]> {
        try {
            const users = await User.find({
                $or: [
                    { email: { $regex: searchTerm, $options: 'i' } },
                    { role: { $regex: searchTerm, $options: 'i' } }
                ]
            })
                .select('-password')
                .sort({ created_at: -1 })
                .limit(20);

            return users;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to search users: ${error.message}`);
            }
            throw new Error('Failed to search users');
        }
    }




}

export default new UserService();