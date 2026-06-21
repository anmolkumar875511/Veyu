// ─────────────────────────────────────────────────────────────────────────────
// src/pages/worker/Tasks.jsx
//
// Field worker's task feed. Shows assigned complaints route-ordered.
// Tap a task to view detail and advance/complete it.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCurrentUser, useLogout } from '../../hooks/useAuthGuards.js';
import { usePolling } from '../../hooks/usePolling.js';
import { getMyTasksApi, getWorkerSummaryApi } from '../../api/worker.api.js';
import { ASSIGNMENT_STATUS_LABELS } from '../../constants/complaint.constants.js';

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

const STATUS_COLORS = {
    pending: '#94a3b8',
    acknowledged: '#3b82f6',
    en_route: '#f59e0b',
    on_site: '#a78bfa',
};

function TaskCard({ task, index, onClick }) {
    const complaint = task.complaintId;
    const icon = CATEGORY_ICONS[complaint?.category] ?? '📋';
    const color = STATUS_COLORS[task.status] ?? '#94a3b8';

    return (
        <div
            style={s.card}
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onClick()}
        >
            <span style={s.cardIndex}>{index + 1}</span>
            <span style={s.cardIcon}>{icon}</span>
            <div style={s.cardBody}>
                <span style={s.cardTitle}>{complaint?.title ?? 'Task'}</span>
                <span style={s.cardSub}>
                    {complaint?.category} · {complaint?.address ?? 'No address'}
                </span>
                {task.instructions && (
                    <span style={s.cardInstructions}>📝 {task.instructions}</span>
                )}
            </div>
            <div style={s.cardRight}>
                <span style={{ ...s.statusBadge, color, background: `${color}1a` }}>
                    {ASSIGNMENT_STATUS_LABELS[task.status]}
                </span>
                {complaint?.severity && (
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

export default function WorkerTasks() {
    const user = useCurrentUser();
    const logout = useLogout();
    const navigate = useNavigate();

    const [tasks, setTasks] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchTasks = useCallback(async () => {
        try {
            const result = await getMyTasksApi();
            setTasks(result.tasks ?? []);
            setError(null);
        } catch {
            setError('Could not load your tasks.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTasks();
        getWorkerSummaryApi()
            .then(setSummary)
            .catch(() => {});
    }, []);

    usePolling(fetchTasks, 30_000, true);

    return (
        <div style={s.page}>
            <header style={s.nav}>
                <div style={s.navBrand}>
                    <span style={s.brandDot} />
                    <span style={s.brandName}>Nagarik</span>
                    <span style={s.navDivider}>·</span>
                    <span style={s.navRole}>Field Tasks</span>
                </div>
                <div style={s.navRight}>
                    <Link to="/observations" style={s.navLink}>
                        FieldMesh
                    </Link>
                    <button onClick={logout} style={s.navLogout}>
                        Sign out
                    </button>
                </div>
            </header>

            <main style={s.main}>
                {/* Greeting + summary */}
                <section style={s.greeting}>
                    <div>
                        <h1 style={s.greetingHeading}>Hi, {user?.name?.split(' ')[0]} 👋</h1>
                        <p style={s.greetingSub}>
                            {summary
                                ? `${summary.pendingCount} pending · ${summary.completedCount} completed · ★ ${summary.worker.fieldPoints} points`
                                : 'Loading your stats…'}
                        </p>
                    </div>
                    <Link to="/observations" style={s.fieldMeshBtn}>
                        + Report Observation
                    </Link>
                </section>

                {/* Task feed */}
                <section style={s.feedSection}>
                    <h2 style={s.feedTitle}>Today's Route</h2>

                    {error && <div style={s.errorBanner}>{error}</div>}

                    {loading ? (
                        <div style={s.skeletonList}>
                            {[0, 1, 2].map((i) => (
                                <div key={i} style={s.skeleton} />
                            ))}
                        </div>
                    ) : tasks.length === 0 ? (
                        <div style={s.empty}>
                            <span style={s.emptyIcon}>🎉</span>
                            <p style={s.emptyText}>No tasks assigned right now.</p>
                            <Link to="/observations" style={s.emptyLink}>
                                Submit a FieldMesh observation →
                            </Link>
                        </div>
                    ) : (
                        <div style={s.list}>
                            {tasks.map((t, i) => (
                                <TaskCard
                                    key={t._id}
                                    task={t}
                                    index={i}
                                    onClick={() => navigate(`/tasks/${t._id}`)}
                                />
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
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
    navLink: { fontSize: '0.82rem', color: '#22d3ee', textDecoration: 'none', fontWeight: 600 },
    navLogout: {
        background: 'none',
        border: '1px solid #334155',
        borderRadius: '0.375rem',
        color: '#94a3b8',
        fontSize: '0.78rem',
        padding: '0.3rem 0.7rem',
        cursor: 'pointer',
    },
    main: {
        maxWidth: '640px',
        margin: '0 auto',
        padding: '1.75rem 1.25rem 4rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
    },
    greeting: {
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '1rem',
        flexWrap: 'wrap',
    },
    greetingHeading: {
        fontSize: '1.4rem',
        fontWeight: 800,
        color: '#f8fafc',
        margin: '0 0 0.3rem 0',
    },
    greetingSub: { fontSize: '0.8rem', color: '#64748b', margin: 0 },
    fieldMeshBtn: {
        background: '#a78bfa22',
        border: '1px solid #a78bfa66',
        borderRadius: '0.625rem',
        color: '#c4b5fd',
        fontSize: '0.8rem',
        fontWeight: 600,
        padding: '0.55rem 1rem',
        textDecoration: 'none',
        whiteSpace: 'nowrap',
    },
    feedSection: { display: 'flex', flexDirection: 'column', gap: '1rem' },
    feedTitle: { fontSize: '1.05rem', fontWeight: 700, color: '#e2e8f0', margin: 0 },
    errorBanner: {
        background: '#450a0a',
        border: '1px solid #7f1d1d',
        borderRadius: '0.5rem',
        color: '#fca5a5',
        fontSize: '0.84rem',
        padding: '0.75rem 1rem',
    },
    skeletonList: { display: 'flex', flexDirection: 'column', gap: '0.625rem' },
    skeleton: {
        height: '76px',
        background: '#1e293b',
        borderRadius: '0.75rem',
        border: '1px solid #334155',
    },
    empty: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.625rem',
        padding: '3rem 1rem',
        textAlign: 'center',
        background: '#1e293b',
        borderRadius: '1rem',
        border: '1px dashed #334155',
    },
    emptyIcon: { fontSize: '2rem' },
    emptyText: { fontSize: '0.875rem', color: '#64748b', margin: 0 },
    emptyLink: { fontSize: '0.8rem', color: '#22d3ee', textDecoration: 'none' },
    list: { display: 'flex', flexDirection: 'column', gap: '0.625rem' },
    card: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '0.875rem',
        padding: '0.875rem 1rem',
        cursor: 'pointer',
    },
    cardIndex: {
        fontSize: '0.78rem',
        fontWeight: 700,
        color: '#475569',
        width: '1.25rem',
        flexShrink: 0,
    },
    cardIcon: { fontSize: '1.4rem', flexShrink: 0 },
    cardBody: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.15rem' },
    cardTitle: {
        fontSize: '0.86rem',
        fontWeight: 600,
        color: '#e2e8f0',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    cardSub: { fontSize: '0.72rem', color: '#475569' },
    cardInstructions: { fontSize: '0.72rem', color: '#a78bfa', marginTop: '0.15rem' },
    cardRight: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '0.3rem',
        flexShrink: 0,
    },
    statusBadge: {
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
};
