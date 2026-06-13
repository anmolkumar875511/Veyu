import { Router } from 'express';
import rateLimit from 'express-rate-limit';

import * as AuthController from '../controllers/auth.controller.js';
import { protect, requireRole } from '../middleware/auth.middleware.js';
import {
    validateRegister,
    validateLogin,
    validateChangePassword,
    validateCreateStaff,
    validate,
} from '../validators/auth.validators.js';

const router = Router();
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: {
        success: false,
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many attempts. Try again in 15 minutes.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const refreshLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: { success: false, code: 'TOO_MANY_REQUESTS', message: 'Too many refresh requests.' },
    standardHeaders: true,
    legacyHeaders: false,
});

router.post('/register', authLimiter, validateRegister, validate, AuthController.register);
router.post('/login', authLimiter, validateLogin, validate, AuthController.login);
router.post('/refresh', refreshLimiter, AuthController.refresh);

router.post('/logout', protect, AuthController.logout);
router.get('/me', protect, AuthController.getMe);
router.patch('/password', protect, validateChangePassword, validate, AuthController.changePassword);

router.post(
    '/staff',
    protect,
    requireRole('admin'),
    validateCreateStaff,
    validate,
    AuthController.createStaff
);

export default router;
