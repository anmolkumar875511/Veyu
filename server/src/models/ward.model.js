import mongoose from 'mongoose';

const { Schema, model } = mongoose;

export const STRESS_BANDS = {
    CALM: 'calm',
    STABLE: 'stable',
    RISING: 'rising',
    CRITICAL: 'critical',
    EMERGENCY: 'emergency',
};

const wardSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, 'Ward name is required'],
            trim: true,
            unique: true,
        },

        wardNumber: {
            type: Number,
            required: [true, 'Ward number is required'],
            unique: true,
            min: 1,
        },

        city: {
            type: String,
            required: [true, 'City is required'],
            trim: true,
        },

        officerId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },

        boundary: {
            type: {
                type: String,
                enum: ['Polygon'],
                default: 'Polygon',
            },
            coordinates: {
                type: [[[Number]]],
                default: undefined,
            },
        },

        pulseVelocity: {
            type: Number,
            default: 1.0,
            min: 0,
        },

        stressBand: {
            type: String,
            enum: Object.values(STRESS_BANDS),
            default: STRESS_BANDS.STABLE,
        },
        complaintsLast48h: { type: Number, default: 0, min: 0 },
        complaintsPrev48h: { type: Number, default: 0, min: 0 },
        pulseLastUpdated: { type: Date, default: null },

        healthScore: {
            type: Number,
            default: 100,
            min: 0,
            max: 100,
        },

        stats: {
            totalOpen: { type: Number, default: 0 },
            totalResolved: { type: Number, default: 0 },
            avgResolutionHours: { type: Number, default: 0 },
            resolutionRate: { type: Number, default: 0 },
        },

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

wardSchema.index({ officerId: 1 });
wardSchema.index({ stressBand: 1 });
wardSchema.index({ healthScore: -1 });
wardSchema.index({ isActive: 1 });
wardSchema.index({ boundary: '2dsphere' }, { sparse: true });

wardSchema.methods.computeStressBand = function () {
    const v = this.pulseVelocity;
    if (v < 0.8) return STRESS_BANDS.CALM;
    if (v < 1.2) return STRESS_BANDS.STABLE;
    if (v < 2.0) return STRESS_BANDS.RISING;
    if (v < 4.0) return STRESS_BANDS.CRITICAL;
    return STRESS_BANDS.EMERGENCY;
};

wardSchema.statics.findActive = function () {
    return this.find({ isActive: true }).sort({ wardNumber: 1 });
};

wardSchema.statics.findOrFallback = async function (longitude, latitude) {
    const byBoundary = await this.findOne({
        boundary: {
            $geoIntersects: {
                $geometry: { type: 'Point', coordinates: [longitude, latitude] },
            },
        },
        isActive: true,
    });
    if (byBoundary) return byBoundary;

    return this.findOne({ isActive: true }).sort({ wardNumber: 1 });
};

const Ward = model('Ward', wardSchema);
export default Ward;
