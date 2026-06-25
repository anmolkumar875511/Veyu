import Ward from '../models/ward.model.js';
import Complaint from '../models/complaint.model.js';
import { logger } from '../utils/logger.js';
import { PULSE_GRID } from '../constants/index.js';

const SCOPE = 'PulseGrid';
const WINDOW_MS = PULSE_GRID.WINDOW_HOURS * 60 * 60 * 1000;

export async function recomputeWardPulse(wardId) {
    const now = new Date();
    const last48hStart = new Date(now.getTime() - WINDOW_MS);
    const prev48hStart = new Date(now.getTime() - 2 * WINDOW_MS);

    const [complaintsLast48h, complaintsPrev48h] = await Promise.all([
        Complaint.countDocuments({ wardId, createdAt: { $gte: last48hStart, $lte: now } }),
        Complaint.countDocuments({ wardId, createdAt: { $gte: prev48hStart, $lt: last48hStart } }),
    ]);

    const pulseVelocity =
        complaintsPrev48h === 0
            ? complaintsLast48h === 0
                ? 1.0
                : complaintsLast48h
            : complaintsLast48h / complaintsPrev48h;

    const ward = await Ward.findById(wardId);
    if (!ward) return null;

    ward.complaintsLast48h = complaintsLast48h;
    ward.complaintsPrev48h = complaintsPrev48h;
    ward.pulseVelocity = Math.round(pulseVelocity * 100) / 100;
    ward.stressBand = ward.computeStressBand();
    ward.pulseLastUpdated = now;
    await ward.save();

    return ward.toObject();
}

export async function recomputeAllWards() {
    const wards = await Ward.find({ isActive: true }).select('_id');

    const results = [];
    for (const w of wards) {
        const updated = await recomputeWardPulse(w._id);
        if (updated) results.push(updated);
    }

    logger.info(SCOPE, `Recomputed velocity for ${results.length} ward(s)`);

    return { updated: results.length, wards: results };
}

export async function getPulseGridSnapshot() {
    return Ward.find({ isActive: true })
        .select('name wardNumber pulseVelocity stressBand complaintsLast48h healthScore')
        .sort({ wardNumber: 1 })
        .lean();
}
