// src/constants/complaint.constants.js
// ─────────────────────────────────────────────────────────────────────────────
// Single source of truth for complaint-related constants on the frontend.
// Mirrors backend model enums — keep in sync if backend categories change.
// ─────────────────────────────────────────────────────────────────────────────

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

// ── Flat label maps (used for display text only) ──────────────────────────────

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

// ── Rich status meta (label + badge color + bg tint + timeline step) ──────────
// Used by StatusBadge, StatusTimeline, and ComplaintRow across citizen pages.
// `step` drives the linear timeline: 1–5 = progress path, 0 = terminal.

export const STATUS_META = {
    submitted: { label: 'Submitted', color: '#94a3b8', bg: '#94a3b811', step: 1 },
    verified: { label: 'Verified', color: '#3b82f6', bg: '#3b82f611', step: 2 },
    assigned: { label: 'Assigned', color: '#a78bfa', bg: '#a78bfa11', step: 3 },
    in_progress: { label: 'In Progress', color: '#f59e0b', bg: '#f59e0b11', step: 4 },
    resolved: { label: 'Resolved', color: '#22c55e', bg: '#22c55e11', step: 5 },
    rejected: { label: 'Rejected', color: '#ef4444', bg: '#ef444411', step: 0 },
    duplicate: { label: 'Duplicate', color: '#64748b', bg: '#64748b11', step: 0 },
};

// ── Category icons (emoji per category) ──────────────────────────────────────

export const CATEGORY_ICONS = {
    'Road Damage': '🛣️',
    Pothole: '⚠️',
    Garbage: '🗑️',
    'Water Leakage': '💧',
    Drainage: '🌊',
    Streetlight: '💡',
    Sewage: '🔧',
    Encroachment: '🚧',
    'Illegal Dumping': '♻️',
    Other: '📋',
};

// ── Status filter tabs (for MyComplaints list) ────────────────────────────────

export const STATUS_TABS = [
    { value: '', label: 'All' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'rejected', label: 'Rejected' },
];

// ── Progress timeline step order ──────────────────────────────────────────────

export const TIMELINE_STEPS = ['submitted', 'verified', 'assigned', 'in_progress', 'resolved'];

// ── Statuses where a citizen is allowed to delete their complaint ──────────────

export const DELETABLE_STATUSES = ['submitted', 'duplicate'];

// ── Severity → color (for SeverityPip and severity dots) ─────────────────────

export const SEVERITY_COLOR = (severity) => {
    if (severity >= 7) return '#ef4444';
    if (severity >= 4) return '#f59e0b';
    return '#22c55e';
};
