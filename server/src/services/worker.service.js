import Assignment, { ASSIGNMENT_STATUS } from '../models/assignment.model.js';
import Complaint, { COMPLAINT_STATUS } from '../models/complaint.model.js';
import Observation, { OBSERVATION_STATUS } from '../models/observation.model.js';
import User from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { classifyObservation } from './gemini.service.js';

const AUTO_ELEVATE_CONFIDENCE_THRESHOLD = 0.8;

export async function getMyTasks(workerId, query) {
    const { status } = query;

    const filter = { workerId };
    filter.status = status
        ? status
        : {
              $in: [
                  ASSIGNMENT_STATUS.PENDING,
                  ASSIGNMENT_STATUS.ACKNOWLEDGED,
                  ASSIGNMENT_STATUS.EN_ROUTE,
                  ASSIGNMENT_STATUS.ON_SITE,
              ],
          };

    const assignments = await Assignment.find(filter)
        .sort({ queuePosition: 1, createdAt: 1 })
        .populate({
            path: 'complaintId',
            select: 'title description category severity imageUrl location address status',
        })
        .populate('assignedBy', 'name')
        .lean();

    return { tasks: assignments };
}

export async function getTaskDetail(assignmentId, workerId) {
    const assignment = await Assignment.findOne({ _id: assignmentId, workerId })
        .populate('complaintId')
        .populate('assignedBy', 'name phone')
        .lean();

    if (!assignment) throw ApiError.notFound('Task');
    return { assignment };
}

const TASK_STATUS_FLOW = {
    [ASSIGNMENT_STATUS.PENDING]: ASSIGNMENT_STATUS.ACKNOWLEDGED,
    [ASSIGNMENT_STATUS.ACKNOWLEDGED]: ASSIGNMENT_STATUS.EN_ROUTE,
    [ASSIGNMENT_STATUS.EN_ROUTE]: ASSIGNMENT_STATUS.ON_SITE,
};

export async function advanceTaskStatus(assignmentId, workerId) {
    const assignment = await Assignment.findOne({ _id: assignmentId, workerId });
    if (!assignment) throw ApiError.notFound('Task');

    const nextStatus = TASK_STATUS_FLOW[assignment.status];
    if (!nextStatus) {
        throw ApiError.badRequest(
            `Cannot advance from status "${assignment.status}". Use the complete endpoint to finish.`,
            'INVALID_TASK_TRANSITION'
        );
    }

    assignment.status = nextStatus;
    if (nextStatus === ASSIGNMENT_STATUS.ACKNOWLEDGED) assignment.acknowledgedAt = new Date();
    if (nextStatus === ASSIGNMENT_STATUS.ON_SITE) assignment.arrivedAt = new Date();
    await assignment.save();

    if (nextStatus === ASSIGNMENT_STATUS.EN_ROUTE || nextStatus === ASSIGNMENT_STATUS.ON_SITE) {
        await Complaint.updateOne(
            { _id: assignment.complaintId },
            { $set: { status: COMPLAINT_STATUS.IN_PROGRESS } }
        );
    }

    return { assignment };
}

export async function completeTask(assignmentId, workerId, dto, file) {
    const { completionNote } = dto;

    const assignment = await Assignment.findOne({ _id: assignmentId, workerId });
    if (!assignment) throw ApiError.notFound('Task');

    if (assignment.status === ASSIGNMENT_STATUS.COMPLETED) {
        throw ApiError.badRequest('This task is already completed.', 'ALREADY_COMPLETED');
    }
    if (!file) throw ApiError.badRequest('A proof-of-completion photo is required.', 'NO_IMAGE');

    assignment.status = ASSIGNMENT_STATUS.COMPLETED;
    assignment.completedAt = new Date();
    assignment.completionNote = completionNote ?? null;
    assignment.completionImageUrl = file.path;
    assignment.completionImagePublicId = file.filename;
    await assignment.save();

    const complaint = await Complaint.findById(assignment.complaintId);
    if (complaint) {
        complaint.status = COMPLAINT_STATUS.RESOLVED;
        complaint.resolvedAt = new Date();
        complaint.resolutionImageUrl = file.path;
        complaint._statusChangedBy = workerId;
        await complaint.save();
    }

    await User.updateOne({ _id: workerId }, { $inc: { fieldPoints: 10 } });

    return { assignment, complaint };
}

