import { body, query, param, validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError.js';

export const validateListQuery = [
    query('city').optional().trim().isLength({ max: 100 }).withMessage('Invalid city filter.'),
    query('isActive')
        .optional()
        .isIn(['true', 'false'])
        .withMessage("isActive must be 'true' or 'false'."),
];

export const validateCreateWard = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Ward name is required.')
        .isLength({ max: 100 })
        .withMessage('Ward name cannot exceed 100 characters.'),
    body('wardNumber')
        .notEmpty()
        .withMessage('Ward number is required.')
        .isInt({ min: 1 })
        .withMessage('Ward number must be a positive integer.'),
    body('city')
        .trim()
        .notEmpty()
        .withMessage('City is required.')
        .isLength({ max: 100 })
        .withMessage('City cannot exceed 100 characters.'),
    body('officerId').optional({ checkFalsy: true }).isMongoId().withMessage('Invalid officer ID.'),
    body('boundary')
        .optional()
        .isObject()
        .withMessage('Boundary must be a GeoJSON Polygon object.'),
];

export const validateUpdateWard = [
    body('name')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 100 })
        .withMessage('Ward name cannot exceed 100 characters.'),
    body('city')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 100 })
        .withMessage('City cannot exceed 100 characters.'),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean.'),
    body('boundary')
        .optional()
        .isObject()
        .withMessage('Boundary must be a GeoJSON Polygon object.'),
];

export const validateAssignOfficer = [
    body('officerId')
        .notEmpty()
        .withMessage('Officer ID is required.')
        .isMongoId()
        .withMessage('Invalid officer ID.'),
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
