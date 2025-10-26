require('dotenv').config();
import fs from 'fs';
const swaggerAutogen = require('swagger-autogen')({
    openapi: '3.0.0',
    autoHeaders: false,  // Disable auto header detection
    autoQuery: false,    // Disable auto query parameter detection
    autoBody: false      // Disable auto body detection
});

const doc = {
    info: {
        version: '1.0.0',
        title: 'EV Maintenance Backend API',
        description: 'Auto-generated API documentation for EV Maintenance System',
        contact: {
            name: 'API Support',
            email: 'support@evmaintenance.com'
        }
    },
    host: process.env.NODE_ENV === 'production'
        ? 'ev-maintenance-9bd58b96744e.herokuapp.com'
        : `localhost:${process.env.PORT || 3000}`,
    basePath: '/',
    schemes: process.env.NODE_ENV === 'production' ? ['https'] : ['http'],
    consumes: ['application/json'],
    produces: ['application/json'],
    tags: [
        {
            name: 'Auth',
            description: 'Authentication and authorization endpoints'
        },
        {
            name: 'Users',
            description: 'User management and authentication endpoints'
        },
        {
            name: 'Customers',
            description: 'Customer management endpoints'
        },
        {
            name: 'System Users',
            description: 'System user management endpoints'
        },
        {
            name: 'Vehicles',
            description: 'Vehicle management endpoints'
        },
        {
            name: 'Service Packages',
            description: 'Service package management endpoints'
        },
        {
            name: 'Vehicle Subscriptions',
            description: 'Vehicle subscription management endpoints'
        },
        {
            name: 'Centers',
            description: 'Service center management endpoints'
        },
        {
            name: 'Appointments',
            description: 'Appointment management endpoints'
        },
        {
            name: 'Service Records',
            description: 'Service record management endpoints'
        },
        {
            name: 'Service Checklists',
            description: 'Service checklist management endpoints'
        },
        {
            name: 'Auto Parts',
            description: 'Auto part inventory management endpoints'
        },
        {
            name: 'Service Details',
            description: 'Service detail management endpoints'
        },
        {
            name: 'Payments',
            description: 'Payment processing and management endpoints'
        },
        {
            name: 'Invoices',
            description: 'Invoice management endpoints'
        }
    ],
    definitions: {
        User: {
            user_id: '60f1b2b3c4e5f6g7h8i9j0k1',
            email: 'user@example.com',
            role: 'customer',
            isDeleted: false,
            created_at: '2025-09-21T10:00:00.000Z',
            updated_at: '2025-09-21T10:00:00.000Z'
        },
        Login: {
            email: 'user@example.com',
            password: 'password123'
        },
        Register: {
            email: 'user@example.com',
            password: 'password123',
            role: 'STAFF',
        },
        UserUpdate: {
            email: 'newemail@example.com',
            password: 'newpassword123',
            role: 'TECHNICIAN',
            isDeleted: false,
        },
        ApiResponse: {
            success: true,
            message: 'Operation completed successfully',
            data: {}
        },
        ErrorResponse: {
            success: false,
            message: 'Error message description'
        },
        PaginationInfo: {
            current_page: 1,
            total_pages: 5,
            total_count: 23,
            per_page: 10
        },
        CreateAlert: {
            title: 'Maintenance Due',
            content: 'Your vehicle requires maintenance',
            vehicleId: '507f1f77bcf86cd799439011',
            type: 'MAINTENANCE',
            priority: 'HIGH'
        },
        UsersListResponse: {
            success: true,
            message: 'Users retrieved successfully',
            data: [{ $ref: '#/definitions/User' }],
            pagination: { $ref: '#/definitions/PaginationInfo' }
        },
        Customer: {
            _id: '60f1b2b3c4e5f6g7h8i9j0k1',
            userId: '60f1b2b3c4e5f6g7h8i9j0k2',
            customerName: 'John Doe',
            dateOfBirth: '1990-01-15',
            address: '123 Main St, City, State 12345',
            createdAt: '2025-09-21T10:00:00.000Z',
            updatedAt: '2025-09-21T10:00:00.000Z'
        },
        CreateCustomer: {
            userId: '507f1f77bcf86cd799439011',
            customerName: 'John Doe',
            dateOfBirth: '1990-01-15',
            phone: '+1234567890',
            address: '123 Main St, City, State'
        },
        UpdateCustomer: {
            customerName: 'John Doe',
            dateOfBirth: '1990-01-15',
            address: '123 Main St, City, State'
        },
        UpdateSystemUser: {
            name: 'John Doe',
            dateOfBirth: '1990-01-15',
            certificates: [
                {
                    name: 'AWS Certified Solutions Architect',
                    issuingOrganization: 'Amazon',
                    issueDate: '2020-01-01',
                    expirationDate: '2023-01-01',
                    credentialUrl: 'https://www.cert-url.com/123'
                }
            ]
        },
        AssignVehicle: {
            vehicleId: '60f1b2b3c4e5f6g7h8i9j0k1',
            phone: '0123456789'
        },
        SystemUser: {
            _id: '60f1b2b3c4e5f6g7h8i9j0k1',
            userId: '60f1b2b3c4e5f6g7h8i9j0k2',
            name: 'John Doe',
            dateOfBirth: '1990-01-15',
            phone: '+1234567890',
            certificate: 'string',
            createdAt: '2025-09-21T10:00:00.000Z',
            updatedAt: '2025-09-21T10:00:00.000Z'
        },
        Center: {
            _id: '60f1b2b3c4e5f6g7h8i9j0k1',
            name: 'Downtown Service Center',
            address: '456 Main St, City, State 54321',
            phone: '+1234567890',
            createdAt: '2025-09-21T10:00:00.000Z',
            updatedAt: '2025-09-21T10:00:00.000Z'
        },
        CreateCenter: {
            name: 'Downtown Service Center',
            address: '456 Main St, City, State 54321',
            phone: '+1234567890'
        },
        UpdateCenter: {
            name: 'Updated Service Center',
            address: '789 New St, City, State 54321',
            phone: '+0987654321'
        },
        Appointment: {
            _id: '60f1b2b3c4e5f6g7h8i9j0k1',
            staffId: '60f1b2b3c4e5f6g7h8i9j0k2',
            customer_id: '60f1b2b3c4e5f6g7h8i9j0k3',
            vehicle_id: '60f1b2b3c4e5f6g7h8i9j0k4',
            center_id: '60f1b2b3c4e5f6g7h8i9j0k5',
            startTime: '2025-10-16T09:00:00.000Z',
            endTime: '2025-10-16T11:00:00.000Z',
            status: 'scheduled',
            createdAt: '2025-09-21T10:00:00.000Z',
            updatedAt: '2025-09-21T10:00:00.000Z'
        },
        CreateAppointment: {
            staffId: '60f1b2b3c4e5f6g7h8i9j0k2',
            customer_id: '60f1b2b3c4e5f6g7h8i9j0k3',
            vehicle_id: '60f1b2b3c4e5f6g7h8i9j0k4',
            center_id: '60f1b2b3c4e5f6g7h8i9j0k5',
            startTime: '2025-10-16T09:00:00.000Z',
            endTime: '2025-10-16T11:00:00.000Z',
            status: 'scheduled'
        },
        UpdateAppointment: {
            startTime: '2025-10-16T10:00:00.000Z',
            endTime: '2025-10-16T12:00:00.000Z',
            status: 'completed'
        },
        ServiceRecord: {
            _id: '60f1b2b3c4e5f6g7h8i9j0k1',
            appointment_id: '60f1b2b3c4e5f6g7h8i9j0k2',
            technician_id: '60f1b2b3c4e5f6g7h8i9j0k3',
            start_time: '2025-10-16T09:00:00.000Z',
            end_time: '2025-10-16T11:00:00.000Z',
            description: 'Regular maintenance completed',
            status: 'completed',
            createdAt: '2025-09-21T10:00:00.000Z',
            updatedAt: '2025-09-21T10:00:00.000Z'
        },
        CreateServiceRecord: {
            appointment_id: '60f1b2b3c4e5f6g7h8i9j0k2',
            technician_id: '60f1b2b3c4e5f6g7h8i9j0k3',
            start_time: '2025-10-16T09:00:00.000Z',
            end_time: '2025-10-16T11:00:00.000Z',
            description: 'Regular maintenance completed',
            status: 'completed'
        },
        UpdateServiceRecord: {
            end_time: '2025-10-16T12:00:00.000Z',
            description: 'Maintenance and inspection completed',
            status: 'completed'
        },
        ServiceChecklist: {
            _id: '60f1b2b3c4e5f6g7h8i9j0k1',
            record_id: '60f1b2b3c4e5f6g7h8i9j0k2',
            name: 'Oil Change',
            status: 'completed',
            note: 'Used synthetic oil',
            createdAt: '2025-09-21T10:00:00.000Z',
            updatedAt: '2025-09-21T10:00:00.000Z'
        },
        CreateServiceChecklist: {
            record_id: '60f1b2b3c4e5f6g7h8i9j0k2',
            name: 'Oil Change',
            status: 'pending',
            note: 'Schedule oil change'
        },
        UpdateServiceChecklist: {
            name: 'Oil Change',
            status: 'completed',
            note: 'Used synthetic oil'
        },
        AutoPart: {
            _id: '60f1b2b3c4e5f6g7h8i9j0k1',
            name: 'Brake Pad',
            quantity: 15,
            cost_price: 35,
            selling_price: 55,
            min_stock: 5,
            recommended_min_stock: 10,
            last_forecast_date: '2025-09-15T10:00:00.000Z',
            createdAt: '2025-09-21T10:00:00.000Z',
            updatedAt: '2025-09-21T10:00:00.000Z'
        },
        CreateAutoPart: {
            name: 'Brake Pad',
            quantity: 20,
            cost_price: 35,
            selling_price: 55,
            min_stock: 5,
            recommended_min_stock: 10,
            last_forecast_date: '2025-09-15T10:00:00.000Z'
        },
        UpdateAutoPart: {
            name: 'Brake Pad',
            quantity: 18,
            cost_price: 36,
            selling_price: 58,
            min_stock: 6,
            recommended_min_stock: 12,
            last_forecast_date: '2025-10-01T10:00:00.000Z'
        },
        ServiceDetail: {
            _id: '60f1b2b3c4e5f6g7h8i9j0k1',
            record_id: '60f1b2b3c4e5f6g7h8i9j0k2',
            part_id: '60f1b2b3c4e5f6g7h8i9j0k3',
            description: 'Replaced brake pads',
            quantity: 2,
            unit_price: 58,
            createdAt: '2025-09-21T10:00:00.000Z',
            updatedAt: '2025-09-21T10:00:00.000Z'
        },
        CreateServiceDetail: {
            record_id: '60f1b2b3c4e5f6g7h8i9j0k2',
            part_id: '60f1b2b3c4e5f6g7h8i9j0k3',
            description: 'Replaced brake pads',
            quantity: 2,
            unit_price: 58
        },
        UpdateServiceDetail: {
            description: 'Replaced brake pads and rotors',
            quantity: 4,
            unit_price: 60
        },
        Payment: {
            _id: '60f1b2b3c4e5f6g7h8i9j0k1',
            appointment_id: '60f1b2b3c4e5f6g7h8i9j0k2',
            customer_id: '60f1b2b3c4e5f6g7h8i9j0k3',
            order_code: 123456,
            amount: 250000,
            description: 'Payment for maintenance service',
            status: 'pending',
            payment_url: 'https://payos.vn/pay/123456',
            transaction_id: 'TXN123456789',
            payment_method: 'QR',
            paid_at: '2025-09-21T10:00:00.000Z',
            createdAt: '2025-09-21T10:00:00.000Z',
            updatedAt: '2025-09-21T10:00:00.000Z'
        },
        CreatePayment: {
            appointment_id: '60f1b2b3c4e5f6g7h8i9j0k2',
            customer_id: '60f1b2b3c4e5f6g7h8i9j0k3',
            amount: 250000,
            description: 'Payment for maintenance service'
        },
        PaymentWebhook: {
            order_code: 123456,
            status: 'PAID',
            transaction_id: 'TXN123456789',
            payment_method: 'QR',
            paid_at: '2025-09-21T10:00:00.000Z'
        },
        Invoice: {
            _id: '60f1b2b3c4e5f6g7h8i9j0k1',
            payment_id: '60f1b2b3c4e5f6g7h8i9j0k2',
            invoiceType: 'VAT',
            minusAmount: 0,
            totalAmount: 250000,
            payment_method: 'QR',
            transaction_code: 'TXN123456789',
            status: 'issued',
            createdAt: '2025-09-21T10:00:00.000Z',
            updatedAt: '2025-09-21T10:00:00.000Z'
        },
        CreateInvoice: {
            payment_id: '60f1b2b3c4e5f6g7h8i9j0k2',
            invoiceType: 'VAT',
            minusAmount: 0,
            totalAmount: 250000
        },
        UpdateInvoice: {
            status: 'issued',
            minusAmount: 5000,
            totalAmount: 245000
        }
    },
    securityDefinitions: {
        bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            description: 'Enter your JWT Bearer token here',
        },
    },
};

const outputFile = './src/swagger-output.json';
const endpointsFiles = [
    './src/app.ts'
];

swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
    const swaggerData: Record<string, any> = JSON.parse(fs.readFileSync(outputFile, 'utf8'));

    const newPaths: Record<string, any> = {};
    for (const path in swaggerData.paths) {
        if (path.endsWith('/') && path !== '/') {
            // Bỏ dấu / cuối
            const newPath = path.slice(0, -1);
            newPaths[newPath] = swaggerData.paths[path];
        } else {
            newPaths[path] = swaggerData.paths[path];
        }
    }

    swaggerData.paths = newPaths;

    fs.writeFileSync(outputFile, JSON.stringify(swaggerData, null, 2));
    console.log('✅ Swagger documentation generated successfully!');
    console.log('📄 File created: ./src/swagger-output.json');
});