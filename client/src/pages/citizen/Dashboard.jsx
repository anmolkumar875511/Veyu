// src/pages/citizen/Dashboard.jsx

import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Camera, ClipboardList, Map, MapPin, Plus, TrendingUp, ChevronRight } from 'lucide-react';
import { useCurrentUser } from '../../hooks/useAuthGuards.js';
import { usePolling } from '../../hooks/usePolling.js';
import { getMyComplaintsApi, getCityStatsApi } from '../../api/complaints.api.js';
import {
    PageShell,
    NavBar,
    NavBrand,
    StatusBadge,
    SeverityPip,
    EmptyState,
    ErrorBanner,
    Skeleton,
    Pagination,
    AccentLink,
} from '../../components/citizen/CitizenShell.jsx';
import { NotificationBell } from '../../components/shared/NotificationBell.jsx';
import { cn } from '../../lib/utils';
import { getCategoryIcon } from '../../constants/categoryIcons.js';

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
}

function formatTimeAgo(dateStr) {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60_000),
        hours = Math.floor(diff / 3_600_000),
        days = Math.floor(diff / 86_400_000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

const ACCENTS = {
    amber: { border: 'border-t-amber-500', text: 'text-amber-600' },
    emerald: { border: 'border-t-emerald-500', text: 'text-emerald-600' },
    primary: { border: 'border-t-primary-500', text: 'text-primary-600' },
    violet: { border: 'border-t-violet-500', text: 'text-violet-600' },
};

function StatCard({ label, value, sub, accent = 'primary', loading }) {
    const tone = ACCENTS[accent] ?? ACCENTS.primary;
    return (
        <div className={cn('flex flex-col gap-1 rounded-xl border border-t-[3px] border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5', tone.border)}>
            {loading ? (
                <div className="h-14 animate-pulse rounded-md bg-slate-100 dark:bg-slate-800" />
            ) : (
                <>
                    <span className={cn('text-[1.75rem] font-extrabold leading-none tracking-tight', tone.text)}>
                        {value ?? '—'}
                    </span>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
                    {sub && <span className="text-[0.68rem] text-slate-400 dark:text-slate-500">{sub}</span>}
                </>
            )}
        </div>
    );
}

function ComplaintCard({ complaint }) {
    const navigate = useNavigate();
    const Icon = getCategoryIcon(complaint.category);
    return (
        <div
            onClick={() => navigate('/my-reports')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/my-reports')}
            className="flex cursor-pointer items-center gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 transition-shadow duration-150 hover:shadow-[var(--shadow-card-hover)] sm:p-5"
        >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                <Icon className="size-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-slate-900 dark:text-white sm:text-base">
                    {complaint.title}
                </span>
                <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                    <span className="text-xs text-slate-500 dark:text-slate-400">{complaint.category}</span>
                    <span className="text-slate-300 dark:text-slate-600">·</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">{formatTimeAgo(complaint.createdAt)}</span>
                    {complaint.upvotes > 0 && (
                        <>
                            <span className="text-slate-300 dark:text-slate-600">·</span>
                            <span className="flex items-center gap-0.5 text-xs text-amber-600">
                                <TrendingUp className="size-3" /> {complaint.upvotes}
                            </span>
                        </>
                    )}
                </div>
                {complaint.address && (
                    <span className="mt-0.5 flex items-center gap-1 truncate text-[0.68rem] text-slate-400 dark:text-slate-500">
                        <MapPin className="size-3 shrink-0" /> {complaint.address}
                    </span>
                )}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
                <StatusBadge status={complaint.status} />
                <SeverityPip severity={complaint.severity} />
            </div>
        </div>
    );
}

const QUICK_LINKS = [
    { to: '/report', icon: Camera, label: 'Report Issue', sub: 'Photo + description' },
    { to: '/my-reports', icon: ClipboardList, label: 'My Reports', sub: 'Track submissions' },
    { to: '/map', icon: Map, label: 'City Map', sub: 'Live heatmap' },
];

export default function CitizenDashboard() {
    const user = useCurrentUser();

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
            // non-critical — stats simply stay empty
        } finally {
            setLoadingStats(false);
        }
    }, []);

    useEffect(() => {
        fetchComplaints(1);
        fetchStats();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    useEffect(() => {
        fetchComplaints(page);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);
    usePolling(fetchComplaints, 30_000, complaints.length > 0);

    const firstName = user?.name?.split(' ')[0] ?? 'there';

    return (
        <PageShell>
            <NavBar
                left={<NavBrand />}
                right={<NotificationBell />}
            />
            <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 pb-16 sm:gap-10 sm:px-6 sm:py-10 xl:px-10">
                <motion.section
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-wrap items-start justify-between gap-4"
                >
                    <div>
                        <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                            {getGreeting()}, {firstName}
                        </h1>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 sm:text-base">
                            {(user?.reputationScore ?? 0) > 0
                                ? `${user.reputationScore} reputation points — keep reporting!`
                                : 'Help improve your city — report an issue today.'}
                        </p>
                    </div>
                    <AccentLink to="/report">
                        <Plus className="mr-1.5 -ml-0.5 size-4" /> Report Issue
                    </AccentLink>
                </motion.section>

                <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <StatCard label="Open issues" value={cityStats?.totalOpen} sub="city-wide" accent="amber" loading={loadingStats} />
                    <StatCard
                        label="Resolved today"
                        value={cityStats?.resolvedToday}
                        sub="last 24 hours"
                        accent="emerald"
                        loading={loadingStats}
                    />
                    <StatCard
                        label="Avg resolution"
                        value={cityStats?.avgResolutionHours ? `${cityStats.avgResolutionHours}h` : null}
                        sub="this month"
                        accent="primary"
                        loading={loadingStats}
                    />
                    <StatCard label="Top issue" value={cityStats?.topCategory} sub="most reported" accent="violet" loading={loadingStats} />
                </section>

                <section className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-bold text-slate-900 dark:text-white">My Reports</h2>
                        {complaints.length > 0 && (
                            <Link
                                to="/my-reports"
                                className="flex items-center gap-0.5 text-sm text-primary-600 hover:text-primary-700"
                            >
                                See all <ChevronRight className="size-3.5" />
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
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            <Skeleton height="72px" count={3} />
                        </div>
                    )}
                    {!loadingFeed && !error && complaints.length === 0 && (
                        <EmptyState
                            icon={ClipboardList}
                            heading="No reports yet"
                            sub="Spotted a pothole, broken streetlight, or drainage issue? Report it in under 30 seconds."
                            cta="Report your first issue"
                            ctaTo="/report"
                        />
                    )}
                    {!loadingFeed && complaints.length > 0 && (
                        <>
                            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                {complaints.map((c) => (
                                    <ComplaintCard key={c._id} complaint={c} />
                                ))}
                            </div>
                            <Pagination
                                page={page}
                                totalPages={totalPages}
                                onPrev={() => setPage((p) => p - 1)}
                                onNext={() => setPage((p) => p + 1)}
                                className="mt-2"
                            />
                        </>
                    )}
                </section>

                <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {QUICK_LINKS.map(({ to, icon: Icon, label, sub }) => (
                        <Link
                            key={to}
                            to={to}
                            className="flex flex-col gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-shadow duration-150 hover:shadow-[var(--shadow-card-hover)]"
                        >
                            <Icon className="size-6 text-primary-600" aria-hidden="true" />
                            <span className="text-sm font-semibold text-slate-900 dark:text-white">{label}</span>
                            <span className="text-xs text-slate-400 dark:text-slate-500">{sub}</span>
                        </Link>
                    ))}
                </section>
            </main>
        </PageShell>
    );
}
