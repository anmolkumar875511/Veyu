import * as AuthService from '../services/auth.service.js';
import { JWT_CONFIG } from '../config/jwt.config.js';

// ── Helpers ───────────────────────────────────────────────────────────────────
function setRefreshCookie(res, refreshToken) {
    res.cookie(JWT_CONFIG.COOKIE.name, refreshToken, JWT_CONFIG.COOKIE.options);
}

function clearRefreshCookie(res) {
    res.clearCookie(JWT_CONFIG.COOKIE.name, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/api/auth',
    });
}

// ── Controllers ───────────────────────────────────────────────────────────────

export async function register(req, res, next) {
    try {
        const { user, accessToken, refreshToken } = await AuthService.registerCitizen(req.body);
        setRefreshCookie(res, refreshToken);
        res.status(201).json({ success: true, data: { user, accessToken } });
    } catch (err) {
        next(err);
    }
}

export async function login(req, res, next) {
    try {
        const { user, accessToken, refreshToken } = await AuthService.loginUser(req.body);
        setRefreshCookie(res, refreshToken);
        res.status(200).json({ success: true, data: { user, accessToken } });
    } catch (err) {
        next(err);
    }
}

export async function refresh(req, res, next) {
    try {
        const refreshToken = req.cookies?.[JWT_CONFIG.COOKIE.name];
        const result = await AuthService.refreshTokens(refreshToken);
        setRefreshCookie(res, result.refreshToken);
        res.status(200).json({
            success: true,
            data: { user: result.user, accessToken: result.accessToken },
        });
    } catch (err) {
        clearRefreshCookie(res);
        next(err);
    }
}

export async function logout(req, res) {
    clearRefreshCookie(res);
    res.status(200).json({ success: true, message: 'Logged out successfully.' });
}

export async function getMe(req, res, next) {
    try {
        const user = await AuthService.getMe(req.user.id);
        res.status(200).json({ success: true, data: { user } });
    } catch (err) {
        next(err);
    }
}

export async function createStaff(req, res, next) {
    try {
        const { user } = await AuthService.createStaffAccount(req.body);
        res.status(201).json({ success: true, data: { user } });
    } catch (err) {
        next(err);
    }
}

export async function changePassword(req, res, next) {
    try {
        await AuthService.changePassword(req.user.id, req.body);
        clearRefreshCookie(res);
        res.status(200).json({
            success: true,
            message: 'Password updated. Please log in again.',
        });
    } catch (err) {
        next(err);
    }
}
