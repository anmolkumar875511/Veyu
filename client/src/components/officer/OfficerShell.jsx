// src/components/officer/OfficerShell.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Shared primitives for all officer pages (WarRoom, ComplaintDetail,
// Reports, Forecasts). Styled with Tailwind utility classes.
// Public API (component names + props) preserved so page files stay stable.
// ─────────────────────────────────────────────────────────────────────────────

import { Link, NavLink as RouterNavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, Radio, Zap, ClipboardList, UserCircle, MapPinned, Users, UserPlus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { getStatusTheme } from '../../lib/roleTheme';
import { STATUS_META } from '../../constants/complaint.constants.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { ThemeToggle } from '../ui/ThemeToggle.jsx';
import { Sidebar } from '../layout/Sidebar.jsx';
import { SidebarToggle } from '../layout/SidebarToggle.jsx';
import { useSidebar } from '../layout/SidebarContext.jsx';
import { Footer } from '../layout/Footer.jsx';

// These routes (/war-room, /reports, /forecasts) are shared by both the
// 'officer' and 'admin' roles. Admins additionally get their own management
// pages, so the shell has to know which role is actually signed in rather
// than always presenting itself as "Officer".
const OFFICER_NAV = [
    { to: '/war-room', label: 'War Room', icon: Radio },
    { to: '/forecasts', label: 'SilentSignal', icon: Zap },
    { to: '/reports', label: 'Reports', icon: ClipboardList },
    { to: '/profile', label: 'Profile', icon: UserCircle },
];

const ADMIN_EXTRA_NAV = [
    { to: '/admin/wards', label: 'Wards', icon: MapPinned },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/staff', label: 'Add staff', icon: UserPlus },
];

// ── Page shell ────────────────────────────────────────────────────────────────
export function PageShell({ children }) {
    const { collapsed } = useSidebar();
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    // Insert admin-only management links after "War Room", before Reports/Profile,
    // so an admin viewing this shared shell sees their full toolset.
    const navItems = isAdmin
        ? [OFFICER_NAV[0], ...ADMIN_EXTRA_NAV, ...OFFICER_NAV.slice(1)]
        : OFFICER_NAV;
    return (
        <div className="min-h-screen bg-surface-50 dark:bg-slate-950 text-slate-900 dark:text-white">
            <Sidebar items={navItems} accent={isAdmin ? 'amber' : 'violet'} roleLabel={isAdmin ? 'Admin' : 'Officer'} />
            <div className={cn('flex min-h-screen flex-col transition-[padding] duration-200', collapsed ? 'lg:pl-[76px]' : 'lg:pl-64')}>
                {children}
                <Footer />
            </div>
        </div>
    );
}

// ── Full-screen loading / error state ─────────────────────────────────────────
export function FullscreenState({ children }) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface-50 dark:bg-slate-950 text-base text-slate-400 dark:text-slate-500">
            {children}
        </div>
    );
}

// ── Nav bar ───────────────────────────────────────────────────────────────────
export function NavBar({ left, right }) {
    return (
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/80 backdrop-blur-md px-4 sm:px-6">
            <div className="flex items-center gap-2">
                <SidebarToggle />
                {left}
            </div>
            <div className="flex items-center gap-3 sm:gap-5">
                {right}
                <ThemeToggle />
            </div>
        </header>
    );
}

// ── Page title (nav-bar left slot) ────────────────────────────────────────────
// The brand mark already lives at the top of the sidebar, so the nav bar only
// needs the current section's name — showing the logo again here duplicated
// it right below itself.
export function NavBrand({ name, sub }) {
    return <span className="text-sm font-semibold text-slate-900 dark:text-white">{sub ?? name ?? 'War Room'}</span>;
}

// ── Nav link ──────────────────────────────────────────────────────────────────
export function NavLink({ to, children }) {
    return (
        <RouterNavLink
            to={to}
            className={({ isActive }) =>
                cn(
                    'relative text-sm font-medium transition-colors',
                    isActive
                        ? 'text-slate-900 dark:text-white'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                )
            }
        >
            {({ isActive }) => (
                <span className="relative inline-flex flex-col items-center">
                    {children}
                    {isActive && (
                        <motion.span
                            layoutId="officer-nav-underline"
                            className="absolute -bottom-2 h-0.5 w-full rounded-full bg-violet-600 dark:bg-violet-400"
                            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                        />
                    )}
                </span>
            )}
        </RouterNavLink>
    );
}

