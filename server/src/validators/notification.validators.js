import { query, param, validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError.js';

export const validateListQuery = [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be 1–50.'),
    query('unreadOnly')
        .optional()
        .isIn(['true', 'false'])
        .withMessage("unreadOnly must be 'true' or 'false'."),
];

export const validateMongoIdParam = (paramName = 'id') => [
    param(paramName).isMongoId().withMessage(`Invalid ${paramName}.`),
];

export function validate(req, res, next) {
    const result = validationResult(req);
    if (result.isEmpty()) return next();
    const errors = result.array().map((e) => ({ field: e.path, message: e.msg }));
    next(ApiError.badRequest('Validation failed.', 'VALIDATION_ERROR', errors));
}
