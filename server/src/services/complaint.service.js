import Complaint, { COMPLAINT_STATUS } from '../models/complaint.model.js';
import Vote from '../models/vote.model.js';
import Ward from '../models/ward.model.js';
import User from '../models/user.model.js';
import { NOTIFICATION_TYPES } from '../models/notification.model.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';
import {
    classifyComplaint,
    scoreSeverity,
    generateTitle,
    checkDuplicateText,
} from './gemini.service.js';
import { notify } from './notification.service.js';
import { deleteCloudinaryImage } from '../config/cloudinary.js';
import { DUPLICATE_DETECTION, REPUTATION, PAGINATION, WARD_HEALTH } from '../constants/index.js';

const SCOPE = 'Complaint';

async function resolveWard(longitude, latitude) {
    const ward = await Ward.findOrFallback(longitude, latitude);
    if (!ward) {
        throw ApiError.badRequest(
            'No active wards in database. Run `npm run seed` first.',
            'NO_WARD'
        );
    }
    return ward;
}

async function findDuplicate(longitude, latitude, description) {
    const nearby = await Complaint.find({
        location: {
            $nearSphere: {
                $geometry: { type: 'Point', coordinates: [longitude, latitude] },
                $maxDistance: DUPLICATE_DETECTION.PROXIMITY_RADIUS_METRES,
            },
        },
        status: { $nin: [COMPLAINT_STATUS.REJECTED, COMPLAINT_STATUS.DUPLICATE] },
    })
        .limit(DUPLICATE_DETECTION.MAX_CANDIDATES_CHECKED)
        .select('description title');

    for (const c of nearby) {
        const { isDuplicate } = await checkDuplicateText(description, c.description);
        if (isDuplicate) return c;
    }
    return null;
}

export async function submitComplaint(userId, dto, file) {
    const { description, latitude, longitude, address, categoryOverride } = dto;

    if (!file) throw ApiError.badRequest('An image is required.', 'NO_IMAGE');

    const imageUrl = file.path;
    const imagePublicId = file.filename;

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
        throw ApiError.badRequest('Valid latitude and longitude are required.', 'INVALID_COORDS');
    }

    const [classResult, severityResult, titleResult] = await Promise.all([
        categoryOverride
            ? Promise.resolve({ category: categoryOverride, confidence: 1.0 })
            : classifyComplaint(description),
        scoreSeverity(imageUrl),
        generateTitle(description),
    ]);

    const duplicate = await findDuplicate(lng, lat, description);
    if (duplicate) {
        const comp = await Complaint.create({
            title: titleResult,
            description,
            category: classResult.category,
            categorySource: categoryOverride ? 'manual' : 'ai',
            aiConfidence: classResult.confidence,
            severity: severityResult.severity,
            imageUrl,
            imagePublicId,
            location: { type: 'Point', coordinates: [lng, lat] },
            address: address ?? null,
            wardId: (await resolveWard(lng, lat))._id,
            createdBy: userId,
            status: COMPLAINT_STATUS.DUPLICATE,
            duplicateOf: duplicate._id,
        });

        await notify({
            userId,
            type: NOTIFICATION_TYPES.DUPLICATE_DETECTED,
            data: { title: duplicate.title },
            refModel: 'Complaint',
            refId: duplicate._id,
        });

        return { complaint: comp, isDuplicate: true, duplicateOf: duplicate };
    }

    const ward = await resolveWard(lng, lat);

    const complaint = await Complaint.create({
        title: titleResult,
        description,
        category: classResult.category,
        categorySource: categoryOverride ? 'manual' : 'ai',
        aiConfidence: classResult.confidence,
        severity: severityResult.severity,
        imageUrl,
        imagePublicId,
        location: { type: 'Point', coordinates: [lng, lat] },
        address: address ?? null,
        wardId: ward._id,
        createdBy: userId,
    });

    await User.updateOne(
        { _id: userId },
        { $inc: { reputationScore: REPUTATION.POINTS_COMPLAINT_SUBMITTED } }
    );

    await notify({
        userId,
        type: NOTIFICATION_TYPES.REPUTATION_EARNED,
        data: { points: REPUTATION.POINTS_COMPLAINT_SUBMITTED },
        refModel: 'Complaint',
        refId: complaint._id,
    });

    logger.success(
        SCOPE,
        `Complaint ${complaint._id} submitted by user ${userId} in ward ${ward._id}`
    );

    return { complaint, isDuplicate: false, duplicateOf: null };
}

