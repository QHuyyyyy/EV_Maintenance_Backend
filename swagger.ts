require('dotenv').config();
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
            name: 'Users',
            description: 'User management and authentication endpoints'
        },
        {
            name: 'Customers',
            description: 'Customer management endpoints'
        },
        {
            name: 'Vehicles',
            description: 'Vehicle management endpoints'
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
            role: 'CUSTOMER',
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
            phone: '+1234567890',
            address: '123 Main St, City, State 12345',
            createdAt: '2025-09-21T10:00:00.000Z',
            updatedAt: '2025-09-21T10:00:00.000Z'
        },
        CreateCustomerRequest: {
            userId: '60f1b2b3c4e5f6g7h8i9j0k2',
            customerName: 'John Doe',
            dateOfBirth: '1990-01-15',
            phone: '+1234567890',
            address: '123 Main St, City, State 12345'
        },
        UpdateCustomerRequest: {
            customerName: 'John Updated',
            dateOfBirth: '1990-01-15',
            phone: '+1234567891',
            address: '456 New St, City, State 12345'
        },
        Vehicle: {
            _id: '60f1b2b3c4e5f6g7h8i9j0k1',
            vehicleId: 'EV001',
            customerId: '60f1b2b3c4e5f6g7h8i9j0k2',
            vehicleName: 'Tesla Model 3',
            model: 'Model 3',
            VIN: '1HGCM82633A123456',
            price: 45000,
            batteryCapacity: 75,
            manufacturingYear: 2023,
            lastServiceDate: '2025-01-15',
            nextServiceDue: '2025-07-15',
            warrantyExpiry: '2028-01-15',
            isActive: true,
            createdAt: '2025-09-21T10:00:00.000Z',
            updatedAt: '2025-09-21T10:00:00.000Z'
        },
        CreateVehicleRequest: {
            vehicleId: 'EV001',
            customerId: '60f1b2b3c4e5f6g7h8i9j0k2',
            vehicleName: 'Tesla Model 3',
            model: 'Model 3',
            VIN: '1HGCM82633A123456',
            price: 45000,
            batteryCapacity: 75,
            manufacturingYear: 2023,
            lastServiceDate: '2025-01-15',
            nextServiceDue: '2025-07-15',
            warrantyExpiry: '2028-01-15'
        },
        UpdateVehicleRequest: {
            vehicleName: 'Tesla Model 3 Updated',
            model: 'Model 3',
            price: 47000,
            batteryCapacity: 80,
            manufacturingYear: 2023,
            lastServiceDate: '2025-02-15',
            nextServiceDue: '2025-08-15',
            warrantyExpiry: '2028-01-15',
            isActive: true
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
    console.log('✅ Swagger documentation generated successfully!');
    console.log('📄 File created: ./src/swagger-output.json');
});