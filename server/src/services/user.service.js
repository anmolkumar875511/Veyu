import User from '../models/user.model.js';
import Ward from '../models/ward.model.js';
import { ApiError } from '../utils/ApiError.js';
import { PAGINATION } from '../constants/index.js';

export async function updateMyProfile(userId, dto) {
    const { name, phone, avatar } = dto;

    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound('User');

    if (name !== undefined) user.name = name.trim();
    if (phone !== undefined) user.phone = phone || null;
    if (avatar !== undefined) user.avatar = avatar || null;

    await user.save();
    return { user: user.toPublicJSON() };
}

export async function listUsers(query = {}) {
    const { role, assignedWard, search, isActive } = query;

    const page = parseInt(query.page) || PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(parseInt(query.limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
    const skip = (page - 1) * limit;

    const filter = {};
    if (role) filter.role = role;
    if (assignedWard) filter.assignedWard = assignedWard;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
        ];
    }

    const [users, total] = await Promise.all([
        User.find(filter)
            .select('-password -fcmToken')
            .populate('assignedWard', 'name wardNumber')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        User.countDocuments(filter),
    ]);

    return { users, total, page, totalPages: Math.ceil(total / limit) || 1 };
}

export async function getUserDirectory(role) {
    if (!role)
        throw ApiError.badRequest(
            'A role filter is required for the directory endpoint.',
            'ROLE_REQUIRED'
        );

    const users = await User.find({ role, isActive: true })
        .select('name email assignedWard')
        .populate('assignedWard', 'name wardNumber')
        .sort({ name: 1 })
        .limit(200)
        .lean();

    return { users };
}

export async function getUserById(userId) {
    const user = await User.findById(userId)
        .select('-password -fcmToken')
        .populate('assignedWard', 'name wardNumber');
    if (!user) throw ApiError.notFound('User');
    return { user: user.toObject() };
}

export async function setUserActive(userId, isActive) {
    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound('User');

    user.isActive = isActive;
    await user.save();

    return { user: user.toPublicJSON() };
}

export async function changeUserRole(userId, newRole) {
    const VALID_ROLES = ['citizen', 'officer', 'worker', 'admin'];
    if (!VALID_ROLES.includes(newRole)) {
        throw ApiError.badRequest(
            `Role must be one of: ${VALID_ROLES.join(', ')}.`,
            'INVALID_ROLE'
        );
    }

    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound('User');

    const losesWardEligibility = !['officer', 'worker'].includes(newRole);

    user.role = newRole;
    if (losesWardEligibility && user.assignedWard) {
        await Ward.updateMany({ officerId: user._id }, { $set: { officerId: null } });
        user.assignedWard = null;
    }

    await user.save();
    return { user: user.toPublicJSON() };
}
