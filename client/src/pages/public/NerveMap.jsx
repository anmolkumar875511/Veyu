// src/pages/public/NerveMap.jsx

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { usePolling } from '../../hooks/usePolling.js';
import { getPulseGridSnapshotApi, getWardLeaderboardApi } from '../../api/ward.api.js';
import {
    PageShell, NavBar, NavBrand, NavLink, NavCta,
    ErrorBanner, SkeletonGrid, SkeletonRows,
    StressBand, StressBandLegend, VelocityBar,
} from '../../components/admin/AdminShell.jsx';
import { NerveMapView } from '../../components/shared/NerveMapView.jsx';
import { color, font, space, radius, transition } from '../../theme/index.js';
import { STRESS_BAND_META } from '../../constants/complaint.constants.js';

// ── Stress tile (PulseGrid card) ──────────────────────────────────────────────
function StressTile({ ward }) {
    const meta = STRESS_BAND_META[ward.stressBand] ?? STRESS_BAND_META.stable;
    return (
        <div style={{
            background: color.bgSurface,
            border: `1px solid ${meta.color}44`,
            borderRadius: radius.xl,
            padding: space[5],
            display: 'flex', flexDirection: 'column', gap: space[3],
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: color.textMuted, fontWeight: font.weight.semibold }}>
                    Ward {ward.wardNumber}
                </span>
                <StressBand band={ward.stressBand} />
            </div>

            <span style={{ fontSize: font.size.base, fontWeight: font.weight.bold, color: color.textPrimary }}>
                {ward.name}
            </span>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                {[
                    { value: `${ward.pulseVelocity?.toFixed(1)}×`, label: 'velocity' },
                    { value: ward.complaintsLast48h,                label: 'last 48h' },
                    { value: ward.healthScore,                      label: 'health'   },
                ].map(({ value, label }) => (
                    <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '1rem', fontWeight: font.weight.extrabold, color: color.textPrimary }}>
                            {value}
                        </span>
                        <span style={{ fontSize: '0.62rem', color: color.textMuted }}>{label}</span>
                    </div>
                ))}
            </div>

            <VelocityBar velocity={ward.pulseVelocity} band={ward.stressBand} />
        </div>
    );
}

