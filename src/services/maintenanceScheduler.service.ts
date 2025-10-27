import cron from 'node-cron';
import { Vehicle } from '../models/vehicle.model';
import { VehicleSubscription } from '../models/vehicleSubcription.model';
import { ServicePackage } from '../models/servicePackage';
import { Alert } from '../models/alert.model';
import Customer from '../models/customer.model';
import { differenceInDays } from 'date-fns';
import { firebaseNotificationService } from '../firebase/fcm.service';

interface AlertPayload {
    vehicleId: string;
    alertId?: string;
    title: string;
    content: string;
    type: 'MAINTENANCE' | 'SUBSCRIPTION_EXPIRY' | 'SERVICE_DUE' | 'SYSTEM' | 'WARNING';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export class MaintenanceSchedulerService {
    private cronJob: any;
    startScheduler() {
        console.log('🚀 Starting Maintenance Scheduler...');

        this.cronJob = cron.schedule('0 */6 * * *', async () => {
            console.log(`[${new Date().toISOString()}] Timer Running maintenance check...`);
            try {
                await this.checkMaintenanceAlerts();
                console.log('✅ Maintenance check completed');
            } catch (error) {
                console.error('❌ Error in maintenance check:', error);
            }
        }, {
            scheduled: true,
            timezone: 'Asia/Ho_Chi_Minh'
        });

        console.log('✅ Maintenance Scheduler started');
    }

    /**
     * Stop CRON job
     */
    stopScheduler() {
        if (this.cronJob) {
            this.cronJob.stop();
            console.log('🛑 Maintenance Scheduler stopped');
        }
    }

    /**
     * Main logic: Kiểm tra tất cả xe
     */
    private async checkMaintenanceAlerts() {
        try {
            // Lấy tất cả xe
            const vehicles = await Vehicle.find({});
            console.log(`📋 Found ${vehicles.length} vehicles to check`);

            for (const vehicle of vehicles) {
                await this.checkVehicleAlerts(vehicle);
            }
        } catch (error) {
            console.error('Error checking maintenance alerts:', error);
        }
    }

    /**
     * Kiểm tra alert cho một xe cụ thể
     */
    private async checkVehicleAlerts(vehicle: any) {
        try {
            // 1️⃣ Kiểm tra SERVICE_DUE (based on mileage + time)
            await this.checkServiceDueAlert(vehicle);

            // 2️⃣ Kiểm tra SUBSCRIPTION_EXPIRY
            await this.checkSubscriptionExpiryAlert(vehicle);
        } catch (error) {
            console.error(`Error checking alerts for vehicle ${vehicle._id}:`, error);
        }
    }

    /**
     * 1️⃣ KIỂM TRA SERVICE DUE
     * 
     * Logic:
     * - Lấy active subscription của xe
     * - Nếu không có subscription → skip
     * - Check mileage: (current_mileage - last_alert_mileage) >= km_interval
     *   → Tạo alert SERVICE_DUE và update last_alert_mileage
     * - Check time: (now - last_service_date) >= service_interval_days
     *   → Tạo alert SERVICE_DUE
     * 
     * 🔄 RESET:
     * - Mileage counter: Khi technician update last_service_date
     *   → reset last_alert_mileage = current mileage
     * - Time counter: Tự động reset khi service (last_service_date update)
     * 
     * 📝 FIELDS:
     * - duration: Subscription active period (e.g., 30 days)
     * - service_interval_days: Maintenance frequency (e.g., 365 days = yearly)
     * - km_interval: Mileage interval for maintenance (e.g., 10000 km per service)
     * - last_alert_mileage: Mileage khi lần cuối alert được trigger
     */
    private async checkServiceDueAlert(vehicle: any) {
        try {
            // Lấy active subscription
            const subscription = await VehicleSubscription.findOne({
                vehicleId: vehicle._id,
                status: "ACTIVE"
            }).populate('package_id');

            if (!subscription) {
                console.log(`⏭️ Vehicle ${vehicle._id}: No active subscription`);
                return;
            }

            const servicePackage = subscription.package_id as any;

            // 🔍 Kiểm tra điều kiện SERVICE_DUE
            // Mileage: Check if (current - last_alert) >= interval
            const mileageSinceLastAlert = vehicle.mileage - (vehicle.last_alert_mileage || 0);
            const isServiceDueByMileage = mileageSinceLastAlert >= servicePackage.km_interval;

            // Time: Check if (now - last_service_date) >= interval
            const daysPassedSinceService = vehicle.last_service_date
                ? differenceInDays(new Date(), new Date(vehicle.last_service_date))
                : null;

            const isServiceDueByTime = daysPassedSinceService
                ? daysPassedSinceService >= servicePackage.service_interval_days
                : true; // Nếu chưa có last_service_date, coi như cần service

            if (isServiceDueByMileage || isServiceDueByTime) {
                // 🚨 Tạo alert
                const alertData: AlertPayload = {
                    vehicleId: vehicle._id.toString(),
                    title: '🔧 Service Due',
                    content: this.buildServiceDueContent(
                        vehicle,
                        servicePackage,
                        isServiceDueByMileage,
                        isServiceDueByTime,
                        daysPassedSinceService,
                        mileageSinceLastAlert
                    ),
                    type: 'SERVICE_DUE',
                    priority: this.calculatePriority(
                        isServiceDueByMileage,
                        isServiceDueByTime,
                        daysPassedSinceService,
                        servicePackage.service_interval_days
                    )
                };

                await this.createAlertIfNotExists(alertData, vehicle._id);
            }
        } catch (error) {
            console.error(`Error checking SERVICE_DUE for vehicle ${vehicle._id}:`, error);
        }
    }

    /**
     * 2️⃣ KIỂM TRA SUBSCRIPTION EXPIRY
     * 
     * Logic:
     * - Lấy active subscription
     * - Nếu subscription sắp hết (< 7 ngày) hoặc đã hết
     *   → Tạo alert SUBSCRIPTION_EXPIRY
     */
    private async checkSubscriptionExpiryAlert(vehicle: any) {
        try {
            const subscription = await VehicleSubscription.findOne({
                vehicleId: vehicle._id,
                status: "ACTIVE"
            }).populate('package_id');

            if (!subscription) {
                return;
            }

            const daysUntilExpiry = differenceInDays(
                new Date(subscription.end_date),
                new Date()
            );

            // ⚠️ Nếu subscription sắp hết hoặc đã hết
            if (daysUntilExpiry <= 7) {
                const alertData: AlertPayload = {
                    vehicleId: vehicle._id.toString(),
                    title: daysUntilExpiry <= 0
                        ? '❌ Subscription Expired'
                        : `⏰ Subscription Expiring Soon (${daysUntilExpiry} days)`,
                    content: this.buildSubscriptionExpiryContent(
                        vehicle,
                        subscription,
                        daysUntilExpiry
                    ),
                    type: 'SUBSCRIPTION_EXPIRY',
                    priority: daysUntilExpiry <= 0 ? 'CRITICAL' : 'HIGH'
                };

                await this.createAlertIfNotExists(alertData);
            }
        } catch (error) {
            console.error(`Error checking SUBSCRIPTION_EXPIRY for vehicle ${vehicle._id}:`, error);
        }
    }

    /**
     * Build content cho SERVICE_DUE alert
     */
    private buildServiceDueContent(
        vehicle: any,
        servicePackage: any,
        byMileage: boolean,
        byTime: boolean,
        daysPassedSinceService: number | null,
        mileageSinceLastAlert: number = 0
    ): string {
        let content = `🚗 ${vehicle.vehicleName} (${vehicle.model})\n`;
        content += `\n📊 Current Status:\n`;
        content += `• Mileage: ${vehicle.mileage} km\n`;
        content += `• Since Last Alert: ${mileageSinceLastAlert} km (Threshold: ${servicePackage.km_interval} km)\n`;

        if (daysPassedSinceService !== null) {
            content += `• Last Service: ${daysPassedSinceService} days ago (Interval: ${servicePackage.service_interval_days} days)\n`;
        }

        content += `\n🛑 Reason(s) for Alert:\n`;
        if (byMileage) {
            const kmOver = mileageSinceLastAlert - servicePackage.km_interval;
            content += `• Mileage exceeded by ${kmOver} km\n`;
        }
        if (byTime) {
            if (daysPassedSinceService !== null) {
                const daysOver = daysPassedSinceService - servicePackage.service_interval_days;
                content += `• Time interval exceeded by ${daysOver} days\n`;
            } else {
                content += `• No service record found\n`;
            }
        }

        content += `\n💡 Recommended Action:\n`;
        content += `Schedule a ${servicePackage.name} service now to maintain vehicle health and warranty.`;

        return content;
    }

    /**
     * Build content cho SUBSCRIPTION_EXPIRY alert
     */
    private buildSubscriptionExpiryContent(
        vehicle: any,
        subscription: any,
        daysUntilExpiry: number
    ): string {
        let content = `🚗 ${vehicle.vehicleName} (${vehicle.model})\n`;
        content += `\n📅 Subscription Details:\n`;
        content += `• Package: ${(subscription.package_id as any).name}\n`;

        if (daysUntilExpiry <= 0) {
            content += `• Status: ❌ EXPIRED (${Math.abs(daysUntilExpiry)} days ago)\n`;
        } else {
            content += `• Expires in: ${daysUntilExpiry} days\n`;
            content += `• Expiry Date: ${new Date(subscription.end_date).toDateString()}\n`;
        }

        content += `\n💡 Recommended Action:\n`;
        content += `Renew your subscription now to continue receiving maintenance alerts and services.`;

        return content;
    }

    /**
     * Tính priority dựa trên urgency
     */
    private calculatePriority(
        byMileage: boolean,
        byTime: boolean,
        daysPassedSinceService: number | null,
        serviceDuration: number
    ): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
        // Nếu cả 2 điều kiện đều vượt → CRITICAL
        if (byMileage && byTime) {
            return 'CRITICAL';
        }

        // Nếu vượt mileage → HIGH
        if (byMileage) {
            return 'HIGH';
        }

        // Nếu vượt time interval nhiều → HIGH
        if (byTime && daysPassedSinceService) {
            const daysOver = daysPassedSinceService - serviceDuration;
            if (daysOver > serviceDuration * 0.5) { // Nếu vượt > 50% interval
                return 'HIGH';
            }
            return 'MEDIUM';
        }

        return 'MEDIUM';
    }

