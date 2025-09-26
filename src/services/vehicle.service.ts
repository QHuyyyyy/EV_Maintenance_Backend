import Vehicle from '../models/vehicle.model';
import { CreateVehicleRequest, UpdateVehicleRequest, IVehicle } from '../types/vehicle.type';

export class VehicleService {

    /**
     * Create a new vehicle
     */
    async createVehicle(vehicleData: CreateVehicleRequest): Promise<IVehicle> {
        try {
            // Check if vehicle with this VIN already exists
            const existingVIN = await Vehicle.findOne({ VIN: vehicleData.VIN });
            if (existingVIN) {
                throw new Error('Vehicle with this VIN already exists');
            }

            // Check if vehicle ID already exists
            const existingVehicleId = await Vehicle.findOne({ vehicleId: vehicleData.vehicleId });
            if (existingVehicleId) {
                throw new Error('Vehicle with this ID already exists');
            }

            const vehicle = new Vehicle(vehicleData);
            const savedVehicle = await vehicle.save();
            return await this.getVehicleById(savedVehicle._id.toString());
        } catch (error) {
            if (error instanceof Error) {
                if ((error as any).code === 11000) {
                    if ((error as any).keyPattern?.VIN) {
                        throw new Error('Vehicle with this VIN already exists');
                    }
                    if ((error as any).keyPattern?.vehicleId) {
                        throw new Error('Vehicle with this ID already exists');
                    }
                }
                throw new Error(`Failed to create vehicle: ${error.message}`);
            }
            throw new Error('Failed to create vehicle: Unknown error');
        }
    }

