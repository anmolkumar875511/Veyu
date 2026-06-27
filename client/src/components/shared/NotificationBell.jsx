// src/components/shared/NotificationBell.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Bell icon + dropdown notification feed. Drop into any NavBar right slot.
// Covers: GET /notifications, GET /notifications/unread-count,
//         PATCH /notifications/:id/read, PATCH /notifications/read-all,
//         DELETE /notifications/:id
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from 'react';
import {
    getMyNotificationsApi,
    getUnreadCountApi,
    markAsReadApi,
    markAllAsReadApi,
    deleteNotificationApi,
} from '../../api/notification.api.js';
import { color, font, radius, space, shadow, transition } from '../../theme/index.js';

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
            setNotifications((prev) =>
                prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
            );
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
        <div ref={dropRef} style={{ position: 'relative' }}>
            {/* Bell button */}
            <button
                onClick={openDropdown}
                aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
                style={{
                    position: 'relative',
                    background: 'none',
                    border: `1px solid ${color.borderDefault}`,
                    borderRadius: radius.sm,
                    color: color.textSecondary,
                    width: '2rem',
                    height: '2rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    flexShrink: 0,
                }}
            >
                🔔
                {unreadCount > 0 && (
                    <span
                        style={{
                            position: 'absolute',
                            top: '-4px',
                            right: '-4px',
                            background: color.danger,
                            color: '#fff',
                            fontSize: '0.55rem',
                            fontWeight: font.weight.bold,
                            minWidth: '1rem',
                            height: '1rem',
                            borderRadius: radius.full,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0 0.2rem',
                            lineHeight: 1,
                        }}
                    >
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {open && (
                <div
                    style={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        right: 0,
                        width: '340px',
                        background: color.bgSurface,
                        border: `1px solid ${color.borderDefault}`,
                        borderRadius: radius.xl,
                        boxShadow: shadow.card,
                        zIndex: 300,
                        overflow: 'hidden',
                        maxHeight: '480px',
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    {/* Header */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: `${space[3]} ${space[4]}`,
                            borderBottom: `1px solid ${color.borderFaint}`,
                        }}
                    >
                        <span
                            style={{
                                fontSize: font.size.base,
                                fontWeight: font.weight.bold,
                                color: color.textPrimary,
                            }}
                        >
                            Notifications
                        </span>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAll}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: font.size.xs,
                                    color: color.accent,
                                    cursor: 'pointer',
                                    fontFamily: font.sans,
                                }}
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* List */}
                    <div style={{ overflowY: 'auto', flex: 1 }}>
                        {loading && (
                            <p
                                style={{
                                    padding: space[5],
                                    fontSize: font.size.sm,
                                    color: color.textMuted,
                                    margin: 0,
                                    textAlign: 'center',
                                }}
                            >
                                Loading…
                            </p>
                        )}

                        {!loading && notifications.length === 0 && (
                            <p
                                style={{
                                    padding: `${space[8]} ${space[4]}`,
                                    fontSize: font.size.sm,
                                    color: color.textMuted,
                                    margin: 0,
                                    textAlign: 'center',
                                }}
                            >
                                No notifications yet.
                            </p>
                        )}

                        {!loading &&
                            notifications.map((n) => (
                                <div
                                    key={n._id}
                                    style={{
                                        display: 'flex',
                                        gap: space[3],
                                        alignItems: 'flex-start',
                                        padding: `${space[3]} ${space[4]}`,
                                        borderBottom: `1px solid ${color.borderFaint}`,
                                        background: n.isRead ? 'transparent' : `${color.accent}08`,
                                        transition: transition.fast,
                                    }}
                                >
                                    {/* Unread dot */}
                                    <span
                                        style={{
                                            width: '0.4rem',
                                            height: '0.4rem',
                                            borderRadius: radius.full,
                                            background: n.isRead ? 'transparent' : color.accent,
                                            flexShrink: 0,
                                            marginTop: '0.35rem',
                                        }}
                                    />

                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p
                                            style={{
                                                fontSize: font.size.sm,
                                                fontWeight: n.isRead
                                                    ? font.weight.normal
                                                    : font.weight.semibold,
                                                color: color.textPrimary,
                                                margin: `0 0 0.15rem 0`,
                                                lineHeight: 1.4,
                                            }}
                                        >
                                            {n.title}
                                        </p>
                                        <p
                                            style={{
                                                fontSize: font.size.xs,
                                                color: color.textSecondary,
                                                margin: `0 0 0.25rem 0`,
                                                lineHeight: 1.5,
                                            }}
                                        >
                                            {n.message}
                                        </p>
                                        <span
                                            style={{ fontSize: '0.68rem', color: color.textMuted }}
                                        >
                                            {timeAgo(n.createdAt)}
                                        </span>
                                    </div>

                                    <div
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '0.2rem',
                                            flexShrink: 0,
                                        }}
                                    >
                                        {!n.isRead && (
                                            <button
                                                onClick={() => handleMarkRead(n._id)}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    color: color.accent,
                                                    fontSize: font.size.xs,
                                                    cursor: 'pointer',
                                                    padding: 0,
                                                }}
                                                title="Mark as read"
                                            >
                                                ✓
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(n._id)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: color.textMuted,
                                                fontSize: font.size.xs,
                                                cursor: 'pointer',
                                                padding: 0,
                                            }}
                                            title="Delete"
                                        >
                                            ×
                                        </button>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            )}
        </div>
    );
}
