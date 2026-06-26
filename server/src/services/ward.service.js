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
    filter.isActive = isActive !== undefined ? isActive === 'true' : true;

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

    if (ward.officerId && ward.officerId.toString() !== officerId.toString()) {
        await User.updateOne({ _id: ward.officerId }, { $set: { assignedWard: null } });
    }

    await Ward.updateOne({ officerId, _id: { $ne: wardId } }, { $set: { officerId: null } });

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
