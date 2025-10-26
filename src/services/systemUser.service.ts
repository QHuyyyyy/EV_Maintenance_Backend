import User from '../../src/models/user.model';
import SystemUser from '../models/systemUser.model';
import { CreateSystemUserRequest, UpdateSystemUserRequest, ISystemUser } from '../types/systemUser.type';

export class SystemUserService {

    /**
     * Create a new system user profile with empty fields (used during registration)
     */
    async createEmptySystemUser(userId: string): Promise<ISystemUser> {
        try {
            const systemUser = new SystemUser({
                userId: userId,
                name: '',
                dateOfBirth: null,
                certificates: []
            });
            const savedSystemUser = await systemUser.save();
            return await this.getSystemUserById(savedSystemUser._id.toString());
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to create system user profile: ${error.message}`);
            }
            throw new Error('Failed to create system user profile: Unknown error');
        }
    }


    /**
     * Get system user by ID
     */
    async getSystemUserById(systemUserId: string): Promise<ISystemUser> {
        try {
            const systemUser = await SystemUser.findById(systemUserId)
                .populate({
                    path: 'userId',
                    match: { isDeleted: false },
                    select: 'phone email role'
                })
                .lean();
            if (!systemUser || !systemUser.userId) {
                throw new Error('System user not found');
            }
            return {
                ...systemUser,
                _id: systemUser._id.toString(),
            } as ISystemUser;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to get system user: ${error.message}`);
            }
            throw new Error('Failed to get system user: Unknown error');
        }
    }

    /**
     * Get system user by user ID
     */
    async getSystemUserByUserId(userId: string): Promise<ISystemUser | null> {
        try {
            const systemUser = await SystemUser.findOne({ userId })
                .populate({
                    path: 'userId',
                    match: { isDeleted: false },
                    select: 'phone email role'
                })
                .lean();
            if (!systemUser || !systemUser.userId) {
                return null;
            }
            return {
                ...systemUser,
                _id: systemUser._id.toString(),
            } as ISystemUser;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to get system user by user ID: ${error.message}`);
            }
            throw new Error('Failed to get system user by user ID: Unknown error');
        }
    }

    /**
     * Get all system users with optional filtering and pagination
     */
    async getAllSystemUsers(filters?: {
        name?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        systemUsers: ISystemUser[];
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
            if (filters?.name) {
                query.name = { $regex: filters.name, $options: 'i' };
            }

            const systemUsersRaw = await SystemUser.find(query)
                .populate({
                    path: 'userId',
                    match: { isDeleted: false },
                    select: 'phone email role'
                })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean();
            const filteredSystemUsers = systemUsersRaw.filter(su => su.userId);
            const mappedSystemUsers = filteredSystemUsers.map(systemUser => ({
                ...systemUser,
                _id: systemUser._id.toString(),
            })) as ISystemUser[];
            return {
                systemUsers: mappedSystemUsers,
                total: mappedSystemUsers.length,
                page,
                limit,
                totalPages: Math.ceil(mappedSystemUsers.length / limit)
            };
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to get system users: ${error.message}`);
            }
            throw new Error('Failed to get system users: Unknown error');
        }
    }

    /**
     * Update system user by ID
     */
    async updateSystemUser(systemUserId: string, updateData: UpdateSystemUserRequest): Promise<ISystemUser | null> {
        try {
            const updatedSystemUser = await SystemUser.findByIdAndUpdate(
                systemUserId,
                updateData,
                { new: true, runValidators: true }
            ).lean();

            if (!updatedSystemUser) {
                return null;
            }

            return await this.getSystemUserById(systemUserId);
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to update system user: ${error.message}`);
            }
            throw new Error('Failed to update system user: Unknown error');
        }
    }

    /**
     * Delete system user by ID (soft delete)
     */
    async deleteSystemUser(systemUserId: string): Promise<boolean> {
        try {
            const systemUser = await SystemUser.findById(systemUserId);
            if (!systemUser) {
                throw new Error('System user not found');
            }
            // Set isDeleted on the referenced user
            await User.findByIdAndUpdate(systemUser.userId, { isDeleted: true });
            return true;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to delete system user: ${error.message}`);
            }
            throw new Error('Failed to delete system user: Unknown error');
        }
    }

    /**
     * Set online status for a system user
     */
    async setOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
        try {
            // Find SystemUser by userId (from User model)
            const systemUser = await SystemUser.findOneAndUpdate(
                { userId: userId },
                { isOnline: isOnline },
                { new: true }
            );

            if (!systemUser) {
                console.log(`SystemUser not found for userId: ${userId}`);
                return;
            }

            console.log(`Set SystemUser ${systemUser._id} isOnline to ${isOnline}`);
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to set online status: ${error.message}`);
            }
            throw new Error('Failed to set online status: Unknown error');
        }
    }
}