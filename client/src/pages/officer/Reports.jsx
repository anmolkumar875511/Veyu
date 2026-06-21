// ─────────────────────────────────────────────────────────────────────────────
// src/pages/officer/Reports.jsx
//
// Ward analytics dashboard for the officer's assigned ward.
// Shows status breakdown, category breakdown, avg resolution time,
// and a worker leaderboard.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCurrentUser } from '../../hooks/useAuthGuards.js';
import { getWardReportApi } from '../../api/officer.api.js';
import { COMPLAINT_STATUS_LABELS } from '../../constants/complaint.constants.js';

const STATUS_COLORS = {
    submitted: '#94a3b8',
    verified: '#3b82f6',
    assigned: '#a78bfa',
    in_progress: '#f59e0b',
    resolved: '#22c55e',
    rejected: '#ef4444',
    duplicate: '#64748b',
};

function StatBlock({ label, value, sub, accent }) {
    return (
        <div style={{ ...s.statBlock, borderTopColor: accent }}>
            <span style={{ ...s.statValue, color: accent }}>{value ?? '—'}</span>
            <span style={s.statLabel}>{label}</span>
            {sub && <span style={s.statSub}>{sub}</span>}
        </div>
    );
}

function StatusBar({ breakdown }) {
    const total = Object.values(breakdown).reduce((a, b) => a + b, 0) || 1;
    return (
        <div style={s.statusBarWrap}>
            <div style={s.statusBarTrack}>
                {Object.entries(breakdown).map(
                    ([status, count]) =>
                        count > 0 && (
                            <div
                                key={status}
                                style={{
                                    width: `${(count / total) * 100}%`,
                                    background: STATUS_COLORS[status] ?? '#475569',
                                    height: '100%',
                                }}
                                title={`${COMPLAINT_STATUS_LABELS[status]}: ${count}`}
                            />
                        )
                )}
            </div>
            <div style={s.statusLegend}>
                {Object.entries(breakdown)
                    .filter(([, c]) => c > 0)
                    .map(([status, count]) => (
                        <span key={status} style={s.legendItem}>
                            <span style={{ ...s.legendDot, background: STATUS_COLORS[status] }} />
                            {COMPLAINT_STATUS_LABELS[status]} ({count})
                        </span>
                    ))}
            </div>
        </div>
    );
}

