// ─────────────────────────────────────────────────────────────────────────────
// src/pages/citizen/MyComplaints.jsx
//
// Full complaint history page for the citizen.
// Features:
//   - Status filter tabs
//   - Paginated list with sort
//   - Inline delete for unverified complaints
//   - Detail drawer (right panel) showing timeline, AI info, upvote
//   - Auto-polls every 30s for status changes
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { usePolling } from '../../hooks/usePolling.js';
import {
    getMyComplaintsApi,
    getComplaintByIdApi,
    toggleUpvoteApi,
    deleteComplaintApi,
    parseComplaintError,
} from '../../api/complaints.api.js';

// ── Constants ─────────────────────────────────────────────────────────────────
const STATUS_META = {
    submitted: { label: 'Submitted', color: '#94a3b8', bg: '#94a3b811', step: 1 },
    verified: { label: 'Verified', color: '#3b82f6', bg: '#3b82f611', step: 2 },
    assigned: { label: 'Assigned', color: '#a78bfa', bg: '#a78bfa11', step: 3 },
    in_progress: { label: 'In Progress', color: '#f59e0b', bg: '#f59e0b11', step: 4 },
    resolved: { label: 'Resolved', color: '#22c55e', bg: '#22c55e11', step: 5 },
    rejected: { label: 'Rejected', color: '#ef4444', bg: '#ef444411', step: 0 },
    duplicate: { label: 'Duplicate', color: '#64748b', bg: '#64748b11', step: 0 },
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

const STATUS_TABS = [
    { value: '', label: 'All' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'rejected', label: 'Rejected' },
];

const TIMELINE_STEPS = ['submitted', 'verified', 'assigned', 'in_progress', 'resolved'];

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
    const m = STATUS_META[status] ?? STATUS_META.submitted;
    return <span style={{ ...s.badge, color: m.color, background: m.bg }}>{m.label}</span>;
}

function ComplaintRow({ complaint, isSelected, onClick }) {
    const icon = CATEGORY_ICONS[complaint.category] ?? '📋';
    return (
        <div
            style={{
                ...s.row,
                background: isSelected ? '#334155' : '#1e293b',
                borderColor: isSelected ? '#22d3ee44' : '#334155',
            }}
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onClick()}
        >
            <span style={s.rowIcon}>{icon}</span>
            <div style={s.rowBody}>
                <span style={s.rowTitle}>{complaint.title}</span>
                <span style={s.rowMeta}>
                    {complaint.category} · {formatDate(complaint.createdAt)}
                </span>
            </div>
            <div style={s.rowRight}>
                <StatusBadge status={complaint.status} />
                {complaint.severity && (
                    <span
                        style={{
                            ...s.sevDot,
                            background:
                                complaint.severity >= 7
                                    ? '#ef4444'
                                    : complaint.severity >= 4
                                      ? '#f59e0b'
                                      : '#22c55e',
                        }}
                    >
                        {complaint.severity}/10
                    </span>
                )}
            </div>
        </div>
    );
}

