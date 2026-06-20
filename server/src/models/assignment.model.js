import mongoose from 'mongoose';

const { Schema, model } = mongoose;

export const ASSIGNMENT_STATUS = {
    PENDING: 'pending',
    ACKNOWLEDGED: 'acknowledged',
    EN_ROUTE: 'en_route',
    ON_SITE: 'on_site',
    COMPLETED: 'completed',
    REASSIGNED: 'reassigned',
};

const assignmentSchema = new Schema(
    {
        complaintId: {
            type: Schema.Types.ObjectId,
            ref: 'Complaint',
            required: [true, 'Complaint reference is required'],
        },

        workerId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Worker reference is required'],
        },

        assignedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Assigning officer reference is required'],
        },

        wardId: {
            type: Schema.Types.ObjectId,
            ref: 'Ward',
            required: true,
        },

        status: {
            type: String,
            enum: Object.values(ASSIGNMENT_STATUS),
            default: ASSIGNMENT_STATUS.PENDING,
        },

        instructions: {
            type: String,
            trim: true,
            maxlength: [500, 'Instructions cannot exceed 500 characters'],
            default: null,
        },

        queuePosition: {
            type: Number,
            default: 0,
        },

        acknowledgedAt: { type: Date, default: null },
        arrivedAt: { type: Date, default: null },
        completedAt: { type: Date, default: null },

        completionNote: {
            type: String,
            trim: true,
            maxlength: 400,
            default: null,
        },

        completionImageUrl: {
            type: String,
            default: null,
        },

        completionImagePublicId: {
            type: String,
            select: false,
            default: null,
        },

        previousWorkerId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },

        reassignmentReason: {
            type: String,
            trim: true,
            default: null,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

assignmentSchema.index({ workerId: 1, status: 1 });
assignmentSchema.index({ complaintId: 1 }, { unique: true });
assignmentSchema.index({ assignedBy: 1, createdAt: -1 });
assignmentSchema.index({ wardId: 1, status: 1 });

assignmentSchema.virtual('resolutionMinutes').get(function () {
    if (!this.completedAt || !this.createdAt) return null;
    return Math.round((this.completedAt - this.createdAt) / 60_000);
});

const Assignment = model('Assignment', assignmentSchema);

export default Assignment;
