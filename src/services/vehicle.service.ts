import { Vehicle } from '../models/vehicle.model';
import Customer from '../models/customer.model';

export class VehicleService {
    // Lấy tất cả xe
    async getAllVehicles() {
        try {
            const vehicles = await Vehicle.find().populate('customerId', 'customerName phone address');
            return vehicles;
        } catch (error) {
            throw new Error(`Error fetching vehicles: ${error}`);
        }
    }

    // Lấy xe theo ID
    async getVehicleById(id: string) {
        try {
            const vehicle = await Vehicle.findById(id).populate('customerId', 'customerName phone address');
            return vehicle;
        } catch (error) {
            throw new Error(`Error fetching vehicle: ${error}`);
        }
    }

    // Lấy xe theo customer ID
    async getVehiclesByCustomer(customerId: string) {
        try {
            const vehicles = await Vehicle.find({ customerId }).populate('customerId', 'customerName phone address');
            return vehicles;
        } catch (error) {
            throw new Error(`Error fetching vehicles by customer: ${error}`);
        }
    }

    // Tạo xe mới
    async createVehicle(vehicleData: any) {
        try {
            // Kiểm tra xem customer có tồn tại không
            const customer = await Customer.findById(vehicleData.customerId);
            if (!customer) {
                throw new Error('Customer not found');
            }

            // Kiểm tra VIN không trùng lặp
            if (vehicleData.VIN) {
                const existingVehicle = await Vehicle.findOne({ VIN: vehicleData.VIN });
                if (existingVehicle) {
                    throw new Error('VIN already exists');
                }
            }

            const vehicle = new Vehicle(vehicleData);
            const savedVehicle = await vehicle.save();
            return await this.getVehicleById(savedVehicle._id.toString());
        } catch (error) {
            throw new Error(`Error creating vehicle: ${error}`);
        }
    }

    // Cập nhật xe
    async updateVehicle(id: string, updateData: any) {
        try {
            // Kiểm tra VIN không trùng lặp (nếu có cập nhật VIN)
            if (updateData.VIN) {
                const existingVehicle = await Vehicle.findOne({
                    VIN: updateData.VIN,
                    _id: { $ne: id }
                });
                if (existingVehicle) {
                    throw new Error('VIN already exists');
                }
            }

            // Kiểm tra customer có tồn tại không (nếu có cập nhật customerId)
            if (updateData.customerId) {
                const customer = await Customer.findById(updateData.customerId);
                if (!customer) {
                    throw new Error('Customer not found');
                }
            }

            const updatedVehicle = await Vehicle.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            ).populate('customerId', 'customerName phone address');

            return updatedVehicle;
        } catch (error) {
            throw new Error(`Error updating vehicle: ${error}`);
        }
    }

    // Xóa xe
    async deleteVehicle(id: string) {
        try {
            const deletedVehicle = await Vehicle.findByIdAndDelete(id);
            return deletedVehicle;
        } catch (error) {
            throw new Error(`Error deleting vehicle: ${error}`);
        }
    }

    // Kiểm tra xe có đăng ký dịch vụ không
    async hasActiveSubscriptions(vehicleId: string) {
        try {
            const { VehicleSubscription } = require('../models/vehicleSubcription.model');
            const activeSubscriptions = await VehicleSubscription.find({
                vehicleId,
                status: 'ACTIVE'
            });
            return activeSubscriptions.length > 0;
        } catch (error) {
            throw new Error(`Error checking subscriptions: ${error}`);
        }
    }
}