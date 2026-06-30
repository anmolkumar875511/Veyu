import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const otpSchema = new Schema(
    {
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },

        code: {
            type: String,
            required: true,
            select: false,
        },

        expiresAt: {
            type: Date,
            required: true,
        },

        attempts: {
            type: Number,
            default: 0,
        },

        verified: {
            type: Boolean,
            default: false,
        },

        purpose: {
            type: String,
            enum: ['register', 'login'],
            default: 'register',
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

otpSchema.index({ email: 1, purpose: 1 });

const OTP = model('OTP', otpSchema);
export default OTP;