// ── Back link ─────────────────────────────────────────────────────────────────
export function BackLink({ to, children }) {
    return (
        <Link to={to} className="text-sm text-slate-500 dark:text-slate-400 transition-colors hover:text-slate-800 dark:hover:text-slate-200">
            {children}
        </Link>
    );
}

// ── Nav user name ─────────────────────────────────────────────────────────────
export function NavUser({ name }) {
    return <span className="hidden text-xs text-slate-400 dark:text-slate-500 sm:inline">{name}</span>;
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

// ── Nav title (center label) ──────────────────────────────────────────────────
export function NavTitle({ children }) {
    return <span className="text-sm font-semibold text-slate-900 dark:text-white">{children}</span>;
}

// ── Status badge ──────────────────────────────────────────────────────────────
export function StatusBadge({ status }) {
    const theme = getStatusTheme(status);
    const label = STATUS_META[status]?.label ?? status;
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold',
                theme.text,
                theme.bg,
                theme.border
            )}
        >
            <span className={cn('size-1.5 rounded-full', theme.dot)} />
            {label}
        </span>
    );
}

// ── Severity bar + label ──────────────────────────────────────────────────────
export function SeverityBar({ severity }) {
    if (!severity) return <span className="text-sm text-slate-300 dark:text-slate-600">—</span>;
    const tone = severity >= 7 ? 'bg-rose-500' : severity >= 4 ? 'bg-amber-500' : 'bg-emerald-500';
    const textTone = severity >= 7 ? 'text-rose-600' : severity >= 4 ? 'text-amber-600' : 'text-emerald-600';
    return (
        <div className="flex min-w-[90px] items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div className={cn('h-full rounded-full', tone)} style={{ width: `${severity * 10}%` }} />
            </div>
            <span className={cn('min-w-[1rem] text-xs font-bold', textTone)}>{severity}</span>
        </div>
    );
}

// ── Section label (CAPS metadata label) ──────────────────────────────────────
export function SectionLabel({ children }) {
    return <span className="text-[0.68rem] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{children}</span>;
}

// ── Error banner ──────────────────────────────────────────────────────────────
export function ErrorBanner({ message, onRetry }) {
    if (!message) return null;
    return (
        <div
            role="alert"
            className="flex items-center justify-between gap-3 rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300"
        >
            <span>{message}</span>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="shrink-0 whitespace-nowrap rounded-md border border-rose-200 dark:border-rose-900/50 px-2.5 py-1 text-xs text-rose-700 dark:text-rose-300 transition-colors hover:bg-rose-100 dark:hover:bg-rose-500/10"
                >
                    Retry
                </button>
            )}
        </div>
    );
}

// ── Skeleton rows ─────────────────────────────────────────────────────────────
export function SkeletonRows({ count = 5, height = '52px' }) {
    return (
        <div className="flex flex-col gap-2">
            {Array.from({ length: count }, (_, i) => (
                <div key={i} style={{ height }} className="animate-pulse rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800" />
            ))}
        </div>
    );
}

