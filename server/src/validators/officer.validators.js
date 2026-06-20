import { body, query, param, validationResult } from 'express-validator';
import { COMPLAINT_STATUS, COMPLAINT_CATEGORIES } from '../models/complaint.model.js';
import { ApiError } from '../utils/ApiError.js';

export const validateTriageQuery = [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be 1–50.'),
    query('status').optional().isIn(Object.values(COMPLAINT_STATUS)).withMessage('Invalid status.'),
    query('category').optional().isIn(COMPLAINT_CATEGORIES).withMessage('Invalid category.'),
    query('wardId').optional().isMongoId().withMessage('Invalid ward ID.'),
];

export const validateStatusUpdate = [
    body('status')
        .notEmpty()
        .withMessage('Status is required.')
        .isIn(['verified', 'assigned', 'in_progress', 'resolved', 'rejected'])
        .withMessage('Invalid status value.'),
    body('note')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 300 })
        .withMessage('Note cannot exceed 300 characters.'),
];

export const validateDispatch = [
    body('workerId')
        .notEmpty()
        .withMessage('Worker ID is required.')
        .isMongoId()
        .withMessage('Invalid worker ID.'),
    body('instructions')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 500 })
        .withMessage('Instructions cannot exceed 500 characters.'),
];

export const validateReassign = [
    body('newWorkerId')
        .notEmpty()
        .withMessage('New worker ID is required.')
        .isMongoId()
        .withMessage('Invalid worker ID.'),
    body('reason')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 300 })
        .withMessage('Reason cannot exceed 300 characters.'),
];

export const validateObservationReview = [
    body('action')
        .notEmpty()
        .withMessage('Action is required.')
        .isIn(['elevate', 'dismiss'])
        .withMessage("Action must be 'elevate' or 'dismiss'."),
    body('reviewNote')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 300 })
        .withMessage('Review note cannot exceed 300 characters.'),
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
