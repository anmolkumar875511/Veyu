import { verifyAccessToken, extractBearerToken } from '../utils/token.utils.js';
import { ApiError } from '../utils/ApiError.js';

export function protect(req, res, next) {
    const token = extractBearerToken(req.headers.authorization);

    if (!token) {
        return next(ApiError.unauthorized('No authentication token provided.'));
    }

    try {
        const payload = verifyAccessToken(token);
        req.user = {
            id: payload.sub,
            role: payload.role,
            email: payload.email,
        };
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') return next(ApiError.tokenExpired());
        return next(ApiError.tokenInvalid());
    }
}

export function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return next(ApiError.unauthorized());
        }
        if (!roles.includes(req.user.role)) {
            return next(
                ApiError.forbidden(
                    `This action requires one of the following roles: ${roles.join(', ')}.`,
                    'INSUFFICIENT_ROLE'
                )
            );
        }
        next();
    };
}

export function optionalAuth(req, res, next) {
    const token = extractBearerToken(req.headers.authorization);
    if (!token) return next();

    try {
        const payload = verifyAccessToken(token);
        req.user = {
            id: payload.sub,
            role: payload.role,
            email: payload.email,
        };
    } catch {
        req.user = null;
    }
    next();
}

export function requireOwnerOrRole(getOwnerId, ...roles) {
    return async (req, res, next) => {
        try {
            if (!req.user) return next(ApiError.unauthorized());

            // Elevated roles bypass ownership check
            if (roles.includes(req.user.role)) return next();

            const ownerId = await getOwnerId(req);
            if (!ownerId) return next(ApiError.notFound('Resource'));

            if (ownerId.toString() !== req.user.id) {
                return next(ApiError.forbidden('You do not own this resource.'));
            }
            next();
        } catch (err) {
            next(err);
        }
    };
}
