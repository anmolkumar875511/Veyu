import 'dotenv/config';
import { createApp } from '../src/app.js';
import { connectDB } from '../src/config/db.js';
import { validateJwtConfig } from '../src/config/jwt.config.js';
import { logger } from '../src/utils/logger.js';

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
        throw new Error(`Missing required env vars: ${missing.join(', ')}`);
    }
    validateJwtConfig();
}

const app = createApp();

let dbConnectionPromise = null;

export default async function handler(req, res) {
    try {
        if (!dbConnectionPromise) {
            validateEnv();
            dbConnectionPromise = connectDB();
        }
        await dbConnectionPromise;
    } catch (err) {
        dbConnectionPromise = null;
        logger.error('Startup', 'Cold start failed', err);
        res.status(503).json({ success: false, message: 'Service unavailable (startup failure)' });
        return;
    }

    return app(req, res);
}
