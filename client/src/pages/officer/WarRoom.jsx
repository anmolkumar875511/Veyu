// ─────────────────────────────────────────────────────────────────────────────
// src/pages/officer/WarRoom.jsx
//
// Officer triage dashboard. Shows:
//   - Filter tabs by status
//   - Triage queue (cascade-risk pinned to top, then severity-sorted)
//   - Each row links to ComplaintDetail for status/dispatch actions
//   - Auto-polls every 30s for new submissions
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCurrentUser, useLogout } from '../../hooks/useAuthGuards.js';
import { usePolling } from '../../hooks/usePolling.js';
import { getTriageQueueApi } from '../../api/officer.api.js';
import { COMPLAINT_STATUS_LABELS } from '../../constants/complaint.constants.js';

const STATUS_META = {
    submitted: { color: '#94a3b8', bg: '#94a3b811' },
    verified: { color: '#3b82f6', bg: '#3b82f611' },
    assigned: { color: '#a78bfa', bg: '#a78bfa11' },
    in_progress: { color: '#f59e0b', bg: '#f59e0b11' },
};

const CATEGORY_ICONS = {
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

const FILTER_TABS = [
    { value: '', label: 'All Active' },
    { value: 'submitted', label: 'New' },
    { value: 'verified', label: 'Verified' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'in_progress', label: 'In Progress' },
];

function StatusBadge({ status }) {
    const m = STATUS_META[status] ?? STATUS_META.submitted;
    return (
        <span style={{ ...s.badge, color: m.color, background: m.bg }}>
            {COMPLAINT_STATUS_LABELS[status]}
        </span>
    );
}

function SeverityBar({ severity }) {
    if (!severity) return <span style={s.sevNone}>—</span>;
    const color = severity >= 7 ? '#ef4444' : severity >= 4 ? '#f59e0b' : '#22c55e';
    return (
        <div style={s.sevWrap}>
            <div style={s.sevTrack}>
                <div style={{ ...s.sevFill, width: `${severity * 10}%`, background: color }} />
            </div>
            <span style={{ ...s.sevLabel, color }}>{severity}</span>
        </div>
    );
}

function QueueRow({ complaint, onClick }) {
    const icon = CATEGORY_ICONS[complaint.category] ?? '📋';
    const timeAgo = formatTimeAgo(complaint.createdAt);

    return (
        <tr
            style={{ ...s.row, background: complaint.cascadeRisk ? '#7c2d1208' : 'transparent' }}
            onClick={onClick}
        >
            <td style={s.td}>
                {complaint.cascadeRisk && (
                    <span style={s.cascadeTag} title="Cascade risk — nearby water issue verified">
                        ⚡
                    </span>
                )}
            </td>
            <td style={s.td}>
                <span style={s.rowIcon}>{icon}</span>
            </td>
            <td style={{ ...s.td, ...s.tdTitle }}>
                <span style={s.rowTitle}>{complaint.title}</span>
                <span style={s.rowSub}>
                    {complaint.category} · {complaint.wardId?.name ?? 'Unknown ward'}
                </span>
            </td>
            <td style={s.td}>
                <SeverityBar severity={complaint.severity} />
            </td>
            <td style={s.td}>
                {complaint.upvotes > 0 ? (
                    <span style={s.upvoteTag}>▲ {complaint.upvotes}</span>
                ) : (
                    <span style={s.sevNone}>—</span>
                )}
            </td>
            <td style={s.td}>
                <StatusBadge status={complaint.status} />
            </td>
            <td style={s.td}>
                <span style={s.rowTime}>{timeAgo}</span>
            </td>
        </tr>
    );
}

export default function WarRoom() {
    const user = useCurrentUser();
    const logout = useLogout();
    const navigate = useNavigate();

    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusTab, setStatusTab] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    const fetchQueue = useCallback(
        async (p = page, st = statusTab) => {
            try {
                const params = { page: p, limit: 20 };
                if (st) params.status = st;
                const result = await getTriageQueueApi(params);
                setComplaints(result.complaints ?? []);
                setTotal(result.total ?? 0);
                setTotalPages(result.totalPages ?? 1);
                setError(null);
            } catch {
                setError('Could not load the triage queue.');
            } finally {
                setLoading(false);
            }
        },
        [page, statusTab]
    );

    useEffect(() => {
        fetchQueue(page, statusTab);
    }, [page, statusTab]);
    usePolling(() => fetchQueue(page, statusTab), 30_000, true);

    function handleTabChange(val) {
        setStatusTab(val);
        setPage(1);
    }

    const cascadeCount = complaints.filter((c) => c.cascadeRisk).length;

    return (
        <div style={s.page}>
            <header style={s.nav}>
                <div style={s.navBrand}>
                    <span style={s.brandDot} />
                    <span style={s.brandName}>Nagarik</span>
                    <span style={s.navDivider}>·</span>
                    <span style={s.navRole}>War Room</span>
                </div>
                <div style={s.navRight}>
                    <Link to="/reports" style={s.navLink}>
                        Ward Reports
                    </Link>
                    <span style={s.navUser}>{user?.name}</span>
                    <button onClick={logout} style={s.navLogout}>
                        Sign out
                    </button>
                </div>
            </header>

            <main style={s.main}>
                <div style={s.headerRow}>
                    <div>
                        <h1 style={s.heading}>Triage Queue</h1>
                        <p style={s.subheading}>
                            {loading
                                ? 'Loading…'
                                : `${total} active complaint${total !== 1 ? 's' : ''}`}
                            {cascadeCount > 0 && (
                                <span style={s.cascadeWarning}>
                                    {' '}
                                    · ⚡ {cascadeCount} cascade risk{cascadeCount !== 1 ? 's' : ''}
                                </span>
                            )}
                        </p>
                    </div>
                </div>

                <div style={s.tabs}>
                    {FILTER_TABS.map((t) => (
                        <button
                            key={t.value}
                            onClick={() => handleTabChange(t.value)}
                            style={{
                                ...s.tab,
                                background: statusTab === t.value ? '#334155' : 'transparent',
                                color: statusTab === t.value ? '#f1f5f9' : '#64748b',
                                borderBottom:
                                    statusTab === t.value
                                        ? '2px solid #22d3ee'
                                        : '2px solid transparent',
                            }}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {error && (
                    <div style={s.errorBanner}>
                        {error}
                        <button onClick={() => fetchQueue(page, statusTab)} style={s.retryBtn}>
                            Retry
                        </button>
                    </div>
                )}

                {loading ? (
                    <div style={s.skeletonList}>
                        {[0, 1, 2, 3, 4].map((i) => (
                            <div key={i} style={s.skeletonRow} />
                        ))}
                    </div>
                ) : complaints.length === 0 ? (
                    <div style={s.empty}>
                        <span style={s.emptyIcon}>✅</span>
                        <p style={s.emptyText}>No complaints in this queue. All clear.</p>
                    </div>
                ) : (
                    <div style={s.tableWrap}>
                        <table style={s.table}>
                            <thead>
                                <tr>
                                    <th style={s.th}></th>
                                    <th style={s.th}></th>
                                    <th style={s.th}>Complaint</th>
                                    <th style={s.th}>Severity</th>
                                    <th style={s.th}>Votes</th>
                                    <th style={s.th}>Status</th>
                                    <th style={s.th}>Age</th>
                                </tr>
                            </thead>
                            <tbody>
                                {complaints.map((c) => (
                                    <QueueRow
                                        key={c._id}
                                        complaint={c}
                                        onClick={() => navigate(`/war-room/${c._id}`)}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {totalPages > 1 && (
                    <div style={s.pagination}>
                        <button
                            onClick={() => setPage((p) => p - 1)}
                            disabled={page <= 1}
                            style={{ ...s.pageBtn, opacity: page <= 1 ? 0.4 : 1 }}
                        >
                            ← Prev
                        </button>
                        <span style={s.pageLabel}>
                            {page} / {totalPages}
                        </span>
                        <button
                            onClick={() => setPage((p) => p + 1)}
                            disabled={page >= totalPages}
                            style={{ ...s.pageBtn, opacity: page >= totalPages ? 0.4 : 1 }}
                        >
                            Next →
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}

function formatTimeAgo(dateStr) {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60_000);
    const hours = Math.floor(diff / 3_600_000);
    const days = Math.floor(diff / 86_400_000);
    if (mins < 60) return `${mins}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
}

const s = {
    page: {
        minHeight: '100vh',
        background: '#0f172a',
        fontFamily: "'Inter', system-ui, sans-serif",
        color: '#f8fafc',
    },
    nav: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
        height: '56px',
        background: '#0f172a',
        borderBottom: '1px solid #1e293b',
        position: 'sticky',
        top: 0,
        zIndex: 10,
    },
    navBrand: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
    brandDot: {
        width: '0.55rem',
        height: '0.55rem',
        borderRadius: '50%',
        background: '#22d3ee',
        boxShadow: '0 0 8px #22d3ee88',
    },
    brandName: {
        fontSize: '0.85rem',
        fontWeight: 700,
        color: '#e2e8f0',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
    },
    navDivider: { color: '#334155' },
    navRole: { fontSize: '0.8rem', color: '#64748b', fontWeight: 500 },
    navRight: { display: 'flex', alignItems: 'center', gap: '1rem' },
    navLink: { fontSize: '0.82rem', color: '#94a3b8', textDecoration: 'none' },
    navUser: { fontSize: '0.8rem', color: '#475569' },
    navLogout: {
        background: 'none',
        border: '1px solid #334155',
        borderRadius: '0.375rem',
        color: '#94a3b8',
        fontSize: '0.78rem',
        padding: '0.3rem 0.7rem',
        cursor: 'pointer',
    },
    main: { maxWidth: '1080px', margin: '0 auto', padding: '1.75rem 1.5rem 4rem' },
    headerRow: { marginBottom: '1.25rem' },
    heading: { fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 0.25rem 0' },
    subheading: { fontSize: '0.82rem', color: '#64748b', margin: 0 },
    cascadeWarning: { color: '#f97316', fontWeight: 600 },
    tabs: { display: 'flex', gap: 0, borderBottom: '1px solid #1e293b', marginBottom: '1.25rem' },
    tab: {
        padding: '0.6rem 0.9rem',
        fontSize: '0.8rem',
        fontWeight: 500,
        cursor: 'pointer',
        border: 'none',
        transition: 'all 0.15s',
    },
    errorBanner: {
        background: '#450a0a',
        border: '1px solid #7f1d1d',
        borderRadius: '0.5rem',
        color: '#fca5a5',
        fontSize: '0.84rem',
        padding: '0.75rem 1rem',
        marginBottom: '1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    retryBtn: {
        background: 'none',
        border: '1px solid #7f1d1d',
        borderRadius: '0.375rem',
        color: '#fca5a5',
        fontSize: '0.78rem',
        padding: '0.25rem 0.625rem',
        cursor: 'pointer',
    },
    skeletonList: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
    skeletonRow: {
        height: '52px',
        background: '#1e293b',
        borderRadius: '0.5rem',
        border: '1px solid #334155',
    },
    empty: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.625rem',
        padding: '4rem 1rem',
        textAlign: 'center',
    },
    emptyIcon: { fontSize: '2rem' },
    emptyText: { fontSize: '0.875rem', color: '#475569' },
    tableWrap: {
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '0.875rem',
        overflow: 'hidden',
    },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: {
        textAlign: 'left',
        fontSize: '0.7rem',
        fontWeight: 600,
        color: '#475569',
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        padding: '0.75rem 0.875rem',
        borderBottom: '1px solid #334155',
    },
    row: { cursor: 'pointer', borderBottom: '1px solid #1e293b', transition: 'background 0.15s' },
    td: { padding: '0.75rem 0.875rem', verticalAlign: 'middle' },
    tdTitle: { minWidth: '240px' },
    rowIcon: { fontSize: '1.1rem' },
    rowTitle: { display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#e2e8f0' },
    rowSub: { display: 'block', fontSize: '0.7rem', color: '#475569', marginTop: '0.15rem' },
    rowTime: { fontSize: '0.75rem', color: '#475569' },
    cascadeTag: { fontSize: '0.9rem' },
    sevWrap: { display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '90px' },
    sevTrack: {
        flex: 1,
        height: '4px',
        background: '#334155',
        borderRadius: '9999px',
        overflow: 'hidden',
    },
    sevFill: { height: '100%', borderRadius: '9999px' },
    sevLabel: { fontSize: '0.72rem', fontWeight: 700, minWidth: '1rem' },
    sevNone: { color: '#334155', fontSize: '0.8rem' },
    upvoteTag: { fontSize: '0.75rem', color: '#f59e0b', fontWeight: 600 },
    badge: {
        fontSize: '0.68rem',
        fontWeight: 600,
        padding: '0.2rem 0.6rem',
        borderRadius: '9999px',
    },
    pagination: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1.25rem',
        marginTop: '1.25rem',
    },
    pageBtn: {
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '0.5rem',
        color: '#94a3b8',
        fontSize: '0.8rem',
        padding: '0.4rem 0.875rem',
        cursor: 'pointer',
    },
    pageLabel: { fontSize: '0.8rem', color: '#475569' },
};