    /**
     * Tạo alert chỉ nếu chưa tồn tại
     * (Tránh tạo duplicate alerts)
     * 
     * 🔄 Update last_alert_mileage nếu alert là SERVICE_DUE
     */
    private async createAlertIfNotExists(alertData: AlertPayload, vehicleId?: any) {
        try {
            // Kiểm tra có alert SERVICE_DUE hoặc SUBSCRIPTION_EXPIRY chưa đọc không
            const existingAlert = await Alert.findOne({
                vehicleId: alertData.vehicleId,
                type: alertData.type,
                isRead: false,
                createdAt: {
                    $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Trong 24h
                }
            });

            if (existingAlert) {
                console.log(`ℹ️ Alert already exists for vehicle ${alertData.vehicleId} (type: ${alertData.type})`);
                return;
            }

            // Tạo alert mới
            const newAlert = new Alert(alertData);
            const savedAlert = await newAlert.save();

            console.log(`✅ Alert created for vehicle ${alertData.vehicleId}: ${alertData.title}`);

            // 🔄 UPDATE last_alert_mileage nếu là SERVICE_DUE alert
            if (alertData.type === 'SERVICE_DUE' && vehicleId) {
                const vehicle = await Vehicle.findById(vehicleId);
                if (vehicle) {
                    vehicle.last_alert_mileage = vehicle.mileage; // Set to current mileage
                    await vehicle.save();
                    console.log(`📍 Updated last_alert_mileage to ${vehicle.mileage} km for vehicle ${vehicleId}`);
                }
            }

            // 🔔 Gửi notification qua Firebase (ADD alertId từ saved alert)
            alertData.alertId = savedAlert._id.toString();
            await this.sendNotification(alertData);
        } catch (error) {
            console.error(`Error creating alert:`, error);
        }
    }

