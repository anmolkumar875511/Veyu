import mongoose from "mongoose";

const { Schema, model } = mongoose;

export const COMPLAINT_CATEGORIES = [
  "Road Damage",
  "Pothole",
  "Garbage",
  "Water Leakage",
  "Drainage",
  "Streetlight",
  "Sewage",
  "Encroachment",
  "Illegal Dumping",
  "Other",
];

export const COMPLAINT_STATUS = {
  SUBMITTED: "submitted",
  VERIFIED: "verified",
  ASSIGNED: "assigned",
  IN_PROGRESS: "in_progress",
  RESOLVED: "resolved",
  REJECTED: "rejected",
  DUPLICATE: "duplicate",
};

export const STATUS_ORDER = [
  COMPLAINT_STATUS.SUBMITTED,
  COMPLAINT_STATUS.VERIFIED,
  COMPLAINT_STATUS.ASSIGNED,
  COMPLAINT_STATUS.IN_PROGRESS,
  COMPLAINT_STATUS.RESOLVED,
];

const statusHistorySchema = new Schema(
  {
    status: {
      type: String,
      enum: Object.values(COMPLAINT_STATUS),
      required: true,
    },
    changedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 300,
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
      required: [true, "Title is required"],
      trim: true,
      maxlength: [120, "Title cannot exceed 120 characters"],
    },

    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },

    category: {
      type: String,
      enum: {
        values: COMPLAINT_CATEGORIES,
        message: "{VALUE} is not a valid category",
      },
      required: [true, "Category is required"],
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
      required: [true, "An image is required for submission"],
    },

    imagePublicId: {
      type: String,
      select: false,
    },

    audioUrl: {
      type: String,
      default: null,
    },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude] — GeoJSON order
        required: [true, "Location coordinates are required"],
        validate: {
          validator: ([lng, lat]) =>
            lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90,
          message: "Invalid coordinates",
        },
      },
    },

    address: {
      type: String, // Reverse-geocoded human-readable address
      trim: true,
      default: null,
    },

    wardId: {
      type: Schema.Types.ObjectId,
      ref: "Ward",
      required: [true, "Ward association is required"],
    },

    // ── AI-generated fields ───────────────────────────────────────────────────
    // Severity score 1–10 assigned by Gemini Vision
    severity: {
      type: Number,
      min: 1,
      max: 10,
      default: null,
    },

    // Confidence of AI classification (0.0–1.0)
    aiConfidence: {
      type: Number,
      min: 0,
      max: 1,
      default: null,
    },

    // Was category assigned by AI or manually selected by user
    categorySource: {
      type: String,
      enum: ["ai", "manual"],
      default: "ai",
    },

    // ── Deduplication ─────────────────────────────────────────────────────────
    // Points to the original complaint this was flagged as a duplicate of
    duplicateOf: {
      type: Schema.Types.ObjectId,
      ref: "Complaint",
      default: null,
    },

    // ── Cascade risk (set by cascadeRisk.service.js) ──────────────────────────
    // True when a nearby water leakage complaint was verified
    cascadeRisk: {
      type: Boolean,
      default: false,
    },

    cascadeSource: {
      type: Schema.Types.ObjectId,
      ref: "Complaint",
      default: null, // the water complaint that triggered the flag
    },

    // ── Engagement ────────────────────────────────────────────────────────────
    upvotes: {
      type: Number,
      default: 0,
      min: 0,
    },

    upvotedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // ── Ownership ─────────────────────────────────────────────────────────────
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator reference is required"],
    },

    // Proof-of-resolution photo uploaded by field worker
    resolutionImageUrl: {
      type: String,
      default: null,
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

// ── Indexes ──────────────────────────────────────────────────────────────────
complaintSchema.index({ location: "2dsphere" });                  // geo queries — REQUIRED
complaintSchema.index({ wardId: 1, status: 1 });                  // officer war room queries
complaintSchema.index({ status: 1, severity: -1 });               // triage sort
complaintSchema.index({ createdBy: 1 });                          // citizen complaint history
complaintSchema.index({ cascadeRisk: 1, wardId: 1 });             // cascade alert queries
complaintSchema.index({ category: 1, wardId: 1, createdAt: -1 }); // SilentSignal seasonal aggregation
complaintSchema.index({ duplicateOf: 1 }, { sparse: true });

// ── Virtual: computed triage score ───────────────────────────────────────────
// Higher severity + more upvotes + older age = higher priority
complaintSchema.virtual("triageScore").get(function () {
  const ageDays = (Date.now() - this.createdAt) / 86_400_000;
  const sev = this.severity ?? 5;
  const votes = this.upvotes ?? 0;
  return sev * 10 + votes * 0.5 + Math.min(ageDays, 30);
});

// ── Hooks ────────────────────────────────────────────────────────────────────
// Record status change in history automatically
complaintSchema.pre("save", function (next) {
  if (this.isModified("status") && !this.isNew) {
    // changedBy must be set on the document before saving a status change
    // e.g. complaint.statusChangedBy = req.user._id
    this.statusHistory.push({
      status: this.status,
      changedBy: this.statusChangedBy ?? this.createdBy,
      changedAt: new Date(),
    });
  }
  if (this.status === COMPLAINT_STATUS.RESOLVED && !this.resolvedAt) {
    this.resolvedAt = new Date();
  }
  next();
});

const Complaint = model("Complaint", complaintSchema);

export default Complaint;