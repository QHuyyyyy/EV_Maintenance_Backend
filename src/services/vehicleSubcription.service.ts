import { VehicleSubscription } from '../models/vehicleSubcription.model';
import { Vehicle } from '../models/vehicle.model';
import { ServicePackage } from '../models/servicePackage';
import { nowVN } from '../utils/time';

export class VehicleSubscriptionService {
    async getAllSubscriptions() {
        try {
            const subscriptions = await VehicleSubscription.find()
                .populate('vehicleId', 'vehicleName model VIN')
                .populate('package_id', 'name description price duration km_interval')
                .sort({ start_date: -1 });
            return subscriptions;
        } catch (error) {
            throw new Error(`Error fetching subscriptions: ${error}`);
        }
    }

    async getSubscriptionById(id: string) {
        try {
            const subscription = await VehicleSubscription.findById(id)
                .populate('vehicleId', 'vehicleName model VIN')
                .populate('package_id', 'name description price duration km_interval');
            return subscription;
        } catch (error) {
            throw new Error(`Error fetching subscription: ${error}`);
        }
    }

    async getSubscriptionsByVehicle(vehicleId: string) {
        try {
            const subscriptions = await VehicleSubscription.find({ vehicleId })
                .populate('package_id', 'name description price duration km_interval')
                .sort({ start_date: -1 });
            return subscriptions;
        } catch (error) {
            throw new Error(`Error fetching subscriptions by vehicle: ${error}`);
        }
    }

    async getSubscriptionsByCustomer(customerId: string) {
        try {
            // Tìm tất cả xe của khách hàng trước
            const vehicles = await Vehicle.find({ customerId });
            const vehicleIds = vehicles.map(v => v._id);

            const subscriptions = await VehicleSubscription.find({
                vehicleId: { $in: vehicleIds }
            })
                .populate('vehicleId', 'vehicleName model VIN')
                .populate('package_id', 'name description price duration km_interval')
                .sort({ start_date: -1 });

            return subscriptions;
        } catch (error) {
            throw new Error(`Error fetching subscriptions by customer: ${error}`);
        }
    }

