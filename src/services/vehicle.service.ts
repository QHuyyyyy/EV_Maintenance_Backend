import { Vehicle } from '../models/vehicle.model';
import Customer from '../models/customer.model';
import FirebaseStorageService from '../firebase/storage.service';

export class VehicleService {
    // Lấy tất cả xe với filter
    async getAllVehicles(filters: any = {}) {
        try {
            const query: any = {};
            const page = filters.page ? Number(filters.page) : 1;
            const limit = filters.limit ? Number(filters.limit) : 10;
            const skip = (page - 1) * limit;

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

            const [vehicles, total] = await Promise.all([
                Vehicle.find(query)
                    .populate('customerId', 'customerName address')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit),
                Vehicle.countDocuments(query)
            ]);

            return {
                vehicles,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit) || 1
            };
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
            // Kiểm tra customer có tồn tại không (chỉ khi customerId được cung cấp và không null)
            if (vehicleData.customerId && vehicleData.customerId !== null && vehicleData.customerId !== '') {
                const customer = await Customer.findById(vehicleData.customerId);
                if (!customer) {
                    throw new Error('Customer not found');
                }
            } else {
                // Đảm bảo customerId là null khi không có chủ sở hữu
                vehicleData.customerId = null;
            }

            // Xử lý Date fields: nếu empty string thì convert thành null
            if (vehicleData.last_service_date === '' || vehicleData.last_service_date === null) {
                vehicleData.last_service_date = null;
            }

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
            // Lọc bỏ các field empty để giữ nguyên giá trị cũ trong database
            const filteredUpdateData: any = {};

            for (const [key, value] of Object.entries(updateData)) {
                // Chỉ thêm vào filteredUpdateData nếu giá trị không phải là empty
                if (value !== null && value !== undefined && value !== '' &&
                    !(Array.isArray(value) && value.length === 0)) {
                    filteredUpdateData[key] = value;
                }
            }

            if (filteredUpdateData.VIN) {
                const existingVehicle = await Vehicle.findOne({
                    VIN: filteredUpdateData.VIN,
                    _id: { $ne: id }
                });
                if (existingVehicle) {
                    throw new Error('VIN already exists');
                }
            }

            // Kiểm tra plateNumber không trùng lặp (nếu có cập nhật plateNumber)
            if (filteredUpdateData.plateNumber) {
                const existingPlateVehicle = await Vehicle.findOne({
                    plateNumber: filteredUpdateData.plateNumber,
                    _id: { $ne: id }
                });
                if (existingPlateVehicle) {
                    throw new Error('Plate number already exists');
                }
            }

            // Validate year
            if (filteredUpdateData.year && (filteredUpdateData.year < 1900 || filteredUpdateData.year > new Date().getFullYear() + 1)) {
                throw new Error('Invalid vehicle year');
            }

            // Validate mileage
            if (filteredUpdateData.mileage && filteredUpdateData.mileage < 0) {
                throw new Error('Mileage cannot be negative');
            }

            // Validate last_alert_mileage
            if (filteredUpdateData.last_alert_mileage && filteredUpdateData.last_alert_mileage < 0) {
                throw new Error('Last alert mileage cannot be negative');
            }

            // Nếu không có field nào để update, trả về vehicle hiện tại
            if (Object.keys(filteredUpdateData).length === 0) {
                return await this.getVehicleById(id);
            }

            const updatedVehicle = await Vehicle.findByIdAndUpdate(
                id,
                filteredUpdateData,
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
            // Guard: don't delete if there is an active subscription
            const hasActive = await this.hasActiveSubscriptions(id);
            if (hasActive) {
                throw new Error('Không thể xóa xe vì đang có gói đăng ký (subscription) còn hiệu lực');
            }
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

export default new VehicleService();