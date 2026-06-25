import mongoose from 'mongoose';

const { Schema, model } = mongoose;

export const COMPLAINT_CATEGORIES = [
    'Road Damage',
    'Pothole',
    'Garbage',
    'Water Leakage',
    'Drainage',
    'Streetlight',
    'Sewage',
    'Encroachment',
    'Illegal Dumping',
    'Other',
];

export const COMPLAINT_STATUS = {
    SUBMITTED: 'submitted',
    VERIFIED: 'verified',
    ASSIGNED: 'assigned',
    IN_PROGRESS: 'in_progress',
    RESOLVED: 'resolved',
    REJECTED: 'rejected',
    DUPLICATE: 'duplicate',
};

export const STATUS_ORDER = ['submitted', 'verified', 'assigned', 'in_progress', 'resolved'];

const statusHistorySchema = new Schema(
    {
        status: {
            type: String,
            enum: Object.values(COMPLAINT_STATUS),
            required: true,
        },
        changedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        note: {
            type: String,
            trim: true,
            maxlength: 300,
            default: null,
        },
        changedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { _id: false }
);

const complaintSchema = new Schema(
    {
        title: {
            type: String,
            required: [true, 'Title is required'],
            trim: true,
            maxlength: [120, 'Title cannot exceed 120 characters'],
        },

        description: {
            type: String,
            required: [true, 'Description is required'],
            trim: true,
            maxlength: [1000, 'Description cannot exceed 1000 characters'],
        },

        category: {
            type: String,
            enum: {
                values: COMPLAINT_CATEGORIES,
                message: '{VALUE} is not a valid category',
            },
            required: [true, 'Category is required'],
        },

        status: {
            type: String,
            enum: Object.values(COMPLAINT_STATUS),
            default: COMPLAINT_STATUS.SUBMITTED,
        },

        statusHistory: {
            type: [statusHistorySchema],
            default: [],
        },

        imageUrl: {
            type: String,
            required: [true, 'An image is required'],
        },

        imagePublicId: {
            type: String,
            select: false,
            default: null,
        },

        resolutionImageUrl: {
            type: String,
            default: null,
        },

        location: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point',
            },
            coordinates: {
                type: [Number],
                required: [true, 'Location coordinates are required'],
                validate: {
                    validator: ([lng, lat]) => lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90,
                    message: 'Invalid coordinates — must be [longitude, latitude]',
                },
            },
        },

        address: {
            type: String,
            trim: true,
            default: null,
        },

        wardId: {
            type: Schema.Types.ObjectId,
            ref: 'Ward',
            required: [true, 'Ward reference is required'],
        },

        severity: {
            type: Number,
            min: 1,
            max: 10,
            default: null,
        },

        aiConfidence: {
            type: Number,
            min: 0,
            max: 1,
            default: null,
        },

        categorySource: {
            type: String,
            enum: ['ai', 'manual'],
            default: 'ai',
        },

        duplicateOf: {
            type: Schema.Types.ObjectId,
            ref: 'Complaint',
            default: null,
        },

        cascadeRisk: {
            type: Boolean,
            default: false,
        },

        cascadeSource: {
            type: Schema.Types.ObjectId,
            ref: 'Complaint',
            default: null,
        },

        upvotes: {
            type: Number,
            default: 0,
            min: 0,
        },

        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Creator reference is required'],
        },

        resolvedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

complaintSchema.index({ location: '2dsphere' });

complaintSchema.index({ createdBy: 1, createdAt: -1 });
complaintSchema.index({ wardId: 1, status: 1 });
complaintSchema.index({ status: 1, severity: -1 });
complaintSchema.index({ category: 1, wardId: 1, createdAt: -1 });
complaintSchema.index({ cascadeRisk: 1, wardId: 1 });
complaintSchema.index({ duplicateOf: 1 }, { sparse: true });

complaintSchema.virtual('triageScore').get(function () {
    const ageDays = (Date.now() - this.createdAt) / 86_400_000;
    const sev = this.severity ?? 5;
    const votes = this.upvotes ?? 0;
    return sev * 10 + votes * 0.5 + Math.min(ageDays, 30);
});

complaintSchema.pre('save', function () {
    if (this.isModified('status') && !this.isNew) {
        this.statusHistory.push({
            status: this.status,
            changedBy: this.statusChangedBy ?? this.createdBy,
            note: this.statusChangeNote ?? null,
            changedAt: new Date(),
        });
    }
    if (this.status === COMPLAINT_STATUS.RESOLVED && !this.resolvedAt) {
        this.resolvedAt = new Date();
    }
});

const Complaint = model('Complaint', complaintSchema);
export default Complaint;
