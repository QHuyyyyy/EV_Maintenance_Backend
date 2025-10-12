import cookieParser from "cookie-parser";
import cors from "cors";
import "dotenv/config";
import express from "express";
import logger from "morgan";
import swaggerUi from "swagger-ui-express";
import connect from "./database/db";
import userRoutes from "./routes/user.routes";
import authRoutes from "./routes/auth.route";


let swaggerFile: any;
try {
    swaggerFile = require('./swagger-output.json');
} catch (error) {
    console.log('Swagger file not found. Run: npm run swagger');
}

// DB initialize
connect();

const app = express();

app.use(cors())
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Swagger documentation
if (swaggerFile) {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile, {
        customCss: '.swagger-ui .topbar { display: none }',
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
app.listen(process.env.PORT ?? 3000, () => {
    console.log(`App listening on port ${process.env.PORT || 3000}`);
});

export default app;