export default function OfficerReports() {
    const user = useCurrentUser();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const wardId = user?.assignedWard?._id ?? user?.assignedWard;
        if (!wardId) {
            setError('No ward assigned to your account.');
            setLoading(false);
            return;
        }
        getWardReportApi(wardId)
            .then(setReport)
            .catch(() => setError('Could not load ward report.'))
            .finally(() => setLoading(false));
    }, [user]);

    return (
        <div style={s.page}>
            <header style={s.nav}>
                <Link to="/war-room" style={s.backLink}>
                    ← War Room
                </Link>
                <span style={s.navTitle}>Ward Reports</span>
                <span />
            </header>

            <main style={s.main}>
                {loading && <p style={s.dimText}>Loading report…</p>}
                {error && <div style={s.errorBanner}>{error}</div>}

                {report && (
                    <>
                        <div style={s.headerRow}>
                            <h1 style={s.heading}>{report.ward.name}</h1>
                            <p style={s.subheading}>
                                Ward {report.ward.wardNumber} · {report.ward.city}
                            </p>
                        </div>

                        {/* Top stats */}
                        <div style={s.statsGrid}>
                            <StatBlock
                                label="Health Score"
                                value={`${report.ward.healthScore}/100`}
                                accent="#22d3ee"
                            />
                            <StatBlock
                                label="Avg Resolution"
                                value={
                                    report.avgResolutionHours
                                        ? `${report.avgResolutionHours}h`
                                        : '—'
                                }
                                sub="last 30 days"
                                accent="#a78bfa"
                            />
                            <StatBlock
                                label="Resolved"
                                value={report.resolvedCount30d}
                                sub="last 30 days"
                                accent="#22c55e"
                            />
                            <StatBlock
                                label="Stress Band"
                                value={report.ward.stressBand}
                                accent="#f59e0b"
                            />
                        </div>

                        {/* Status breakdown */}
                        <section style={s.section}>
                            <h2 style={s.sectionTitle}>Status Breakdown</h2>
                            <StatusBar breakdown={report.statusBreakdown} />
                        </section>

                        {/* Category breakdown */}
                        <section style={s.section}>
                            <h2 style={s.sectionTitle}>Top Categories (30 days)</h2>
                            <div style={s.categoryList}>
                                {report.categoryBreakdown.length === 0 ? (
                                    <p style={s.dimText}>No complaints in the last 30 days.</p>
                                ) : (
                                    report.categoryBreakdown.map((c) => {
                                        const max = report.categoryBreakdown[0].count;
                                        return (
                                            <div key={c._id} style={s.categoryRow}>
                                                <span style={s.categoryName}>{c._id}</span>
                                                <div style={s.categoryBarTrack}>
                                                    <div
                                                        style={{
                                                            ...s.categoryBarFill,
                                                            width: `${(c.count / max) * 100}%`,
                                                        }}
                                                    />
                                                </div>
                                                <span style={s.categoryCount}>{c.count}</span>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </section>

                        {/* Worker leaderboard */}
                        <section style={s.section}>
                            <h2 style={s.sectionTitle}>Worker Leaderboard</h2>
                            {report.workerLeaderboard.length === 0 ? (
                                <p style={s.dimText}>No completed tasks yet.</p>
                            ) : (
                                <div style={s.leaderboard}>
                                    {report.workerLeaderboard.map((w, i) => (
                                        <div key={i} style={s.leaderRow}>
                                            <span style={s.leaderRank}>#{i + 1}</span>
                                            <span style={s.leaderName}>{w.name}</span>
                                            <span style={s.leaderStat}>
                                                {w.completedCount} completed
                                            </span>
                                            <span style={s.leaderPoints}>★ {w.fieldPoints}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </>
                )}
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
    backLink: { fontSize: '0.82rem', color: '#94a3b8', textDecoration: 'none' },
    navTitle: { fontSize: '0.9rem', fontWeight: 600, color: '#e2e8f0' },
    main: {
        maxWidth: '800px',
        margin: '0 auto',
        padding: '1.75rem 1.5rem 4rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
    },
    dimText: { fontSize: '0.85rem', color: '#475569' },
    errorBanner: {
        background: '#450a0a',
        border: '1px solid #7f1d1d',
        borderRadius: '0.5rem',
        color: '#fca5a5',
        fontSize: '0.84rem',
        padding: '0.75rem 1rem',
    },
    headerRow: {},
    heading: { fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 0.25rem 0' },
    subheading: { fontSize: '0.82rem', color: '#64748b', margin: 0 },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '1rem',
    },
    statBlock: {
        background: '#1e293b',
        border: '1px solid #334155',
        borderTop: '3px solid transparent',
        borderRadius: '0.875rem',
        padding: '1.1rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
    },
    statValue: { fontSize: '1.4rem', fontWeight: 800, textTransform: 'capitalize' },
    statLabel: { fontSize: '0.75rem', color: '#94a3b8' },
    statSub: { fontSize: '0.68rem', color: '#475569' },
    section: { display: 'flex', flexDirection: 'column', gap: '0.875rem' },
    sectionTitle: { fontSize: '1rem', fontWeight: 700, color: '#e2e8f0', margin: 0 },
    statusBarWrap: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
    statusBarTrack: {
        display: 'flex',
        height: '10px',
        borderRadius: '9999px',
        overflow: 'hidden',
        background: '#1e293b',
    },
    statusLegend: { display: 'flex', flexWrap: 'wrap', gap: '0.875rem' },
    legendItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.35rem',
        fontSize: '0.75rem',
        color: '#94a3b8',
    },
    legendDot: { width: '0.5rem', height: '0.5rem', borderRadius: '50%' },
    categoryList: { display: 'flex', flexDirection: 'column', gap: '0.625rem' },
    categoryRow: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
    categoryName: { fontSize: '0.8rem', color: '#cbd5e1', width: '120px', flexShrink: 0 },
    categoryBarTrack: {
        flex: 1,
        height: '8px',
        background: '#1e293b',
        borderRadius: '9999px',
        overflow: 'hidden',
    },
    categoryBarFill: { height: '100%', background: '#22d3ee', borderRadius: '9999px' },
    categoryCount: { fontSize: '0.78rem', color: '#475569', width: '24px', textAlign: 'right' },
    leaderboard: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
    leaderRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.875rem',
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '0.625rem',
        padding: '0.75rem 1rem',
    },
    leaderRank: { fontSize: '0.8rem', fontWeight: 700, color: '#475569', width: '1.75rem' },
    leaderName: { fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0', flex: 1 },
    leaderStat: { fontSize: '0.75rem', color: '#64748b' },
    leaderPoints: { fontSize: '0.78rem', color: '#eab308', fontWeight: 600 },
};
