import { asyncHandler } from '../utils/asyncHandler.js';
import * as AuthService from '../services/auth.service.js';
import { JWT_CONFIG } from '../config/jwt.config.js';

function setRefreshCookie(res, token) {
    res.cookie(JWT_CONFIG.COOKIE.name, token, JWT_CONFIG.COOKIE.options);
}

function clearRefreshCookie(res) {
    res.clearCookie(JWT_CONFIG.COOKIE.name, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/api/auth',
    });
}

export const sendOtp = asyncHandler(async (req, res) => {
    const result = await AuthService.sendOtp(req.body);
    res.status(200).json({ success: true, data: result });
});

export const verifyOtp = asyncHandler(async (req, res) => {
    const { user, accessToken, refreshToken } = await AuthService.verifyOtp(req.body);
    setRefreshCookie(res, refreshToken);
    res.status(201).json({ success: true, data: { user, accessToken } });
});

export const login = asyncHandler(async (req, res) => {
    const { user, accessToken, refreshToken } = await AuthService.loginUser(req.body);
    setRefreshCookie(res, refreshToken);
    res.status(200).json({ success: true, data: { user, accessToken } });
});

export const googleCallback = asyncHandler(async (req, res) => {
    const { user, accessToken, refreshToken } = await AuthService.finishGoogleAuth(req.user);
    setRefreshCookie(res, refreshToken);

    const clientUrl = process.env.CLIENT_URL ?? 'http://localhost:5173';
    res.redirect(`${clientUrl}/auth/google/success?token=${accessToken}`);
});

export const refresh = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.[JWT_CONFIG.COOKIE.name];
    const result = await AuthService.refreshTokens(refreshToken);
    setRefreshCookie(res, result.refreshToken);
    res.status(200).json({
        success: true,
        data: { user: result.user, accessToken: result.accessToken },
    });
});

export const logout = asyncHandler(async (req, res) => {
    clearRefreshCookie(res);
    res.status(200).json({ success: true, message: 'Logged out successfully.' });
});

export const getMe = asyncHandler(async (req, res) => {
    const user = await AuthService.getMe(req.user.id);
    res.status(200).json({ success: true, data: { user } });
});

export const createStaff = asyncHandler(async (req, res) => {
    const { user } = await AuthService.createStaffAccount(req.body);
    res.status(201).json({ success: true, data: { user } });
});

export const changePassword = asyncHandler(async (req, res) => {
    await AuthService.changePassword(req.user.id, req.body);
    clearRefreshCookie(res);
    res.status(200).json({ success: true, message: 'Password updated. Please log in again.' });
});
