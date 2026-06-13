export const JWT_CONFIG = {
    ACCESS: {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: '15m',
        expiresInMs: 15 * 60 * 1000,
    },

    REFRESH: {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: '7d',
        expiresInMs: 7 * 24 * 60 * 60 * 1000,
    },

    COOKIE: {
        name: 'nagarik_refresh',
        options: {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/api/auth',
        },
    },
};

export function validateJwtConfig() {
    const missing = [];
    if (!process.env.JWT_ACCESS_SECRET) missing.push('JWT_ACCESS_SECRET');
    if (!process.env.JWT_REFRESH_SECRET) missing.push('JWT_REFRESH_SECRET');
    if (missing.length) {
        throw new Error(`Missing required JWT environment variables: ${missing.join(', ')}`);
    }
    if (process.env.JWT_ACCESS_SECRET === process.env.JWT_REFRESH_SECRET) {
        throw new Error('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different values');
    }
}
