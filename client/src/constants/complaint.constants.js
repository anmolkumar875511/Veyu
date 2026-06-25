// src/constants/complaint.constants.js
// Mirrors the backend COMPLAINT_CATEGORIES array.
// Single source of truth on the frontend.

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

// Maps current assignment status → label of the NEXT action button
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

// ── PulseGrid stress bands ────────────────────────────────────────────────────
export const STRESS_BAND_META = {
    calm: { label: 'Calm', color: '#22c55e' },
    stable: { label: 'Stable', color: '#3b82f6' },
    rising: { label: 'Rising', color: '#f59e0b' },
    critical: { label: 'Critical', color: '#f97316' },
    emergency: { label: 'Emergency', color: '#ef4444' },
};

// ── SilentSignal forecast metadata ───────────────────────────────────────────
export const FORECAST_TRIGGER_META = {
    seasonal: { label: 'Seasonal Pattern', icon: '📅', color: '#a78bfa' },
    weather: { label: 'Weather Forecast', icon: '🌧️', color: '#3b82f6' },
    velocity: { label: 'Velocity Spike', icon: '📈', color: '#f59e0b' },
    combined: { label: 'Combined Signal', icon: '⚡', color: '#ef4444' },
};

export const FORECAST_STATUS_META = {
    active: { label: 'Active', color: '#f59e0b' },
    acknowledged: { label: 'Acknowledged', color: '#3b82f6' },
    confirmed: { label: 'Confirmed', color: '#22c55e' },
    expired: { label: 'Expired', color: '#64748b' },
};
