import 'dotenv/config';
import { createServer } from 'http';
import { createApp } from './app.js';
import { connectDB, disconnectDB, getDBHealth } from './config/db.js';
import { validateJwtConfig } from './config/jwt.config.js';
import { startPulseGridCron } from './cron/pulseGrid.cron.js';
import { startSilentSignalCron } from './cron/silentSignal.cron.js';
import { logger } from './utils/logger.js';

const REQUIRED_ENV = [
    'MONGODB_URI',
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
];

function validateEnv() {
    const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
    if (missing.length > 0) {
        logger.error('Startup', `Missing required env vars: ${missing.join(', ')}`);
        process.exit(1);
    }
    validateJwtConfig();
    logger.success('Startup', 'Environment validated');
}

function addDetailedHealth(app) {
    app.get('/health/detailed', async (_req, res) => {
        const db = await getDBHealth();
        res.status(db.status === 'connected' ? 200 : 503).json({
            success: db.status === 'connected',
            service: 'veyu-api',
            environment: process.env.NODE_ENV ?? 'development',
            timestamp: new Date().toISOString(),
            database: db,
            uptime: Math.floor(process.uptime()),
            memory: {
                heapUsedMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                rssMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
            },
        });
    });
}

function registerShutdown(httpServer) {
    let shutting = false;

    async function shutdown(sig) {
        if (shutting) return;
        shutting = true;
        logger.info('Shutdown', `Received ${sig} — shutting down`);

        httpServer.close(async () => {
            await disconnectDB(sig);
            logger.success('Shutdown', 'Clean exit');
            process.exit(0);
        });

        setTimeout(() => {
            logger.error('Shutdown', 'Forced exit after timeout');
            process.exit(1);
        }, 10_000);
    }

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
}

function registerProcessHandlers() {
    process.on('unhandledRejection', (reason) => {
        logger.error('Process', 'Unhandled promise rejection', reason);
    });
    process.on('uncaughtException', (err) => {
        logger.error('Process', 'Uncaught exception (fatal)', err);
        process.exit(1);
    });
}

async function main() {
    logger.info('Startup', `Veyu API — ${process.env.NODE_ENV ?? 'development'}`);

    validateEnv();
    registerProcessHandlers();

    try {
        await connectDB();
    } catch (err) {
        logger.error('Startup', 'Could not connect to MongoDB — exiting', err);
        process.exit(1);
    }

    startPulseGridCron();
    startSilentSignalCron();

    const app = createApp();
    const httpServer = createServer(app);

    addDetailedHealth(app);

    const PORT = parseInt(process.env.PORT ?? '5000', 10);

    httpServer.listen(PORT, () => {
        logger.success('Startup', `HTTP server on port ${PORT}`);
        logger.success('Startup', `Health: http://localhost:${PORT}/health`);
        logger.success('Startup', 'Veyu API is live');
    });

    registerShutdown(httpServer);
}

main();
