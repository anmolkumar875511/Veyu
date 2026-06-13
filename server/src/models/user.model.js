import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const { Schema, model } = mongoose;

const userSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            minlength: [2, 'Name must be at least 2 characters'],
            maxlength: [60, 'Name cannot exceed 60 characters'],
        },

        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
        },

        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters'],
            select: false,
        },

        role: {
            type: String,
            enum: {
                values: ['citizen', 'officer', 'worker', 'admin'],
                message: '{VALUE} is not a valid role',
            },
            default: 'citizen',
        },

        phone: {
            type: String,
            trim: true,
            match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'],
        },

        avatar: {
            type: String,
            default: null,
        },

        reputationScore: {
            type: Number,
            default: 0,
            min: 0,
        },

        fieldPoints: {
            type: Number,
            default: 0,
            min: 0,
        },

        assignedWard: {
            type: Schema.Types.ObjectId,
            ref: 'Ward',
            default: null,
        },

        isActive: {
            type: Boolean,
            default: true,
        },

        lastLogin: {
            type: Date,
            default: null,
        },

        fcmToken: {
            type: String,
            default: null,
            select: false,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// ── Indexes ──────────────────────────────────────────────────────────────────
// userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ assignedWard: 1 });

// ── Hooks ────────────────────────────────────────────────────────────────────
// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// ── Instance Methods ─────────────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toPublicJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    delete obj.fcmToken;
    return obj;
};

// ── Static Methods ────────────────────────────────────────────────────────────
userSchema.statics.findByEmail = function (email) {
    return this.findOne({ email: email.toLowerCase() }).select('+password');
};

const User = model('User', userSchema);

export default User;
