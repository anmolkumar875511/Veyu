import mongoose from "mongoose";

const { Schema, model } = mongoose;

// Stress bands used by PulseGrid choropleth renderer
// Derived from complaint velocity ratio (last 48h vs prev 48h)
export const STRESS_BANDS = {
  CALM: "calm",           // velocity < 0.8  — complaints declining
  STABLE: "stable",       // velocity 0.8–1.2 — normal
  RISING: "rising",       // velocity 1.2–2.0 — accelerating
  CRITICAL: "critical",   // velocity 2.0–4.0 — urgent
  EMERGENCY: "emergency", // velocity > 4.0   — crisis
};

const wardSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Ward name is required"],
      trim: true,
      unique: true,
    },

    wardNumber: {
      type: Number,
      required: [true, "Ward number is required"],
      unique: true,
      min: 1,
    },

    city: {
      type: String,
      required: true,
      trim: true,
    },

    // Officer responsible for this ward
    officerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // GeoJSON polygon boundary of the ward (used for map rendering)
    boundary: {
      type: {
        type: String,
        enum: ["Polygon"],
        default: "Polygon",
      },
      coordinates: {
        type: [[[Number]]],
        default: undefined,
      },
    },

    // ── PulseGrid fields ──────────────────────────────────────────────────────
    // Velocity = complaints_last_48h / complaints_prev_48h
    // Recomputed every hour by pulseGrid.service.js via node-cron
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

    complaintsLast48h: {
      type: Number,
      default: 0,
      min: 0,
    },

    complaintsPrev48h: {
      type: Number,
      default: 0,
      min: 0,
    },

    pulseLastUpdated: {
      type: Date,
      default: null,
    },

    // ── Health score (0–100) ─────────────────────────────────────────────────
    // Composite: resolution rate, avg close time, open backlog, citizen satisfaction
    // Recomputed nightly
    healthScore: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },

    // ── Analytics (recomputed nightly) ───────────────────────────────────────
    stats: {
      totalOpen: { type: Number, default: 0 },
      totalResolved: { type: Number, default: 0 },
      avgResolutionHours: { type: Number, default: 0 },
      resolutionRate: { type: Number, default: 0 }, // percentage 0–100
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

// ── Indexes ──────────────────────────────────────────────────────────────────
wardSchema.index({ wardNumber: 1 }, { unique: true });
wardSchema.index({ officerId: 1 });
wardSchema.index({ stressBand: 1 });
wardSchema.index({ healthScore: -1 });
wardSchema.index({ boundary: "2dsphere" }, { sparse: true });

// ── Instance Methods ─────────────────────────────────────────────────────────
wardSchema.methods.computeStressBand = function () {
  const v = this.pulseVelocity;
  if (v < 0.8) return STRESS_BANDS.CALM;
  if (v < 1.2) return STRESS_BANDS.STABLE;
  if (v < 2.0) return STRESS_BANDS.RISING;
  if (v < 4.0) return STRESS_BANDS.CRITICAL;
  return STRESS_BANDS.EMERGENCY;
};

const Ward = model("Ward", wardSchema);

export default Ward;