function StatusTimeline({ status }) {
    const currentStep = STATUS_META[status]?.step ?? 0;
    const isTerminal = status === 'rejected' || status === 'duplicate';

    if (isTerminal) {
        return (
            <div style={s.timelineTerminal}>
                <StatusBadge status={status} />
            </div>
        );
    }

    return (
        <div style={s.timeline}>
            {TIMELINE_STEPS.map((st, i) => {
                const stepMeta = STATUS_META[st];
                const done = (STATUS_META[status]?.step ?? 0) > i;
                const active = status === st;
                return (
                    <div key={st} style={s.timelineStep}>
                        <div
                            style={{
                                ...s.timelineDot,
                                background: done || active ? stepMeta.color : '#334155',
                                boxShadow: active ? `0 0 8px ${stepMeta.color}88` : 'none',
                            }}
                        />
                        <span
                            style={{
                                ...s.timelineLabel,
                                color: done || active ? stepMeta.color : '#475569',
                            }}
                        >
                            {stepMeta.label}
                        </span>
                        {i < TIMELINE_STEPS.length - 1 && (
                            <div
                                style={{
                                    ...s.timelineLine,
                                    background: done ? '#334155' : '#1e293b',
                                }}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

function DetailDrawer({ complaintId, onClose }) {
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [hasVoted, setHasVoted] = useState(false);
    const [upvotes, setUpvotes] = useState(0);
    const [deleting, setDeleting] = useState(false);
    const [err, setErr] = useState(null);

    useEffect(() => {
        setLoading(true);
        setErr(null);
        getComplaintByIdApi(complaintId)
            .then(({ complaint, hasVoted: hv }) => {
                setDetail(complaint);
                setHasVoted(hv);
                setUpvotes(complaint.upvotes);
            })
            .catch(() => setErr('Could not load complaint details.'))
            .finally(() => setLoading(false));
    }, [complaintId]);

    async function handleVote() {
        try {
            const res = await toggleUpvoteApi(complaintId);
            setUpvotes(res.upvotes);
            setHasVoted(res.hasVoted);
        } catch {
            /* non-fatal */
        }
    }

    async function handleDelete() {
        if (!confirm('Delete this complaint? This cannot be undone.')) return;
        setDeleting(true);
        try {
            await deleteComplaintApi(complaintId);
            onClose('deleted');
        } catch (e) {
            setErr(parseComplaintError(e));
            setDeleting(false);
        }
    }

    const canDelete = detail && ['submitted', 'duplicate'].includes(detail.status);

    return (
        <div style={s.drawer}>
            <div style={s.drawerHeader}>
                <span style={s.drawerTitle}>Complaint Detail</span>
                <button onClick={() => onClose()} style={s.closeBtn} aria-label="Close">
                    ×
                </button>
            </div>

            {loading && <div style={s.drawerLoading}>Loading…</div>}
            {err && <div style={s.drawerErr}>{err}</div>}

            {detail && !loading && (
                <div style={s.drawerBody}>
                    {/* Image */}
                    <img src={detail.imageUrl} alt="Complaint" style={s.drawerImg} />

                    {/* Title + category */}
                    <h2 style={s.drawerCTitle}>{detail.title}</h2>
                    <div style={s.drawerMeta}>
                        <StatusBadge status={detail.status} />
                        <span style={s.drawerMetaItem}>{detail.category}</span>
                        {detail.wardId && (
                            <span style={s.drawerMetaItem}>Ward {detail.wardId.wardNumber}</span>
                        )}
                    </div>

                    {/* Description */}
                    <p style={s.drawerDesc}>{detail.description}</p>

                    {/* Address */}
                    {detail.address && <p style={s.drawerAddr}>📍 {detail.address}</p>}

                    {/* AI info */}
                    <div style={s.aiBox}>
                        <span style={s.aiBoxLabel}>AI Assessment</span>
                        <div style={s.aiBoxRow}>
                            <span style={s.aiBoxKey}>Category</span>
                            <span style={s.aiBoxVal}>{detail.category}</span>
                        </div>
                        <div style={s.aiBoxRow}>
                            <span style={s.aiBoxKey}>Severity</span>
                            <span style={s.aiBoxVal}>{detail.severity ?? '—'}/10</span>
                        </div>
                        <div style={s.aiBoxRow}>
                            <span style={s.aiBoxKey}>Confidence</span>
                            <span style={s.aiBoxVal}>
                                {detail.aiConfidence
                                    ? `${Math.round(detail.aiConfidence * 100)}%`
                                    : '—'}
                            </span>
                        </div>
                        {detail.categorySource === 'manual' && (
                            <span style={s.manualTag}>Category was set manually</span>
                        )}
                    </div>

                    {/* Duplicate notice */}
                    {detail.duplicateOf && (
                        <div style={s.dupBox}>
                            🔁 Linked to an existing report. Consider upvoting the original.
                        </div>
                    )}

                    {/* Status timeline */}
                    <div style={s.section}>
                        <span style={s.sectionLabel}>Progress</span>
                        <StatusTimeline status={detail.status} />
                    </div>

                    {/* Upvote */}
                    <div style={s.section}>
                        <span style={s.sectionLabel}>Community support</span>
                        <button
                            onClick={handleVote}
                            style={{
                                ...s.upvoteBtn,
                                background: hasVoted ? '#22d3ee22' : '#0f172a',
                                borderColor: hasVoted ? '#22d3ee' : '#334155',
                                color: hasVoted ? '#22d3ee' : '#94a3b8',
                            }}
                        >
                            {hasVoted ? '▲ Upvoted' : '▲ Upvote'} · {upvotes}
                        </button>
                    </div>

                    {/* Delete */}
                    {canDelete && (
                        <button onClick={handleDelete} disabled={deleting} style={s.deleteBtn}>
                            {deleting ? 'Deleting…' : 'Delete this complaint'}
                        </button>
                    )}

                    <span style={s.drawerDate}>Submitted {formatDate(detail.createdAt)}</span>
                </div>
            )}
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MyComplaints() {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedId, setSelectedId] = useState(null);

    const fetchComplaints = useCallback(
        async (p = page, st = statusFilter) => {
            try {
                const params = { page: p, limit: 10 };
                if (st) params.status = st;
                const result = await getMyComplaintsApi(params);
                setComplaints(result.complaints ?? []);
                setTotal(result.total ?? 0);
                setTotalPages(result.totalPages ?? 1);
                setError(null);
            } catch {
                setError('Could not load complaints.');
            } finally {
                setLoading(false);
            }
        },
        [page, statusFilter]
    );

    useEffect(() => {
        fetchComplaints(page, statusFilter);
    }, [page, statusFilter]);
    usePolling(() => fetchComplaints(page, statusFilter), 30_000, complaints.length > 0);

    function handleTabChange(val) {
        setStatusFilter(val);
        setPage(1);
        setSelectedId(null);
    }

    function handleDrawerClose(action) {
        setSelectedId(null);
        if (action === 'deleted') fetchComplaints(page, statusFilter);
    }

    return (
        <div style={s.page}>
            <header style={s.nav}>
                <Link to="/dashboard" style={s.backLink}>
                    ← Dashboard
                </Link>
                <span style={s.navTitle}>My Reports</span>
                <Link to="/report" style={s.newReportLink}>
                    + New
                </Link>
            </header>

            <div style={s.layout}>
                {/* ── Left: list ──────────────────────────────────────────────── */}
                <div style={s.listPanel}>
                    {/* Status tabs */}
                    <div style={s.tabs}>
                        {STATUS_TABS.map((t) => (
                            <button
                                key={t.value}
                                onClick={() => handleTabChange(t.value)}
                                style={{
                                    ...s.tab,
                                    background:
                                        statusFilter === t.value ? '#334155' : 'transparent',
                                    color: statusFilter === t.value ? '#f1f5f9' : '#64748b',
                                    borderBottom:
                                        statusFilter === t.value
                                            ? '2px solid #22d3ee'
                                            : '2px solid transparent',
                                }}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* Count */}
                    {!loading && (
                        <p style={s.countLabel}>
                            {total} report{total !== 1 ? 's' : ''}
                        </p>
                    )}

                    {/* Error */}
                    {error && <div style={s.errBanner}>{error}</div>}

                    {/* Loading skeletons */}
                    {loading && (
                        <div style={s.list}>
                            {[0, 1, 2, 3].map((i) => (
                                <div key={i} style={s.skeleton} />
                            ))}
                        </div>
                    )}

                    {/* Empty */}
                    {!loading && complaints.length === 0 && (
                        <div style={s.empty}>
                            <p style={s.emptyText}>No complaints found.</p>
                            <Link to="/report" style={s.emptyLink}>
                                Submit your first report →
                            </Link>
                        </div>
                    )}

                    {/* List */}
                    {!loading && complaints.length > 0 && (
                        <div style={s.list}>
                            {complaints.map((c) => (
                                <ComplaintRow
                                    key={c._id}
                                    complaint={c}
                                    isSelected={selectedId === c._id}
                                    onClick={() =>
                                        setSelectedId(selectedId === c._id ? null : c._id)
                                    }
                                />
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
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
                </div>

                {/* ── Right: detail drawer ────────────────────────────────────── */}
                {selectedId && (
                    <DetailDrawer
                        key={selectedId}
                        complaintId={selectedId}
                        onClose={handleDrawerClose}
                    />
                )}
            </div>
        </div>
    );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(str) {
    if (!str) return '';
    return new Date(str).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

// ── Styles ────────────────────────────────────────────────────────────────────
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
    backLink: { fontSize: '0.82rem', color: '#94a3b8', textDecoration: 'none' },
    navTitle: { fontSize: '0.9rem', fontWeight: 600, color: '#e2e8f0' },
    newReportLink: {
        fontSize: '0.82rem',
        color: '#22d3ee',
        textDecoration: 'none',
        fontWeight: 600,
    },
    layout: { display: 'flex', height: 'calc(100vh - 56px)' },

    // ── List panel
    listPanel: {
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
    },
    tabs: { display: 'flex', gap: 0, borderBottom: '1px solid #1e293b', padding: '0 1.25rem' },
    tab: {
        padding: '0.75rem 0.875rem',
        fontSize: '0.78rem',
        fontWeight: 500,
        cursor: 'pointer',
        border: 'none',
        transition: 'all 0.15s',
    },
    countLabel: { fontSize: '0.72rem', color: '#475569', padding: '0.5rem 1.25rem 0', margin: 0 },
    errBanner: {
        background: '#450a0a',
        color: '#fca5a5',
        fontSize: '0.8rem',
        padding: '0.75rem 1.25rem',
        margin: '0.75rem 1.25rem',
        borderRadius: '0.5rem',
        border: '1px solid #7f1d1d',
    },
    list: {
        flex: 1,
        overflowY: 'auto',
        padding: '0.75rem 1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.625rem',
    },
    skeleton: {
        height: '68px',
        background: '#1e293b',
        borderRadius: '0.75rem',
        border: '1px solid #334155',
    },
    empty: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
        padding: '3rem',
    },
    emptyText: { color: '#475569', fontSize: '0.875rem', margin: 0 },
    emptyLink: { color: '#22d3ee', textDecoration: 'none', fontSize: '0.82rem' },
    pagination: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        padding: '1rem',
        borderTop: '1px solid #1e293b',
    },
    pageBtn: {
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '0.5rem',
        color: '#94a3b8',
        fontSize: '0.78rem',
        padding: '0.35rem 0.75rem',
        cursor: 'pointer',
    },
    pageLabel: { fontSize: '0.78rem', color: '#475569' },

    // ── Complaint row
    row: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.875rem',
        border: '1px solid',
        borderRadius: '0.75rem',
        padding: '0.875rem 1rem',
        cursor: 'pointer',
        transition: 'background 0.15s, border-color 0.15s',
    },
    rowIcon: { fontSize: '1.4rem', flexShrink: 0 },
    rowBody: { flex: 1, minWidth: 0 },
    rowTitle: {
        display: 'block',
        fontSize: '0.84rem',
        fontWeight: 600,
        color: '#e2e8f0',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    rowMeta: { display: 'block', fontSize: '0.7rem', color: '#475569', marginTop: '0.2rem' },
    rowRight: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '0.3rem',
        flexShrink: 0,
    },
    badge: {
        fontSize: '0.68rem',
        fontWeight: 600,
        padding: '0.18rem 0.55rem',
        borderRadius: '9999px',
    },
    sevDot: {
        fontSize: '0.62rem',
        fontWeight: 700,
        color: '#0f172a',
        padding: '0.12rem 0.4rem',
        borderRadius: '9999px',
    },

    // ── Detail drawer
    drawer: {
        width: '360px',
        flexShrink: 0,
        borderLeft: '1px solid #1e293b',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflowY: 'auto',
        background: '#1e293b',
    },
    drawerHeader: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem 1.25rem',
        borderBottom: '1px solid #334155',
        position: 'sticky',
        top: 0,
        background: '#1e293b',
        zIndex: 1,
    },
    drawerTitle: { fontSize: '0.875rem', fontWeight: 700, color: '#e2e8f0' },
    closeBtn: {
        background: 'none',
        border: 'none',
        color: '#64748b',
        fontSize: '1.25rem',
        cursor: 'pointer',
        lineHeight: 1,
    },
    drawerLoading: { padding: '2rem', color: '#475569', fontSize: '0.82rem', textAlign: 'center' },
    drawerErr: { padding: '1rem 1.25rem', color: '#fca5a5', fontSize: '0.82rem' },
    drawerBody: { padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' },
    drawerImg: { width: '100%', height: '180px', objectFit: 'cover', borderRadius: '0.625rem' },
    drawerCTitle: {
        fontSize: '1rem',
        fontWeight: 700,
        color: '#f1f5f9',
        margin: 0,
        lineHeight: 1.4,
    },
    drawerMeta: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' },
    drawerMetaItem: { fontSize: '0.72rem', color: '#64748b' },
    drawerDesc: { fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.6, margin: 0 },
    drawerAddr: { fontSize: '0.75rem', color: '#475569', margin: 0 },
    drawerDate: { fontSize: '0.7rem', color: '#334155', textAlign: 'right' },

    aiBox: {
        background: '#0f172a',
        borderRadius: '0.625rem',
        padding: '0.875rem',
        border: '1px solid #334155',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.4rem',
    },
    aiBoxLabel: {
        fontSize: '0.65rem',
        fontWeight: 600,
        color: '#475569',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
    },
    aiBoxRow: { display: 'flex', justifyContent: 'space-between' },
    aiBoxKey: { fontSize: '0.75rem', color: '#64748b' },
    aiBoxVal: { fontSize: '0.75rem', color: '#e2e8f0', fontWeight: 500 },
    manualTag: { fontSize: '0.68rem', color: '#a78bfa' },

    dupBox: {
        background: '#451a0311',
        border: '1px solid #92400e44',
        borderRadius: '0.5rem',
        padding: '0.75rem',
        fontSize: '0.78rem',
        color: '#fbbf24',
    },

    section: { display: 'flex', flexDirection: 'column', gap: '0.625rem' },
    sectionLabel: {
        fontSize: '0.65rem',
        fontWeight: 600,
        color: '#475569',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
    },

    // Timeline
    timeline: { display: 'flex', alignItems: 'flex-start', gap: 0 },
    timelineTerminal: { display: 'flex' },
    timelineStep: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.3rem',
        flex: 1,
        position: 'relative',
    },
    timelineDot: {
        width: '0.6rem',
        height: '0.6rem',
        borderRadius: '50%',
        flexShrink: 0,
        transition: 'background 0.3s, box-shadow 0.3s',
    },
    timelineLabel: { fontSize: '0.58rem', fontWeight: 500, textAlign: 'center', lineHeight: 1.2 },
    timelineLine: {
        position: 'absolute',
        top: '0.28rem',
        left: '50%',
        right: '-50%',
        height: '1px',
    },

    upvoteBtn: {
        border: '1px solid',
        borderRadius: '0.5rem',
        fontSize: '0.82rem',
        padding: '0.5rem 1rem',
        cursor: 'pointer',
        fontWeight: 500,
        transition: 'all 0.2s',
    },
    deleteBtn: {
        background: 'none',
        border: '1px solid #7f1d1d',
        borderRadius: '0.5rem',
        color: '#ef4444',
        fontSize: '0.78rem',
        padding: '0.5rem',
        cursor: 'pointer',
    },
};
