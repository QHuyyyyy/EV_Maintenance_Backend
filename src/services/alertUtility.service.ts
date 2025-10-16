import { AlertService } from "./alert.service";
import { AlertType, AlertPriority } from "../types/alert.type";
const alertService = new AlertService();
export class AlertUtilityService {
    // Tạo alert cho maintenance due
    static async createMaintenanceAlert(vehicleId: string, maintenanceType: string): Promise<void> {
        try {
            await alertService.createAlert({
                title: "Maintenance Due",
                content: `Your vehicle requires ${maintenanceType} maintenance. Please schedule an appointment.`,
                vehicleId,
                type: AlertType.MAINTENANCE,
                priority: AlertPriority.HIGH
            });
        } catch (error) {
            console.error("Error creating maintenance alert:", error);
        }
    }

    // Tạo alert cho subscription expiry
    static async createSubscriptionExpiryAlert(vehicleId: string, daysRemaining: number): Promise<void> {
        try {
            let priority = AlertPriority.MEDIUM;
            if (daysRemaining <= 3) priority = AlertPriority.CRITICAL;
            else if (daysRemaining <= 7) priority = AlertPriority.HIGH;

            await alertService.createAlert({
                title: "Subscription Expiring Soon",
                content: `Your vehicle subscription will expire in ${daysRemaining} day(s). Please renew to continue service.`,
                vehicleId,
                type: AlertType.SUBSCRIPTION_EXPIRY,
                priority
            });
        } catch (error) {
            console.error("Error creating subscription expiry alert:", error);
        }
    }

    // Tạo alert cho service due
    static async createServiceDueAlert(vehicleId: string, serviceType: string, dueDate: Date): Promise<void> {
        try {
            const today = new Date();
            const timeDiff = dueDate.getTime() - today.getTime();
            const daysUntilDue = Math.ceil(timeDiff / (1000 * 3600 * 24));

            let priority = AlertPriority.MEDIUM;
            if (daysUntilDue <= 0) priority = AlertPriority.CRITICAL;
            else if (daysUntilDue <= 3) priority = AlertPriority.HIGH;

            const dueDateStr = dueDate.toLocaleDateString();

            await alertService.createAlert({
                title: "Service Due",
                content: `${serviceType} service is due on ${dueDateStr}. ${daysUntilDue <= 0 ? 'Service is overdue!' : `${daysUntilDue} day(s) remaining.`}`,
                vehicleId,
                type: AlertType.SERVICE_DUE,
                priority
            });
        } catch (error) {
            console.error("Error creating service due alert:", error);
        }
    }

    // Tạo alert cảnh báo
    static async createWarningAlert(vehicleId: string, warningMessage: string, priority: AlertPriority = AlertPriority.HIGH): Promise<void> {
        try {
            await alertService.createAlert({
                title: "Vehicle Warning",
                content: warningMessage,
                vehicleId,
                type: AlertType.WARNING,
                priority
            });
        } catch (error) {
            console.error("Error creating warning alert:", error);
        }
    }

    // Tạo system alert
    static async createSystemAlert(vehicleId: string, systemMessage: string, priority: AlertPriority = AlertPriority.MEDIUM): Promise<void> {
        try {
            await alertService.createAlert({
                title: "System Notification",
                content: systemMessage,
                vehicleId,
                type: AlertType.SYSTEM,
                priority
            });
        } catch (error) {
            console.error("Error creating system alert:", error);
        }
    }

    // Check và tạo alerts tự động cho tất cả vehicles
    static async checkAndCreateAutoAlerts(): Promise<void> {
        try {
            // Import ở đây để tránh circular dependency
            const { Vehicle } = await import("../models/vehicle.model");

            const vehicles = await Vehicle.find().lean();

            for (const vehicle of vehicles) {
                // Kiểm tra maintenance (ví dụ: mỗi 6 tháng)
                // Sử dụng createdAt để tính toán, có thể thêm lastMaintenance field vào Vehicle model sau
                const lastMaintenanceDate = vehicle.createdAt;
                const sixMonthsAgo = new Date();
                sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

                if (new Date(lastMaintenanceDate) < sixMonthsAgo) {
                    await this.createMaintenanceAlert(vehicle._id.toString(), "routine");
                }

                // Kiểm tra subscription expiry (nếu có thông tin subscription)
                // Có thể expand logic này dựa trên vehicle subscription model

                // Kiểm tra service due dates
                // Có thể expand logic này dựa trên service history
            }
        } catch (error) {
            console.error("Error in auto alert check:", error);
        }
    }


}