import mongoose from "mongoose";

const { Schema, model } = mongoose;

// Separate collection for votes so we can:
// 1. Prevent double-voting with a unique compound index
// 2. Query "did this user upvote this complaint" in O(1)
// 3. Keep the complaint document lean (no large upvotedBy array)
// The complaint.upvotes counter is the denormalized fast-read count;
// this collection is the authoritative source of truth.

const voteSchema = new Schema(
  {
    complaintId: {
      type: Schema.Types.ObjectId,
      ref: "Complaint",
      required: [true, "Complaint reference is required"],
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },

    // Reserved for future downvote or reaction system
    voteType: {
      type: String,
      enum: ["upvote"],
      default: "upvote",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ── Indexes ──────────────────────────────────────────────────────────────────
// Unique compound — one vote per user per complaint
voteSchema.index({ complaintId: 1, userId: 1 }, { unique: true });
voteSchema.index({ userId: 1, createdAt: -1 }); // user's voting history

// ── Static helpers ────────────────────────────────────────────────────────────
voteSchema.statics.hasVoted = function (complaintId, userId) {
  return this.exists({ complaintId, userId });
};

voteSchema.statics.countForComplaint = function (complaintId) {
  return this.countDocuments({ complaintId });
};

const Vote = model("Vote", voteSchema);

export default Vote;