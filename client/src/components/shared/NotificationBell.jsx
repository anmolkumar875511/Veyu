// src/components/shared/NotificationBell.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Bell icon + dropdown notification feed. Drop into any NavBar right slot.
// Covers: GET /notifications, GET /notifications/unread-count,
//         PATCH /notifications/:id/read, PATCH /notifications/read-all,
//         DELETE /notifications/:id
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Check, X } from 'lucide-react';
import {
    getMyNotificationsApi,
    getUnreadCountApi,
    markAsReadApi,
    markAllAsReadApi,
    deleteNotificationApi,
} from '../../api/notification.api.js';
import { cn } from '../../lib/utils';

function timeAgo(dateStr) {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60_000);
    const hours = Math.floor(diff / 3_600_000);
    const days = Math.floor(diff / 86_400_000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
}

export function NotificationBell() {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const dropRef = useRef(null);

    // ── Fetch unread count (light poll) ──────────────────────────────────────
    const fetchCount = useCallback(async () => {
        try {
            const d = await getUnreadCountApi();
            setUnreadCount(d.unreadCount ?? 0);
        } catch {
            /* non-fatal */
        }
    }, []);

    useEffect(() => {
        fetchCount();
        const id = setInterval(fetchCount, 30_000);
        return () => clearInterval(id);
    }, [fetchCount]);

    // ── Fetch full list when dropdown opens ───────────────────────────────────
    async function openDropdown() {
        if (open) {
            setOpen(false);
            return;
        }
        setOpen(true);
        setLoading(true);
        try {
            const d = await getMyNotificationsApi({ limit: 20 });
            setNotifications(d.notifications ?? []);
            setUnreadCount(d.unreadCount ?? 0);
        } catch {
            /* non-fatal */
        } finally {
            setLoading(false);
        }
    }

    // ── Close on outside click ────────────────────────────────────────────────
    useEffect(() => {
        if (!open) return;
        function handleClick(e) {
            if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false);
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [open]);

    async function handleMarkRead(id) {
        try {
            await markAsReadApi(id);
            setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
            setUnreadCount((c) => Math.max(0, c - 1));
        } catch {
            /* non-fatal */
        }
    }

    async function handleMarkAll() {
        try {
            await markAllAsReadApi();
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch {
            /* non-fatal */
        }
    }

    async function handleDelete(id) {
        try {
            await deleteNotificationApi(id);
            setNotifications((prev) => prev.filter((n) => n._id !== id));
        } catch {
            /* non-fatal */
        }
    }

    return (
        <div ref={dropRef} className="relative">
            {/* Bell button */}
            <button
                onClick={openDropdown}
                aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
                className="relative flex size-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
            >
                <Bell className="size-4" aria-hidden="true" />
                {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[0.55rem] font-bold leading-none text-white">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-[calc(100%+8px)] z-[300] flex max-h-[480px] w-[min(340px,90vw)] flex-col overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-[var(--shadow-popover)]"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-4 py-3">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">Notifications</span>
                            {unreadCount > 0 && (
                                <button onClick={handleMarkAll} className="text-xs text-primary-600 hover:text-primary-700">
                                    Mark all read
                                </button>
                            )}
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto">
                            {loading && <p className="p-5 text-center text-sm text-slate-400 dark:text-slate-500">Loading…</p>}

                            {!loading && notifications.length === 0 && (
                                <p className="px-4 py-8 text-center text-sm text-slate-400 dark:text-slate-500">No notifications yet.</p>
                            )}

                            {!loading &&
                                notifications.map((n) => (
                                    <div
                                        key={n._id}
                                        className={cn(
                                            'flex items-start gap-3 border-b border-slate-100 dark:border-slate-800 px-4 py-3 transition-colors',
                                            !n.isRead && 'bg-primary-50/60 dark:bg-primary-500/15'
                                        )}
                                    >
                                        {/* Unread dot */}
                                        <span className={cn('mt-1.5 size-1.5 shrink-0 rounded-full', n.isRead ? 'bg-transparent' : 'bg-primary-500')} />

                                        <div className="min-w-0 flex-1">
                                            <p className={cn('mb-0.5 text-sm leading-snug text-slate-900 dark:text-white', !n.isRead && 'font-semibold')}>
                                                {n.title}
                                            </p>
                                            <p className="mb-1 text-xs leading-snug text-slate-500 dark:text-slate-400">{n.message}</p>
                                            <span className="text-[0.68rem] text-slate-400 dark:text-slate-500">{timeAgo(n.createdAt)}</span>
                                        </div>

                                        <div className="flex shrink-0 flex-col items-center gap-1.5">
                                            {!n.isRead && (
                                                <button
                                                    onClick={() => handleMarkRead(n._id)}
                                                    title="Mark as read"
                                                    className="text-primary-500 transition-colors hover:text-primary-700"
                                                >
                                                    <Check className="size-3.5" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(n._id)}
                                                title="Delete"
                                                className="text-slate-300 dark:text-slate-600 transition-colors hover:text-slate-500"
                                            >
                                                <X className="size-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
