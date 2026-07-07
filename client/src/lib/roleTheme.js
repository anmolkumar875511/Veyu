// src/lib/roleTheme.js
// Static Tailwind class maps per role. Kept static (no string interpolation)
// so Tailwind's compiler can see and generate every class used.

export const ROLE_THEME = {
    admin: {
        label: 'Admin',
        text: 'text-amber-600',
        textDark: 'dark:text-amber-400',
        bg: 'bg-amber-50',
        bgSolid: 'bg-amber-500',
        border: 'border-amber-200',
        ring: 'ring-amber-500',
        dot: 'bg-amber-500',
        gradient: 'from-amber-500 to-orange-500',
    },
    officer: {
        label: 'Officer',
        text: 'text-violet-600',
        textDark: 'dark:text-violet-400',
        bg: 'bg-violet-50',
        bgSolid: 'bg-violet-500',
        border: 'border-violet-200',
        ring: 'ring-violet-500',
        dot: 'bg-violet-500',
        gradient: 'from-violet-500 to-indigo-500',
    },
    worker: {
        label: 'Worker',
        text: 'text-emerald-600',
        textDark: 'dark:text-emerald-400',
        bg: 'bg-emerald-50',
        bgSolid: 'bg-emerald-500',
        border: 'border-emerald-200',
        ring: 'ring-emerald-500',
        dot: 'bg-emerald-500',
        gradient: 'from-emerald-500 to-teal-500',
    },
    citizen: {
        label: 'Citizen',
        text: 'text-primary-600',
        textDark: 'dark:text-primary-400',
        bg: 'bg-primary-50',
        bgSolid: 'bg-primary-600',
        border: 'border-primary-200',
        ring: 'ring-primary-500',
        dot: 'bg-primary-500',
        gradient: 'from-primary-600 to-indigo-500',
    },
};

export function getRoleTheme(role) {
    return ROLE_THEME[role?.toLowerCase()] ?? ROLE_THEME.citizen;
}

// Status → semantic color mapping (complaint/task statuses across the app)
export const STATUS_THEME = {
    pending: { text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500' },
    open: { text: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-200', dot: 'bg-sky-500' },
    'in-progress': { text: 'text-primary-700', bg: 'bg-primary-50', border: 'border-primary-200', dot: 'bg-primary-500' },
    in_progress: { text: 'text-primary-700', bg: 'bg-primary-50', border: 'border-primary-200', dot: 'bg-primary-500' },
    assigned: { text: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200', dot: 'bg-violet-500' },
    resolved: { text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500' },
    closed: { text: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200', dot: 'bg-slate-400' },
    rejected: { text: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', dot: 'bg-rose-500' },
    escalated: { text: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', dot: 'bg-rose-500' },
    submitted: { text: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200', dot: 'bg-slate-400' },
    verified: { text: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-200', dot: 'bg-sky-500' },
    duplicate: { text: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200', dot: 'bg-slate-400' },
    acknowledged: { text: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-200', dot: 'bg-sky-500' },
    en_route: { text: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200', dot: 'bg-violet-500' },
    on_site: { text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500' },
    completed: { text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500' },
    reassigned: { text: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200', dot: 'bg-slate-400' },
    dismissed: { text: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200', dot: 'bg-slate-400' },
    flagged: { text: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', dot: 'bg-rose-500' },
    active: { text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500' },
    confirmed: { text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500' },
    expired: { text: 'text-slate-500', bg: 'bg-slate-100', border: 'border-slate-200', dot: 'bg-slate-400' },
    emergency: { text: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', dot: 'bg-rose-500' },
    critical: { text: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', dot: 'bg-rose-500' },
    rising: { text: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', dot: 'bg-orange-500' },
    stable: { text: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-200', dot: 'bg-sky-500' },
    calm: { text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500' },
};

export function getStatusTheme(status) {
    const key = status?.toLowerCase().replace(/\s+/g, '-');
    return STATUS_THEME[key] ?? STATUS_THEME.pending;
}
