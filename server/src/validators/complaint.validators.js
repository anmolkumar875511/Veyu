import { body, query, param } from 'express-validator';
import { COMPLAINT_CATEGORIES, COMPLAINT_STATUS } from '../models/complaint.model.js';
import { ApiError } from '../utils/ApiError.js';
import { validationResult } from 'express-validator';

export const validateSubmit = [
    body('description')
        .trim()
        .notEmpty()
        .withMessage('Description is required.')
        .isLength({ min: 10 })
        .withMessage('Description must be at least 10 characters.')
        .isLength({ max: 1000 })
        .withMessage('Description cannot exceed 1000 characters.'),

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

    body('categoryOverride')
        .optional({ checkFalsy: true })
        .isIn(COMPLAINT_CATEGORIES)
        .withMessage(`Category must be one of: ${COMPLAINT_CATEGORIES.join(', ')}.`),
];

export const validateListQuery = [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.'),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('Limit must be between 1 and 50.'),

    query('status')
        .optional()
        .isIn(Object.values(COMPLAINT_STATUS))
        .withMessage('Invalid status filter.'),

    query('category').optional().isIn(COMPLAINT_CATEGORIES).withMessage('Invalid category filter.'),
];

export const validateMongoId = [param('id').isMongoId().withMessage('Invalid complaint ID.')];

export function validate(req, res, next) {
    const result = validationResult(req);
    if (result.isEmpty()) return next();
    const errors = result.array().map((e) => ({ field: e.path, message: e.msg }));
    next(ApiError.badRequest('Validation failed.', 'VALIDATION_ERROR', errors));
}