    /**
     * Get vehicle by ID
     */
    async getVehicleById(vehicleId: string): Promise<IVehicle> {
        try {
            const vehicle = await Vehicle.findById(vehicleId)
                .populate('customerId', 'customerName phone')
                .lean();
            
            if (!vehicle) {
                throw new Error('Vehicle not found');
            }
            return {
                ...vehicle,
                _id: vehicle._id.toString(),
                customerId: vehicle.customerId.toString()
            } as IVehicle;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to get vehicle: ${error.message}`);
            }
            throw new Error('Failed to get vehicle: Unknown error');
        }
    }

    /**
     * Get vehicle by VIN
     */
    async getVehicleByVIN(vin: string): Promise<IVehicle | null> {
        try {
            const vehicle = await Vehicle.findOne({ VIN: vin.toUpperCase() })
                .populate('customerId', 'customerName phone')
                .lean();
            
            if (!vehicle) {
                return null;
            }
            
            return {
                ...vehicle,
                _id: vehicle._id.toString(),
                customerId: vehicle.customerId.toString()
            } as IVehicle;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to get vehicle by VIN: ${error.message}`);
            }
            throw new Error('Failed to get vehicle by VIN: Unknown error');
        }
    }

    /**
     * Get vehicles by customer ID
     */
    async getVehiclesByCustomerId(customerId: string): Promise<IVehicle[]> {
        try {
            const vehiclesRaw = await Vehicle.find({ customerId, isActive: true })
                .populate('customerId', 'customerName phone')
                .sort({ createdAt: -1 })
                .lean();

            return vehiclesRaw.map(vehicle => ({
                ...vehicle,
                _id: vehicle._id.toString(),
                customerId: vehicle.customerId.toString()
            })) as IVehicle[];
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to get vehicles by customer: ${error.message}`);
            }
            throw new Error('Failed to get vehicles by customer: Unknown error');
        }
    }

    /**
     * Get all vehicles with optional filtering and pagination
     */
    async getAllVehicles(filters?: {
        vehicleName?: string;
        model?: string;
        customerId?: string;
        isActive?: boolean;
        page?: number;
        limit?: number;
    }): Promise<{
        vehicles: IVehicle[];
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
            if (filters?.vehicleName) {
                query.vehicleName = { $regex: filters.vehicleName, $options: 'i' };
            }
            if (filters?.model) {
                query.model = { $regex: filters.model, $options: 'i' };
            }
            if (filters?.customerId) {
                query.customerId = filters.customerId;
            }
            if (filters?.isActive !== undefined) {
                query.isActive = filters.isActive;
            }

            // Execute queries
            const [vehiclesRaw, total] = await Promise.all([
                Vehicle.find(query)
                    .populate('customerId', 'customerName phone')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                Vehicle.countDocuments(query)
            ]);

            const vehicles = vehiclesRaw.map(vehicle => ({
                ...vehicle,
                _id: vehicle._id.toString(),
                customerId: vehicle.customerId.toString()
            })) as IVehicle[];

            return {
                vehicles,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            };
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to get vehicles: ${error.message}`);
            }
            throw new Error('Failed to get vehicles: Unknown error');
        }
    }

    /**
     * Update vehicle by ID
     */
    async updateVehicle(vehicleId: string, updateData: UpdateVehicleRequest): Promise<IVehicle | null> {
        try {
            const vehicle = await Vehicle.findByIdAndUpdate(
                vehicleId,
                { ...updateData },
                { new: true, runValidators: true }
            ).populate('customerId', 'customerName phone').lean();

            if (!vehicle) {
                return null;
            }

            return {
                ...vehicle,
                _id: vehicle._id.toString(),
                customerId: vehicle.customerId.toString()
            } as IVehicle;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to update vehicle: ${error.message}`);
            }
            throw new Error('Failed to update vehicle: Unknown error');
        }
    }

    /**
     * Delete vehicle by ID (soft delete)
     */
    async deleteVehicle(vehicleId: string): Promise<IVehicle> {
        try {
            const vehicle = await Vehicle.findByIdAndUpdate(
                vehicleId,
                { isActive: false },
                { new: true, runValidators: true }
            ).populate('customerId', 'customerName phone').lean();

            if (!vehicle) {
                throw new Error('Vehicle not found');
            }

            return {
                ...vehicle,
                _id: vehicle._id.toString(),
                customerId: vehicle.customerId.toString()
            } as IVehicle;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to delete vehicle: ${error.message}`);
            }
            throw new Error('Failed to delete vehicle: Unknown error');
        }
    }

    /**
     * Search vehicles by name, model, or VIN
     */
    async searchVehicles(searchTerm: string): Promise<IVehicle[]> {
        try {
            const vehiclesRaw = await Vehicle.find({
                $and: [
                    { isActive: true },
                    {
                        $or: [
                            { vehicleName: { $regex: searchTerm, $options: 'i' } },
                            { model: { $regex: searchTerm, $options: 'i' } },
                            { VIN: { $regex: searchTerm, $options: 'i' } },
                            { vehicleId: { $regex: searchTerm, $options: 'i' } }
                        ]
                    }
                ]
            })
                .populate('customerId', 'customerName phone')
                .sort({ createdAt: -1 })
                .limit(20)
                .lean();

            return vehiclesRaw.map(vehicle => ({
                ...vehicle,
                _id: vehicle._id.toString(),
                customerId: vehicle.customerId.toString()
            })) as IVehicle[];
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to search vehicles: ${error.message}`);
            }
            throw new Error('Failed to search vehicles: Unknown error');
        }
    }

    /**
     * Get vehicles due for service
     */
    async getVehiclesDueForService(): Promise<IVehicle[]> {
        try {
            const today = new Date();
            const vehiclesRaw = await Vehicle.find({
                isActive: true,
                nextServiceDue: { $lte: today }
            })
                .populate('customerId', 'customerName phone')
                .sort({ nextServiceDue: 1 })
                .lean();

            return vehiclesRaw.map(vehicle => ({
                ...vehicle,
                _id: vehicle._id.toString(),
                customerId: vehicle.customerId.toString()
            })) as IVehicle[];
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to get vehicles due for service: ${error.message}`);
            }
            throw new Error('Failed to get vehicles due for service: Unknown error');
        }
    }
}

export default new VehicleService();