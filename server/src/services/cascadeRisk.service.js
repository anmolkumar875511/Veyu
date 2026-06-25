import Complaint, { COMPLAINT_STATUS } from '../models/complaint.model.js';
import { CASCADE_RISK } from '../constants/index.js';

const { TRIGGER_CATEGORIES, TARGET_CATEGORIES, RADIUS_METRES } = CASCADE_RISK;

export async function evaluateCascadeRisk(verifiedComplaint) {
    if (!TRIGGER_CATEGORIES.includes(verifiedComplaint.category)) {
        return { flaggedCount: 0, flaggedIds: [] };
    }

    const [lng, lat] = verifiedComplaint.location.coordinates;

    const nearby = await Complaint.find({
        _id: { $ne: verifiedComplaint._id },
        category: { $in: TARGET_CATEGORIES },
        status: {
            $nin: [
                COMPLAINT_STATUS.RESOLVED,
                COMPLAINT_STATUS.REJECTED,
                COMPLAINT_STATUS.DUPLICATE,
            ],
        },
        location: {
            $nearSphere: {
                $geometry: { type: 'Point', coordinates: [lng, lat] },
                $maxDistance: RADIUS_METRES,
            },
        },
    }).select('_id');

    if (nearby.length === 0) return { flaggedCount: 0, flaggedIds: [] };

    const ids = nearby.map((c) => c._id);

    await Complaint.updateMany(
        { _id: { $in: ids } },
        { $set: { cascadeRisk: true, cascadeSource: verifiedComplaint._id } }
    );

    return { flaggedCount: ids.length, flaggedIds: ids.map(String) };
}

export async function clearCascadeFlag(complaintId) {
    await Complaint.updateOne(
        { _id: complaintId },
        { $set: { cascadeRisk: false, cascadeSource: null } }
    );
}
