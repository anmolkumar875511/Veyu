// src/components/admin/AdminShell.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Shared primitives for WardManagement, UserManagement, and NerveMap.
// Styled with Tailwind utility classes. Public API preserved.
// ─────────────────────────────────────────────────────────────────────────────

import { Link, NavLink as RouterNavLink } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, X, Radio, MapPinned, Users, UserPlus, Zap, ClipboardList, UserCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { STRESS_BAND_META } from '../../constants/complaint.constants.js';
import { Logo } from '../ui/Logo.jsx';
import { ThemeToggle } from '../ui/ThemeToggle.jsx';
import { Sidebar } from '../layout/Sidebar.jsx';
import { SidebarToggle } from '../layout/SidebarToggle.jsx';
import { useSidebar } from '../layout/SidebarContext.jsx';
import { Footer } from '../layout/Footer.jsx';

// Mirrors OfficerShell's admin-aware nav so the toolset looks identical no
// matter which shared route (/war-room, /reports, /forecasts) or admin-only
// route (/admin/*) the admin happens to be on.
const ADMIN_NAV = [
    { to: '/war-room', label: 'War Room', icon: Radio },
    { to: '/admin/wards', label: 'Wards', icon: MapPinned },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/staff', label: 'Add staff', icon: UserPlus },
    { to: '/forecasts', label: 'SilentSignal', icon: Zap },
    { to: '/reports', label: 'Reports', icon: ClipboardList },
    { to: '/profile', label: 'Profile', icon: UserCircle },
];

// ── Page shell ────────────────────────────────────────────────────────────────
// `sidebar` opts in to the admin nav rail — WardManagement/UserManagement pass
// it, while the public NerveMap page (which also uses this shell) omits it so
// anonymous visitors don't see admin-only navigation or a sign-out control.
export function PageShell({ children, sidebar = false }) {
    const { collapsed } = useSidebar();
    if (!sidebar) {
        return (
            <div className="flex min-h-screen flex-col bg-surface-50 dark:bg-slate-950 text-slate-900 dark:text-white">
                {children}
                <Footer />
            </div>
        );
    }
    return (
        <div className="min-h-screen bg-surface-50 dark:bg-slate-950 text-slate-900 dark:text-white">
            <Sidebar items={ADMIN_NAV} accent="amber" roleLabel="Admin" />
            <div className={cn('flex min-h-screen flex-col transition-[padding] duration-200', collapsed ? 'lg:pl-[76px]' : 'lg:pl-64')}>
                {children}
                <Footer />
            </div>
        </div>
    );
}

// ── Nav bar ───────────────────────────────────────────────────────────────────
export function NavBar({ left, right, withToggle = false }) {
    return (
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/80 backdrop-blur-md px-4 sm:px-6">
            <div className="flex items-center gap-2">
                {withToggle && <SidebarToggle />}
                {left}
            </div>
            <div className="flex items-center gap-3 sm:gap-5">
                {right}
                <ThemeToggle />
            </div>
        </header>
    );
}

// ── Brand mark ────────────────────────────────────────────────────────────────
// Only used by the public NerveMap page, which has no sidebar — everywhere
// else in the admin shell, use NavPageTitle so the mark isn't shown twice.
export function NavBrand({ sub }) {
    return <Logo to="/admin/wards" withText size="sm" sub={sub} />;
}

// ── Page title (nav-bar left slot for sidebar pages) ─────────────────────────
export function NavPageTitle({ children }) {
    return <span className="text-sm font-semibold text-slate-900 dark:text-white">{children}</span>;
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
                            layoutId="admin-nav-underline"
                            className="absolute -bottom-2 h-0.5 w-full rounded-full bg-amber-500 dark:bg-amber-400"
                            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                        />
                    )}
                </span>
            )}
        </RouterNavLink>
    );
}

// ── Nav CTA link (filled button style) ───────────────────────────────────────
export function NavCta({ to, children }) {
    return (
        <Link
            to={to}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-700"
        >
            {children}
        </Link>
    );
}

// ── Nav user text ─────────────────────────────────────────────────────────────
export function NavUser({ name }) {
    return <span className="hidden text-xs text-slate-400 dark:text-slate-500 sm:inline">{name}</span>;
}

// ── Nav logout button ─────────────────────────────────────────────────────────
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

// ── Error banner ──────────────────────────────────────────────────────────────
export function ErrorBanner({ message }) {
    if (!message) return null;
    return (
        <div role="alert" className="rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
            {message}
        </div>
    );
}

// ── Success message ───────────────────────────────────────────────────────────
export function SuccessMsg({ message }) {
    if (!message) return null;
    return <span className="text-sm text-emerald-600">{message}</span>;
}

// ── Skeleton rows ─────────────────────────────────────────────────────────────
export function SkeletonRows({ count = 3, height = '70px' }) {
    return (
        <div className="flex flex-col gap-2">
            {Array.from({ length: count }, (_, i) => (
                <div key={i} style={{ height }} className="animate-pulse rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800" />
            ))}
        </div>
    );
}

