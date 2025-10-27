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
import autoPartRoutes from "./routes/autoPart.routes";
import serviceDetailRoutes from "./routes/serviceDetail.routes";
import schedulerRoutes from "./routes/scheduler.routes";
import conversationRoutes from "./routes/conversation.routes";
import paymentRoutes from "./routes/payment.routes";
import invoiceRoutes from "./routes/invoice.routes";
import { maintenanceScheduler } from "./services/maintenanceScheduler.service";
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
app.use('/api/auto-parts', autoPartRoutes);
app.use('/api/service-details', serviceDetailRoutes);
app.use('/api/scheduler', schedulerRoutes);
app.use('/api/chat', conversationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/invoices', invoiceRoutes);

// Root route redirect to API docs

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

// Start server
const PORT = process.env.PORT ?? 3000;
const httpServer = http.createServer(app);

// Initialize Socket.io
chatSocketService.initializeSocket(httpServer);

httpServer.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
    console.log(`WebSocket server initialized`);
});

export default app;
