import cookieParser from "cookie-parser";
import cors from "cors";
import "dotenv/config";
import express from "express";
import logger from "morgan";
import swaggerUi from "swagger-ui-express";
import connect from "./database/db";
import userRoutes from "./routes/user.routes";
import authRoutes from "./routes/auth.route";
import customerRoutes from "./routes/customer.routes";
import systemUserRoutes from "./routes/systemUser.routes";
import vehicleRoutes from "./routes/vehicle.routes";
import servicePackageRoutes from "./routes/servicePackage.routes";
import vehicleSubscriptionRoutes from "./routes/vehicleSubscription.routes";
import alertRoutes from "./routes/alert.routes";
import centerRoutes from "./routes/center.routes";
import appointmentRoutes from "./routes/appointment.routes";
import serviceRecordRoutes from "./routes/serviceRecord.routes";
import serviceChecklistRoutes from "./routes/serviceChecklist.routes";
import recordChecklistRoutes from "./routes/recordChecklist.routes";
import autoPartRoutes from "./routes/autoPart.routes";
import centerAutoPartRoutes from "./routes/centerAutoPart.routes";
import serviceDetailRoutes from "./routes/serviceDetail.routes";
import schedulerRoutes from "./routes/scheduler.routes";
import conversationRoutes from "./routes/conversation.routes";
import paymentRoutes from "./routes/payment.routes";
import invoiceRoutes from "./routes/invoice.routes";
import statisticsRoutes from "./routes/statistics.routes";
import shiftAssignmentRoutes from "./routes/shift-assignment.routes";
import shift from './routes/workshift.routes';
import forecastRoutes from './routes/forecast.routes';
import slotRoutes from './routes/slot.routes';
import warrantyRoutes from './routes/warranty.routes';
import vehicleAutoPartRoutes from './routes/vehicleAutoPart.routes';
import inventoryTicketRoutes from './routes/inventoryTicket.routes';
import importRequestRoutes from './routes/importRequest.routes';
import inventoryTransactionRoutes from './routes/inventoryTransaction.routes';
import serviceOrderRoutes from './routes/serviceOrder.routes';
import { maintenanceScheduler } from "./services/maintenanceScheduler.service";
import { initWorkShiftDailyJob } from './services/workshiftScheduler.service';
import { startAnalysisWorker } from "./ai/services/analysisWorker.service";
import { startAnalysisScheduler } from "./ai/services/analysisScheduler.service";
import http from "http";
import chatSocketService from "./socket/chat.socket";


let swaggerFile: any;
try {
    swaggerFile = require('./swagger-output.json');
} catch (error) {
    console.log('Swagger file not found. Run: npm run swagger');
}

// DB initialize
connect();

// Start maintenance scheduler
maintenanceScheduler.startScheduler();
// Start analysis scheduler and worker
startAnalysisScheduler();
startAnalysisWorker();
initWorkShiftDailyJob();
const app = express();

app.use(cors())
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


