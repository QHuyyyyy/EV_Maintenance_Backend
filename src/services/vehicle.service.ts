import { Vehicle } from '../models/vehicle.model';
import Customer from '../models/customer.model';
import FirebaseStorageService from '../firebase/storage.service';

export class VehicleService {
    // Lấy tất cả xe với filter
    async getAllVehicles(filters: any = {}) {
        try {
            const query: any = {};

            // Filter theo customerId
            if (filters.customerId) {
                query.customerId = filters.customerId;
            }

            // Filter theo năm sản xuất
            if (filters.year) {
                query.year = filters.year;
            }

            // Filter theo model
            if (filters.model) {
                query.model = new RegExp(filters.model, 'i');
            }

            // Filter theo vehicleName
            if (filters.vehicleName) {
                query.vehicleName = new RegExp(filters.vehicleName, 'i');
            }

            // Filter theo plateNumber
            if (filters.plateNumber) {
                query.plateNumber = new RegExp(filters.plateNumber, 'i');
            }

            // Filter theo VIN
            if (filters.VIN) {
                query.VIN = new RegExp(filters.VIN, 'i');
            }

            // Filter theo mileage (range)
            if (filters.minMileage || filters.maxMileage) {
                query.mileage = {};
                if (filters.minMileage) {
                    query.mileage.$gte = Number(filters.minMileage);
                }
                if (filters.maxMileage) {
                    query.mileage.$lte = Number(filters.maxMileage);
                }
            }

            // Filter theo price (range)
            if (filters.minPrice || filters.maxPrice) {
                query.price = {};
                if (filters.minPrice) {
                    query.price.$gte = Number(filters.minPrice);
                }
                if (filters.maxPrice) {
                    query.price.$lte = Number(filters.maxPrice);
                }
            }

            const vehicles = await Vehicle.find(query).populate('customerId', 'customerName address');
            return vehicles;
        } catch (error) {
            throw new Error(`Error fetching vehicles: ${error}`);
        }
    }

    // Lấy xe theo ID
    async getVehicleById(id: string) {
        try {
            const vehicle = await Vehicle.findById(id).populate('customerId', 'customerName address');
            return vehicle;
        } catch (error) {
            throw new Error(`Error fetching vehicle: ${error}`);
        }
    }

    // Lấy xe theo customer ID
    async getVehiclesByCustomer(customerId: string) {
        try {
            const vehicles = await Vehicle.find({ customerId }).populate('customerId', 'customerName address');
            return vehicles;
        } catch (error) {
            throw new Error(`Error fetching vehicles by customer: ${error}`);
        }
    }

    // Tạo xe mới
    async createVehicle(vehicleData: any) {
        try {
            // Kiểm tra xem customer có tồn tại không (chỉ khi customerId được cung cấp)
            if (vehicleData.customerId) {
                const customer = await Customer.findById(vehicleData.customerId);
                if (!customer) {
                    throw new Error('Customer not found');
                }
            }

            // Kiểm tra VIN không trùng lặp
            if (vehicleData.VIN) {
                const existingVehicle = await Vehicle.findOne({ VIN: vehicleData.VIN });
                if (existingVehicle) {
                    throw new Error('VIN already exists');
                }
            }

            // Kiểm tra plateNumber không trùng lặp
            if (vehicleData.plateNumber) {
                const existingPlateVehicle = await Vehicle.findOne({ plateNumber: vehicleData.plateNumber });
                if (existingPlateVehicle) {
                    throw new Error('Plate number already exists');
                }
            }

            // Validate year
            if (vehicleData.year && (vehicleData.year < 1900 || vehicleData.year > new Date().getFullYear() + 1)) {
                throw new Error('Invalid vehicle year');
            }

            // Validate mileage
            if (vehicleData.mileage && vehicleData.mileage < 0) {
                throw new Error('Mileage cannot be negative');
            }
            if (vehicleData.last_service_date && isNaN(new Date(vehicleData.last_service_date).getTime())) {
                throw new Error('Invalid last service date');
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

            // Kiểm tra plateNumber không trùng lặp (nếu có cập nhật plateNumber)
            if (updateData.plateNumber) {
                const existingPlateVehicle = await Vehicle.findOne({
                    plateNumber: updateData.plateNumber,
                    _id: { $ne: id }
                });
                if (existingPlateVehicle) {
                    throw new Error('Plate number already exists');
                }
            }

            // Validate year
            if (updateData.year && (updateData.year < 1900 || updateData.year > new Date().getFullYear() + 1)) {
                throw new Error('Invalid vehicle year');
            }

            // Validate mileage
            if (updateData.mileage && updateData.mileage < 0) {
                throw new Error('Mileage cannot be negative');
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
            ).populate('customerId', 'customerName address');

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

    // Cập nhật mileage
    async updateMileage(id: string, newMileage: number) {
        try {
            if (newMileage < 0) {
                throw new Error('Mileage cannot be negative');
            }

            const vehicle = await Vehicle.findById(id);
            if (!vehicle) {
                throw new Error('Vehicle not found');
            }

            if (vehicle.mileage && newMileage < vehicle.mileage) {
                throw new Error('New mileage cannot be less than current mileage');
            }

            const updatedVehicle = await Vehicle.findByIdAndUpdate(
                id,
                { mileage: newMileage },
                { new: true, runValidators: true }
            ).populate('customerId', 'customerName address');

            return updatedVehicle;
        } catch (error) {
            throw new Error(`Error updating mileage: ${error}`);
        }
    }

    // Cập nhật ngày bảo dưỡng cuối
    async updateLastServiceDate(id: string, serviceDate: Date) {
        try {
            const updatedVehicle = await Vehicle.findByIdAndUpdate(
                id,
                { last_service_date: serviceDate },
                { new: true, runValidators: true }
            ).populate('customerId', 'customerName address');

            return updatedVehicle;
        } catch (error) {
            throw new Error(`Error updating last service date: ${error}`);
        }
    }


}