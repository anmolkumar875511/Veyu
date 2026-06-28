// src/constants/complaint.constants.js
// ─────────────────────────────────────────────────────────────────────────────
// Single source of truth for complaint-related constants on the frontend.
// Mirrors complaint.model.js enums — keep in sync if backend categories change.
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

export const STATUS_META = {
    submitted: { label: 'Submitted', color: '#94a3b8', bg: '#94a3b811', step: 1 },
    verified: { label: 'Verified', color: '#3b82f6', bg: '#3b82f611', step: 2 },
    assigned: { label: 'Assigned', color: '#a78bfa', bg: '#a78bfa11', step: 3 },
    in_progress: { label: 'In Progress', color: '#f59e0b', bg: '#f59e0b11', step: 4 },
    resolved: { label: 'Resolved', color: '#22c55e', bg: '#22c55e11', step: 5 },
    rejected: { label: 'Rejected', color: '#ef4444', bg: '#ef444411', step: 0 },
    duplicate: { label: 'Duplicate', color: '#64748b', bg: '#64748b11', step: 0 },
};

export const STATUS_TABS = [
    { value: '', label: 'All' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'rejected', label: 'Rejected' },
];

export const TIMELINE_STEPS = ['submitted', 'verified', 'assigned', 'in_progress', 'resolved'];

export const DELETABLE_STATUSES = ['submitted', 'duplicate'];

export const SEVERITY_COLOR = (severity) => {
    if (severity >= 7) return '#ef4444';
    if (severity >= 4) return '#f59e0b';
    return '#22c55e';
};
