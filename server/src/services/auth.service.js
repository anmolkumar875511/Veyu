import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import OTP from '../models/otp.model.js';
import { User } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/token.utils.js';
import { sendOtpEmail } from './email.service.js';
import { logger } from '../utils/logger.js';

const SCOPE = 'Auth';
const OTP_TTL_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;

function generateOtp() {
    // crypto.randomInt is cryptographically secure
    return String(crypto.randomInt(100_000, 999_999));
}

export async function sendOtp(dto) {
    const { name, email, password, phone } = dto;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
        throw ApiError.conflict('An account with this email already exists.', 'EMAIL_TAKEN');
    }

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60_000);

    const hashedCode = await bcrypt.hash(code, 8);

    await OTP.findOneAndUpdate(
        { email: email.toLowerCase(), purpose: 'register' },
        {
            email: email.toLowerCase(),
            code: hashedCode,
            expiresAt,
            attempts: 0,
            verified: false,
            purpose: 'register',
        },
        { upsert: true, new: true }
    );

    await sendOtpEmail(email, code);

    logger.info(SCOPE, `OTP sent to ${email}`);

    return { message: 'OTP sent. Check your email.' };
}

export async function verifyOtp(dto) {
    const { name, email, password, phone, code } = dto;

    const record = await OTP.findOne({
        email: email.toLowerCase(),
        purpose: 'register',
        verified: false,
    }).select('+code');

    if (!record) {
        throw ApiError.badRequest(
            'No pending verification for this email. Request a new OTP.',
            'NO_OTP'
        );
    }

    if (new Date() > record.expiresAt) {
        await record.deleteOne();
        throw ApiError.badRequest('OTP has expired. Please request a new one.', 'OTP_EXPIRED');
    }

    if (record.attempts >= OTP_MAX_ATTEMPTS) {
        await record.deleteOne();
        throw ApiError.tooMany('Too many incorrect attempts. Request a new OTP.');
    }

    const isMatch = await bcrypt.compare(code, record.code);
    if (!isMatch) {
        record.attempts += 1;
        await record.save();
        const remaining = OTP_MAX_ATTEMPTS - record.attempts;
        throw ApiError.badRequest(
            `Incorrect OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`,
            'OTP_INVALID'
        );
    }

    await record.deleteOne();

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
        throw ApiError.conflict('An account with this email already exists.', 'EMAIL_TAKEN');
    }

    const user = await User.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password,
        phone: phone ?? null,
        role: 'citizen',
        isVerified: true,
    });

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    logger.success(SCOPE, `New citizen registered via OTP: ${user.email}`);

    return { user: user.toPublicJSON(), accessToken, refreshToken };
}

export async function loginUser(dto) {
    const { email, password } = dto;

    const user = await User.findByEmail(email);
    if (!user) {
        throw ApiError.unauthorized('Invalid email or password.', 'INVALID_CREDENTIALS');
    }

    if (!user.password) {
        throw ApiError.unauthorized(
            'This account uses Google sign-in. Please continue with Google.',
            'USE_GOOGLE'
        );
    }

    if (!user.isVerified) {
        throw ApiError.forbidden(
            'Email not verified. Please complete OTP verification.',
            'EMAIL_NOT_VERIFIED'
        );
    }

    if (!user.isActive) {
        throw ApiError.forbidden(
            'Your account has been deactivated. Contact support.',
            'ACCOUNT_DEACTIVATED'
        );
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        throw ApiError.unauthorized('Invalid email or password.', 'INVALID_CREDENTIALS');
    }

    User.updateOne({ _id: user._id }, { lastLogin: new Date() }).exec();

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    return { user: user.toPublicJSON(), accessToken, refreshToken };
}

export async function finishGoogleAuth(user) {
    if (!user.isActive) {
        throw ApiError.forbidden('Your account has been deactivated.', 'ACCOUNT_DEACTIVATED');
    }

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    return { user: user.toPublicJSON(), accessToken, refreshToken };
}

export async function refreshTokens(refreshToken) {
    if (!refreshToken) throw ApiError.refreshExpired();

    let payload;
    try {
        payload = verifyRefreshToken(refreshToken);
    } catch (err) {
        if (err.name === 'TokenExpiredError') throw ApiError.refreshExpired();
        throw ApiError.tokenInvalid();
    }

    const user = await User.findById(payload.sub);
    if (!user || !user.isActive) {
        throw ApiError.unauthorized('User not found or deactivated.', 'USER_NOT_FOUND');
    }

    return {
        user: user.toPublicJSON(),
        accessToken: signAccessToken(user),
        refreshToken: signRefreshToken(user),
    };
}

export async function getMe(userId) {
    const user = await User.findById(userId).populate('assignedWard', 'name wardNumber');
    if (!user) throw ApiError.notFound('User');
    return user.toPublicJSON();
}

export async function createStaffAccount(dto) {
    const { name, email, password, role, phone, assignedWard } = dto;

    if (!['officer', 'worker'].includes(role)) {
        throw ApiError.badRequest("Role must be 'officer' or 'worker'.", 'INVALID_ROLE');
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) throw ApiError.conflict('Email already registered.', 'EMAIL_TAKEN');

    const user = await User.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password,
        role,
        phone: phone ?? null,
        assignedWard: assignedWard ?? null,
        isVerified: true,
    });

    return { user: user.toPublicJSON() };
}

export async function changePassword(userId, dto) {
    const { currentPassword, newPassword } = dto;

    const user = await User.findById(userId).select('+password');
    if (!user) throw ApiError.notFound('User');

    if (!user.password) {
        throw ApiError.badRequest(
            'This account uses Google sign-in and has no password to change.',
            'NO_PASSWORD'
        );
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
        throw ApiError.badRequest('Current password is incorrect.', 'WRONG_PASSWORD');
    }

    if (currentPassword === newPassword) {
        throw ApiError.badRequest('New password must differ from current.', 'SAME_PASSWORD');
    }

    user.password = newPassword;
    await user.save();
}
