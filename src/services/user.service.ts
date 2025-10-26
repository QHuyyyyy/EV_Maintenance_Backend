import User from '../models/user.model';
import { IUserUpdate, IUser } from '../types/user.type';

export async function getUserById(userId: string) {
    try {
        const user = await User.findById(userId).select('-password');
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

export async function createUser(data: IUser) {
    const user = new User(data);
    return await user.save();
}

/**
 * Get user by email for authentication (includes password)
 */
export async function getUserByEmailForAuth(email: string) {
    try {
        const user = await User.findOne({ email: email });
        if (!user) {
            throw new Error("The account does not exist");
        }
        return user;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to get user by email: ${error.message}`);
        }
        throw new Error('Failed to get user by email: Unknown error');
    }
}

/**
 * Get user by phone for authentication
 */
export async function getUserByPhone(phone: string) {
    try {
        const user = await User.findOne({ phone: phone, isDeleted: false });
        return user; // Return null if not found, no error
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to get user by phone: ${error.message}`);
        }
        throw new Error('Failed to get user by phone: Unknown error');
    }
}

/**
 * Get all users with optional filtering
 */
export async function getAllUsers(filters?: {
    role?: string;
    isDeleted?: string;
    page?: number;
    limit?: number;
}) {
    try {
        const page = filters?.page || 1;
        const limit = filters?.limit || 10;
        const skip = (page - 1) * limit;

        // Build query object
        const query: any = {};
        if (filters?.role) {
            query.role = filters.role;
        }
        if (filters?.isDeleted) {
            query.isDeleted = filters.isDeleted;
        }

        // Execute queries
        const [users, total] = await Promise.all([
            User.find(query)
                .select('-password')
                .sort({ createdAt: -1 })
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
export async function updateUser(userId: string, updateData: IUserUpdate) {
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
        ).select('-password');

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
export async function deleteUser(userId: string) {
    try {
        const user = await User.findByIdAndUpdate(
            userId,
            { isDeleted: true },
            { new: true, runValidators: true }
        ).select('-password');
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




