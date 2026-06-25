import Notification, { NOTIFICATION_TYPES } from '../models/notification.model.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';
import { PAGINATION } from '../constants/index.js';

const SCOPE = 'Notification';

const TEMPLATES = {
    [NOTIFICATION_TYPES.COMPLAINT_VERIFIED]: (d) => ({
        title: 'Complaint verified',
        message: `Your report "${d.title}" has been verified and is being reviewed for assignment.`,
    }),
    [NOTIFICATION_TYPES.COMPLAINT_ASSIGNED]: (d) => ({
        title: 'Complaint assigned',
        message: `Your report "${d.title}" has been assigned to a field worker.`,
    }),
    [NOTIFICATION_TYPES.COMPLAINT_IN_PROGRESS]: (d) => ({
        title: 'Work in progress',
        message: `A field worker is now actively working on "${d.title}".`,
    }),
    [NOTIFICATION_TYPES.COMPLAINT_RESOLVED]: (d) => ({
        title: 'Complaint resolved',
        message: `Great news — "${d.title}" has been marked resolved.`,
    }),
    [NOTIFICATION_TYPES.COMPLAINT_REJECTED]: (d) => ({
        title: 'Complaint rejected',
        message: d.note
            ? `Your report "${d.title}" was rejected: ${d.note}`
            : `Your report "${d.title}" was rejected by an officer.`,
    }),
    [NOTIFICATION_TYPES.UPVOTE_RECEIVED]: (d) => ({
        title: 'Your report got an upvote',
        message: `"${d.title}" just received community support. +2 reputation.`,
    }),
    [NOTIFICATION_TYPES.DUPLICATE_DETECTED]: (d) => ({
        title: 'Similar issue found',
        message: `Your report was linked to an existing complaint: "${d.title}". Consider upvoting it instead.`,
    }),
    [NOTIFICATION_TYPES.REPUTATION_EARNED]: (d) => ({
        title: 'Reputation earned',
        message: `You earned +${d.points} reputation points.`,
    }),
    [NOTIFICATION_TYPES.NEW_COMPLAINT]: (d) => ({
        title: 'New complaint in your ward',
        message: `"${d.title}" (${d.category}) was just submitted in ${d.wardName}.`,
    }),
    [NOTIFICATION_TYPES.STRESS_BAND_ELEVATED]: (d) => ({
        title: `${d.wardName} stress elevated`,
        message: `Complaint velocity in ${d.wardName} has risen to "${d.stressBand}". Velocity: ${d.velocity}×.`,
    }),
    [NOTIFICATION_TYPES.SILENT_SIGNAL_ALERT]: (d) => ({
        title: 'SilentSignal forecast',
        message: d.summary,
    }),
    [NOTIFICATION_TYPES.CASCADE_RISK_FLAGGED]: (d) => ({
        title: 'Cascade risk flagged',
        message: `"${d.title}" was flagged as cascade risk following a nearby verified water/sewage complaint.`,
    }),
    [NOTIFICATION_TYPES.OBSERVATION_NEEDS_REVIEW]: (d) => ({
        title: 'FieldMesh observation needs review',
        message: `A worker submitted a ${d.category} observation in ${d.wardName} that needs your review.`,
    }),
    [NOTIFICATION_TYPES.TASK_ASSIGNED]: (d) => ({
        title: 'New task assigned',
        message: `You've been assigned: "${d.title}".${d.instructions ? ` Note: ${d.instructions}` : ''}`,
    }),
    [NOTIFICATION_TYPES.TASK_REASSIGNED]: (d) => ({
        title: 'Task reassigned',
        message: `"${d.title}" has been reassigned to another worker.`,
    }),
    [NOTIFICATION_TYPES.FIELD_POINTS_AWARDED]: (d) => ({
        title: 'Field points awarded',
        message: `+${d.points} field points for ${d.reason}.`,
    }),
};

export async function notify({ userId, type, data = {}, refModel = null, refId = null }) {
    try {
        const template = TEMPLATES[type];
        if (!template) {
            logger.warn(
                SCOPE,
                `No template registered for notification type "${type}" — skipping.`
            );
            return null;
        }

        const { title, message } = template(data);

        const notification = await Notification.create({
            userId,
            type,
            title,
            message,
            refModel,
            refId,
        });

        return notification.toObject();
    } catch (err) {
        logger.error(SCOPE, `Failed to create notification (type=${type}, userId=${userId})`, err);
        return null;
    }
}

export async function notifyMany(userIds, { type, data = {}, refModel = null, refId = null }) {
    const results = await Promise.allSettled(
        userIds.map((userId) => notify({ userId, type, data, refModel, refId }))
    );
    return results.filter((r) => r.status === 'fulfilled' && r.value !== null).length;
}

export async function getMyNotifications(userId, query = {}) {
    const page = parseInt(query.page) || PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(parseInt(query.limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
    const skip = (page - 1) * limit;

    const filter = { userId };
    if (query.unreadOnly === 'true') filter.isRead = false;

    const [notifications, total, unreadCount] = await Promise.all([
        Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        Notification.countDocuments(filter),
        Notification.countUnread(userId),
    ]);

    return {
        notifications,
        total,
        unreadCount,
        page,
        totalPages: Math.ceil(total / limit) || 1,
    };
}

export async function markAsRead(notificationId, userId) {
    const notification = await Notification.findOne({ _id: notificationId, userId });
    if (!notification) throw ApiError.notFound('Notification');

    if (!notification.isRead) {
        notification.isRead = true;
        notification.readAt = new Date();
        await notification.save();
    }

    return notification.toObject();
}

export async function markAllAsRead(userId) {
    const result = await Notification.markAllRead(userId);
    return { modifiedCount: result.modifiedCount ?? 0 };
}

export async function deleteNotification(notificationId, userId) {
    const result = await Notification.deleteOne({ _id: notificationId, userId });
    if (result.deletedCount === 0) throw ApiError.notFound('Notification');
}

export async function getUnreadCount(userId) {
    const count = await Notification.countUnread(userId);
    return { unreadCount: count };
}