// Swagger documentation
if (swaggerFile) {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile, {
        customCss: '.swagger-ui .topbar { display: true }',
        customSiteTitle: 'EV Maintenance API Documentation',
        swaggerOptions: {
            persistAuthorization: true,
            displayRequestDuration: true,
            docExpansion: 'list',
            filter: true,
            showExtensions: true,
        }
    }));
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/system-users', systemUserRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/service-packages', servicePackageRoutes);
app.use('/api/vehicle-subscriptions', vehicleSubscriptionRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/centers', centerRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/service-records', serviceRecordRoutes);
app.use('/api/service-checklists', serviceChecklistRoutes);
app.use('/api/record-checklists', recordChecklistRoutes);
app.use('/api/auto-parts', autoPartRoutes);
app.use('/api/center-auto-parts', centerAutoPartRoutes);
app.use('/api/service-details', serviceDetailRoutes);
app.use('/api/scheduler', schedulerRoutes);
app.use('/api/chat', conversationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/workshifts', shift);
app.use('/api/shift-assignments', shiftAssignmentRoutes);
app.use('/api/forecast', forecastRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/warranties', warrantyRoutes);
app.use('/api/vehicle-auto-parts', vehicleAutoPartRoutes);
app.use('/api/inventory-tickets', inventoryTicketRoutes);
app.use('/api/inventory-transactions', inventoryTransactionRoutes);
app.use('/api/service-orders', serviceOrderRoutes);
app.use('/api/import-requests', importRequestRoutes);
app.get('/api/import-requests', (req, res) => {
    // #swagger.tags = ['Import Requests']
    // #swagger.summary = 'Get all import requests'
    // #swagger.description = 'Retrieve paginated list of import requests with optional filters'
    // #swagger.parameters['center_id'] = { description: 'Center ID to filter', required: false, type: 'string', in: 'query' }
    // #swagger.parameters['status'] = { description: 'Status filter', required: false, type: 'string', in: 'query' }
    // #swagger.parameters['page'] = { description: 'Page number', required: false, type: 'number', in: 'query' }
    // #swagger.parameters['limit'] = { description: 'Page size', required: false, type: 'number', in: 'query' }
    // #swagger.security = [{ "bearerAuth": [] }]
    // #swagger.responses[200] = { description: 'Success', schema: { success: true, data: {} } }
});

app.get('/api/import-requests/:id', (req, res) => {
    // #swagger.tags = ['Import Requests']
    // #swagger.summary = 'Get import request by ID'
    // #swagger.parameters['id'] = { description: 'ImportRequest ID', required: true, type: 'string', in: 'path' }
    // #swagger.security = [{ "bearerAuth": [] }]
    // #swagger.responses[200] = { description: 'Success', schema: { success: true, data: {} } }
    // #swagger.responses[404] = { description: 'Not found' }
});

app.post('/api/import-requests', (req, res) => {
    // #swagger.tags = ['Import Requests']
    // #swagger.summary = 'Create import request'
    // #swagger.description = 'Create a new import request'
    // #swagger.security = [{ "bearerAuth": [] }]
    /* #swagger.requestBody = {
        required: true,
        content: {
            'application/json': {
                schema: { $ref: '#/components/schemas/CreateImportRequest' }
            }
        }
    } */
    // #swagger.responses[201] = { description: 'Created', schema: { success: true, message: 'Import request created successfully', data: {} } }
});

app.put('/api/import-requests/:id', (req, res) => {
    // #swagger.tags = ['Import Requests']
    // #swagger.summary = 'Update import request'
    // #swagger.parameters['id'] = { description: 'ImportRequest ID', required: true, type: 'string', in: 'path' }
    // #swagger.security = [{ "bearerAuth": [] }]
    /* #swagger.requestBody = {
        required: true,
        content: {
            'application/json': {
                schema: { $ref: '#/components/schemas/UpdateImportRequest' }
            }
        }
    } */
    // #swagger.responses[200] = { description: 'Updated', schema: { success: true, message: 'Import request updated successfully', data: {} } }
});

app.delete('/api/import-requests/:id', (req, res) => {
    // #swagger.tags = ['Import Requests']
    // #swagger.summary = 'Delete import request'
    // #swagger.parameters['id'] = { description: 'ImportRequest ID', required: true, type: 'string', in: 'path' }
    // #swagger.security = [{ "bearerAuth": [] }]
    // #swagger.responses[200] = { description: 'Deleted', schema: { success: true, message: 'Import request deleted successfully', data: {} } }
});

app.get('/api/import-requests/:request_id/items', (req, res) => {
    // #swagger.tags = ['Import Requests']
    // #swagger.summary = 'Get items of an import request'
    // #swagger.parameters['request_id'] = { description: 'ImportRequest ID', required: true, type: 'string', in: 'path' }
    // #swagger.security = [{ "bearerAuth": [] }]
    // #swagger.responses[200] = { description: 'Success', schema: { success: true, data: [] } }
});

app.get('/', (req, res) => {
    // #swagger.ignore = true
    res.redirect('/api-docs');
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Start server (default 5000 so dashboard can connect websocket ws://localhost:5000)
const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;
const httpServer = http.createServer(app);

// Initialize Socket.io
chatSocketService.initializeSocket(httpServer);

httpServer.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
    console.log(`WebSocket server initialized`);

});

export default app;
