import Complaint, { COMPLAINT_STATUS } from '../models/complaint.model.js';

const CASCADE_TRIGGER_CATEGORIES = ['Water Leakage', 'Sewage'];
const CASCADE_TARGET_CATEGORIES = ['Road Damage', 'Pothole', 'Drainage'];
const CASCADE_RADIUS_METRES = 200;

export async function evaluateCascadeRisk(verifiedComplaint) {
    if (!CASCADE_TRIGGER_CATEGORIES.includes(verifiedComplaint.category)) {
        return { flaggedCount: 0, flaggedIds: [] };
    }

    const [lng, lat] = verifiedComplaint.location.coordinates;

    const nearby = await Complaint.find({
        _id: { $ne: verifiedComplaint._id },
        category: { $in: CASCADE_TARGET_CATEGORIES },
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
                $maxDistance: CASCADE_RADIUS_METRES,
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
