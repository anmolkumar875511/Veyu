import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import morgan from 'morgan';
import passport from 'passport';
import { configurePassport } from './config/passport.config.js';

import authRoutes from './routes/auth.routes.js';
import complaintRoutes from './routes/complaint.routes.js';
import officerRoutes from './routes/officer.routes.js';
import workerRoutes from './routes/worker.routes.js';
import wardRoutes from './routes/ward.routes.js';
import forecastRoutes from './routes/forecast.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import userRoutes from './routes/user.routes.js';

import { errorHandler, notFoundHandler } from './middleware/errorHandler.middleware.js';

const ALLOWED_ORIGINS = [
    process.env.CLIENT_URL,
    'http://localhost:5173',
    'http://localhost:3000',
].filter(Boolean);

export function createApp() {
    const app = express();
    configurePassport();
    app.use(passport.initialize());
    app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

    app.use(
        cors({
            origin(origin, cb) {
                if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
                cb(new Error(`CORS: origin ${origin} is not allowed.`));
            },
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization'],
        })
    );

    app.use(compression());
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    app.use(cookieParser());

    if (process.env.NODE_ENV !== 'test') {
        app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
    }

    app.set('trust proxy', 1);

    app.get('/health', (_req, res) => {
        res.status(200).json({
            success: true,
            service: 'veyu-api',
            environment: process.env.NODE_ENV ?? 'development',
            timestamp: new Date().toISOString(),
        });
    });

    app.use('/api/auth', authRoutes);
    app.use('/api/complaints', complaintRoutes);
    app.use('/api/officer', officerRoutes);
    app.use('/api/worker', workerRoutes);
    app.use('/api/wards', wardRoutes);
    app.use('/api/forecasts', forecastRoutes);
    app.use('/api/notifications', notificationRoutes);
    app.use('/api/users', userRoutes);

    app.use(notFoundHandler);
    app.use(errorHandler);

    return app;
}
