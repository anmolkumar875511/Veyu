import { body, query, param, validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError.js';

export const validateTaskQuery = [
    query('status')
        .optional()
        .isIn(['pending', 'acknowledged', 'en_route', 'on_site', 'completed', 'reassigned'])
        .withMessage('Invalid status filter.'),
];

export const validateCompleteTask = [
    body('completionNote')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 400 })
        .withMessage('Completion note cannot exceed 400 characters.'),
];

export const validateObservation = [
    body('latitude')
        .notEmpty()
        .withMessage('Latitude is required.')
        .isFloat({ min: -90, max: 90 })
        .withMessage('Invalid latitude.'),
    body('longitude')
        .notEmpty()
        .withMessage('Longitude is required.')
        .isFloat({ min: -180, max: 180 })
        .withMessage('Invalid longitude.'),
    body('address')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 300 })
        .withMessage('Address cannot exceed 300 characters.'),
    body('note')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 300 })
        .withMessage('Note cannot exceed 300 characters.'),
];

export const validateObservationQuery = [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be 1–50.'),
    query('status')
        .optional()
        .isIn(['pending', 'ai_reviewed', 'elevated', 'dismissed', 'flagged'])
        .withMessage('Invalid status filter.'),
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
