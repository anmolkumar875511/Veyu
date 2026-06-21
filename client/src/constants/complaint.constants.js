export const COMPLAINT_CATEGORIES = [
    'Road Damage',
    'Pothole',
    'Garbage',
    'Water Leakage',
    'Drainage',
    'Streetlight',
    'Sewage',
    'Encroachment',
    'Illegal Dumping',
    'Other',
];

export const COMPLAINT_STATUS_LABELS = {
    submitted: 'Submitted',
    verified: 'Verified',
    assigned: 'Assigned',
    in_progress: 'In Progress',
    resolved: 'Resolved',
    rejected: 'Rejected',
    duplicate: 'Duplicate',
};

export const ASSIGNMENT_STATUS_LABELS = {
    pending: 'Pending',
    acknowledged: 'Acknowledged',
    en_route: 'En Route',
    on_site: 'On Site',
    completed: 'Completed',
    reassigned: 'Reassigned',
};

export const ASSIGNMENT_NEXT_ACTION = {
    pending: 'Acknowledge task',
    acknowledged: 'Start heading there',
    en_route: 'Mark arrived',
    on_site: 'Complete task',
};

export const OBSERVATION_STATUS_LABELS = {
    pending: 'Pending AI Review',
    ai_reviewed: 'AI Reviewed',
    elevated: 'Elevated',
    dismissed: 'Dismissed',
    flagged: 'Needs Review',
};
