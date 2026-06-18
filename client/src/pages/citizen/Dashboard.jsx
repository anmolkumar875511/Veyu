// ─────────────────────────────────────────────────────────────────────────────
// src/pages/citizen/Dashboard.jsx
//
// Citizen home page. Shows:
//   - Greeting + reputation score
//   - Four city-wide stat cards
//   - "My Reports" feed with status polling every 30s
//   - Quick-links section
//   - Empty state with CTA
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCurrentUser, useLogout } from '../../hooks/useAuthGuards.js';
import { usePolling } from '../../hooks/usePolling.js';
import { getMyComplaintsApi, getCityStatsApi } from '../../api/complaints.api.js';

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_META = {
    submitted: { label: 'Submitted', color: '#94a3b8', bg: '#94a3b811' },
    verified: { label: 'Verified', color: '#3b82f6', bg: '#3b82f611' },
    assigned: { label: 'Assigned', color: '#a78bfa', bg: '#a78bfa11' },
    in_progress: { label: 'In Progress', color: '#f59e0b', bg: '#f59e0b11' },
    resolved: { label: 'Resolved', color: '#22c55e', bg: '#22c55e11' },
    rejected: { label: 'Rejected', color: '#ef4444', bg: '#ef444411' },
    duplicate: { label: 'Duplicate', color: '#64748b', bg: '#64748b11' },
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

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent, loading }) {
    return (
        <div style={{ ...s.statCard, borderTopColor: accent }}>
            {loading ? (
                <div style={s.shimmer} />
            ) : (
                <>
                    <span style={{ ...s.statValue, color: accent }}>{value ?? '—'}</span>
                    <span style={s.statLabel}>{label}</span>
                    {sub && <span style={s.statSub}>{sub}</span>}
                </>
            )}
        </div>
    );
}

function StatusBadge({ status }) {
    const meta = STATUS_META[status] ?? STATUS_META.submitted;
    return <span style={{ ...s.badge, color: meta.color, background: meta.bg }}>{meta.label}</span>;
}

