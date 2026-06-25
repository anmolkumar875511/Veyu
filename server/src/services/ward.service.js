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
import Ward from '../models/ward.model.js';
import User from '../models/user.model.js';
import Complaint, { COMPLAINT_STATUS } from '../models/complaint.model.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';
import { WARD_HEALTH } from '../constants/index.js';

const SCOPE = 'Ward';

export async function listWards(query) {
    const { city, isActive } = query;

    const filter = {};
    if (city) filter.city = city;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    else filter.isActive = true;

    const wards = await Ward.find(filter)
        .sort({ wardNumber: 1 })
        .populate('officerId', 'name')
        .lean();

    return { wards };
}

export async function getWardById(wardId) {
    const ward = await Ward.findById(wardId).populate('officerId', 'name email').lean();
    if (!ward) throw ApiError.notFound('Ward');
    return { ward };
}

export async function getWardLeaderboard() {
    const wards = await Ward.find({ isActive: true })
        .select('name wardNumber healthScore stressBand stats')
        .sort({ healthScore: -1 })
        .lean();

    return { wards: wards.map((w, i) => ({ ...w, rank: i + 1 })) };
}

export async function createWard(dto) {
    const { name, wardNumber, city, officerId, boundary } = dto;

    const existing = await Ward.findOne({ $or: [{ wardNumber }, { name: name.trim() }] });
    if (existing) {
        throw ApiError.conflict('A ward with this number or name already exists.', 'WARD_EXISTS');
    }

    if (officerId) {
        const officer = await User.findOne({ _id: officerId, role: 'officer' });
        if (!officer) throw ApiError.badRequest('Officer not found.', 'INVALID_OFFICER');
    }

    const ward = await Ward.create({
        name: name.trim(),
        wardNumber,
        city: city.trim(),
        officerId: officerId ?? null,
        boundary: boundary ?? undefined,
    });

    if (officerId) {
        await User.updateOne({ _id: officerId }, { assignedWard: ward._id });
    }

    logger.success(SCOPE, `Ward "${ward.name}" (#${ward.wardNumber}) created`);

    return { ward };
}

export async function updateWard(wardId, dto) {
    const ward = await Ward.findById(wardId);
    if (!ward) throw ApiError.notFound('Ward');

    const { name, city, isActive, boundary } = dto;

    if (name) ward.name = name.trim();
    if (city) ward.city = city.trim();
    if (typeof isActive === 'boolean') ward.isActive = isActive;
    if (boundary) ward.boundary = boundary;

    await ward.save();
    return { ward };
}

export async function assignOfficer(wardId, officerId) {
    const ward = await Ward.findById(wardId);
    if (!ward) throw ApiError.notFound('Ward');

    const officer = await User.findOne({ _id: officerId, role: 'officer' });
    if (!officer)
        throw ApiError.badRequest('Officer not found or not an officer.', 'INVALID_OFFICER');

    await Ward.updateMany({ officerId }, { $set: { officerId: null } });

    if (ward.officerId) {
        await User.updateOne({ _id: ward.officerId }, { $set: { assignedWard: null } });
    }

    ward.officerId = officerId;
    await ward.save();

    await User.updateOne({ _id: officerId }, { $set: { assignedWard: ward._id } });

    logger.info(SCOPE, `Officer ${officerId} assigned to ward ${wardId}`);

    return { ward };
}

export async function recomputeWardStats(wardId) {
    const ward = await Ward.findById(wardId);
    if (!ward) throw ApiError.notFound('Ward');

    const since = new Date(Date.now() - WARD_HEALTH.STATS_WINDOW_DAYS * 86_400_000);

    const [totalOpen, totalResolved, resolutionAgg] = await Promise.all([
        Complaint.countDocuments({
            wardId,
            status: {
                $nin: [
                    COMPLAINT_STATUS.RESOLVED,
                    COMPLAINT_STATUS.REJECTED,
                    COMPLAINT_STATUS.DUPLICATE,
                ],
            },
        }),
        Complaint.countDocuments({
            wardId,
            status: COMPLAINT_STATUS.RESOLVED,
            resolvedAt: { $gte: since },
        }),
        Complaint.aggregate([
            {
                $match: {
                    wardId: ward._id,
                    status: COMPLAINT_STATUS.RESOLVED,
                    resolvedAt: { $exists: true },
                    createdAt: { $gte: since },
                },
            },
            {
                $project: {
                    hours: { $divide: [{ $subtract: ['$resolvedAt', '$createdAt'] }, 3_600_000] },
                },
            },
            { $group: { _id: null, avg: { $avg: '$hours' } } },
        ]),
    ]);

    const totalComplaintsWindow = await Complaint.countDocuments({
        wardId,
        createdAt: { $gte: since },
    });
    const resolutionRate =
        totalComplaintsWindow > 0 ? Math.round((totalResolved / totalComplaintsWindow) * 100) : 100;

    const avgResolutionHours = resolutionAgg[0] ? Math.round(resolutionAgg[0].avg) : 0;

    const backlogPenalty = Math.min(
        totalOpen * WARD_HEALTH.BACKLOG_PENALTY_PER_OPEN,
        WARD_HEALTH.BACKLOG_PENALTY_CAP
    );
    const speedPenalty =
        avgResolutionHours > WARD_HEALTH.SLOW_RESOLUTION_THRESHOLD_HOURS
            ? WARD_HEALTH.SLOW_RESOLUTION_PENALTY
            : 0;
    const healthScore = Math.max(0, Math.min(100, resolutionRate - backlogPenalty - speedPenalty));

    ward.stats = { totalOpen, totalResolved, avgResolutionHours, resolutionRate };
    ward.healthScore = healthScore;
    await ward.save();

    return ward.toObject();
}

export async function recomputeAllWardStats() {
    const wards = await Ward.find({ isActive: true }).select('_id');
    const results = [];
    for (const w of wards) {
        results.push(await recomputeWardStats(w._id));
    }
    logger.info(SCOPE, `Recomputed stats for ${results.length} ward(s)`);
    return { updated: results.length, wards: results };
}