// ── Leaderboard row ───────────────────────────────────────────────────────────
function LeaderRow({ ward }) {
    const meta  = STRESS_BAND_META[ward.stressBand] ?? STRESS_BAND_META.stable;
    const isTop = ward.rank === 1;

    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: space[4],
            background: isTop ? `${color.success}08` : color.bgSurface,
            border: `1px solid ${isTop ? `${color.success}33` : color.borderDefault}`,
            borderRadius: radius.xl, padding: `${space[4]} ${space[5]}`,
        }}>
            <span style={{
                fontSize: font.size.md, fontWeight: font.weight.extrabold,
                color: isTop ? color.success : color.textMuted,
                width: '2.25rem', flexShrink: 0,
            }}>
                #{ward.rank}
            </span>

            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                <span style={{ fontSize: font.size.base, fontWeight: font.weight.semibold, color: color.textPrimary }}>
                    {ward.name}
                </span>
                <span style={{ fontSize: font.size.xs, color: color.textMuted }}>Ward {ward.wardNumber}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.1rem' }}>
                <span style={{ fontSize: font.size.sm, color: color.textSecondary, fontWeight: font.weight.semibold }}>
                    {ward.stats?.resolutionRate ?? 0}% resolved
                </span>
                <span style={{ fontSize: font.size.xs, color: color.textMuted }}>
                    {ward.stats?.avgResolutionHours ? `${ward.stats.avgResolutionHours}h avg` : '—'}
                </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: space[2], flexShrink: 0 }}>
                <span style={{ fontSize: font.size.md, fontWeight: font.weight.extrabold, color: color.accent }}>
                    {ward.healthScore}
                </span>
                <span style={{
                    width: '0.5rem', height: '0.5rem', borderRadius: radius.full,
                    background: meta.color, display: 'inline-block',
                }} />
            </div>
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function PublicNerveMap() {
    const { isAuthenticated, user } = useAuth();

    const [pulseWards,  setPulseWards]  = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading,     setLoading]     = useState(true);
    const [error,       setError]       = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    const fetchAll = useCallback(async () => {
        try {
            const [pulse, board] = await Promise.all([
                getPulseGridSnapshotApi(),
                getWardLeaderboardApi(),
            ]);
            setPulseWards(pulse.wards ?? []);
            setLeaderboard(board.wards ?? []);
            setLastUpdated(new Date());
            setError(null);
        } catch { setError('Could not load city data.'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchAll(); }, []);
    usePolling(fetchAll, 60_000, true);

    const emergencyCount = pulseWards.filter((w) => w.stressBand === 'emergency').length;
    const criticalCount  = pulseWards.filter((w) => w.stressBand === 'critical').length;

    const dashLink = isAuthenticated
        ? (user?.role === 'citizen' ? '/dashboard' : '/war-room')
        : null;

    return (
        <PageShell>
            <NavBar
                left={<NavBrand />}
                right={
                    <>
                        {isAuthenticated ? (
                            <NavLink to={dashLink}>Go to dashboard →</NavLink>
                        ) : (
                            <>
                                <NavLink to="/login">Sign in</NavLink>
                                <NavCta to="/register">Get started</NavCta>
                            </>
                        )}
                    </>
                }
            />

            <main style={{
                maxWidth: '920px', margin: '0 auto',
                padding: `${space[10]} ${space[6]} ${space[16]}`,
                display: 'flex', flexDirection: 'column', gap: space[10],
            }}>
                {/* Hero */}
                <section style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: space[3], alignItems: 'center' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: font.weight.extrabold, color: color.textPrimary, margin: 0, letterSpacing: font.tracking.tight }}>
                        City Pulse
                    </h1>
                    <p style={{ fontSize: font.size.base, color: color.textMuted, margin: 0, maxWidth: '420px', lineHeight: 1.6 }}>
                        Live infrastructure health across every ward — updated automatically every 60 seconds.
                    </p>
                    {lastUpdated && (
                        <span style={{ fontSize: font.size.xs, color: color.textMuted }}>
                            Last updated {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    )}
                </section>

                <ErrorBanner message={error} />

                {/* Alert banner */}
                {!loading && (emergencyCount > 0 || criticalCount > 0) && (
                    <div style={{
                        background: '#7c2d1215', border: '1px solid #f9731644',
                        borderRadius: radius.lg, padding: `${space[3]} ${space[5]}`,
                        fontSize: font.size.sm, color: '#fb923c',
                        textAlign: 'center', fontWeight: font.weight.bold,
                    }}>
                        ⚡{' '}
                        {emergencyCount > 0 && `${emergencyCount} ward${emergencyCount !== 1 ? 's' : ''} in emergency`}
                        {emergencyCount > 0 && criticalCount > 0 && ' · '}
                        {criticalCount > 0  && `${criticalCount} ward${criticalCount !== 1 ? 's' : ''} critical`}
                    </div>
                )}

                {/* PulseGrid — Live Map */}
                <section style={{ display: 'flex', flexDirection: 'column', gap: space[5] }}>
                    <div>
                        <h2 style={{ fontSize: '1.15rem', fontWeight: font.weight.bold, color: color.textPrimary, margin: `0 0 ${space[1]} 0` }}>
                            PulseGrid — Live Stress Map
                        </h2>
                        <p style={{ fontSize: font.size.sm, color: color.textMuted, margin: 0 }}>
                            Velocity, not volume — a ward where complaints are accelerating ranks above one with more complaints filed slowly.
                        </p>
                    </div>

                    {loading
                        ? <SkeletonGrid count={1} height="480px" minCol="100%" />
                        : (
                            <NerveMapView
                                wards={pulseWards}
                                height="480px"
                            />
                        )
                    }
                </section>

                {/* PulseGrid tile cards — quick scan below the map */}
                {!loading && pulseWards.length > 0 && (
                    <section style={{ display: 'flex', flexDirection: 'column', gap: space[4] }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: font.weight.bold, color: color.textPrimary, margin: 0 }}>
                            Ward Breakdown
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: space[3] }}>
                            {pulseWards.map((w) => <StressTile key={w._id ?? w.wardNumber} ward={w} />)}
                        </div>
                        <StressBandLegend />
                    </section>
                )}

                {/* Leaderboard */}
                <section style={{ display: 'flex', flexDirection: 'column', gap: space[5] }}>
                    <div>
                        <h2 style={{ fontSize: '1.15rem', fontWeight: font.weight.bold, color: color.textPrimary, margin: `0 0 ${space[1]} 0` }}>
                            Ward Accountability Leaderboard
                        </h2>
                        <p style={{ fontSize: font.size.sm, color: color.textMuted, margin: 0 }}>
                            Ranked by health score — resolution rate, speed, and backlog.
                        </p>
                    </div>

                    {loading
                        ? <SkeletonRows count={4} height="72px" />
                        : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: space[2] }}>
                                {leaderboard.map((w) => <LeaderRow key={w._id ?? w.wardNumber} ward={w} />)}
                            </div>
                        )
                    }
                </section>
            </main>
        </PageShell>
    );
}