// ── Skeleton grid ─────────────────────────────────────────────────────────────
export function SkeletonGrid({ count = 3, height = '220px', minColWidth = '280px' }) {
    return (
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${minColWidth}, 1fr))` }}>
            {Array.from({ length: count }, (_, i) => (
                <div key={i} style={{ height }} className="animate-pulse rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800" />
            ))}
        </div>
    );
}

// ── Empty state ───────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, heading, sub }) {
    return (
        <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
            {Icon && (
                <div className="flex size-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                    <Icon className="size-6 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                </div>
            )}
            <p className="text-base font-semibold text-slate-600 dark:text-slate-300">{heading}</p>
            {sub && <p className="max-w-sm text-sm leading-relaxed text-slate-400 dark:text-slate-500">{sub}</p>}
        </div>
    );
}

// ── Filter tabs (shared by WarRoom and MyComplaints) ──────────────────────────
export function FilterTabs({ tabs, active, onChange }) {
    return (
        <div className="mb-5 flex overflow-x-auto border-b border-slate-200 dark:border-slate-800">
            {tabs.map((t) => (
                <button
                    key={t.value}
                    onClick={() => onChange(t.value)}
                    className={cn(
                        'whitespace-nowrap border-b-2 px-3 py-3 text-xs font-medium transition-colors',
                        active === t.value
                            ? 'border-primary-600 text-slate-900 dark:text-white'
                            : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                    )}
                >
                    {t.label}
                </button>
            ))}
        </div>
    );
}

// ── Pagination ────────────────────────────────────────────────────────────────
export function Pagination({ page, totalPages, onPrev, onNext }) {
    if (totalPages <= 1) return null;
    return (
        <div className="mt-5 flex items-center justify-center gap-5">
            <PageBtn onClick={onPrev} disabled={page <= 1}>
                Prev
            </PageBtn>
            <span className="text-sm text-slate-400 dark:text-slate-500">
                {page} / {totalPages}
            </span>
            <PageBtn onClick={onNext} disabled={page >= totalPages}>
                Next
            </PageBtn>
        </div>
    );
}

function PageBtn({ onClick, disabled, children }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-1.5 text-sm text-slate-600 dark:text-slate-300 transition-colors disabled:cursor-not-allowed disabled:opacity-40 enabled:hover:bg-slate-50 dark:hover:bg-slate-800"
        >
            {children}
        </button>
    );
}

// ── Surface card ──────────────────────────────────────────────────────────────
export function Card({ children, className, style, padding }) {
    return (
        <div
            style={{ padding, ...style }}
            className={cn('rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-[var(--shadow-card)]', padding && 'p-0', className)}
        >
            {children}
        </div>
    );
}

// ── Meta grid (label + value pairs) ──────────────────────────────────────────
const META_GRID_COLS = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-4',
};

export function MetaGrid({ items, columns = 3 }) {
    return (
        <div className={cn('grid gap-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4', META_GRID_COLS[columns] ?? META_GRID_COLS[3])}>
            {items.map(({ label, value }) => (
                <div key={label} className="flex flex-col gap-0.5">
                    <span className="text-[0.65rem] uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</span>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{value ?? '—'}</span>
                </div>
            ))}
        </div>
    );
}

// ── Shared form inputs (for action panels) ────────────────────────────────────
export function Textarea({ placeholder, value, onChange, rows = 3 }) {
    return (
        <textarea
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            rows={rows}
            className="w-full resize-y rounded-lg border border-slate-200 dark:border-slate-800 bg-surface-50 dark:bg-slate-950 px-3 py-2.5 text-sm text-slate-900 dark:text-white outline-none transition-colors focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
        />
    );
}

export function Select({ value, onChange, children }) {
    return (
        <select
            value={value}
            onChange={onChange}
            className="w-full cursor-pointer rounded-lg border border-slate-200 dark:border-slate-800 bg-surface-50 dark:bg-slate-950 px-3 py-2.5 text-sm text-slate-900 dark:text-white outline-none transition-colors focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
        >
            {children}
        </select>
    );
}

// ── Action buttons ─────────────────────────────────────────────────────────────
export function BtnPrimary({ onClick, disabled, loading, loadingText, children }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled || loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-primary-300"
        >
            {loading && <Loader2 className="size-4 animate-spin" />}
            {loading ? (loadingText ?? 'Loading…') : children}
        </button>
    );
}

export function BtnDanger({ onClick, children }) {
    return (
        <button
            onClick={onClick}
            className="w-full rounded-lg border border-rose-200 dark:border-rose-900/50 py-2.5 text-sm font-semibold text-rose-600 dark:text-rose-400 transition-colors hover:bg-rose-50 dark:hover:bg-rose-500/10"
        >
            {children}
        </button>
    );
}

export function BtnDangerSolid({ onClick, disabled, loading, children }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled || loading}
            className="w-full rounded-lg bg-rose-600 py-2.5 text-sm font-bold text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-65"
        >
            {loading ? 'Loading…' : children}
        </button>
    );
}

export function BtnGhost({ onClick, children }) {
    return (
        <button
            onClick={onClick}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-800 py-2 text-sm text-slate-500 dark:text-slate-400 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
        >
            {children}
        </button>
    );
}
