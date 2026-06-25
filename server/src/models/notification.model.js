import mongoose from 'mongoose';

const { Schema, model } = mongoose;

export const NOTIFICATION_TYPES = {
    COMPLAINT_VERIFIED: 'complaint_verified',
    COMPLAINT_ASSIGNED: 'complaint_assigned',
    COMPLAINT_IN_PROGRESS: 'complaint_in_progress',
    COMPLAINT_RESOLVED: 'complaint_resolved',
    COMPLAINT_REJECTED: 'complaint_rejected',
    UPVOTE_RECEIVED: 'upvote_received',
    DUPLICATE_DETECTED: 'duplicate_detected',
    REPUTATION_EARNED: 'reputation_earned',

    NEW_COMPLAINT: 'new_complaint',
    STRESS_BAND_ELEVATED: 'stress_band_elevated',
    SILENT_SIGNAL_ALERT: 'silent_signal_alert',
    CASCADE_RISK_FLAGGED: 'cascade_risk_flagged',
    OBSERVATION_NEEDS_REVIEW: 'observation_needs_review',

    TASK_ASSIGNED: 'task_assigned',
    TASK_REASSIGNED: 'task_reassigned',
    FIELD_POINTS_AWARDED: 'field_points_awarded',
};

const notificationSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Recipient user is required'],
        },

        type: {
            type: String,
            enum: Object.values(NOTIFICATION_TYPES),
            required: [true, 'Notification type is required'],
        },

        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },

        message: {
            type: String,
            required: true,
            trim: true,
            maxlength: 300,
        },

        refModel: {
            type: String,
            enum: ['Complaint', 'Observation', 'Assignment', 'Ward', 'Forecast'],
            default: null,
        },

        refId: {
            type: Schema.Types.ObjectId,
            refPath: 'refModel',
            default: null,
        },

        isRead: {
            type: Boolean,
            default: false,
        },

        readAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, createdAt: -1 });

notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 24 * 60 * 60 });

notificationSchema.statics.markAllRead = function (userId) {
    return this.updateMany(
        { userId, isRead: false },
        { $set: { isRead: true, readAt: new Date() } }
    );
};

notificationSchema.statics.countUnread = function (userId) {
    return this.countDocuments({ userId, isRead: false });
};

const Notification = model('Notification', notificationSchema);

export default Notification;
