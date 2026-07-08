// ─────────────────────────────────────────────────────────────────────────────
// src/App.jsx
//
// Global UI shell — lives inside all providers, wraps all page content.
//
// Responsibilities:
//   - Toast notification system (listens to "nagarik:notification" DOM events
//     fired by useNotifications hook — works without prop drilling)
//   - Scroll-to-top on every route change
//   - Renders <Outlet /> for the route tree
//
// What App.jsx is NOT:
//   - It doesn't own any routes (that's AppRouter.jsx)
//   - It doesn't own any providers (that's AppRouter.jsx)
//   - It doesn't fetch any data (that's each page's responsibility)
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
    CheckCircle2,
    ArrowRight,
    Settings,
    XCircle,
    AlertTriangle,
    Radio,
    Zap,
    ClipboardList,
    Star,
    Info,
    X,
} from 'lucide-react';
import { cn } from './lib/utils';

// ── Toast types → icon + tone map ─────────────────────────────────────────────
const TOAST_STYLES = {
    complaint_verified: { icon: CheckCircle2, tone: 'text-emerald-500' },
    complaint_assigned: { icon: ArrowRight, tone: 'text-sky-500' },
    complaint_in_progress: { icon: Settings, tone: 'text-amber-500' },
    complaint_resolved: { icon: CheckCircle2, tone: 'text-emerald-500' },
    complaint_rejected: { icon: XCircle, tone: 'text-rose-500' },
    stress_band_elevated: { icon: AlertTriangle, tone: 'text-orange-500' },
    silent_signal_alert: { icon: Radio, tone: 'text-violet-500' },
    cascade_risk_flagged: { icon: Zap, tone: 'text-amber-500' },
    task_assigned: { icon: ClipboardList, tone: 'text-sky-500' },
    field_points_awarded: { icon: Star, tone: 'text-amber-500' },
    default: { icon: Info, tone: 'text-primary-500' },
};

const TOAST_DURATION = 4500; // ms

// ── Toast item component ──────────────────────────────────────────────────────
function Toast({ toast, onDismiss }) {
    const { icon: Icon, tone } = TOAST_STYLES[toast.type] ?? TOAST_STYLES.default;

    useEffect(() => {
        const timer = setTimeout(() => onDismiss(toast.id), TOAST_DURATION);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 60, transition: { duration: 0.2 } }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            role="alert"
            aria-live="polite"
            className="pointer-events-auto flex w-full items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-[var(--shadow-popover)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-[var(--shadow-popover-dark)]"
        >
            <Icon className={cn('mt-0.5 size-5 shrink-0', tone)} aria-hidden="true" />
            <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-snug text-slate-900 dark:text-white">{toast.title}</p>
                {toast.message && <p className="mt-0.5 text-xs leading-snug text-slate-500 dark:text-slate-400">{toast.message}</p>}
            </div>
            <button
                onClick={() => onDismiss(toast.id)}
                aria-label="Dismiss notification"
                className="shrink-0 rounded-md p-0.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            >
                <X className="size-4" />
            </button>
        </motion.div>
    );
}

// ── ToastContainer ────────────────────────────────────────────────────────────
function ToastContainer() {
    const [toasts, setToasts] = useState([]);

    // Listen for notifications dispatched by useNotifications hook
    useEffect(() => {
        function handleNotification(e) {
            const notification = e.detail;
            if (!notification) return;

            setToasts((prev) => {
                // Deduplicate — don't show the same notification twice
                if (prev.some((t) => t.id === notification.id)) return prev;
                return [...prev, notification].slice(-5); // max 5 toasts at once
            });
        }

        window.addEventListener('nagarik:notification', handleNotification);
        return () => window.removeEventListener('nagarik:notification', handleNotification);
    }, []);

    const dismiss = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <div
            aria-label="Notifications"
            className="pointer-events-none fixed right-4 top-4 z-[9999] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2.5 sm:right-5 sm:top-5"
        >
            <AnimatePresence initial={false}>
                {toasts.map((toast) => (
                    <Toast key={toast.id} toast={toast} onDismiss={dismiss} />
                ))}
            </AnimatePresence>
        </div>
    );
}

// ── ScrollToTop ───────────────────────────────────────────────────────────────
// Scrolls to top on every route change — standard SPA behavior.
function ScrollToTop() {
    const { pathname } = useLocation();
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
    }, [pathname]);
    return null;
}

// ── PageTransition ────────────────────────────────────────────────────────────
// Subtle fade + rise on every route change so navigating the app feels fluid
// instead of an abrupt swap. Kept short (0.18s) so it never feels sluggish.
function PageTransition() {
    const location = useLocation();
    return (
        <AnimatePresence mode="wait" initial={false}>
            <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            >
                <Outlet />
            </motion.div>
        </AnimatePresence>
    );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
    return (
        <>
            {/* Scroll restoration on route change */}
            <ScrollToTop />

            {/* Page content — rendered by the router's <Outlet />, animated on change */}
            <PageTransition />

            {/* Global toast overlay — portal-style, always on top */}
            <ToastContainer />
        </>
    );
}
