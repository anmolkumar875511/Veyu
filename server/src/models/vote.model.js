import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const voteSchema = new Schema(
    {
        complaintId: {
            type: Schema.Types.ObjectId,
            ref: 'Complaint',
            required: [true, 'Complaint reference is required'],
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User reference is required'],
        },
        voteType: {
            type: String,
            enum: ['upvote'],
            default: 'upvote',
        },
    },
    { timestamps: true, versionKey: false }
);

voteSchema.index({ complaintId: 1, userId: 1 }, { unique: true });
voteSchema.index({ userId: 1, createdAt: -1 });

voteSchema.statics.hasVoted = function (complaintId, userId) {
    return this.exists({ complaintId, userId });
};

voteSchema.statics.countForComplaint = function (complaintId) {
    return this.countDocuments({ complaintId });
};

voteSchema.statics.removeAllForComplaint = function (complaintId) {
    return this.deleteMany({ complaintId });
};

const Vote = model('Vote', voteSchema);
export default Vote;
