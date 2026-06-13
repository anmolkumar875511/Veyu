import { ApiError } from '../utils/ApiError.js';

export function errorHandler(err, req, res, next) {
    if (err.isOperational) {
        console.warn(`[${err.statusCode}] ${err.code ?? 'ERROR'}: ${err.message}`);
    } else {
        console.error('Unexpected error:', err);
    }

    if (err.code === 11000) {
        const field = Object.keys(err.keyValue ?? {})[0] ?? 'field';
        const apiErr = ApiError.conflict(
            `${field.charAt(0).toUpperCase() + field.slice(1)} is already taken.`,
            'DUPLICATE_KEY'
        );
        return res.status(apiErr.statusCode).json(formatError(apiErr));
    }

    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map((e) => ({
            field: e.path,
            message: e.message,
        }));
        const apiErr = ApiError.badRequest('Validation failed.', 'VALIDATION_ERROR', errors);
        return res.status(apiErr.statusCode).json(formatError(apiErr));
    }

    if (err.name === 'CastError') {
        const apiErr = ApiError.badRequest(`Invalid value for field: ${err.path}`, 'CAST_ERROR');
        return res.status(apiErr.statusCode).json(formatError(apiErr));
    }

    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json(formatError(ApiError.tokenInvalid()));
    }
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json(formatError(ApiError.tokenExpired()));
    }

    if (err instanceof ApiError) {
        return res.status(err.statusCode).json(formatError(err));
    }

    return res.status(500).json(formatError(ApiError.internal()));
}

function formatError(err) {
    const body = {
        success: false,
        code: err.code ?? 'ERROR',
        message: err.message,
    };
    if (err.errors && err.errors.length > 0) {
        body.errors = err.errors;
    }
    return body;
}

export function notFoundHandler(req, res, next) {
    next(ApiError.notFound(`Route ${req.method} ${req.originalUrl}`));
}
