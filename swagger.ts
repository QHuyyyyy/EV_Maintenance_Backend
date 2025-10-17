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
            phone: '+1234567890',
            address: '123 Main St, City, State'
        },
        UpdateSystemUser: {
            name: 'John Doe',
            dateOfBirth: '1990-01-15',
            phone: '+1234567890',
            certification: 'string'
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