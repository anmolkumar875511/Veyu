export class ApiError extends Error {
    constructor(statusCode, message, code = null, errors = []) {
        super(message);
        this.name = 'ApiError';
        this.statusCode = statusCode;
        this.code = code;
        this.errors = errors;
        this.isOperational = true;
    }

    static badRequest(message, code, errors) {
        return new ApiError(400, message, code ?? 'BAD_REQUEST', errors);
    }
    static unauthorized(message = 'Authentication required', code = 'UNAUTHORIZED') {
        return new ApiError(401, message, code);
    }
    static forbidden(
        message = 'You do not have permission to perform this action',
        code = 'FORBIDDEN'
    ) {
        return new ApiError(403, message, code);
    }
    static notFound(resource = 'Resource') {
        return new ApiError(404, `${resource} not found`, 'NOT_FOUND');
    }
    static conflict(message, code = 'CONFLICT') {
        return new ApiError(409, message, code);
    }
    static tooMany(message = 'Too many requests. Please try again later.') {
        return new ApiError(429, message, 'TOO_MANY_REQUESTS');
    }
    static internal(message = 'Something went wrong. Please try again.') {
        return new ApiError(500, message, 'INTERNAL_ERROR');
    }

    static tokenExpired() {
        return new ApiError(401, 'Your session has expired. Please log in again.', 'TOKEN_EXPIRED');
    }
    static tokenInvalid() {
        return new ApiError(401, 'Invalid authentication token.', 'TOKEN_INVALID');
    }
    static refreshExpired() {
        return new ApiError(401, 'Session expired. Please log in again.', 'REFRESH_EXPIRED');
    }
}
