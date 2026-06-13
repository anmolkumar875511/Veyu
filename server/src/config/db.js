import mongoose from 'mongoose';

const MONGOOSE_OPTIONS = {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    minPoolSize: 2,
    connectTimeoutMS: 10000,
    heartbeatFrequencyMS: 10000,
};

const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY_MS = 1000;

let retryCount = 0;
let isConnected = false;

const log = {
    info: (msg) => console.log(`[DB] ℹ  ${msg}`),
    success: (msg) => console.log(`[DB] ✓  ${msg}`),
    warn: (msg) => console.warn(`[DB] ⚠  ${msg}`),
    error: (msg, err) => console.error(`[DB] ✗  ${msg}`, err ?? ''),
};

function registerConnectionEvents() {
    const db = mongoose.connection;

    db.on('connected', () => {
        isConnected = true;
        retryCount = 0;
        log.success(`Connected to MongoDB Atlas — db: "${db.name}"`);
    });

    db.on('disconnected', () => {
        isConnected = false;
        log.warn('MongoDB disconnected. Mongoose will auto-reconnect.');
    });

    db.on('reconnected', () => {
        isConnected = true;
        log.success('MongoDB reconnected.');
    });

    db.on('error', (err) => {
        isConnected = false;
        log.error('MongoDB connection error:', err.message);
    });

    db.on('close', () => {
        isConnected = false;
        log.warn('MongoDB connection closed permanently.');
    });
}

export async function connectDB() {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
        throw new Error(
            'MONGODB_URI is not set. Add it to your .env file.\n' +
                'Example: MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/nagarik'
        );
    }

    if (mongoose.connection.listenerCount('connected') === 0) {
        registerConnectionEvents();
    }

    if (mongoose.connection.readyState === 1) {
        log.info('connectDB called but connection already open — reusing.');
        return mongoose.connection;
    }

    try {
        log.info(
            retryCount === 0
                ? 'Connecting to MongoDB Atlas…'
                : `Retry attempt ${retryCount}/${MAX_RETRIES}…`
        );

        await mongoose.connect(uri, MONGOOSE_OPTIONS);
        return mongoose.connection;
    } catch (err) {
        retryCount++;

        if (retryCount > MAX_RETRIES) {
            log.error(`Failed to connect to MongoDB after ${MAX_RETRIES} attempts. Exiting.`, err);
            process.exit(1);
        }

        const delayMs = INITIAL_RETRY_DELAY_MS * Math.pow(2, retryCount - 1);
        log.warn(`Connection failed. Retrying in ${delayMs / 1000}s… (${err.message})`);

        await new Promise((resolve) => setTimeout(resolve, delayMs));
        return connectDB();
    }
}

export async function disconnectDB(signal = 'unknown') {
    if (mongoose.connection.readyState === 0) return;

    log.info(`Closing MongoDB connection (signal: ${signal})…`);
    await mongoose.connection.close(false);
    log.info('MongoDB connection closed cleanly.');
}

export async function getDBHealth() {
    const states = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting',
    };

    const state = states[mongoose.connection.readyState] ?? 'unknown';

    if (mongoose.connection.readyState !== 1) {
        return { status: state, latencyMs: null, host: null };
    }

    const start = Date.now();
    try {
        await mongoose.connection.db.admin().ping();
        return {
            status: 'connected',
            latencyMs: Date.now() - start,
            host: mongoose.connection.host,
            dbName: mongoose.connection.name,
        };
    } catch {
        return { status: 'error', latencyMs: null, host: mongoose.connection.host };
    }
}

export function isDBConnected() {
    return mongoose.connection.readyState === 1;
}
