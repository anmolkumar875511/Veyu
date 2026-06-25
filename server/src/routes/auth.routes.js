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
import { RATE_LIMITS } from '../constants/index.js';

const router = Router();

const authLimiter = rateLimit({
    windowMs: RATE_LIMITS.AUTH_WINDOW_MS,
    max: RATE_LIMITS.AUTH_MAX_ATTEMPTS,
    message: {
        success: false,
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many attempts. Try again in 15 minutes.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const refreshLimiter = rateLimit({
    windowMs: RATE_LIMITS.REFRESH_WINDOW_MS,
    max: RATE_LIMITS.REFRESH_MAX_ATTEMPTS,
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