// ── Skeleton grid ─────────────────────────────────────────────────────────────
export function SkeletonGrid({ count = 6, height = '150px', minCol = '220px' }) {
    return (
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${minCol}, 1fr))` }}>
            {Array.from({ length: count }, (_, i) => (
                <div key={i} style={{ height }} className="animate-pulse rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800" />
            ))}
        </div>
    );
}

// ── Stress band badge ─────────────────────────────────────────────────────────
const STRESS_TONE = {
    calm: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10',
    stable: 'text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-500/10',
    rising: 'text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-500/10',
    critical: 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-500/10',
    emergency: 'text-white bg-rose-600',
};

export function StressBand({ band }) {
    const meta = STRESS_BAND_META[band] ?? STRESS_BAND_META.stable;
    const tone = STRESS_TONE[band] ?? STRESS_TONE.stable;
    return <span className={cn('rounded-full px-2.5 py-1 text-[0.65rem] font-bold', tone)}>{meta.label}</span>;
}

// ── Form input ────────────────────────────────────────────────────────────────
export function Input({ value, onChange, placeholder, type = 'text', required, className, ...rest }) {
    return (
        <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            className={cn(
                'min-w-[140px] flex-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-surface-50 dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none transition-colors focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10',
                className
            )}
            {...rest}
        />
    );
}

// ── Primary button ────────────────────────────────────────────────────────────
export function BtnPrimary({ onClick, disabled, loading, loadingText, children, type = 'button', size = 'md' }) {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={cn(
                'inline-flex w-auto items-center justify-center gap-2 rounded-lg bg-primary-600 font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-primary-300',
                size === 'sm' ? 'px-3.5 py-1.5 text-xs' : 'px-4 py-2.5 text-sm'
            )}
        >
            {loading && <Loader2 className="size-3.5 animate-spin" />}
            {loading ? (loadingText ?? 'Loading…') : children}
        </button>
    );
}

// ── Ghost button ──────────────────────────────────────────────────────────────
export function BtnGhost({ onClick, children, size = 'md' }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-600 dark:text-slate-300 transition-colors hover:bg-surface-50 dark:hover:bg-slate-800',
                size === 'sm' ? 'px-3.5 py-1.5' : 'px-4 py-2'
            )}
        >
            {children}
        </button>
    );
}

// ── Tool button (secondary action) ────────────────────────────────────────────
export function ToolBtn({ onClick, disabled, children }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs text-slate-600 dark:text-slate-300 transition-colors disabled:cursor-not-allowed disabled:opacity-60 enabled:hover:bg-surface-50 dark:hover:bg-slate-800"
        >
            {children}
        </button>
    );
}

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, className, style }) {
    return (
        <div style={style} className={cn('flex flex-col gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-[var(--shadow-card)]', className)}>
            {children}
        </div>
    );
}

// ── Modal overlay ─────────────────────────────────────────────────────────────
export function Modal({ title, onClose, children }) {
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 8 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    onClick={(e) => e.stopPropagation()}
                    className="flex w-full max-w-md flex-col gap-4 rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-[var(--shadow-popover)]"
                >
                    <div className="flex items-center justify-between">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
                        <button
                            onClick={onClose}
                            aria-label="Close"
                            className="rounded-lg p-1 text-slate-400 dark:text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:text-slate-300"
                        >
                            <X className="size-5" />
                        </button>
                    </div>
                    {children}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

// ── Section heading ───────────────────────────────────────────────────────────
export function SectionHeading({ title, sub }) {
    return (
        <div className="flex flex-col gap-0.5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
            {sub && <p className="text-sm text-slate-500 dark:text-slate-400">{sub}</p>}
        </div>
    );
}

// ── Velocity bar (PulseGrid) ──────────────────────────────────────────────────
const VELOCITY_BAR_TONE = {
    calm: 'bg-emerald-500',
    stable: 'bg-sky-500',
    rising: 'bg-orange-500',
    critical: 'bg-rose-500',
    emergency: 'bg-rose-600',
};

export function VelocityBar({ velocity, band }) {
    const tone = VELOCITY_BAR_TONE[band] ?? VELOCITY_BAR_TONE.stable;
    return (
        <div className="h-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
                className={cn('h-full rounded-full transition-all duration-500', tone)}
                style={{ width: `${Math.min((velocity ?? 1) * 25, 100)}%` }}
            />
        </div>
    );
}

// ── Legend row ────────────────────────────────────────────────────────────────
const LEGEND_DOT_TONE = {
    calm: 'bg-emerald-500',
    stable: 'bg-sky-500',
    rising: 'bg-orange-500',
    critical: 'bg-rose-500',
    emergency: 'bg-rose-600',
};

export function StressBandLegend() {
    return (
        <div className="flex flex-wrap justify-center gap-4">
            {Object.entries(STRESS_BAND_META).map(([key, m]) => (
                <span key={key} className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <span className={cn('size-2 rounded-full', LEGEND_DOT_TONE[key] ?? 'bg-slate-400')} />
                    {m.label}
                </span>
            ))}
        </div>
    );
}
