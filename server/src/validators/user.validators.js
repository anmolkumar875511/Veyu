import { body, query, param, validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError.js';

export const validateUpdateProfile = [
    body('name')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ min: 2, max: 60 })
        .withMessage('Name must be 2–60 characters.'),
    body('phone')
        .optional({ checkFalsy: true })
        .matches(/^[6-9]\d{9}$/)
        .withMessage('Enter a valid 10-digit Indian mobile number.'),
];

export const validateListQuery = [
    query('role')
        .optional()
        .isIn(['citizen', 'officer', 'worker', 'admin'])
        .withMessage('Invalid role filter.'),
    query('assignedWard').optional().isMongoId().withMessage('Invalid ward ID.'),
    query('isActive')
        .optional()
        .isIn(['true', 'false'])
        .withMessage("isActive must be 'true' or 'false'."),
    query('search').optional().trim().isLength({ max: 100 }).withMessage('Search term too long.'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be 1–50.'),
];

export const validateDirectoryQuery = [
    query('role')
        .notEmpty()
        .withMessage('Role is required.')
        .isIn(['citizen', 'officer', 'worker', 'admin'])
        .withMessage('Invalid role.'),
];

export const validateSetActive = [
    body('isActive').isBoolean().withMessage('isActive must be a boolean.'),
];

export const validateChangeRole = [
    body('role')
        .notEmpty()
        .withMessage('Role is required.')
        .isIn(['citizen', 'officer', 'worker', 'admin'])
        .withMessage('Invalid role.'),
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
