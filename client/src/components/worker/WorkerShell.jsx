// src/components/worker/WorkerShell.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Shared primitives for field worker pages (Tasks, TaskDetail, Observations).
// Styled with Tailwind utility classes. Public API preserved.
// ─────────────────────────────────────────────────────────────────────────────

import { Link } from 'react-router-dom';
import { Camera, ClipboardList, Crosshair, Loader2, Star, TriangleAlert, UserCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { OBSERVATION_STATUS_LABELS } from '../../constants/complaint.constants.js';
import { ThemeToggle } from '../ui/ThemeToggle.jsx';
import { Sidebar } from '../layout/Sidebar.jsx';
import { SidebarToggle } from '../layout/SidebarToggle.jsx';
import { useSidebar } from '../layout/SidebarContext.jsx';
import { Footer } from '../layout/Footer.jsx';

const WORKER_NAV = [
    { to: '/tasks', label: 'Tasks', icon: ClipboardList },
    { to: '/observations', label: 'Observations', icon: Camera },
    { to: '/profile', label: 'Profile', icon: UserCircle },
];

// ── Page shell ────────────────────────────────────────────────────────────────
export function PageShell({ children }) {
    const { collapsed } = useSidebar();
    return (
        <div className="min-h-screen bg-surface-50 dark:bg-slate-950 text-slate-900 dark:text-white">
            <Sidebar items={WORKER_NAV} accent="emerald" roleLabel="Field Worker" />
            <div className={cn('flex min-h-screen flex-col transition-[padding] duration-200', collapsed ? 'lg:pl-[76px]' : 'lg:pl-64')}>
                {children}
                <Footer />
            </div>
        </div>
    );
}

// ── Fullscreen state (loading / error / success) ───────────────────────────────
export function FullscreenState({ children }) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface-50 dark:bg-slate-950 text-base text-slate-400 dark:text-slate-500">
            {children}
        </div>
    );
}

// ── Nav bar ───────────────────────────────────────────────────────────────────
export function NavBar({ left, center, right }) {
    return (
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/80 backdrop-blur-md px-4 sm:px-6">
            <div className="flex flex-1 items-center gap-2">
                <SidebarToggle />
                {left}
            </div>
            <div className="hidden flex-1 items-center justify-center sm:flex">{center}</div>
            <div className="flex flex-1 items-center justify-end gap-3 sm:gap-4">
                {right}
                <ThemeToggle />
            </div>
        </header>
    );
}

// ── Page title (nav-bar left slot) ───────────────────────────────────────────
// Sidebar already carries the brand mark, so this is just the section title.
export function NavBrand({ sub }) {
    return <span className="text-sm font-semibold text-slate-900 dark:text-white">{sub ?? 'Tasks'}</span>;
}

// ── Nav back link ─────────────────────────────────────────────────────────────
export function BackLink({ to, children }) {
    return (
        <Link to={to} className="text-sm text-slate-500 dark:text-slate-400 transition-colors hover:text-slate-800 dark:hover:text-slate-200">
            {children}
        </Link>
    );
}

// ── Nav accent link ───────────────────────────────────────────────────────────
export function NavAccentLink({ to, children }) {
    return (
        <Link to={to} className="text-sm font-semibold text-violet-600 transition-colors hover:text-violet-700">
            {children}
        </Link>
    );
}

// ── Nav title (center) ────────────────────────────────────────────────────────
export function NavTitle({ children }) {
    return <span className="text-sm font-semibold text-slate-900 dark:text-white">{children}</span>;
}

// ── Nav sign-out button ───────────────────────────────────────────────────────
export function NavLogout({ onClick }) {
    return (
        <button
            onClick={onClick}
            className="rounded-md border border-slate-200 dark:border-slate-800 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
        >
            Sign out
        </button>
    );
}

// ── Assignment status badge ────────────────────────────────────────────────────
const ASSIGNMENT_STATUS_TONE = {
    pending: 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800',
    acknowledged: 'text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-500/10',
    en_route: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10',
    on_site: 'text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-500/10',
    completed: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10',
    reassigned: 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800',
};

export function AssignmentBadge({ status, label }) {
    const tone = ASSIGNMENT_STATUS_TONE[status] ?? ASSIGNMENT_STATUS_TONE.pending;
    return (
        <span className={cn('whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold', tone)}>{label}</span>
    );
}

// ── Observation status badge ──────────────────────────────────────────────────
const OBSERVATION_STATUS_TONE = {
    pending: 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800',
    ai_reviewed: 'text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-500/10',
    elevated: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10',
    dismissed: 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800',
    flagged: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10',
};

export function ObservationBadge({ status }) {
    const tone = OBSERVATION_STATUS_TONE[status] ?? OBSERVATION_STATUS_TONE.pending;
    return <span className={cn('rounded-full px-2 py-0.5 text-[0.65rem] font-semibold', tone)}>{OBSERVATION_STATUS_LABELS[status]}</span>;
}

// ── Severity tag ──────────────────────────────────────────────────────────────
export function SeverityTag({ severity }) {
    if (!severity) return null;
    const tone = severity >= 7 ? 'bg-rose-500' : severity >= 4 ? 'bg-amber-500' : 'bg-emerald-500';
    return (
        <span className={cn('whitespace-nowrap rounded-full px-1.5 py-0.5 text-[0.62rem] font-bold text-white', tone)}>
            {severity}/10
        </span>
    );
}

// ── Error banner ──────────────────────────────────────────────────────────────
export function ErrorBanner({ message }) {
    if (!message) return null;
    return (
        <div role="alert" className="rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
            {message}
        </div>
    );
}

