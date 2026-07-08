// src/components/citizen/CitizenShell.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Shared primitives for all citizen pages. Styled with Tailwind utility classes,
// dark-mode aware, with the shared Logo + ThemeToggle baked into the nav.
// Public API (component names + props) preserved so page files stay stable.
// ─────────────────────────────────────────────────────────────────────────────

import { Link, NavLink as RouterNavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, ChevronLeft, ChevronRight, LayoutDashboard, Map, ClipboardList, UserCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { getStatusTheme } from '../../lib/roleTheme';
import { STATUS_META } from '../../constants/complaint.constants.js';
import { ThemeToggle } from '../ui/ThemeToggle.jsx';
import { Sidebar } from '../layout/Sidebar.jsx';
import { SidebarToggle } from '../layout/SidebarToggle.jsx';
import { useSidebar } from '../layout/SidebarContext.jsx';
import { Footer } from '../layout/Footer.jsx';

const CITIZEN_NAV = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/map', label: 'City Map', icon: Map },
    { to: '/my-reports', label: 'My Reports', icon: ClipboardList },
    { to: '/profile', label: 'Profile', icon: UserCircle },
];

// ── Page shell ────────────────────────────────────────────────────────────────
export function PageShell({ children }) {
    const { collapsed } = useSidebar();
    return (
        <div className="min-h-screen bg-surface-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
            <Sidebar items={CITIZEN_NAV} accent="primary" roleLabel="Citizen" />
            <div className={cn('flex min-h-screen flex-col transition-[padding] duration-200', collapsed ? 'lg:pl-[76px]' : 'lg:pl-64')}>
                {children}
                <Footer />
            </div>
        </div>
    );
}

// ── Sticky nav bar ────────────────────────────────────────────────────────────
export function NavBar({ left, center, right }) {
    return (
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/85 px-4 backdrop-blur-md transition-colors dark:border-slate-800 dark:bg-slate-950/80 sm:px-6">
            <div className="flex flex-1 items-center gap-2">
                <SidebarToggle />
                {left}
            </div>
            <div className="hidden flex-1 items-center justify-center sm:flex">{center}</div>
            <div className="flex flex-1 items-center justify-end gap-2 sm:gap-3">
                {right}
                <ThemeToggle />
            </div>
        </header>
    );
}

// ── Page title (nav-bar left slot) ───────────────────────────────────────────
// Sidebar already carries the brand mark, so this is just the section title.
export function NavBrand({ name }) {
    return <span className="text-sm font-semibold text-slate-900 dark:text-white">{name ?? 'Dashboard'}</span>;
}

// ── Nav link (route-aware active state) ──────────────────────────────────────
export function NavLink({ to, children }) {
    return (
        <RouterNavLink
            to={to}
            className={({ isActive }) =>
                cn(
                    'relative text-sm font-medium transition-colors',
                    isActive
                        ? 'text-slate-900 dark:text-white'
                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                )
            }
        >
            {({ isActive }) => (
                <span className="relative inline-flex flex-col items-center">
                    {children}
                    {isActive && (
                        <motion.span
                            layoutId="citizen-nav-underline"
                            className="absolute -bottom-2 h-0.5 w-full rounded-full bg-primary-600 dark:bg-primary-400"
                            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                        />
                    )}
                </span>
            )}
        </RouterNavLink>
    );
}

export function NavLinkAccent({ to, children }) {
    return (
        <Link
            to={to}
            className="text-sm font-semibold text-primary-600 transition-colors hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
        >
            {children}
        </Link>
    );
}

// ── Ghost nav button ──────────────────────────────────────────────────────────
export function NavButton({ onClick, children }) {
    return (
        <button
            onClick={onClick}
            className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
            {children}
        </button>
    );
}

// ── Status badge ──────────────────────────────────────────────────────────────
export function StatusBadge({ status }) {
    const theme = getStatusTheme(status);
    const label = STATUS_META[status]?.label ?? status;
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold',
                'dark:border-white/10 dark:bg-white/5 dark:brightness-125',
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

// ── Severity pill ─────────────────────────────────────────────────────────────
export function SeverityPip({ severity }) {
    if (!severity) return null;
    const tone = severity >= 7 ? 'bg-rose-500' : severity >= 4 ? 'bg-amber-500' : 'bg-emerald-500';
    return (
        <span className={cn('whitespace-nowrap rounded-full px-1.5 py-0.5 text-[0.62rem] font-bold text-white', tone)}>
            {severity}/10
        </span>
    );
}

// ── Section label (CAPS metadata label) ──────────────────────────────────────
export function SectionLabel({ children }) {
    return (
        <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {children}
        </span>
    );
}

// ── Error banner with optional retry ─────────────────────────────────────────
export function ErrorBanner({ message, onRetry }) {
    if (!message) return null;
    return (
        <div
            role="alert"
            className="flex items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-500/10 dark:text-rose-300"
        >
            <span>{message}</span>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="shrink-0 whitespace-nowrap rounded-md border border-rose-200 px-2.5 py-1 text-xs text-rose-700 transition-colors hover:bg-rose-100 dark:border-rose-900/50 dark:text-rose-300 dark:hover:bg-rose-500/10"
                >
                    Retry
                </button>
            )}
        </div>
    );
}

// ── Skeleton placeholder ──────────────────────────────────────────────────────
export function Skeleton({ height = '68px', count = 3 }) {
    return (
        <>
            {Array.from({ length: count }, (_, i) => (
                <div
                    key={i}
                    style={{ height }}
                    className="animate-pulse rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800/60"
                />
            ))}
        </>
    );
}

// ── Pagination ────────────────────────────────────────────────────────────────
export function Pagination({ page, totalPages, onPrev, onNext, className }) {
    if (totalPages <= 1) return null;
    return (
        <div className={cn('flex items-center justify-center gap-5', className)}>
            <PaginationBtn onClick={onPrev} disabled={page <= 1}>
                <ChevronLeft className="size-4" /> Prev
            </PaginationBtn>
            <span className="text-sm text-slate-400 dark:text-slate-500">
                {page} / {totalPages}
            </span>
            <PaginationBtn onClick={onNext} disabled={page >= totalPages}>
                Next <ChevronRight className="size-4" />
            </PaginationBtn>
        </div>
    );
}

function PaginationBtn({ onClick, disabled, children }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-sm text-slate-600 transition-colors disabled:cursor-not-allowed disabled:opacity-40 enabled:hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:enabled:hover:bg-slate-800"
        >
            {children}
        </button>
    );
}

// ── Empty state ───────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon = Building2, heading, sub, cta, ctaTo }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-900"
        >
            <div className="flex size-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                <Icon className="size-6 text-slate-400 dark:text-slate-500" aria-hidden="true" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{heading}</h3>
            {sub && <p className="max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">{sub}</p>}
            {cta && ctaTo && (
                <Link
                    to={ctaTo}
                    className="mt-2 inline-flex items-center rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-400"
                >
                    {cta}
                </Link>
            )}
        </motion.div>
    );
}

// ── Surface card ──────────────────────────────────────────────────────────────
export function Card({ children, className, ...props }) {
    return (
        <div
            className={cn(
                'rounded-xl border border-slate-200 bg-white shadow-[var(--shadow-card)] transition-colors',
                'dark:border-slate-800 dark:bg-slate-900 dark:shadow-[var(--shadow-card-dark)]',
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

// ── Accent CTA link (styled as button) ───────────────────────────────────────
export function AccentLink({ to, children }) {
    return (
        <Link
            to={to}
            className="inline-flex shrink-0 items-center whitespace-nowrap rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-400"
        >
            {children}
        </Link>
    );
}
