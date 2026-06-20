import Complaint, { COMPLAINT_STATUS } from '../models/complaint.model.js';
import Assignment, { ASSIGNMENT_STATUS } from '../models/assignment.model.js';
import Observation, { OBSERVATION_STATUS } from '../models/observation.model.js';
import User from '../models/user.model.js';
import Ward from '../models/ward.model.js';
import { ApiError } from '../utils/ApiError.js';
import { evaluateCascadeRisk, clearCascadeFlag } from './cascadeRisk.service.js';

export async function getTriageQueue(officerWardId, query) {
    const { page = 1, limit = 20, status, category, wardId } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {
        status: {
            $nin: [
                COMPLAINT_STATUS.RESOLVED,
                COMPLAINT_STATUS.REJECTED,
                COMPLAINT_STATUS.DUPLICATE,
            ],
        },
    };

    if (wardId) filter.wardId = wardId;
    else if (officerWardId) filter.wardId = officerWardId;

    if (status) filter.status = status;
    if (category) filter.category = category;

    const [complaints, total] = await Promise.all([
        Complaint.find(filter)
            .sort({ cascadeRisk: -1, severity: -1, upvotes: -1, createdAt: 1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('wardId', 'name wardNumber stressBand')
            .populate('createdBy', 'name')
            .lean(),
        Complaint.countDocuments(filter),
    ]);

    return {
        complaints,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
    };
}

export async function getComplaintDetail(complaintId) {
    const complaint = await Complaint.findById(complaintId)
        .populate('wardId', 'name wardNumber stressBand officerId')
        .populate('createdBy', 'name email reputationScore')
        .populate('duplicateOf', 'title status')
        .populate('cascadeSource', 'title category')
        .lean();

    if (!complaint) throw ApiError.notFound('Complaint');

    const assignment = await Assignment.findOne({ complaintId })
        .populate('workerId', 'name phone fieldPoints')
        .lean();

    return { complaint, assignment: assignment ?? null };
}

export async function updateComplaintStatus(complaintId, officerId, dto) {
    const { status, note } = dto;

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) throw ApiError.notFound('Complaint');

    const validTargets = [
        COMPLAINT_STATUS.VERIFIED,
        COMPLAINT_STATUS.ASSIGNED,
        COMPLAINT_STATUS.IN_PROGRESS,
        COMPLAINT_STATUS.RESOLVED,
        COMPLAINT_STATUS.REJECTED,
    ];
    if (!validTargets.includes(status)) {
        throw ApiError.badRequest(
            `Officers cannot set status to "${status}".`,
            'INVALID_TRANSITION'
        );
    }

    complaint.status = status;
    complaint._statusChangedBy = officerId;
    if (note) {
        complaint.statusHistory.push({ status, changedBy: officerId, note, changedAt: new Date() });
    }
    await complaint.save();

    let cascadeResult = { flaggedCount: 0, flaggedIds: [] };
    if (status === COMPLAINT_STATUS.VERIFIED) {
        cascadeResult = await evaluateCascadeRisk(complaint);
    }

    if (
        [COMPLAINT_STATUS.RESOLVED, COMPLAINT_STATUS.REJECTED].includes(status) &&
        complaint.cascadeRisk
    ) {
        await clearCascadeFlag(complaint._id);
    }

    return { complaint, cascadeResult };
}

export async function dispatchToWorker(complaintId, officerId, dto) {
    const { workerId, instructions } = dto;

    const [complaint, worker] = await Promise.all([
        Complaint.findById(complaintId),
        User.findOne({ _id: workerId, role: 'worker', isActive: true }),
    ]);

    if (!complaint) throw ApiError.notFound('Complaint');
    if (!worker) throw ApiError.badRequest('Worker not found or inactive.', 'INVALID_WORKER');

    const existing = await Assignment.findOne({ complaintId });
    if (existing && existing.status !== ASSIGNMENT_STATUS.REASSIGNED) {
        throw ApiError.conflict(
            'This complaint already has an active assignment.',
            'ALREADY_ASSIGNED'
        );
    }

    const queueCount = await Assignment.countDocuments({
        workerId,
        status: {
            $in: [
                ASSIGNMENT_STATUS.PENDING,
                ASSIGNMENT_STATUS.ACKNOWLEDGED,
                ASSIGNMENT_STATUS.EN_ROUTE,
            ],
        },
    });

    const assignment = await Assignment.create({
        complaintId,
        workerId,
        assignedBy: officerId,
        wardId: complaint.wardId,
        instructions: instructions ?? null,
        queuePosition: queueCount,
    });

    complaint.status = COMPLAINT_STATUS.ASSIGNED;
    complaint._statusChangedBy = officerId;
    await complaint.save();

    return { assignment, complaint };
}

export async function reassignWorker(complaintId, officerId, dto) {
    const { newWorkerId, reason } = dto;

    const current = await Assignment.findOne({
        complaintId,
        status: { $ne: ASSIGNMENT_STATUS.COMPLETED },
    });
    if (!current) throw ApiError.notFound('Active assignment');

    const newWorker = await User.findOne({ _id: newWorkerId, role: 'worker', isActive: true });
    if (!newWorker)
        throw ApiError.badRequest('New worker not found or inactive.', 'INVALID_WORKER');

    current.status = ASSIGNMENT_STATUS.REASSIGNED;
    current.reassignmentReason = reason ?? null;
    await current.save();

    const queueCount = await Assignment.countDocuments({
        workerId: newWorkerId,
        status: {
            $in: [
                ASSIGNMENT_STATUS.PENDING,
                ASSIGNMENT_STATUS.ACKNOWLEDGED,
                ASSIGNMENT_STATUS.EN_ROUTE,
            ],
        },
    });

    const newAssignment = await Assignment.create({
        complaintId,
        workerId: newWorkerId,
        assignedBy: officerId,
        wardId: current.wardId,
        instructions: current.instructions,
        queuePosition: queueCount,
        previousWorkerId: current.workerId,
    });

    return { assignment: newAssignment };
}

export async function getObservationQueue(officerWardId, query) {
    const { page = 1, limit = 20, status, wardId } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};
    if (wardId) filter.wardId = wardId;
    else if (officerWardId) filter.wardId = officerWardId;

    filter.status = status ?? { $in: [OBSERVATION_STATUS.AI_REVIEWED, OBSERVATION_STATUS.FLAGGED] };

    const [observations, total] = await Promise.all([
        Observation.find(filter)
            .sort({ aiConfidence: -1, createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('workerId', 'name fieldPoints')
            .populate('wardId', 'name wardNumber')
            .lean(),
        Observation.countDocuments(filter),
    ]);

    return {
        observations,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
    };
}

export async function reviewObservation(observationId, officerId, dto) {
    const { action, reviewNote } = dto;

    const observation = await Observation.findById(observationId);
    if (!observation) throw ApiError.notFound('Observation');
    if (observation.status === OBSERVATION_STATUS.ELEVATED) {
        throw ApiError.badRequest(
            'This observation has already been elevated.',
            'ALREADY_ELEVATED'
        );
    }

    if (action === 'dismiss') {
        observation.status = OBSERVATION_STATUS.DISMISSED;
        observation.reviewedBy = officerId;
        observation.reviewNote = reviewNote ?? null;
        await observation.save();
        return { observation, complaint: null };
    }

    if (action === 'elevate') {
        const complaint = await Complaint.create({
            title:
                observation.note?.slice(0, 80) ||
                `${observation.aiCategory} reported by field worker`,
            description:
                observation.note ||
                `Field observation: ${observation.aiCategory}. No additional description provided.`,
            category: observation.aiCategory ?? 'Other',
            categorySource: 'ai',
            aiConfidence: observation.aiConfidence,
            severity: observation.aiSeverity ?? 5,
            imageUrl: observation.imageUrl,
            location: observation.location,
            address: observation.address,
            wardId: observation.wardId,
            createdBy: observation.workerId,
            status: COMPLAINT_STATUS.VERIFIED,
        });

        observation.status = OBSERVATION_STATUS.ELEVATED;
        observation.elevatedTo = complaint._id;
        observation.elevatedAt = new Date();
        observation.reviewedBy = officerId;
        observation.reviewNote = reviewNote ?? null;
        observation.pointsAwarded = 15;
        await observation.save();

        await User.updateOne({ _id: observation.workerId }, { $inc: { fieldPoints: 15 } });
        await evaluateCascadeRisk(complaint);

        return { observation, complaint };
    }

    throw ApiError.badRequest("Action must be 'elevate' or 'dismiss'.", 'INVALID_ACTION');
}

export async function getWardReport(wardId) {
    const ward = await Ward.findById(wardId).lean();
    if (!ward) throw ApiError.notFound('Ward');

    const since30d = new Date(Date.now() - 30 * 86_400_000);

    const [statusBreakdown, categoryBreakdown, resolutionAgg, workerLeaderboard] =
        await Promise.all([
            Complaint.aggregate([
                { $match: { wardId: ward._id } },
                { $group: { _id: '$status', count: { $sum: 1 } } },
            ]),
            Complaint.aggregate([
                { $match: { wardId: ward._id, createdAt: { $gte: since30d } } },
                { $group: { _id: '$category', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]),
            Complaint.aggregate([
                {
                    $match: {
                        wardId: ward._id,
                        status: COMPLAINT_STATUS.RESOLVED,
                        resolvedAt: { $exists: true },
                        createdAt: { $gte: since30d },
                    },
                },
                {
                    $project: {
                        hours: {
                            $divide: [{ $subtract: ['$resolvedAt', '$createdAt'] }, 3_600_000],
                        },
                    },
                },
                { $group: { _id: null, avg: { $avg: '$hours' }, count: { $sum: 1 } } },
            ]),
            Assignment.aggregate([
                { $match: { wardId: ward._id, status: ASSIGNMENT_STATUS.COMPLETED } },
                { $group: { _id: '$workerId', completedCount: { $sum: 1 } } },
                { $sort: { completedCount: -1 } },
                { $limit: 5 },
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'worker',
                    },
                },
                { $unwind: '$worker' },
                {
                    $project: {
                        name: '$worker.name',
                        fieldPoints: '$worker.fieldPoints',
                        completedCount: 1,
                    },
                },
            ]),
        ]);

    return {
        ward,
        statusBreakdown: statusBreakdown.reduce((acc, st) => ({ ...acc, [st._id]: st.count }), {}),
        categoryBreakdown,
        avgResolutionHours: resolutionAgg[0] ? Math.round(resolutionAgg[0].avg) : null,
        resolvedCount30d: resolutionAgg[0]?.count ?? 0,
        workerLeaderboard,
    };
}

export async function getAvailableWorkers(wardId) {
    const filter = { role: 'worker', isActive: true };
    if (wardId) filter.assignedWard = wardId;

    const workers = await User.find(filter).select('name phone fieldPoints assignedWard').lean();

    const withLoad = await Promise.all(
        workers.map(async (w) => {
            const activeCount = await Assignment.countDocuments({
                workerId: w._id,
                status: {
                    $in: [
                        ASSIGNMENT_STATUS.PENDING,
                        ASSIGNMENT_STATUS.ACKNOWLEDGED,
                        ASSIGNMENT_STATUS.EN_ROUTE,
                        ASSIGNMENT_STATUS.ON_SITE,
                    ],
                },
            });
            return { ...w, activeTaskCount: activeCount };
        })
    );

    return { workers: withLoad };
}
