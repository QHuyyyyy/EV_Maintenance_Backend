export interface IAlert {
    _id?: string;
    title: string;
    content: string;
    isRead: boolean;
    vehicleId: string;
    type: AlertType;
    priority: AlertPriority;
    createdAt?: Date;
    updatedAt?: Date;
}

export enum AlertType {
    MAINTENANCE = 'MAINTENANCE',
    SUBSCRIPTION_EXPIRY = 'SUBSCRIPTION_EXPIRY',
    SERVICE_DUE = 'SERVICE_DUE',
    SYSTEM = 'SYSTEM',
    WARNING = 'WARNING'
}

export enum AlertPriority {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    CRITICAL = 'CRITICAL'
}

export interface CreateAlertRequest {
    title: string;
    content: string;
    vehicleId: string;
    type?: AlertType;
    priority?: AlertPriority;
}

export interface UpdateAlertRequest {
    title?: string;
    content?: string;
    isRead?: boolean;
    type?: AlertType;
    priority?: AlertPriority;
}

export interface AlertQueryParams {
    vehicleId?: string;
    isRead?: boolean;
    type?: AlertType;
    priority?: AlertPriority;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}