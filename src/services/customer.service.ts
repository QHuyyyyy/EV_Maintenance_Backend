import User from '../models/user.model';
import Customer from '../models/customer.model';
import { CreateCustomerRequest, UpdateCustomerRequest, ICustomer } from '../types/customer.type';

export class CustomerService {

    /**
     * Create a new customer profile with empty fields (used during registration)
     */
    async createEmptyCustomer(userId: string): Promise<ICustomer> {
        try {
            const customer = new Customer({
                userId: userId,
                customerName: '',
                address: ''
            });
            const savedCustomer = await customer.save();
            return await this.getCustomerById(savedCustomer._id.toString());
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to create customer profile: ${error.message}`);
            }
            throw new Error('Failed to create customer profile: Unknown error');
        }
    }



    /**
     * Get customer by ID
     */
    async getCustomerById(customerId: string): Promise<ICustomer> {
        try {
            const customer = await Customer.findById(customerId)
                .populate({
                    path: 'userId',
                    match: { isDeleted: false },
                    select: 'phone email role'
                })
                .lean();
            if (!customer || !customer.userId) {
                throw new Error('Customer not found');
            }
            return {
                ...customer,
                _id: customer._id.toString(),
            } as ICustomer;

        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to get customer: ${error.message}`);
            }
            throw new Error('Failed to get customer: Unknown error');
        }
    }

    /**
     * Get customer by user ID
     */
    async getCustomerByUserId(userId: string): Promise<ICustomer | null> {
        try {
            const customer = await Customer.findOne({ userId })
                .populate({
                    path: 'userId',
                    match: { isDeleted: false },
                    select: 'phone email role'
                })
                .lean();
            if (!customer || !customer.userId) {
                return null;
            }
            return {
                ...customer,
                _id: customer._id.toString(),
                userId: customer.userId
            } as ICustomer;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to get customer by user ID: ${error.message}`);
            }
            throw new Error('Failed to get customer by user ID: Unknown error');
        }
    }

    /**
     * Get all customers with optional filtering and pagination
     */
    async getAllCustomers(filters?: {
        customerName?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        customers: ICustomer[];
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
            if (filters?.customerName) {
                query.customerName = { $regex: filters.customerName, $options: 'i' };
            }

            // Execute queries
            const customersRaw = await Customer.find(query)
                .populate({
                    path: 'userId',
                    match: { isDeleted: false },
                    select: 'phone email role'
                })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean();
            const customers = customersRaw.filter(c => c.userId).map(customer => ({
                ...customer,
                _id: customer._id.toString(),
                userId: customer.userId
            })) as ICustomer[];
            return {
                customers,
                total: customers.length,
                page,
                limit,
                totalPages: Math.ceil(customers.length / limit)
            };
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to get customers: ${error.message}`);
            }
            throw new Error('Failed to get customers: Unknown error');
        }
    }

    /**
     * Update customer by ID
     */
    async updateCustomer(customerId: string, updateData: UpdateCustomerRequest): Promise<ICustomer | null> {
        try {
            const customer = await Customer.findByIdAndUpdate(
                customerId,
                { ...updateData },
                { new: true, runValidators: true }
            ).populate('userId', 'phone email role').lean();

            if (!customer) {
                return null;
            }

            return {
                ...customer,
                _id: customer._id.toString(),
                userId: customer.userId // Giữ nguyên object populate
            } as ICustomer;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to update customer: ${error.message}`);
            }
            throw new Error('Failed to update customer: Unknown error');
        }
    }

    /**
     * Delete customer by ID (soft delete)
     */
    async deleteCustomer(customerId: string) {
        try {
            const customer = await Customer.findById(customerId);
            if (!customer) {
                throw new Error('Customer not found');
            }
            await User.findByIdAndUpdate(customer.userId, { isDeleted: true });
            return true;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to delete customer: ${error.message}`);
            }
            throw new Error('Failed to delete customer: Unknown error');
        }
    }

    /**
     * Search customers by name or address
     */
    async searchCustomers(searchTerm: string): Promise<ICustomer[]> {
        try {
            const customersRaw = await Customer.find({
                $or: [
                    { customerName: { $regex: searchTerm, $options: 'i' } },
                    { address: { $regex: searchTerm, $options: 'i' } }
                ]
            })
                .populate('userId', 'phone email role')
                .sort({ createdAt: -1 })
                .limit(20)
                .lean();

            return customersRaw.map(customer => ({
                ...customer,
                _id: customer._id.toString(),
                userId: customer.userId // Giữ nguyên object populate
            })) as ICustomer[];
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to search customers: ${error.message}`);
            }
            throw new Error('Failed to search customers: Unknown error');
        }
    }
}

export default new CustomerService();