    async createSubscription(subscriptionData: any) {
        try {
            // Validate dữ liệu
            if (!subscriptionData.vehicleId || !subscriptionData.package_id) {
                throw new Error('Vehicle ID and Package ID are required');
            }

            // Kiểm tra xe có tồn tại không
            const vehicle = await Vehicle.findById(subscriptionData.vehicleId);
            if (!vehicle) {
                throw new Error('Vehicle not found');
            }

            // Kiểm tra gói dịch vụ có tồn tại không
            const servicePackage = await ServicePackage.findById(subscriptionData.package_id);
            if (!servicePackage) {
                throw new Error('Service package not found');
            }

            // Kiểm tra xe có đăng ký đang hoạt động không
            const activeSubscription = await this.getActiveSubscriptionByVehicle(subscriptionData.vehicleId);
            if (activeSubscription) {
                throw new Error('Vehicle already has an active subscription');
            }

            // Tính toán ngày bắt đầu và kết thúc
            // Duration được tính bằng ngày
            let startDate: Date;
            if (subscriptionData.start_date) {
                startDate = new Date(subscriptionData.start_date);
                // Kiểm tra xem ngày có hợp lệ không
                if (isNaN(startDate.getTime())) {
                    throw new Error('Invalid start_date format. Please provide a valid date');
                }
            } else {
                startDate = new Date();
            }

            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + servicePackage.duration);
            
            // Calculate pricing with discount
            const originalPrice = servicePackage.price || 0;
            const discountPercent = servicePackage.discount_percent || 0;
            const discountAmount = Math.floor((originalPrice * discountPercent) / 100);
            const finalPrice = originalPrice - discountAmount;
            
            const subscription = new VehicleSubscription({
                vehicleId: subscriptionData.vehicleId,
                package_id: subscriptionData.package_id,
                start_date: startDate,
                end_date: endDate,
                // Always start as PENDING until payment is completed via webhook
                status: 'PENDING',
                // Pricing information
                original_price: originalPrice,
                discount_percent: discountPercent,
                discount_amount: discountAmount,
                final_price: finalPrice
            });

            const savedSubscription = await subscription.save();
            return await this.getSubscriptionById(savedSubscription._id.toString());
        } catch (error) {
            throw new Error(`Error creating subscription: ${error}`);
        }
    }

    // Cập nhật đăng ký
    async updateSubscription(id: string, updateData: any) {
        try {
            // Kiểm tra nếu cập nhật gói dịch vụ
            if (updateData.package_id) {
                const servicePackage = await ServicePackage.findById(updateData.package_id);
                if (!servicePackage) {
                    throw new Error('Service package not found');
                }

                // Nếu thay đổi gói dịch vụ, cần tính lại ngày kết thúc
                // Duration được tính bằng ngày
                if (updateData.start_date) {
                    const startDate = new Date(updateData.start_date);
                    // Kiểm tra xem ngày có hợp lệ không
                    if (isNaN(startDate.getTime())) {
                        throw new Error('Invalid start_date format. Please provide a valid date');
                    }
                    const endDate = new Date(startDate);
                    endDate.setDate(endDate.getDate() + servicePackage.duration);
                    updateData.end_date = endDate;
                }
            }

            const updatedSubscription = await VehicleSubscription.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            )
                .populate('vehicleId', 'vehicleName model VIN')
                .populate('package_id', 'name description price duration km_interval');

            return updatedSubscription;
        } catch (error) {
            throw new Error(`Error updating subscription: ${error}`);
        }
    }

    // Cập nhật trạng thái đăng ký
    async updateSubscriptionStatus(id: string, status: string) {
        try {
            const validStatuses = ['ACTIVE', 'EXPIRED', 'PENDING'];
            if (!validStatuses.includes(status)) {
                throw new Error('Invalid status');
            }

            const updatedSubscription = await VehicleSubscription.findByIdAndUpdate(
                id,
                { status },
                { new: true, runValidators: true }
            )
                .populate('vehicleId', 'vehicleName model VIN')
                .populate('package_id', 'name description price duration km_interval');

            return updatedSubscription;
        } catch (error) {
            throw new Error(`Error updating subscription status: ${error}`);
        }
    }

    // Xóa đăng ký
    async deleteSubscription(id: string) {
        try {
            const deletedSubscription = await VehicleSubscription.findByIdAndDelete(id);
            return deletedSubscription;
        } catch (error) {
            throw new Error(`Error deleting subscription: ${error}`);
        }
    }

    // Lấy đăng ký đang hoạt động của xe
    async getActiveSubscriptionByVehicle(vehicleId: string) {
        try {
            const activeSubscription = await VehicleSubscription.findOne({
                vehicleId,
                status: 'ACTIVE',
                end_date: { $gte: new Date() }
            })
                .populate('package_id', 'name description price duration km_interval');

            return activeSubscription;
        } catch (error) {
            throw new Error(`Error fetching active subscription: ${error}`);
        }
    }

    // Lấy đăng ký sắp hết hạn
    async getExpiringSubscriptions(days: number = 30) {
        try {
            const expiryDate = nowVN();
            expiryDate.setDate(expiryDate.getDate() + days);

            const expiringSubscriptions = await VehicleSubscription.find({
                status: 'ACTIVE',
                end_date: {
                    $gte: nowVN(),
                    $lte: expiryDate
                }
            })
                .populate('vehicleId', 'vehicleName model VIN')
                .populate('package_id', 'name description price duration km_interval')
                .sort({ end_date: 1 });

            return expiringSubscriptions;
        } catch (error) {
            throw new Error(`Error fetching expiring subscriptions: ${error}`);
        }
    }

    // Gia hạn đăng ký
    async renewSubscription(id: string, newPackageId?: string) {
        try {
            const subscription = await VehicleSubscription.findById(id);
            if (!subscription) {
                throw new Error('Subscription not found');
            }

            const packageId = newPackageId || subscription.package_id;
            const servicePackage = await ServicePackage.findById(packageId);
            if (!servicePackage) {
                throw new Error('Service package not found');
            }

            // Tạo đăng ký mới
            // Duration được tính bằng ngày
            const newStartDate = subscription.end_date;
            const newEndDate = new Date(newStartDate);
            newEndDate.setDate(newEndDate.getDate() + servicePackage.duration);

            const renewedSubscription = new VehicleSubscription({
                vehicleId: subscription.vehicleId,
                package_id: packageId,
                start_date: newStartDate,
                end_date: newEndDate,
                status: 'ACTIVE'
            });

            // Cập nhật đăng ký cũ thành EXPIRED
            await VehicleSubscription.findByIdAndUpdate(id, { status: 'EXPIRED' });

            const savedSubscription = await renewedSubscription.save();
            return await this.getSubscriptionById(savedSubscription._id.toString());
        } catch (error) {
            throw new Error(`Error renewing subscription: ${error}`);
        }
    }

    // Cập nhật trạng thái đăng ký hết hạn tự động
    async updateExpiredSubscriptions() {
        try {
            const expiredSubscriptions = await VehicleSubscription.updateMany(
                {
                    status: 'ACTIVE',
                    end_date: { $lt: new Date() }
                },
                { status: 'EXPIRED' }
            );

            return expiredSubscriptions;
        } catch (error) {
            throw new Error(`Error updating expired subscriptions: ${error}`);
        }
    }

    // Tính discount cho hóa đơn dựa trên subscription của xe
    async calculateSubscriptionDiscount(vehicleId: string, totalAmount: number): Promise<{
        hasSubscription: boolean;
        discount: number;
        discountPercent: number;
        finalAmount: number;
        subscriptionId?: string;
        packageName?: string;
    }> {
        try {
            // Kiểm tra xe có subscription đang active không
            const activeSubscription = await VehicleSubscription.findOne({
                vehicleId,
                status: 'ACTIVE',
                start_date: { $lte: new Date() },
                end_date: { $gte: new Date() }
            }).populate('package_id', 'name discount_percent');

            if (!activeSubscription) {
                return {
                    hasSubscription: false,
                    discount: 0,
                    discountPercent: 0,
                    finalAmount: totalAmount
                };
            }

            const servicePackage = activeSubscription.package_id as any;
            const discountPercent = servicePackage.discount_percent || 0;
            const discount = (totalAmount * discountPercent) / 100;
            const finalAmount = totalAmount - discount;

            return {
                hasSubscription: true,
                discount: Math.round(discount),
                discountPercent,
                finalAmount: Math.round(finalAmount),
                subscriptionId: activeSubscription._id.toString(),
                packageName: servicePackage.name
            };
        } catch (error) {
            throw new Error(`Error calculating subscription discount: ${error}`);
        }
    }

    // Lấy thông tin subscription của xe để hiển thị khi tạo hóa đơn
    async getSubscriptionForBilling(vehicleId: string) {
        try {
            const activeSubscription = await VehicleSubscription.findOne({
                vehicleId,
                status: 'ACTIVE',
                start_date: { $lte: new Date() },
                end_date: { $gte: new Date() }
            })
                .populate('package_id', 'name description price discount_percent duration')
                .populate('vehicleId', 'vehicleName model plateNumber');

            if (!activeSubscription) {
                return null;
            }

            return {
                subscriptionId: activeSubscription._id,
                vehicleInfo: activeSubscription.vehicleId,
                packageInfo: activeSubscription.package_id,
                startDate: activeSubscription.start_date,
                endDate: activeSubscription.end_date,
                status: activeSubscription.status
            };
        } catch (error) {
            throw new Error(`Error fetching subscription for billing: ${error}`);
        }
    }

    // Lấy package theo service record
    async getPackageByServiceRecord(serviceRecordId: string) {
        try {
            const ServiceRecord = require('../models/serviceRecord.model').default;
            
            // Lấy service record và populate appointment -> vehicle
            const serviceRecord = await ServiceRecord.findById(serviceRecordId)
                .populate({
                    path: 'appointment_id',
                    populate: { path: 'vehicle_id' }
                });

            if (!serviceRecord) {
                throw new Error('Service record not found');
            }

            console.log('📋 Service Record found:', {
                id: serviceRecord._id,
                appointment: serviceRecord.appointment_id ? 'exists' : 'missing'
            });

            const appointment = serviceRecord.appointment_id as any;
            if (!appointment || !appointment.vehicle_id) {
                return {
                    hasSubscription: false,
                    message: 'Vehicle information not found in service record',
                    debug: {
                        hasAppointment: !!appointment,
                        hasVehicle: !!(appointment && appointment.vehicle_id)
                    }
                };
            }

            const vehicleId = appointment.vehicle_id._id.toString();
            console.log('🚗 Vehicle ID:', vehicleId);

            const today = new Date();
            today.setHours(0, 0, 0, 0); // Reset to start of day for comparison

            // Tìm subscription active của vehicle
            const activeSubscription = await VehicleSubscription.findOne({
                vehicleId,
                status: 'ACTIVE'
                // Bỏ check date ở đây vì có thể chênh lệch timestamp
            })
                .populate('package_id')
                .populate('vehicleId', 'vehicleName model plateNumber');

            console.log('📦 Active subscription:', activeSubscription ? 'found' : 'not found');

            if (!activeSubscription) {
                return null;
            }

            // Chỉ trả về package
            return activeSubscription.package_id;
        } catch (error) {
            throw new Error(`Error fetching package by service record: ${error}`);
        }
    }
}

export default new VehicleSubscriptionService();