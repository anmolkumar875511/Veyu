import { User } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/token.utils.js';

export async function registerCitizen(dto) {
    const { name, email, password, phone } = dto;

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
    });

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    return { user: user.toPublicJSON(), accessToken, refreshToken };
}

export async function loginUser(dto) {
    const { email, password } = dto;

    const user = await User.findByEmail(email);
    if (!user) {
        throw ApiError.unauthorized('Invalid email or password.', 'INVALID_CREDENTIALS');
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
    if (!user || !user.isActive)
        throw ApiError.unauthorized('User not found or deactivated.', 'USER_NOT_FOUND');

    const newAccessToken = signAccessToken(user);
    const newRefreshToken = signRefreshToken(user);

    return {
        user: user.toPublicJSON(),
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
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
    });

    return { user: user.toPublicJSON() };
}

export async function changePassword(userId, dto) {
    const { currentPassword, newPassword } = dto;

    const user = await User.findById(userId).select('+password');
    if (!user) throw ApiError.notFound('User');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
        throw ApiError.badRequest('Current password is incorrect.', 'WRONG_PASSWORD');
    }

    if (currentPassword === newPassword) {
        throw ApiError.badRequest(
            'New password must be different from your current password.',
            'SAME_PASSWORD'
        );
    }

    user.password = newPassword;
    await user.save();
}