function ComplaintCard({ complaint }) {
    const navigate = useNavigate();
    const icon = CATEGORY_ICONS[complaint.category] ?? '📋';
    const timeAgo = formatTimeAgo(complaint.createdAt);

    return (
        <div
            style={s.complaintCard}
            onClick={() => navigate('/my-reports')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/my-reports')}
        >
            <div style={s.cardIcon} aria-hidden="true">
                {icon}
            </div>

            <div style={s.cardBody}>
                <div style={s.cardTitleRow}>
                    <span style={s.cardTitle}>{complaint.title}</span>
                </div>
                <div style={s.cardMeta}>
                    <span style={s.cardCategory}>{complaint.category}</span>
                    <span style={s.metaDot}>·</span>
                    <span style={s.cardTime}>{timeAgo}</span>
                    {complaint.upvotes > 0 && (
                        <>
                            <span style={s.metaDot}>·</span>
                            <span style={s.cardUpvotes}>▲ {complaint.upvotes}</span>
                        </>
                    )}
                </div>
                {complaint.address && <span style={s.cardAddress}>📍 {complaint.address}</span>}
            </div>

            <div style={s.cardRight}>
                <StatusBadge status={complaint.status} />
                {complaint.severity && (
                    <span
                        style={{
                            ...s.severityDot,
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

function EmptyState() {
    return (
        <div style={s.emptyState}>
            <div style={s.emptyIcon} aria-hidden="true">
                🏙️
            </div>
            <h3 style={s.emptyHeading}>No reports yet</h3>
            <p style={s.emptySub}>
                Spotted a pothole, broken streetlight, or drainage issue?
                <br />
                Report it in under 30 seconds.
            </p>
            <Link to="/report" style={s.emptyBtn}>
                Report your first issue →
            </Link>
        </div>
    );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

export default function CitizenDashboard() {
    const user = useCurrentUser();
    const logout = useLogout();
    const navigate = useNavigate();

    const [complaints, setComplaints] = useState([]);
    const [cityStats, setCityStats] = useState(null);
    const [loadingFeed, setLoadingFeed] = useState(true);
    const [loadingStats, setLoadingStats] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // ── Fetch my complaints ────────────────────────────────────────────────────
    const fetchComplaints = useCallback(
        async (p = page) => {
            try {
                const result = await getMyComplaintsApi({ page: p, limit: 8 });
                setComplaints(result.complaints ?? []);
                setTotalPages(result.totalPages ?? 1);
                setError(null);
            } catch {
                setError('Could not load your reports. Pull down to retry.');
            } finally {
                setLoadingFeed(false);
            }
        },
        [page]
    );

    // ── Fetch city stats ───────────────────────────────────────────────────────
    const fetchStats = useCallback(async () => {
        try {
            const stats = await getCityStatsApi();
            setCityStats(stats);
        } catch {
            // non-fatal — show dashes
        } finally {
            setLoadingStats(false);
        }
    }, []);

    // ── Initial load ───────────────────────────────────────────────────────────
    useEffect(() => {
        fetchComplaints(1);
        fetchStats();
    }, []);

    // Re-fetch when page changes
    useEffect(() => {
        fetchComplaints(page);
    }, [page]);

    // ── Poll complaints every 30s for updated statuses ─────────────────────────
    usePolling(fetchComplaints, 30_000, complaints.length > 0);

    const firstName = user?.name?.split(' ')[0] ?? 'there';
    const greeting = getGreeting();

    return (
        <div style={s.page}>
            {/* ── Nav bar ─────────────────────────────────────────────────────── */}
            <header style={s.nav}>
                <div style={s.navBrand}>
                    <span style={s.brandDot} />
                    <span style={s.brandName}>Nagarik</span>
                </div>

                <div style={s.navRight}>
                    <Link to="/map" style={s.navLink}>
                        City Map
                    </Link>
                    <Link to="/my-reports" style={s.navLink}>
                        My Reports
                    </Link>
                    <button onClick={logout} style={s.navLogout}>
                        Sign out
                    </button>
                </div>
            </header>

            <main style={s.main}>
                {/* ── Greeting ──────────────────────────────────────────────────── */}
                <section style={s.greeting}>
                    <div>
                        <h1 style={s.greetingHeading}>
                            {greeting}, {firstName} 👋
                        </h1>
                        <p style={s.greetingSubtext}>
                            {(user?.reputationScore ?? 0) > 0
                                ? `You have ${user.reputationScore} reputation points. Keep reporting!`
                                : 'Help improve your city — report an issue today.'}
                        </p>
                    </div>
                    <Link to="/report" style={s.reportBtn}>
                        + Report Issue
                    </Link>
                </section>

                {/* ── City stats ────────────────────────────────────────────────── */}
                <section style={s.statsGrid}>
                    <StatCard
                        label="Open issues"
                        value={cityStats?.totalOpen}
                        sub="city-wide"
                        accent="#f59e0b"
                        loading={loadingStats}
                    />
                    <StatCard
                        label="Resolved today"
                        value={cityStats?.resolvedToday}
                        sub="last 24 hours"
                        accent="#22c55e"
                        loading={loadingStats}
                    />
                    <StatCard
                        label="Avg resolution"
                        value={
                            cityStats?.avgResolutionHours
                                ? `${cityStats.avgResolutionHours}h`
                                : null
                        }
                        sub="this month"
                        accent="#22d3ee"
                        loading={loadingStats}
                    />
                    <StatCard
                        label="Top issue"
                        value={cityStats?.topCategory}
                        sub="most reported"
                        accent="#a78bfa"
                        loading={loadingStats}
                    />
                </section>

                {/* ── My Reports ────────────────────────────────────────────────── */}
                <section style={s.feedSection}>
                    <div style={s.feedHeader}>
                        <h2 style={s.feedTitle}>My Reports</h2>
                        {complaints.length > 0 && (
                            <Link to="/my-reports" style={s.seeAllLink}>
                                See all →
                            </Link>
                        )}
                    </div>

                    {error && (
                        <div style={s.errorBanner} role="alert">
                            {error}
                            <button
                                onClick={() => {
                                    setError(null);
                                    fetchComplaints(page);
                                }}
                                style={s.retryBtn}
                            >
                                Retry
                            </button>
                        </div>
                    )}

                    {loadingFeed && (
                        <div style={s.feedList}>
                            {[0, 1, 2].map((i) => (
                                <div key={i} style={s.skeletonCard} />
                            ))}
                        </div>
                    )}

                    {!loadingFeed && !error && complaints.length === 0 && <EmptyState />}

                    {!loadingFeed && complaints.length > 0 && (
                        <>
                            <div style={s.feedList}>
                                {complaints.map((c) => (
                                    <ComplaintCard key={c._id} complaint={c} />
                                ))}
                            </div>

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
                                        style={{
                                            ...s.pageBtn,
                                            opacity: page >= totalPages ? 0.4 : 1,
                                        }}
                                    >
                                        Next →
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </section>

                {/* ── Quick links ───────────────────────────────────────────────── */}
                <section style={s.quickLinks}>
                    <Link to="/report" style={s.quickCard}>
                        <span style={s.quickIcon}>📸</span>
                        <span style={s.quickLabel}>Report Issue</span>
                        <span style={s.quickSub}>Photo + description</span>
                    </Link>
                    <Link to="/my-reports" style={s.quickCard}>
                        <span style={s.quickIcon}>📋</span>
                        <span style={s.quickLabel}>My Reports</span>
                        <span style={s.quickSub}>Track all submissions</span>
                    </Link>
                    <Link to="/map" style={s.quickCard}>
                        <span style={s.quickIcon}>🗺️</span>
                        <span style={s.quickLabel}>City Map</span>
                        <span style={s.quickSub}>Live issue heatmap</span>
                    </Link>
                </section>
            </main>
        </div>
    );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
}

function formatTimeAgo(dateStr) {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60_000);
    const hours = Math.floor(diff / 3_600_000);
    const days = Math.floor(diff / 86_400_000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
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
        zIndex: 100,
    },
    navBrand: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
    brandDot: {
        width: '0.55rem',
        height: '0.55rem',
        borderRadius: '50%',
        background: '#22d3ee',
        boxShadow: '0 0 8px #22d3ee88',
        display: 'inline-block',
    },
    brandName: {
        fontSize: '0.85rem',
        fontWeight: 700,
        color: '#e2e8f0',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
    },
    navRight: { display: 'flex', alignItems: 'center', gap: '1.25rem' },
    navLink: { fontSize: '0.82rem', color: '#94a3b8', textDecoration: 'none', fontWeight: 500 },
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
        maxWidth: '780px',
        margin: '0 auto',
        padding: '2rem 1.5rem 4rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '2.5rem',
    },
    greeting: {
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '1rem',
        flexWrap: 'wrap',
    },
    greetingHeading: {
        fontSize: '1.6rem',
        fontWeight: 800,
        color: '#f8fafc',
        margin: '0 0 0.35rem 0',
        letterSpacing: '-0.02em',
    },
    greetingSubtext: { fontSize: '0.875rem', color: '#64748b', margin: 0 },
    reportBtn: {
        display: 'inline-flex',
        alignItems: 'center',
        background: '#22d3ee',
        color: '#0f172a',
        fontSize: '0.875rem',
        fontWeight: 700,
        padding: '0.65rem 1.25rem',
        borderRadius: '0.625rem',
        textDecoration: 'none',
        whiteSpace: 'nowrap',
        flexShrink: 0,
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '1rem',
    },
    statCard: {
        background: '#1e293b',
        border: '1px solid #334155',
        borderTop: '3px solid transparent',
        borderRadius: '0.875rem',
        padding: '1.25rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.3rem',
    },
    statValue: { fontSize: '1.75rem', fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em' },
    statLabel: { fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 },
    statSub: { fontSize: '0.7rem', color: '#475569' },
    shimmer: {
        height: '3.5rem',
        background: '#334155',
        borderRadius: '0.375rem',
        animation: 'pulse 1.5s ease-in-out infinite',
    },
    feedSection: { display: 'flex', flexDirection: 'column', gap: '1rem' },
    feedHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    feedTitle: { fontSize: '1.05rem', fontWeight: 700, color: '#e2e8f0' },
    seeAllLink: { fontSize: '0.8rem', color: '#22d3ee', textDecoration: 'none' },
    errorBanner: {
        background: '#450a0a',
        border: '1px solid #7f1d1d',
        borderRadius: '0.625rem',
        color: '#fca5a5',
        fontSize: '0.84rem',
        padding: '0.75rem 1rem',
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
    feedList: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
    skeletonCard: {
        height: '72px',
        background: '#1e293b',
        borderRadius: '0.875rem',
        border: '1px solid #334155',
        animation: 'pulse 1.5s ease-in-out infinite',
    },
    complaintCard: {
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        background: '#1e293b',
        border: '1px solid #1e293b',
        borderRadius: '0.875rem',
        padding: '1rem 1.125rem',
        cursor: 'pointer',
    },
    cardIcon: { fontSize: '1.5rem', flexShrink: 0 },
    cardBody: { flex: 1, minWidth: 0 },
    cardTitleRow: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' },
    cardTitle: {
        fontSize: '0.875rem',
        fontWeight: 600,
        color: '#e2e8f0',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    cardMeta: { display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' },
    cardCategory: { fontSize: '0.72rem', color: '#94a3b8' },
    metaDot: { color: '#334155', fontSize: '0.7rem' },
    cardTime: { fontSize: '0.72rem', color: '#475569' },
    cardUpvotes: { fontSize: '0.72rem', color: '#f59e0b' },
    cardAddress: {
        display: 'block',
        fontSize: '0.7rem',
        color: '#475569',
        marginTop: '0.2rem',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    cardRight: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '0.35rem',
        flexShrink: 0,
    },
    badge: {
        fontSize: '0.7rem',
        fontWeight: 600,
        padding: '0.2rem 0.6rem',
        borderRadius: '9999px',
    },
    severityDot: {
        fontSize: '0.65rem',
        fontWeight: 600,
        color: '#0f172a',
        padding: '0.15rem 0.45rem',
        borderRadius: '9999px',
    },
    emptyState: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.875rem',
        padding: '3rem 1.5rem',
        textAlign: 'center',
        background: '#1e293b',
        borderRadius: '1rem',
        border: '1px dashed #334155',
    },
    emptyIcon: { fontSize: '2.5rem' },
    emptyHeading: { fontSize: '1.1rem', fontWeight: 700, color: '#e2e8f0' },
    emptySub: { fontSize: '0.85rem', color: '#64748b', lineHeight: 1.6, margin: 0 },
    emptyBtn: {
        display: 'inline-block',
        marginTop: '0.5rem',
        background: '#22d3ee',
        color: '#0f172a',
        fontSize: '0.875rem',
        fontWeight: 700,
        padding: '0.65rem 1.5rem',
        borderRadius: '0.625rem',
        textDecoration: 'none',
    },
    pagination: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1.25rem',
        marginTop: '0.5rem',
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
    quickLinks: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '0.875rem',
    },
    quickCard: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.35rem',
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '0.875rem',
        padding: '1.25rem 1rem',
        textDecoration: 'none',
    },
    quickIcon: { fontSize: '1.5rem' },
    quickLabel: { fontSize: '0.875rem', fontWeight: 600, color: '#e2e8f0' },
    quickSub: { fontSize: '0.72rem', color: '#475569' },
};