    /**
     * 🔔 Gửi notification qua Firebase Cloud Messaging
     * 
     * Logic:
     * 1. Lấy vehicle để tìm customerId
     * 2. Lấy customer để tìm deviceTokens
     * 3. Gửi push notification đến tất cả devices
     * 4. Xóa tokens không hợp lệ (device đã uninstall app)
     */
    private async sendNotification(alertData: AlertPayload) {
        try {
            // 1️⃣ Lấy vehicle
            const vehicle = await Vehicle.findById(alertData.vehicleId);
            if (!vehicle || !vehicle.customerId) {
                console.log(`⏭️ Vehicle ${alertData.vehicleId}: No customer associated`);
                return;
            }

            // 2️⃣ Lấy customer với device tokens
            const customer = await Customer.findById(vehicle.customerId);
            if (!customer || !customer.deviceTokens || customer.deviceTokens.length === 0) {
                console.log(`⏭️ Customer ${vehicle.customerId}: No registered device tokens`);
                return;
            }

            // 3️⃣ Tạo notification payload
            const notificationPayload = {
                tokens: customer.deviceTokens,
                notification: {
                    title: alertData.title,
                    body: alertData.content.substring(0, 200), // Giới hạn 200 ký tự cho body
                },
                data: {
                    type: 'alert',                    // ← FIX: Send 'alert' type (mobile expects this)
                    id: alertData.alertId || alertData.vehicleId,  // ← FIX: Use alertId if available, fallback to vehicleId
                    vehicleId: alertData.vehicleId,   // ← Keep for context but id is primary
                    alertType: alertData.type,        // ← ADD: Keep specific type (SERVICE_DUE, SUBSCRIPTION_EXPIRY)
                    priority: alertData.priority,
                    timestamp: new Date().toISOString(),
                    // Dữ liệu chi tiết để app xử lý
                    fullContent: alertData.content,
                }
            };

            // 4️⃣ Gửi đến tất cả devices
            console.log(`📤 Sending notification to ${customer.deviceTokens.length} device(s)...`);
            const result = await firebaseNotificationService.sendMulticast(notificationPayload);

            // 5️⃣ Xử lý invalid tokens
            if (result.invalidTokens && result.invalidTokens.length > 0) {
                console.log(`⚠️ Removing ${result.invalidTokens.length} invalid token(s)`);
                await firebaseNotificationService.removeInvalidTokens(
                    result.invalidTokens,
                    vehicle.customerId.toString()
                );
            }

            console.log(`✅ Notification sent successfully (Success: ${result.successCount}, Failed: ${result.failureCount})`);

        } catch (error) {
            console.error('❌ Error sending notification:', error);
        }
    }

    /**
     * Manual trigger (dùng cho testing)
     * Endpoint: POST /scheduler/trigger
     */
    async manualTrigger() {
        console.log('🔫 Manual trigger called');
        await this.checkMaintenanceAlerts();
    }
}

export const maintenanceScheduler = new MaintenanceSchedulerService();
