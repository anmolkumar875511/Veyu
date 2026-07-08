// src/pages/public/NerveMap.jsx

import { useState, useEffect, useCallback } from 'react';
import { ArrowRight, Trophy, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { usePolling } from '../../hooks/usePolling.js';
import { getPulseGridSnapshotApi, getWardLeaderboardApi } from '../../api/ward.api.js';
import {
    PageShell,
    NavBar,
    NavBrand,
    NavLink,
    NavCta,
    ErrorBanner,
    SkeletonGrid,
    SkeletonRows,
    StressBand,
    StressBandLegend,
    VelocityBar,
} from '../../components/admin/AdminShell.jsx';
import { NerveMapView } from '../../components/shared/NerveMapView.jsx';
import { STRESS_BAND_META } from '../../constants/complaint.constants.js';
import { cn } from '../../lib/utils';

// ── Stress tile (PulseGrid card) ──────────────────────────────────────────────
function StressTile({ ward }) {
    const meta = STRESS_BAND_META[ward.stressBand] ?? STRESS_BAND_META.stable;
    return (
        <div className="flex flex-col gap-3 rounded-xl border bg-white dark:bg-slate-900 p-5" style={{ borderColor: `${meta.color}44` }}>
            <div className="flex items-center justify-between">
                <span className="text-[0.7rem] font-semibold text-slate-400 dark:text-slate-500">Ward {ward.wardNumber}</span>
                <StressBand band={ward.stressBand} />
            </div>

            <span className="text-base font-bold text-slate-900 dark:text-white">{ward.name}</span>

            <div className="flex justify-between">
                {[
                    { value: `${ward.pulseVelocity?.toFixed(1)}×`, label: 'velocity' },
                    { value: ward.complaintsLast48h, label: 'last 48h' },
                    { value: ward.healthScore, label: 'health' },
                ].map(({ value, label }) => (
                    <div key={label} className="flex flex-col items-center gap-0.5">
                        <span className="text-base font-extrabold text-slate-900 dark:text-white">{value}</span>
                        <span className="text-[0.62rem] text-slate-400 dark:text-slate-500">{label}</span>
                    </div>
                ))}
            </div>

            <VelocityBar velocity={ward.pulseVelocity} band={ward.stressBand} />
        </div>
    );
}

// ── Leaderboard row ───────────────────────────────────────────────────────────
function LeaderRow({ ward }) {
    const meta = STRESS_BAND_META[ward.stressBand] ?? STRESS_BAND_META.stable;
    const isTop = ward.rank === 1;

    return (
        <div
            className={cn(
                'flex items-center gap-4 rounded-xl border px-5 py-4',
                isTop ? 'border-emerald-200 bg-emerald-50/40' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
            )}
        >
            <span className={cn('w-9 shrink-0 text-lg font-extrabold', isTop ? 'text-emerald-600' : 'text-slate-400 dark:text-slate-500')}>
                #{ward.rank}
            </span>

            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">{ward.name}</span>
                <span className="text-xs text-slate-400 dark:text-slate-500">Ward {ward.wardNumber}</span>
            </div>

            <div className="flex flex-col items-end gap-0.5">
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{ward.stats?.resolutionRate ?? 0}% resolved</span>
                <span className="text-xs text-slate-400 dark:text-slate-500">
                    {ward.stats?.avgResolutionHours ? `${ward.stats.avgResolutionHours}h avg` : '—'}
                </span>
            </div>

            <div className="flex shrink-0 items-center gap-2">
                <span className="text-lg font-extrabold text-primary-600">{ward.healthScore}</span>
                <span className="inline-block size-2 rounded-full" style={{ background: meta.color }} />
            </div>
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function PublicNerveMap() {
    const { isAuthenticated, user } = useAuth();

    const [pulseWards, setPulseWards] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    const fetchAll = useCallback(async () => {
        try {
            const [pulse, board] = await Promise.all([getPulseGridSnapshotApi(), getWardLeaderboardApi()]);
            setPulseWards(pulse.wards ?? []);
            setLeaderboard(board.wards ?? []);
            setLastUpdated(new Date());
            setError(null);
        } catch {
            setError('Could not load city data.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);
    usePolling(fetchAll, 60_000, true);

    const emergencyCount = pulseWards.filter((w) => w.stressBand === 'emergency').length;
    const criticalCount = pulseWards.filter((w) => w.stressBand === 'critical').length;

    const dashLink = isAuthenticated ? (user?.role === 'citizen' ? '/dashboard' : '/war-room') : null;

    return (
        <PageShell>
            <NavBar
                left={<NavBrand />}
                right={
                    isAuthenticated ? (
                        <NavLink to={dashLink}>
                            <span className="flex items-center gap-1">
                                Go to dashboard <ArrowRight className="size-3.5" />
                            </span>
                        </NavLink>
                    ) : (
                        <>
                            <NavLink to="/login">Sign in</NavLink>
                            <NavCta to="/register">Get started</NavCta>
                        </>
                    )
                }
            />

            <main className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 pb-16 sm:px-6 xl:px-10">
                {/* Hero */}
                <section className="flex flex-col items-center gap-3 text-center">
                    <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">City Pulse</h1>
                    <p className="max-w-md text-base leading-relaxed text-slate-500 dark:text-slate-400">
                        Live infrastructure health across every ward — updated automatically every 60 seconds.
                    </p>
                    {lastUpdated && (
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                            Last updated {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    )}
                </section>

                <ErrorBanner message={error} />

                {/* Alert banner */}
                {!loading && (emergencyCount > 0 || criticalCount > 0) && (
                    <div className="flex items-center justify-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-5 py-3 text-center text-sm font-bold text-orange-600">
                        <Zap className="size-4 shrink-0" />
                        {emergencyCount > 0 && `${emergencyCount} ward${emergencyCount !== 1 ? 's' : ''} in emergency`}
                        {emergencyCount > 0 && criticalCount > 0 && ' · '}
                        {criticalCount > 0 && `${criticalCount} ward${criticalCount !== 1 ? 's' : ''} critical`}
                    </div>
                )}

                {/* PulseGrid — Live Map */}
                <section className="flex flex-col gap-5">
                    <div>
                        <h2 className="mb-1 text-lg font-bold text-slate-900 dark:text-white">PulseGrid — Live Stress Map</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Velocity, not volume — a ward where complaints are accelerating ranks above one with more complaints
                            filed slowly.
                        </p>
                    </div>

                    {loading ? <SkeletonGrid count={1} height="480px" minCol="100%" /> : <NerveMapView wards={pulseWards} height="480px" />}
                </section>

                {/* PulseGrid tile cards — quick scan below the map */}
                {!loading && pulseWards.length > 0 && (
                    <section className="flex flex-col gap-4">
                        <h2 className="text-base font-bold text-slate-900 dark:text-white">Ward Breakdown</h2>
                        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
                            {pulseWards.map((w) => (
                                <StressTile key={w._id ?? w.wardNumber} ward={w} />
                            ))}
                        </div>
                        <StressBandLegend />
                    </section>
                )}

                {/* Leaderboard */}
                <section className="flex flex-col gap-5">
                    <div>
                        <h2 className="mb-1 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
                            <Trophy className="size-5 text-amber-500" /> Ward Accountability Leaderboard
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Ranked by health score — resolution rate, speed, and backlog.</p>
                    </div>

                    {loading ? (
                        <SkeletonRows count={4} height="72px" />
                    ) : (
                        <div className="flex flex-col gap-2">
                            {leaderboard.map((w) => (
                                <LeaderRow key={w._id ?? w.wardNumber} ward={w} />
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </PageShell>
    );
}
