// src/components/layout/Sidebar.jsx
// ─────────────────────────────────────────────────────────────────────────────
// The single navigation rail used by every authenticated role. Fixed to the
// left edge, collapsible to icons-only, and becomes an off-canvas drawer on
// mobile — the same pattern used by Linear, Vercel, and Notion.
// One component, configured per-role via `items` + `accent`, so navigation
// never has to be hand-built inside individual pages again.
// ─────────────────────────────────────────────────────────────────────────────

import { NavLink } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronsLeft, ChevronsRight, LogOut, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSidebar } from './SidebarContext.jsx';
import { Logo } from '../ui/Logo.jsx';
import { Avatar } from '../ui/Feedback.jsx';
import { cn } from '../../lib/utils';

const ACCENTS = {
    primary: {
        active: 'bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-300',
        icon: 'text-primary-600 dark:text-primary-400',
        bar: 'bg-primary-600 dark:bg-primary-400',
    },
    violet: {
        active: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300',
        icon: 'text-violet-600 dark:text-violet-400',
        bar: 'bg-violet-600 dark:bg-violet-400',
    },
    emerald: {
        active: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
        icon: 'text-emerald-600 dark:text-emerald-400',
        bar: 'bg-emerald-600 dark:bg-emerald-400',
    },
    amber: {
        active: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
        icon: 'text-amber-600 dark:text-amber-400',
        bar: 'bg-amber-600 dark:bg-amber-400',
    },
};

/**
 * items: [{ to, label, icon: LucideIcon }]
 * accent: 'primary' | 'violet' | 'emerald' | 'amber' — matches each role's brand color
 * roleLabel: shown under the brand mark, e.g. "War Room", "Field Tasks"
 */
export function Sidebar({ items, accent = 'primary', roleLabel }) {
    const { user, logout } = useAuth();
    const { mobileOpen, closeMobile, collapsed, toggleCollapsed } = useSidebar();
    const tone = ACCENTS[accent] ?? ACCENTS.primary;

    const content = (expanded) => (
        <div className="flex h-full flex-col">
            {/* Brand */}
            <div className={cn('flex h-16 shrink-0 items-center border-b border-slate-200 dark:border-slate-800', expanded ? 'px-5' : 'justify-center px-2')}>
                <Logo withText={expanded} size="sm" />
            </div>

            {/* Nav items */}
            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
                {items.map(({ to, label, icon: Icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        onClick={closeMobile}
                        title={!expanded ? label : undefined}
                        className={({ isActive }) =>
                            cn(
                                'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                                expanded ? '' : 'justify-center',
                                isActive
                                    ? tone.active
                                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                            )
                        }
                    >
                        {({ isActive }) => (
                            <>
                                {isActive && (
                                    <motion.span
                                        layoutId="sidebar-active-bar"
                                        className={cn('absolute left-0 h-6 w-1 rounded-r-full', tone.bar)}
                                        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                                    />
                                )}
                                <Icon className={cn('size-[18px] shrink-0', isActive ? tone.icon : '')} aria-hidden="true" />
                                {expanded && <span className="truncate">{label}</span>}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* User + logout */}
            <div className={cn('shrink-0 border-t border-slate-200 dark:border-slate-800 p-3', expanded ? '' : 'flex flex-col items-center gap-2')}>
                <div className={cn('flex items-center gap-2.5 rounded-lg px-2 py-2', expanded && 'mb-1')}>
                    <Avatar name={user?.name ?? '?'} size="sm" />
                    {expanded && (
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{user?.name ?? 'Account'}</p>
                            <p className="truncate text-xs text-slate-400 dark:text-slate-500">{roleLabel ?? user?.role}</p>
                        </div>
                    )}
                </div>
                <button
                    onClick={logout}
                    title="Sign out"
                    className={cn(
                        'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-500/10 dark:hover:text-rose-400',
                        expanded ? 'w-full' : 'justify-center'
                    )}
                >
                    <LogOut className="size-[18px] shrink-0" />
                    {expanded && <span>Sign out</span>}
                </button>

                {/* Collapse toggle — desktop only */}
                <button
                    onClick={toggleCollapsed}
                    className="mt-1 hidden w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300 lg:flex"
                >
                    {expanded ? (
                        <>
                            <ChevronsLeft className="size-4" /> Collapse
                        </>
                    ) : (
                        <ChevronsRight className="size-4" />
                    )}
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop rail — persistent, collapsible */}
            <aside
                className={cn(
                    'fixed inset-y-0 left-0 z-30 hidden border-r border-slate-200 bg-white transition-[width] duration-200 dark:border-slate-800 dark:bg-slate-950 lg:block',
                    collapsed ? 'w-[76px]' : 'w-64'
                )}
            >
                {content(!collapsed)}
            </aside>

            {/* Mobile drawer */}
            <AnimatePresence>
                {mobileOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closeMobile}
                            className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
                        />
                        <motion.aside
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
                            className="fixed inset-y-0 left-0 z-50 w-72 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 lg:hidden"
                        >
                            <button
                                onClick={closeMobile}
                                aria-label="Close menu"
                                className="absolute right-3 top-3 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 dark:text-slate-500 dark:hover:bg-slate-800"
                            >
                                <X className="size-5" />
                            </button>
                            {content(true)}
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}

export default Sidebar;
