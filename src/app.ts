import cookieParser from "cookie-parser";
import cors from "cors";
import "dotenv/config";
import express from "express";
import logger from "morgan";
import connect from "./database/db";
import userRoutes from "./routes/user.routes";


// DB initialize
connect();

const app = express();

app.use(cors());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


// Default route
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Welcome to EV Maintenance Backend API',
        version: '1.0.0'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

app.listen(process.env.PORT ?? 3000, () => {
    console.log(`App listening on port ${process.env.PORT || 3000}`);
});

export default app;
