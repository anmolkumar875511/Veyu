import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import passport from 'passport';
import * as AuthController from '../controllers/auth.controller.js';
import { protect, requireRole } from '../middleware/auth.middleware.js';
import {
    validateSendOtp,
    validateVerifyOtp,
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

const otpLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 3,
    message: {
        success: false,
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many OTP requests. Wait before requesting again.',
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

router.post('/send-otp', otpLimiter, validateSendOtp, validate, AuthController.sendOtp);
router.post('/verify-otp', authLimiter, validateVerifyOtp, validate, AuthController.verifyOtp);
router.post('/login', authLimiter, validateLogin, validate, AuthController.login);

router.get(
    '/google',
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        session: false,
    })
);
router.get(
    '/google/callback',
    passport.authenticate('google', {
        session: false,
        failureRedirect: `${process.env.CLIENT_URL ?? 'http://localhost:5173'}/login?error=google_failed`,
    }),
    AuthController.googleCallback
);
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
