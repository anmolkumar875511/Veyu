import { body, validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError.js';

const emailField = body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required.')
    .isEmail()
    .withMessage('Enter a valid email address.')
    .normalizeEmail();

const passwordField = (fieldName = 'password') =>
    body(fieldName)
        .notEmpty()
        .withMessage('Password is required.')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters.')
        .isLength({ max: 72 })
        .withMessage('Password cannot exceed 72 characters.');

const nameField = body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required.')
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters.')
    .isLength({ max: 60 })
    .withMessage('Name cannot exceed 60 characters.');

const phoneField = body('phone')
    .optional({ checkFalsy: true })
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Enter a valid 10-digit Indian mobile number.');

export const validateSendOtp = [nameField, emailField, passwordField('password'), phoneField];

export const validateVerifyOtp = [
    nameField,
    emailField,
    passwordField('password'),
    phoneField,
    body('code')
        .notEmpty()
        .withMessage('OTP code is required.')
        .isLength({ min: 6, max: 6 })
        .withMessage('OTP must be exactly 6 digits.')
        .isNumeric()
        .withMessage('OTP must be numeric.'),
];

export const validateLogin = [
    emailField,
    body('password').notEmpty().withMessage('Password is required.'),
];

export const validateChangePassword = [
    body('currentPassword').notEmpty().withMessage('Current password is required.'),
    passwordField('newPassword').custom((val, { req }) => {
        if (val === req.body.currentPassword) {
            throw new Error('New password must be different from your current password.');
        }
        return true;
    }),
];

export const validateCreateStaff = [
    nameField,
    emailField,
    passwordField('password'),
    body('role')
        .notEmpty()
        .withMessage('Role is required.')
        .isIn(['officer', 'worker'])
        .withMessage("Role must be 'officer' or 'worker'."),
    phoneField,
    body('assignedWard')
        .optional({ checkFalsy: true })
        .isMongoId()
        .withMessage('Assigned ward must be a valid ID.'),
];

export function validate(req, res, next) {
    const result = validationResult(req);
    if (result.isEmpty()) return next();
    const errors = result.array().map((e) => ({ field: e.path, message: e.msg }));
    next(ApiError.badRequest('Validation failed.', 'VALIDATION_ERROR', errors));
}
