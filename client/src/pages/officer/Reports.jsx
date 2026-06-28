// src/pages/officer/Reports.jsx

import { useState, useEffect } from 'react';
import { useCurrentUser } from '../../hooks/useAuthGuards.js';
import { getWardReportApi } from '../../api/officer.api.js';
import {
    PageShell,
    NavBar,
    BackLink,
    NavTitle,
    ErrorBanner,
    SectionLabel,
} from '../../components/officer/OfficerShell.jsx';
import { NotificationBell } from '../../components/shared/NotificationBell.jsx';
import { color, font, space, radius } from '../../theme/index.js';
import { COMPLAINT_STATUS_LABELS, STATUS_META } from '../../constants/complaint.constants.js';

// ── Stat block ────────────────────────────────────────────────────────────────
function StatBlock({ label, value, sub, accent }) {
    return (
        <div
            style={{
                background: color.bgSurface,
                border: `1px solid ${color.borderDefault}`,
                borderTop: `3px solid ${accent}`,
                borderRadius: radius.xl,
                padding: `${space[5]} ${space[4]}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem',
            }}
        >
            <span
                style={{
                    fontSize: '1.4rem',
                    fontWeight: font.weight.extrabold,
                    color: accent,
                    textTransform: 'capitalize',
                    lineHeight: 1,
                }}
            >
                {value ?? '—'}
            </span>
            <span style={{ fontSize: font.size.xs, color: color.textSecondary }}>{label}</span>
            {sub && <span style={{ fontSize: '0.68rem', color: color.textMuted }}>{sub}</span>}
        </div>
    );
}

// ── Status breakdown bar ──────────────────────────────────────────────────────
function StatusBar({ breakdown }) {
    const total = Object.values(breakdown).reduce((a, b) => a + b, 0) || 1;
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: space[3] }}>
            <div
                style={{
                    display: 'flex',
                    height: '10px',
                    borderRadius: radius.full,
                    overflow: 'hidden',
                    background: color.bgSurface,
                }}
            >
                {Object.entries(breakdown).map(([status, count]) =>
                    count > 0 ? (
                        <div
                            key={status}
                            style={{
                                width: `${(count / total) * 100}%`,
                                background: STATUS_META[status]?.color ?? color.borderDefault,
                                height: '100%',
                            }}
                            title={`${COMPLAINT_STATUS_LABELS[status]}: ${count}`}
                        />
                    ) : null
                )}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: space[4] }}>
                {Object.entries(breakdown)
                    .filter(([, c]) => c > 0)
                    .map(([status, count]) => (
                        <span
                            key={status}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                fontSize: font.size.xs,
                                color: color.textSecondary,
                            }}
                        >
                            <span
                                style={{
                                    width: '0.5rem',
                                    height: '0.5rem',
                                    borderRadius: radius.full,
                                    background: STATUS_META[status]?.color ?? color.borderDefault,
                                    display: 'inline-block',
                                }}
                            />
                            {COMPLAINT_STATUS_LABELS[status]} ({count})
                        </span>
                    ))}
            </div>
        </div>
    );
}

// ── Category bar chart ────────────────────────────────────────────────────────
function CategoryBreakdown({ breakdown }) {
    if (!breakdown?.length) {
        return (
            <p style={{ fontSize: font.size.sm, color: color.textMuted }}>
                No complaints in the last 30 days.
            </p>
        );
    }
    const max = breakdown[0].count;
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: space[2] }}>
            {breakdown.map((c) => (
                <div key={c._id} style={{ display: 'flex', alignItems: 'center', gap: space[3] }}>
                    <span
                        style={{
                            fontSize: font.size.sm,
                            color: color.textSecondary,
                            width: '120px',
                            flexShrink: 0,
                        }}
                    >
                        {c._id}
                    </span>
                    <div
                        style={{
                            flex: 1,
                            height: '8px',
                            background: color.bgSurface,
                            borderRadius: radius.full,
                            overflow: 'hidden',
                        }}
                    >
                        <div
                            style={{
                                width: `${(c.count / max) * 100}%`,
                                height: '100%',
                                background: color.accent,
                                borderRadius: radius.full,
                            }}
                        />
                    </div>
                    <span
                        style={{
                            fontSize: font.size.xs,
                            color: color.textMuted,
                            width: '24px',
                            textAlign: 'right',
                        }}
                    >
                        {c.count}
                    </span>
                </div>
            ))}
        </div>
    );
}

// ── Worker leaderboard ────────────────────────────────────────────────────────
function Leaderboard({ workers }) {
    if (!workers?.length) {
        return (
            <p style={{ fontSize: font.size.sm, color: color.textMuted }}>
                No completed tasks yet.
            </p>
        );
    }
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: space[2] }}>
            {workers.map((w, i) => (
                <div
                    key={i}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: space[3],
                        background: color.bgSurface,
                        border: `1px solid ${color.borderDefault}`,
                        borderRadius: radius.lg,
                        padding: `${space[3]} ${space[4]}`,
                    }}
                >
                    <span
                        style={{
                            fontSize: font.size.sm,
                            fontWeight: font.weight.bold,
                            color: color.textMuted,
                            width: '1.75rem',
                        }}
                    >
                        #{i + 1}
                    </span>
                    <span
                        style={{
                            fontSize: font.size.base,
                            fontWeight: font.weight.semibold,
                            color: color.textPrimary,
                            flex: 1,
                        }}
                    >
                        {w.name}
                    </span>
                    <span style={{ fontSize: font.size.xs, color: color.textMuted }}>
                        {w.completedCount} completed
                    </span>
                    <span
                        style={{
                            fontSize: font.size.sm,
                            color: '#eab308',
                            fontWeight: font.weight.bold,
                        }}
                    >
                        ★ {w.fieldPoints}
                    </span>
                </div>
            ))}
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────
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
        <PageShell>
            <NavBar
                left={<BackLink to="/war-room">← War Room</BackLink>}
                right={
                    <>
                        <NotificationBell />
                        <NavTitle>Ward Reports</NavTitle>
                    </>
                }
            />

            <main
                style={{
                    maxWidth: '800px',
                    margin: '0 auto',
                    padding: `${space[6]} ${space[6]} ${space[16]}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: space[8],
                }}
            >
                {loading && (
                    <p style={{ fontSize: font.size.sm, color: color.textMuted }}>
                        Loading report…
                    </p>
                )}
                <ErrorBanner message={error} />

                {report && (
                    <>
                        <div>
                            <h1
                                style={{
                                    fontSize: '1.5rem',
                                    fontWeight: font.weight.extrabold,
                                    color: color.textPrimary,
                                    margin: `0 0 ${space[1]} 0`,
                                }}
                            >
                                {report.ward.name}
                            </h1>
                            <p
                                style={{
                                    fontSize: font.size.sm,
                                    color: color.textMuted,
                                    margin: 0,
                                }}
                            >
                                Ward {report.ward.wardNumber} · {report.ward.city}
                            </p>
                        </div>

                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                                gap: space[4],
                            }}
                        >
                            <StatBlock
                                label="Health Score"
                                value={`${report.ward.healthScore}/100`}
                                accent={color.accent}
                            />
                            <StatBlock
                                label="Avg Resolution"
                                value={
                                    report.avgResolutionHours
                                        ? `${report.avgResolutionHours}h`
                                        : null
                                }
                                sub="last 30 days"
                                accent="#a78bfa"
                            />
                            <StatBlock
                                label="Resolved"
                                value={report.resolvedCount30d}
                                sub="last 30 days"
                                accent={color.success}
                            />
                            <StatBlock
                                label="Stress Band"
                                value={report.ward.stressBand}
                                accent="#f59e0b"
                            />
                        </div>

                        <section
                            style={{ display: 'flex', flexDirection: 'column', gap: space[4] }}
                        >
                            <h2
                                style={{
                                    fontSize: font.size.md,
                                    fontWeight: font.weight.bold,
                                    color: color.textPrimary,
                                    margin: 0,
                                }}
                            >
                                Status Breakdown
                            </h2>
                            <StatusBar breakdown={report.statusBreakdown} />
                        </section>

                        <section
                            style={{ display: 'flex', flexDirection: 'column', gap: space[4] }}
                        >
                            <h2
                                style={{
                                    fontSize: font.size.md,
                                    fontWeight: font.weight.bold,
                                    color: color.textPrimary,
                                    margin: 0,
                                }}
                            >
                                Top Categories (30 days)
                            </h2>
                            <CategoryBreakdown breakdown={report.categoryBreakdown} />
                        </section>

                        <section
                            style={{ display: 'flex', flexDirection: 'column', gap: space[4] }}
                        >
                            <h2
                                style={{
                                    fontSize: font.size.md,
                                    fontWeight: font.weight.bold,
                                    color: color.textPrimary,
                                    margin: 0,
                                }}
                            >
                                Worker Leaderboard
                            </h2>
                            <Leaderboard workers={report.workerLeaderboard} />
                        </section>
                    </>
                )}
            </main>
        </PageShell>
    );
}
