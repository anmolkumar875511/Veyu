import jwt from 'jsonwebtoken';
import { JWT_CONFIG } from '../config/jwt.config.js';

export function signAccessToken(user) {
    return jwt.sign(
        {
            sub: user._id.toString(),
            role: user.role,
            email: user.email,
        },
        JWT_CONFIG.ACCESS.secret,
        {
            expiresIn: JWT_CONFIG.ACCESS.expiresIn,
            issuer: 'nagarik-api',
            audience: 'nagarik-client',
        }
    );
}

export function signRefreshToken(user) {
    return jwt.sign({ sub: user._id.toString() }, JWT_CONFIG.REFRESH.secret, {
        expiresIn: JWT_CONFIG.REFRESH.expiresIn,
        issuer: 'nagarik-api',
        audience: 'nagarik-client',
    });
}

export function verifyAccessToken(token) {
    return jwt.verify(token, JWT_CONFIG.ACCESS.secret, {
        issuer: 'nagarik-api',
        audience: 'nagarik-client',
    });
}

export function verifyRefreshToken(token) {
    return jwt.verify(token, JWT_CONFIG.REFRESH.secret, {
        issuer: 'nagarik-api',
        audience: 'nagarik-client',
    });
}

export function decodeTokenUnsafe(token) {
    return jwt.decode(token);
}

export function extractBearerToken(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.slice(7).trim();
    return token.length > 0 ? token : null;
}
