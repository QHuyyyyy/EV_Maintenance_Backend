import { ServicePackage } from '../models/servicePackage';

export class ServicePackageService {
    // Lấy tất cả gói dịch vụ
    async getAllServicePackages() {
        try {
            const packages = await ServicePackage.find().sort({ price: 1 });
            return packages;
        } catch (error) {
            throw new Error(`Error fetching service packages: ${error}`);
        }
    }

    // Lấy gói dịch vụ theo ID
    async getServicePackageById(id: string) {
        try {
            const package_ = await ServicePackage.findById(id);
            return package_;
        } catch (error) {
            throw new Error(`Error fetching service package: ${error}`);
        }
    }

    // Tạo gói dịch vụ mới
    async createServicePackage(packageData: any) {
        try {
            // Validate dữ liệu
            if (!packageData.name || !packageData.description || !packageData.price || !packageData.duration || !packageData.km_interval) {
                throw new Error('Missing required fields');
            }

            if (packageData.price <= 0) {
                throw new Error('Price must be greater than 0');
            }

            if (packageData.duration <= 0) {
                throw new Error('Duration must be greater than 0');
            }

            if (packageData.km_interval <= 0) {
                throw new Error('KM interval must be greater than 0');
            }

            const package_ = new ServicePackage(packageData);
            const savedPackage = await package_.save();
            return savedPackage;
        } catch (error) {
            throw new Error(`Error creating service package: ${error}`);
        }
    }

    // Cập nhật gói dịch vụ
    async updateServicePackage(id: string, updateData: any) {
        try {
            // Validate dữ liệu nếu có
            if (updateData.price !== undefined && updateData.price <= 0) {
                throw new Error('Price must be greater than 0');
            }

            if (updateData.duration !== undefined && updateData.duration <= 0) {
                throw new Error('Duration must be greater than 0');
            }

            if (updateData.km_interval !== undefined && updateData.km_interval <= 0) {
                throw new Error('KM interval must be greater than 0');
            }

            const updatedPackage = await ServicePackage.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            );

            return updatedPackage;
        } catch (error) {
            throw new Error(`Error updating service package: ${error}`);
        }
    }

    // Xóa gói dịch vụ
    async deleteServicePackage(id: string) {
        try {
            // Kiểm tra xem gói có đang được sử dụng không
            const hasActiveSubscriptions = await this.hasActiveSubscriptions(id);
            if (hasActiveSubscriptions) {
                throw new Error('Cannot delete service package with active subscriptions');
            }

            const deletedPackage = await ServicePackage.findByIdAndDelete(id);
            return deletedPackage;
        } catch (error) {
            throw new Error(`Error deleting service package: ${error}`);
        }
    }

    // Kiểm tra gói dịch vụ có đăng ký đang hoạt động không
    async hasActiveSubscriptions(packageId: string) {
        try {
            const { VehicleSubscription } = require('../models/vehicleSubcription.model');
            const activeSubscriptions = await VehicleSubscription.find({
                package_id: packageId,
                status: 'ACTIVE'
            });
            return activeSubscriptions.length > 0;
        } catch (error) {
            throw new Error(`Error checking active subscriptions: ${error}`);
        }
    }

    // Lấy gói dịch vụ phổ biến nhất
    async getPopularPackages(limit: number = 5) {
        try {
            const { VehicleSubscription } = require('../models/vehicleSubcription.model');

            const popularPackages = await VehicleSubscription.aggregate([
                {
                    $group: {
                        _id: '$package_id',
                        subscriptionCount: { $sum: 1 }
                    }
                },
                {
                    $lookup: {
                        from: 'servicepackages',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'package'
                    }
                },
                {
                    $unwind: '$package'
                },
                {
                    $sort: { subscriptionCount: -1 }
                },
                {
                    $limit: limit
                },
                {
                    $project: {
                        _id: '$package._id',
                        name: '$package.name',
                        description: '$package.description',
                        price: '$package.price',
                        duration: '$package.duration',
                        km_interval: '$package.km_interval',
                        subscriptionCount: 1
                    }
                }
            ]);

            return popularPackages;
        } catch (error) {
            throw new Error(`Error fetching popular packages: ${error}`);
        }
    }
}