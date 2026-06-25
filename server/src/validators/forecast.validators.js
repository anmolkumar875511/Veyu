import { query, param, validationResult } from 'express-validator';
import { COMPLAINT_CATEGORIES } from '../models/complaint.model.js';
import { ApiError } from '../utils/ApiError.js';

export const validateForecastQuery = [
    query('wardId').optional().isMongoId().withMessage('Invalid ward ID.'),
    query('category').optional().isIn(COMPLAINT_CATEGORIES).withMessage('Invalid category.'),
    query('minConfidence')
        .optional()
        .isFloat({ min: 0, max: 1 })
        .withMessage('minConfidence must be between 0 and 1.'),
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
