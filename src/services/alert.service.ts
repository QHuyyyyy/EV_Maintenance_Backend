import { Alert } from "../models/alert.model";
import { Vehicle } from "../models/vehicle.model";
import { IAlert, CreateAlertRequest, UpdateAlertRequest, AlertQueryParams } from "../types/alert.type";


export class AlertService {
    async createAlert(alertData: CreateAlertRequest): Promise<IAlert> {
        try {
            // Kiểm tra vehicle có tồn tại không
            const vehicle = await Vehicle.findById(alertData.vehicleId);
            if (!vehicle) {
                throw new Error("Vehicle not found");
            }

            const newAlert = new Alert(alertData);
            const savedAlert = await newAlert.save();
            return await this.getAlertById(savedAlert._id.toString());
        } catch (error) {
            throw new Error(`Error creating alert: ${error}`);
        }
    }

    async getAllAlerts(queryParams: AlertQueryParams = {}): Promise<{
        alerts: IAlert[];
        totalCount: number;
        currentPage: number;
        totalPages: number;
    }> {
        try {
            const {
                vehicleId,
                isRead,
                type,
                priority,
                page = 1,
                limit = 10,
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = queryParams;

            // Tạo filter object
            const filter: any = {};
            if (vehicleId) filter.vehicleId = vehicleId;
            if (isRead !== undefined) filter.isRead = isRead;
            if (type) filter.type = type;
            if (priority) filter.priority = priority;

            // Tạo sort object
            const sort: any = {};
            sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

            const skip = (page - 1) * limit;

            const [alerts, totalCount] = await Promise.all([
                Alert.find(filter)
                    .populate({
                        path: 'vehicleId',
                        select: 'vehicleName model VIN'
                    })
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                Alert.countDocuments(filter)
            ]);

            const totalPages = Math.ceil(totalCount / limit);

            // Convert ObjectId to string for response
            const formattedAlerts = alerts.map(alert => ({
                ...alert,
                _id: alert._id.toString(),
                vehicleId: typeof alert.vehicleId === 'object' && alert.vehicleId._id
                    ? alert.vehicleId._id.toString()
                    : alert.vehicleId.toString()
            }));

            return {
                alerts: formattedAlerts as IAlert[],
                totalCount,
                currentPage: page,
                totalPages
            };
        } catch (error) {
            throw new Error(`Error fetching alerts: ${error}`);
        }
    }

    async getAlertById(alertId: string): Promise<IAlert> {
        try {
            const alert = await Alert.findById(alertId)
                .populate({
                    path: 'vehicleId',
                    select: 'vehicleName model VIN'
                })
                .lean();

            if (!alert) {
                throw new Error("Alert not found");
            }

            // Convert ObjectId to string for response
            const formattedAlert = {
                ...alert,
                _id: alert._id.toString(),
                vehicleId: typeof alert.vehicleId === 'object' && alert.vehicleId._id
                    ? alert.vehicleId._id.toString()
                    : alert.vehicleId.toString()
            };

            return formattedAlert as IAlert;
        } catch (error) {
            throw new Error(`Error fetching alert: ${error}`);
        }
    }

    // Cập nhật alert
    async updateAlert(alertId: string, updateData: UpdateAlertRequest): Promise<IAlert> {
        try {
            const updatedAlert = await Alert.findByIdAndUpdate(
                alertId,
                updateData,
                { new: true, runValidators: true }
            ).populate({
                path: 'vehicleId',
                select: 'vehicleName model VIN'
            }).lean();

            if (!updatedAlert) {
                throw new Error("Alert not found");
            }

            // Convert ObjectId to string for response
            const formattedAlert = {
                ...updatedAlert,
                _id: updatedAlert._id.toString(),
                vehicleId: typeof updatedAlert.vehicleId === 'object' && updatedAlert.vehicleId._id
                    ? updatedAlert.vehicleId._id.toString()
                    : updatedAlert.vehicleId.toString()
            };

            return formattedAlert as IAlert;
        } catch (error) {
            throw new Error(`Error updating alert: ${error}`);
        }
    }


    // Đánh dấu alert là đã đọc
    async markAsRead(alertId: string): Promise<IAlert> {
        try {
            return await this.updateAlert(alertId, { isRead: true });
        } catch (error) {
            throw new Error(`Error marking alert as read: ${error}`);
        }
    }




}