export async function submitObservation(workerId, dto, file) {
    const { latitude, longitude, address, note } = dto;

    if (!file) throw ApiError.badRequest('An observation photo is required.', 'NO_IMAGE');

    const worker = await User.findById(workerId).select('assignedWard');
    if (!worker?.assignedWard) {
        throw ApiError.badRequest(
            'Your account has no assigned ward. Contact admin.',
            'NO_WARD_ASSIGNED'
        );
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (isNaN(lat) || isNaN(lng)) {
        throw ApiError.badRequest('Valid latitude and longitude are required.', 'INVALID_COORDS');
    }

    const imageUrl = file.path;
    const imagePublicId = file.filename;

    const aiResult = await classifyObservation(imageUrl, note);

    const observation = await Observation.create({
        workerId,
        wardId: worker.assignedWard,
        imageUrl,
        imagePublicId,
        note: note ?? null,
        location: { type: 'Point', coordinates: [lng, lat] },
        address: address ?? null,
        aiCategory: aiResult.category,
        aiSeverity: aiResult.severity,
        aiConfidence: aiResult.confidence,
        status:
            aiResult.confidence < 0.4 ? OBSERVATION_STATUS.FLAGGED : OBSERVATION_STATUS.AI_REVIEWED,
    });

    let autoElevatedComplaint = null;
    if (aiResult.confidence >= AUTO_ELEVATE_CONFIDENCE_THRESHOLD) {
        autoElevatedComplaint = await Complaint.create({
            title: note?.slice(0, 80) || `${aiResult.category} reported by field worker`,
            description: note || `Field observation: ${aiResult.category}.`,
            category: aiResult.category,
            categorySource: 'ai',
            aiConfidence: aiResult.confidence,
            severity: aiResult.severity,
            imageUrl,
            location: { type: 'Point', coordinates: [lng, lat] },
            address: address ?? null,
            wardId: worker.assignedWard,
            createdBy: workerId,
            status: COMPLAINT_STATUS.VERIFIED,
        });

        observation.status = OBSERVATION_STATUS.ELEVATED;
        observation.elevatedTo = autoElevatedComplaint._id;
        observation.elevatedAt = new Date();
        observation.pointsAwarded = 15;
        await observation.save();

        await User.updateOne({ _id: workerId }, { $inc: { fieldPoints: 15 } });
    } else {
        await User.updateOne({ _id: workerId }, { $inc: { fieldPoints: 2 } });
    }

    return { observation, autoElevated: !!autoElevatedComplaint, complaint: autoElevatedComplaint };
}

export async function getMyObservations(workerId, query) {
    const { page = 1, limit = 10, status } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = { workerId };
    if (status) filter.status = status;

    const [observations, total] = await Promise.all([
        Observation.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
        Observation.countDocuments(filter),
    ]);

    return {
        observations,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
    };
}

export async function getWorkerSummary(workerId) {
    const [worker, completedCount, pendingCount, observationCount] = await Promise.all([
        User.findById(workerId)
            .select('name fieldPoints assignedWard')
            .populate('assignedWard', 'name wardNumber'),
        Assignment.countDocuments({ workerId, status: ASSIGNMENT_STATUS.COMPLETED }),
        Assignment.countDocuments({
            workerId,
            status: {
                $in: [
                    ASSIGNMENT_STATUS.PENDING,
                    ASSIGNMENT_STATUS.ACKNOWLEDGED,
                    ASSIGNMENT_STATUS.EN_ROUTE,
                    ASSIGNMENT_STATUS.ON_SITE,
                ],
            },
        }),
        Observation.countDocuments({ workerId }),
    ]);

    if (!worker) throw ApiError.notFound('Worker');

    return { worker, completedCount, pendingCount, observationCount };
}
