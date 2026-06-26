// src/pages/citizen/Dashboard.jsx

import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCurrentUser, useLogout } from '../../hooks/useAuthGuards.js';
import { usePolling } from '../../hooks/usePolling.js';
import { getMyComplaintsApi, getCityStatsApi } from '../../api/complaints.api.js';
import {
    PageShell,
    NavBar,
    NavBrand,
    NavLink,
    NavButton,
    StatusBadge,
    SeverityPip,
    EmptyState,
    ErrorBanner,
    Skeleton,
    Pagination,
    AccentLink,
} from '../../components/citizen/CitizenShell.jsx';
import { color, font, space, radius, shadow, transition } from '../../theme/index.js';
import { CATEGORY_ICONS } from '../../constants/complaint.constants.js';

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

// ── StatCard ──────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accentColor, loading }) {
    return (
        <div
            style={{
                background: color.bgSurface,
                border: `1px solid ${color.borderDefault}`,
                borderTop: `3px solid ${accentColor}`,
                borderRadius: radius.xl,
                padding: `${space[5]} ${space[4]}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.3rem',
            }}
        >
            {loading ? (
                <div
                    style={{
                        height: '3.5rem',
                        background: color.borderDefault,
                        borderRadius: radius.sm,
                    }}
                />
            ) : (
                <>
                    <span
                        style={{
                            fontSize: '1.75rem',
                            fontWeight: font.weight.extrabold,
                            color: accentColor,
                            lineHeight: 1,
                            letterSpacing: '-0.03em',
                        }}
                    >
                        {value ?? '—'}
                    </span>
                    <span
                        style={{
                            fontSize: font.size.xs,
                            color: color.textSecondary,
                            fontWeight: font.weight.medium,
                        }}
                    >
                        {label}
                    </span>
                    {sub && (
                        <span style={{ fontSize: '0.68rem', color: color.textMuted }}>{sub}</span>
                    )}
                </>
            )}
        </div>
    );
}

// ── ComplaintCard ─────────────────────────────────────────────────────────────
function ComplaintCard({ complaint }) {
    const navigate = useNavigate();
    const icon = CATEGORY_ICONS[complaint.category] ?? '📋';

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: space[4],
                background: color.bgSurface,
                border: `1px solid ${color.borderFaint}`,
                borderRadius: radius.xl,
                padding: `${space[4]} ${space[5]}`,
                cursor: 'pointer',
                transition: transition.fast,
            }}
            onClick={() => navigate('/my-reports')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/my-reports')}
        >
            <div style={{ fontSize: '1.5rem', flexShrink: 0 }}>{icon}</div>

            <div style={{ flex: 1, minWidth: 0 }}>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: space[2],
                        marginBottom: space[1],
                    }}
                >
                    <span
                        style={{
                            fontSize: font.size.base,
                            fontWeight: font.weight.semibold,
                            color: color.textPrimary,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {complaint.title}
                    </span>
                </div>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        flexWrap: 'wrap',
                    }}
                >
                    <span style={{ fontSize: font.size.xs, color: color.textSecondary }}>
                        {complaint.category}
                    </span>
                    <span style={{ color: color.borderDefault, fontSize: font.size.xs }}>·</span>
                    <span style={{ fontSize: font.size.xs, color: color.textMuted }}>
                        {formatTimeAgo(complaint.createdAt)}
                    </span>
                    {complaint.upvotes > 0 && (
                        <>
                            <span style={{ color: color.borderDefault, fontSize: font.size.xs }}>
                                ·
                            </span>
                            <span style={{ fontSize: font.size.xs, color: '#f59e0b' }}>
                                ▲ {complaint.upvotes}
                            </span>
                        </>
                    )}
                </div>
                {complaint.address && (
                    <span
                        style={{
                            display: 'block',
                            fontSize: '0.68rem',
                            color: color.textMuted,
                            marginTop: '0.2rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        📍 {complaint.address}
                    </span>
                )}
            </div>

            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: space[1],
                    flexShrink: 0,
                }}
            >
                <StatusBadge status={complaint.status} />
                <SeverityPip severity={complaint.severity} />
            </div>
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function CitizenDashboard() {
    const user = useCurrentUser();
    const logout = useLogout();

    const [complaints, setComplaints] = useState([]);
    const [cityStats, setCityStats] = useState(null);
    const [loadingFeed, setLoadingFeed] = useState(true);
    const [loadingStats, setLoadingStats] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchComplaints = useCallback(
        async (p = page) => {
            try {
                const result = await getMyComplaintsApi({ page: p, limit: 8 });
                setComplaints(result.complaints ?? []);
                setTotalPages(result.totalPages ?? 1);
                setError(null);
            } catch {
                setError('Could not load your reports.');
            } finally {
                setLoadingFeed(false);
            }
        },
        [page]
    );

    const fetchStats = useCallback(async () => {
        try {
            setCityStats(await getCityStatsApi());
        } catch {
            /* non-fatal */
        } finally {
            setLoadingStats(false);
        }
    }, []);

    useEffect(() => {
        fetchComplaints(1);
        fetchStats();
    }, []);
    useEffect(() => {
        fetchComplaints(page);
    }, [page]);
    usePolling(fetchComplaints, 30_000, complaints.length > 0);

    const firstName = user?.name?.split(' ')[0] ?? 'there';

    return (
        <PageShell>
            <NavBar
                left={<NavBrand />}
                right={
                    <div style={{ display: 'flex', alignItems: 'center', gap: space[5] }}>
                        <NavLink to="/map">City Map</NavLink>
                        <NavLink to="/my-reports">My Reports</NavLink>
                        <NavButton onClick={logout}>Sign out</NavButton>
                    </div>
                }
            />

            <main
                style={{
                    maxWidth: '780px',
                    margin: '0 auto',
                    padding: `${space[8]} ${space[6]} ${space[16]}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: space[10],
                }}
            >
                {/* Greeting */}
                <section
                    style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: space[4],
                        flexWrap: 'wrap',
                    }}
                >
                    <div>
                        <h1
                            style={{
                                fontSize: '1.6rem',
                                fontWeight: font.weight.extrabold,
                                color: color.textPrimary,
                                margin: `0 0 ${space[1]} 0`,
                                letterSpacing: font.tracking.tight,
                            }}
                        >
                            {getGreeting()}, {firstName} 👋
                        </h1>
                        <p style={{ fontSize: font.size.base, color: color.textMuted, margin: 0 }}>
                            {(user?.reputationScore ?? 0) > 0
                                ? `${user.reputationScore} reputation points — keep reporting!`
                                : 'Help improve your city — report an issue today.'}
                        </p>
                    </div>
                    <AccentLink to="/report">+ Report Issue</AccentLink>
                </section>

                {/* City stats */}
                <section
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                        gap: space[4],
                    }}
                >
                    <StatCard
                        label="Open issues"
                        value={cityStats?.totalOpen}
                        sub="city-wide"
                        accentColor="#f59e0b"
                        loading={loadingStats}
                    />
                    <StatCard
                        label="Resolved today"
                        value={cityStats?.resolvedToday}
                        sub="last 24 hours"
                        accentColor={color.success}
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
                        accentColor={color.accent}
                        loading={loadingStats}
                    />
                    <StatCard
                        label="Top issue"
                        value={cityStats?.topCategory}
                        sub="most reported"
                        accentColor="#a78bfa"
                        loading={loadingStats}
                    />
                </section>

                {/* My Reports feed */}
                <section style={{ display: 'flex', flexDirection: 'column', gap: space[4] }}>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}
                    >
                        <h2
                            style={{
                                fontSize: font.size.md,
                                fontWeight: font.weight.bold,
                                color: color.textPrimary,
                                margin: 0,
                            }}
                        >
                            My Reports
                        </h2>
                        {complaints.length > 0 && (
                            <Link
                                to="/my-reports"
                                style={{
                                    fontSize: font.size.sm,
                                    color: color.accent,
                                    textDecoration: 'none',
                                }}
                            >
                                See all →
                            </Link>
                        )}
                    </div>

                    <ErrorBanner
                        message={error}
                        onRetry={() => {
                            setError(null);
                            fetchComplaints(page);
                        }}
                    />

                    {loadingFeed && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: space[3] }}>
                            <Skeleton height="72px" count={3} />
                        </div>
                    )}

                    {!loadingFeed && !error && complaints.length === 0 && (
                        <EmptyState
                            heading="No reports yet"
                            sub="Spotted a pothole, broken streetlight, or drainage issue? Report it in under 30 seconds."
                            cta="Report your first issue →"
                            ctaTo="/report"
                        />
                    )}

                    {!loadingFeed && complaints.length > 0 && (
                        <>
                            <div
                                style={{ display: 'flex', flexDirection: 'column', gap: space[3] }}
                            >
                                {complaints.map((c) => (
                                    <ComplaintCard key={c._id} complaint={c} />
                                ))}
                            </div>
                            <Pagination
                                page={page}
                                totalPages={totalPages}
                                onPrev={() => setPage((p) => p - 1)}
                                onNext={() => setPage((p) => p + 1)}
                                style={{ marginTop: space[2] }}
                            />
                        </>
                    )}
                </section>

                {/* Quick links */}
                <section
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                        gap: space[3],
                    }}
                >
                    {[
                        {
                            to: '/report',
                            icon: '📸',
                            label: 'Report Issue',
                            sub: 'Photo + description',
                        },
                        {
                            to: '/my-reports',
                            icon: '📋',
                            label: 'My Reports',
                            sub: 'Track all submissions',
                        },
                        { to: '/map', icon: '🗺️', label: 'City Map', sub: 'Live issue heatmap' },
                    ].map(({ to, icon, label, sub }) => (
                        <Link
                            key={to}
                            to={to}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.35rem',
                                background: color.bgSurface,
                                border: `1px solid ${color.borderDefault}`,
                                borderRadius: radius.xl,
                                padding: `${space[5]} ${space[4]}`,
                                textDecoration: 'none',
                            }}
                        >
                            <span style={{ fontSize: '1.5rem' }}>{icon}</span>
                            <span
                                style={{
                                    fontSize: font.size.base,
                                    fontWeight: font.weight.semibold,
                                    color: color.textPrimary,
                                }}
                            >
                                {label}
                            </span>
                            <span style={{ fontSize: font.size.xs, color: color.textMuted }}>
                                {sub}
                            </span>
                        </Link>
                    ))}
                </section>
            </main>
        </PageShell>
    );
}