// ── Skeleton rows ─────────────────────────────────────────────────────────────
export function SkeletonRows({ count = 3, height = '76px' }) {
    return (
        <div className="flex flex-col gap-2">
            {Array.from({ length: count }, (_, i) => (
                <div key={i} style={{ height }} className="animate-pulse rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800" />
            ))}
        </div>
    );
}

// ── Empty state ───────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, heading, sub, cta, ctaTo }) {
    return (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-12 text-center">
            {Icon && (
                <div className="flex size-11 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                    <Icon className="size-5 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                </div>
            )}
            <p className="text-base text-slate-500 dark:text-slate-400">{heading}</p>
            {sub && <p className="max-w-xs text-sm leading-relaxed text-slate-400 dark:text-slate-500">{sub}</p>}
            {cta && ctaTo && (
                <Link to={ctaTo} className="text-sm text-primary-600 hover:text-primary-700">
                    {cta}
                </Link>
            )}
        </div>
    );
}

// ── Surface card ──────────────────────────────────────────────────────────────
export function Card({ children, className, style }) {
    return (
        <div style={style} className={cn('rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-[var(--shadow-card)]', className)}>
            {children}
        </div>
    );
}

// ── Section label ─────────────────────────────────────────────────────────────
export function SectionLabel({ children }) {
    return <span className="text-[0.68rem] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{children}</span>;
}

// ── Instructions box ──────────────────────────────────────────────────────────
export function InstructionsBox({ text }) {
    if (!text) return null;
    return (
        <div className="rounded-lg border border-violet-200 bg-violet-50 p-4">
            <span className="mb-2 block text-[0.68rem] font-bold uppercase tracking-wide text-violet-600">
                Officer instructions
            </span>
            <p className="text-sm leading-relaxed text-violet-800">{text}</p>
        </div>
    );
}

// ── Image picker (tap-to-upload zone) ─────────────────────────────────────────
export function ImagePicker({ preview, onClick, minHeight = '160px' }) {
    return (
        <div
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onClick()}
            style={{ minHeight }}
            className={cn(
                'flex cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800',
                !preview && 'bg-surface-50 dark:bg-slate-950'
            )}
        >
            {preview ? (
                <img src={preview} alt="Preview" className="block h-52 w-full object-cover" />
            ) : (
                <div className="flex flex-col items-center gap-2 p-6">
                    <Camera className="size-8 text-slate-300 dark:text-slate-600" aria-hidden="true" />
                    <span className="text-sm text-slate-500 dark:text-slate-400">Tap to add photo</span>
                </div>
            )}
        </div>
    );
}

// ── GPS button ────────────────────────────────────────────────────────────────
export function GpsButton({ status, onClick }) {
    const labels = {
        idle: 'Capture location',
        loading: 'Getting location…',
        ok: 'Location captured — tap to refresh',
        error: 'GPS failed — retry',
    };
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={status === 'loading'}
            className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-left text-sm text-slate-600 dark:text-slate-300 transition-colors hover:bg-surface-50 dark:hover:bg-slate-800 disabled:opacity-60"
        >
            {status === 'error' ? (
                <TriangleAlert className="size-4 shrink-0 text-amber-500" />
            ) : (
                <Crosshair className={cn('size-4 shrink-0 text-primary-600', status === 'loading' && 'animate-spin')} />
            )}
            {labels[status] ?? labels.idle}
        </button>
    );
}

// ── Shared form inputs ────────────────────────────────────────────────────────
export function Textarea({ value, onChange, placeholder, rows = 3, id }) {
    return (
        <textarea
            id={id}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            rows={rows}
            className="w-full resize-y rounded-lg border border-slate-200 dark:border-slate-800 bg-surface-50 dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none transition-colors focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
        />
    );
}

export function Input({ value, onChange, placeholder, type = 'text', id }) {
    return (
        <input
            id={id}
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-surface-50 dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none transition-colors focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
        />
    );
}

// ── Primary button ────────────────────────────────────────────────────────────
export function PrimaryButton({ onClick, disabled, loading, loadingText, children, type = 'button' }) {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-primary-300"
        >
            {loading && <Loader2 className="size-4 animate-spin" />}
            {loading ? (loadingText ?? 'Loading…') : children}
        </button>
    );
}

// ── Success card ──────────────────────────────────────────────────────────────
export function SuccessCard({ icon: Icon, heading, sub, children }) {
    return (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-10 text-center">
            {Icon && (
                <div className="flex size-14 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/10">
                    <Icon className="size-7 text-emerald-500" aria-hidden="true" />
                </div>
            )}
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">{heading}</h2>
            {sub && <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">{sub}</p>}
            {children}
        </div>
    );
}

// ── AI result box ─────────────────────────────────────────────────────────────
export function AIResultBox({ category, severity, confidence }) {
    return (
        <div className="flex w-full flex-col gap-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-surface-50 dark:bg-slate-950 px-5 py-3">
            <span className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">AI classified as</span>
            <span className="text-base font-bold text-primary-600">{category}</span>
            <span className="text-sm text-slate-500 dark:text-slate-400">
                Severity: <strong className="text-slate-700 dark:text-slate-200">{severity}/10</strong>
                {confidence != null && ` · Confidence: ${Math.round(confidence * 100)}%`}
            </span>
        </div>
    );
}

// ── Field points earned badge ─────────────────────────────────────────────────
export function PointsBadge({ points }) {
    return (
        <span className="flex items-center gap-1 text-sm font-bold text-amber-500">
            <Star className="size-4 fill-amber-500" /> +{points} field points
        </span>
    );
}
