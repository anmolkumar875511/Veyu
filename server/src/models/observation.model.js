import mongoose from 'mongoose';
import { COMPLAINT_CATEGORIES } from './complaint.model.js';

const { Schema, model } = mongoose;

export const OBSERVATION_STATUS = {
    PENDING: 'pending',
    AI_REVIEWED: 'ai_reviewed',
    ELEVATED: 'elevated',
    DISMISSED: 'dismissed',
    FLAGGED: 'flagged',
};

const observationSchema = new Schema(
    {
        workerId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Worker reference is required'],
        },

        wardId: {
            type: Schema.Types.ObjectId,
            ref: 'Ward',
            required: [true, 'Ward reference is required'],
        },

        imageUrl: {
            type: String,
            required: [true, 'An observation image is required'],
        },

        imagePublicId: {
            type: String,
            select: false,
        },

        note: {
            type: String,
            trim: true,
            maxlength: [300, 'Note cannot exceed 300 characters'],
            default: null,
        },

        location: {
            type: {
                type: String,
                enum: ['Point'],
                required: true,
                default: 'Point',
            },
            coordinates: {
                type: [Number],
                required: [true, 'Location is required'],
                validate: {
                    validator: ([lng, lat]) => lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90,
                    message: 'Invalid coordinates',
                },
            },
        },

        address: {
            type: String,
            trim: true,
            default: null,
        },

        aiCategory: {
            type: String,
            enum: [...COMPLAINT_CATEGORIES, null],
            default: null,
        },

        aiSeverity: {
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

        aiRawResponse: {
            type: String,
            select: false,
            default: null,
        },

        status: {
            type: String,
            enum: Object.values(OBSERVATION_STATUS),
            default: OBSERVATION_STATUS.PENDING,
        },

        elevatedTo: {
            type: Schema.Types.ObjectId,
            ref: 'Complaint',
            default: null,
        },

        elevatedAt: {
            type: Date,
            default: null,
        },

        reviewedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },

        reviewNote: {
            type: String,
            trim: true,
            maxlength: 300,
            default: null,
        },

        pointsAwarded: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

observationSchema.index({ location: '2dsphere' });
observationSchema.index({ workerId: 1, createdAt: -1 });
observationSchema.index({ status: 1, wardId: 1 });
observationSchema.index({ aiConfidence: -1, status: 1 });
observationSchema.index({ elevatedTo: 1 }, { sparse: true });

const Observation = model('Observation', observationSchema);

export default Observation;
