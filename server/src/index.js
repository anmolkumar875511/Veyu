import 'dotenv/config';
import { createServer } from 'http';

import { createApp } from './app.js';
import { connectDB, disconnectDB, getDBHealth } from './config/db.js';
import { validateJwtConfig } from './config/jwt.config.js';
import { startPulseGridCron } from './cron/pulseGrid.cron.js';
import { startSilentSignalCron } from './cron/silentSignal.cron.js';

function validateEnv() {
    const required = [
        'MONGODB_URI',
        'JWT_ACCESS_SECRET',
        'JWT_REFRESH_SECRET',
        'CLOUDINARY_CLOUD_NAME',
        'CLOUDINARY_API_KEY',
        'CLOUDINARY_API_SECRET',
    ];

    const missing = required.filter((key) => !process.env[key]);
    if (missing.length > 0) {
        console.error(
            '\n[STARTUP] ✗  Missing required environment variables:\n' +
                missing.map((k) => `          • ${k}`).join('\n') +
                '\n\n          Create a .env file — see .env.example for required keys.\n'
        );
        process.exit(1);
    }

    validateJwtConfig();
    console.log('[STARTUP] ✓  Environment variables validated.');
}

function addDetailedHealthRoute(app) {
    app.get('/health/detailed', async (_req, res) => {
        const db = await getDBHealth();
        res.status(db.status === 'connected' ? 200 : 503).json({
            success: db.status === 'connected',
            service: 'nagarik-api',
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

function registerShutdownHandlers(httpServer) {
    let isShuttingDown = false;

    async function shutdown(sig) {
        if (isShuttingDown) return;
        isShuttingDown = true;
        console.log(`\n[SHUTDOWN] Received ${sig}. Shutting down gracefully…`);

        httpServer.close(async () => {
            console.log('[SHUTDOWN] HTTP server closed.');
            await disconnectDB(sig);
            console.log('[SHUTDOWN] ✓  Clean exit.\n');
            process.exit(0);
        });

        setTimeout(() => {
            console.error('[SHUTDOWN] ✗  Forced exit after timeout.');
            process.exit(1);
        }, 10_000);
    }

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
}

function registerGlobalErrorHandlers() {
    process.on('unhandledRejection', (reason) => {
        console.error('[PROCESS] Unhandled promise rejection:', reason);
    });
    process.on('uncaughtException', (err) => {
        console.error('[PROCESS] Uncaught exception (fatal):', err);
        process.exit(1);
    });
}

async function main() {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  Nagarik API  —  Starting up');
    console.log(`  Environment: ${process.env.NODE_ENV ?? 'development'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    validateEnv();
    registerGlobalErrorHandlers();

    await connectDB();

    startPulseGridCron();
    startSilentSignalCron();

    const app = createApp();
    const httpServer = createServer(app);

    addDetailedHealthRoute(app);

    const PORT = parseInt(process.env.PORT ?? '5000', 10);

    httpServer.listen(PORT, () => {
        console.log(`\n[STARTUP] ✓  HTTP server listening on port ${PORT}`);
        console.log(`[STARTUP] ✓  Health: http://localhost:${PORT}/health`);
        console.log('[STARTUP] ✓  Nagarik API is live.\n');
    });

    registerShutdownHandlers(httpServer);
}

main();