export async function getMyComplaints(userId, query) {
    const page = parseInt(query.page) || PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(parseInt(query.limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
    const skip = (page - 1) * limit;

    const filter = { createdBy: userId };
    if (query.status) filter.status = query.status;

    const [complaints, total] = await Promise.all([
        Complaint.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('wardId', 'name wardNumber')
            .lean(),
        Complaint.countDocuments(filter),
    ]);

    return { complaints, total, page, totalPages: Math.ceil(total / limit) || 1 };
}

export async function getComplaintById(complaintId, requestingUserId) {
    const complaint = await Complaint.findById(complaintId)
        .populate('wardId', 'name wardNumber city')
        .populate('createdBy', 'name')
        .populate('duplicateOf', 'title status _id')
        .lean();

    if (!complaint) throw ApiError.notFound('Complaint');

    let hasVoted = false;
    if (requestingUserId) {
        hasVoted = !!(await Vote.hasVoted(complaintId, requestingUserId));
    }

    return { complaint, hasVoted };
}

export async function toggleUpvote(complaintId, userId) {
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) throw ApiError.notFound('Complaint');

    if ([COMPLAINT_STATUS.RESOLVED, COMPLAINT_STATUS.REJECTED].includes(complaint.status)) {
        throw ApiError.badRequest('Cannot vote on a closed complaint.', 'COMPLAINT_CLOSED');
    }

    const existing = await Vote.findOne({ complaintId, userId });

    if (existing) {
        await existing.deleteOne();
        await Complaint.updateOne({ _id: complaintId }, { $inc: { upvotes: -1 } });
        return { upvotes: complaint.upvotes - 1, hasVoted: false };
    }

    await Vote.create({ complaintId, userId });
    await Complaint.updateOne({ _id: complaintId }, { $inc: { upvotes: 1 } });

    if (complaint.createdBy.toString() !== userId.toString()) {
        await User.updateOne(
            { _id: complaint.createdBy },
            { $inc: { reputationScore: REPUTATION.POINTS_UPVOTE_RECEIVED } }
        );

        await notify({
            userId: complaint.createdBy,
            type: NOTIFICATION_TYPES.UPVOTE_RECEIVED,
            data: { title: complaint.title },
            refModel: 'Complaint',
            refId: complaint._id,
        });
    }

    return { upvotes: complaint.upvotes + 1, hasVoted: true };
}

export async function deleteComplaint(complaintId, userId) {
    const complaint = await Complaint.findById(complaintId).select('+imagePublicId');
    if (!complaint) throw ApiError.notFound('Complaint');

    if (complaint.createdBy.toString() !== userId.toString()) {
        throw ApiError.forbidden('You can only delete your own complaints.');
    }

    const deletableStatuses = [COMPLAINT_STATUS.SUBMITTED, COMPLAINT_STATUS.DUPLICATE];
    if (!deletableStatuses.includes(complaint.status)) {
        throw ApiError.badRequest(
            "You can only delete complaints that haven't been verified yet.",
            'CANNOT_DELETE_VERIFIED'
        );
    }

    await deleteCloudinaryImage(complaint.imagePublicId);
    await Vote.deleteMany({ complaintId });
    await complaint.deleteOne();

    await User.updateOne(
        { _id: userId },
        { $inc: { reputationScore: -REPUTATION.POINTS_COMPLAINT_SUBMITTED } }
    );
}

export async function getPublicStats() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const since = new Date(Date.now() - WARD_HEALTH.STATS_WINDOW_DAYS * 86_400_000);

    const [totalOpen, resolvedToday, categoryAgg] = await Promise.all([
        Complaint.countDocuments({
            status: {
                $nin: [
                    COMPLAINT_STATUS.RESOLVED,
                    COMPLAINT_STATUS.REJECTED,
                    COMPLAINT_STATUS.DUPLICATE,
                ],
            },
        }),
        Complaint.countDocuments({
            status: COMPLAINT_STATUS.RESOLVED,
            resolvedAt: { $gte: today },
        }),
        Complaint.aggregate([
            { $match: { createdAt: { $gte: since } } },
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 1 },
        ]),
    ]);

    const resolutionAgg = await Complaint.aggregate([
        {
            $match: {
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
    ]);

    return {
        totalOpen,
        resolvedToday,
        avgResolutionHours: resolutionAgg[0] ? Math.round(resolutionAgg[0].avg) : null,
        topCategory: categoryAgg[0]?._id ?? null,
    };
}

export async function getPublicMapComplaints(query) {
    const { status, category } = query;
    const limit = Math.min(parseInt(query.limit) || 200, 500);

    const filter = {
        status: { $nin: [COMPLAINT_STATUS.DUPLICATE, COMPLAINT_STATUS.REJECTED] },
    };
    if (status) filter.status = status;
    if (category) filter.category = category;

    const complaints = await Complaint.find(filter)
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('title category status severity location address upvotes createdAt wardId')
        .populate('wardId', 'name wardNumber')
        .lean();

    return { complaints };
}
