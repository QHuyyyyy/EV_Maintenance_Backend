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
            name: 'Auto Parts',
            description: 'Auto part inventory management endpoints'
        },
        {
            name: 'Center Auto Parts',
            description: 'Center-scoped auto part inventory management endpoints'
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
        ,
        {
            name: 'Slots',
            description: 'Time slot management endpoints'
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
            centerId: "string"
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
            address: '123 Main St, City, State',

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
            slot_id: "60f1b2b3c4e5f12338i9j0k5"
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
            name: 'Oil Change',
            order: 1,
            createdAt: '2025-09-21T10:00:00.000Z',
            updatedAt: '2025-09-21T10:00:00.000Z'
        },
        CreateServiceChecklist: {
            name: 'Oil Change',
            order: 1,
        },
        UpdateServiceChecklist: {
            name: 'Oil Change',
            order: 1,
        },
        AutoPart: {
            _id: '60f1b2b3c4e5f6g7h8i9j0k1',
            name: 'Brake Pad',
            cost_price: 35,
            selling_price: 55,
            warranty_time: 120,
            createdAt: '2025-09-21T10:00:00.000Z',
            updatedAt: '2025-09-21T10:00:00.000Z'
        },
        CreateAutoPart: {
            name: 'Brake Pad',
            cost_price: 35,
            selling_price: 55,
            warranty_time: 120,
        },
        UpdateAutoPart: {
            name: 'Brake Pad',
            cost_price: 36,
            selling_price: 58,
            warranty_time: 240,
        },
        CenterAutoPart: {
            _id: '60f1b2b3c4e5f6g7h8i9j0k9',
            center_id: '60f1b2b3c4e5f6g7h8i9j0k5',
            part_id: '60f1b2b3c4e5f6g7h8i9j0k1',
            quantity: 10,
            min_stock: 5,
            recommended_min_stock: 8,
            last_forecast_date: '2025-10-01T00:00:00.000Z',
            createdAt: '2025-10-10T10:00:00.000Z',
            updatedAt: '2025-10-20T12:00:00.000Z'
        },
        CreateCenterAutoPart: {
            center_id: '60f1b2b3c4e5f6g7h8i9j0k5',
            part_id: '60f1b2b3c4e5f6g7h8i9j0k1',
            quantity: 10,
            min_stock: 5,
            recommended_min_stock: 8,
            last_forecast_date: '2025-10-01T00:00:00.000Z'
        },
        UpdateCenterAutoPart: {
            center_id: '60f1b2b3c4e5f6g7h8i9j0k5',
            part_id: '60f1b2b3c4e5f6g7h8i9j0k1',
            quantity: 12,
            min_stock: 5,
            recommended_min_stock: 8,
            last_forecast_date: '2025-10-15T00:00:00.000Z'
        },
        AssignShiftsRequest: {
            system_user_id: '60f1b2b3c4e5f6g7h8i9j0k1',
            workshift_ids: ['60f1b2b3c4e5f6g7h8i9j0a1', '60f1b2b3c4e5f6g7h8i9j0a2']
        },
        ShiftAssignment: {
            _id: '60f1b2b3c4e5f6g7h8i9j0k9',
            system_user_id: '60f1b2b3c4e5f6g7h8i9j0k1',
            workshift_id: '60f1b2b3c4e5f6g7h8i9j0a1'
        },
        WorkShift: {
            _id: '60f1b2b3c4e5f6g7h8i9j0a1',
            shift_date: '2025-10-27',
            start_time: '08:00',
            end_time: '12:00',
            status: 'active',
            center_id: '60f1b2b3c4e5f6g7h8i9j0k2'
        },
        CreateWorkShift: {
            // Either provide a single date or an array of dates
            shift_dates: ['2025-10-27', '2025-10-28'],
            // shift_date: '2025-10-27',
            start_time: '08:00',
            end_time: '12:00',
            status: 'active',
            center_id: '60f1b2b3c4e5f6g7h8i9j0k2'
        },
        UpdateWorkShift: {
            start_time: '09:00',
            end_time: '13:00',
            status: 'completed'
        },
        GenerateSlotsRequest: {
            center_ids: ['60f1b2b3c4e5f6g7h8i9j0k5', '60f1b2b3c4e5f6g7h8i9j0k6'],
            dates: ['2025-11-10', '2025-11-11'],
            start_time: '08:00',
            end_time: '17:00',
            duration: 60
        },
        Slot: {
            _id: '675abc901234567890abcdef',
            center_id: '60f1b2b3c4e5f6g7h8i9j0k5',
            slot_date: '2025-11-10T00:00:00.000Z',
            start_time: '09:00',
            end_time: '10:00',
            capacity: 3,
            booked_count: 0,
            status: 'active',
            createdAt: '2025-11-01T10:00:00.000Z',
            updatedAt: '2025-11-01T10:00:00.000Z'
        },
        ServiceDetail: {
            _id: '60f1b2b3c4e5f6g7h8i9j0k1',
            record_id: '60f1b2b3c4e5f6g7h8i9j0k2',
            centerpart_id: '60f1b2b3c4e5f6g7h8i9j0k3',
            description: 'Replaced brake pads',
            quantity: 2,
            unit_price: 58,
            createdAt: '2025-09-21T10:00:00.000Z',
            updatedAt: '2025-09-21T10:00:00.000Z'
        },
        CreateServiceDetail: {
            record_id: '60f1b2b3c4e5f6g7h8i9j0k2',
            centerpart_id: '60f1b2b3c4e5f6g7h8i9j0k3',
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
            service_record_id: '60f1b2b3c4e5f6g7h8i9j0k2',
            subscription_id: '60f1b2b3c4e5f6g7h8i9j0k3',
            customer_id: '60f1b2b3c4e5f6g7h8i9j0k4',
            order_code: 123456,
            amount: 250000,
            description: 'Payment for maintenance service',
            payment_type: 'service_record',
            status: 'pending',
            payment_url: 'https://payos.vn/pay/123456',
            transaction_id: 'TXN123456789',
            payment_method: 'QR',
            paid_at: '2025-09-21T10:00:00.000Z',
            createdAt: '2025-09-21T10:00:00.000Z',
            updatedAt: '2025-09-21T10:00:00.000Z'
        },
        CreatePayment: {
            service_record_id: '60f1b2b3c4e5f6g7h8i9j0k2',
            customer_id: '60f1b2b3c4e5f6g7h8i9j0k4',
            amount: 250000,
            description: 'Payment for service or subscription',
            payment_type: 'service_record',
            returnUrl: 'https://example.com/payment/success',
            cancelUrl: 'https://example.com/payment/cancel'
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
        },
        StaffAppointment: {
            staffId: '60f1b2b3c4e5f6g7h8i9j0k2'
        },
        TechnicianAppointment: {
            technicianId: '60f1b2b3c4e5f6g7h8i9j0k3'
        }
        ,
        RecordChecklist: {
            _id: '60f1b2b3c4e5f6g7h8i9j0k1',
            checklist_id: '60f1b2b3c4e5f6g7h8i9j0k2',
            record_id: '60f1b2b3c4e5f6g7h8i9j0k3',
            status: 'pending',
            note: 'Optional note for this checklist item on the record',
            suggest: [
                { centerpart_id: '60f1b2b3c4e5f6g7h8i9j0p1', quantity: 2 },
                { centerpart_id: '60f1b2b3c4e5f6g7h8i9j0p2', quantity: 1 }
            ], // CenterAutoPart with quantities
            createdAt: '2025-09-21T10:00:00.000Z',
            updatedAt: '2025-09-21T10:00:00.000Z'
        },
        CreateRecordChecklist: {
            checklist_ids: ['60f1b2b3c4e5f6g7h8i9j0k2', '60f1b2b3c4e5f6g7h8i9j0k4'],
            record_id: '60f1b2b3c4e5f6g7h8i9j0k3',
            status: 'pending',
            note: 'Optional note for this checklist item on the record',
            suggest: [
                // You can also send plain IDs for quantity=1
                { part_id: '60f1b2b3c4e5f6g7h8i9j0p1', quantity: 3 }
            ]
        },
        UpdateRecordChecklist: {
            status: 'completed',
            note: 'Inspected and completed',
            suggest_add: [
                { centerpart_id: '60f1b2b3c4e5f6g7h8i9j0p3', quantity: 2 }
            ],
            suggest_update_qty: [
                { centerpart_id: '60f1b2b3c4e5f6g7h8i9j0p1', quantity: 5 }
            ],
            suggest_remove: ['60f1b2b3c4e5f6g7h8i9j0p2']
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