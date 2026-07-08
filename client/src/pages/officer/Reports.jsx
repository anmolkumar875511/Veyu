// src/pages/officer/Reports.jsx

import { useState, useEffect } from 'react';
import { ArrowLeft, Star } from 'lucide-react';
import { useCurrentUser } from '../../hooks/useAuthGuards.js';
import { getWardReportApi } from '../../api/officer.api.js';
import { PageShell, NavBar, BackLink, NavTitle, ErrorBanner } from '../../components/officer/OfficerShell.jsx';
import { NotificationBell } from '../../components/shared/NotificationBell.jsx';
import { COMPLAINT_STATUS_LABELS, STATUS_META } from '../../constants/complaint.constants.js';
import { getStatusTheme } from '../../lib/roleTheme';
import { cn } from '../../lib/utils';

// ── Stat block ────────────────────────────────────────────────────────────────
const ACCENT_TONE = {
    primary: { border: 'border-t-primary-500', text: 'text-primary-600' },
    violet: { border: 'border-t-violet-500', text: 'text-violet-600' },
    emerald: { border: 'border-t-emerald-500', text: 'text-emerald-600' },
    amber: { border: 'border-t-amber-500', text: 'text-amber-600' },
};

function StatBlock({ label, value, sub, accent = 'primary' }) {
    const tone = ACCENT_TONE[accent] ?? ACCENT_TONE.primary;
    return (
        <div className={cn('flex flex-col gap-1 rounded-xl border border-t-[3px] border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4', tone.border)}>
            <span className={cn('text-2xl font-extrabold capitalize leading-none', tone.text)}>{value ?? '—'}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
            {sub && <span className="text-[0.68rem] text-slate-400 dark:text-slate-500">{sub}</span>}
        </div>
    );
}

// ── Status breakdown bar ──────────────────────────────────────────────────────
function StatusBar({ breakdown }) {
    const total = Object.values(breakdown).reduce((a, b) => a + b, 0) || 1;
    return (
        <div className="flex flex-col gap-3">
            <div className="flex h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                {Object.entries(breakdown).map(([status, count]) => {
                    if (count <= 0) return null;
                    const theme = getStatusTheme(status);
                    return (
                        <div
                            key={status}
                            style={{ width: `${(count / total) * 100}%` }}
                            className={cn('h-full', theme.dot)}
                            title={`${COMPLAINT_STATUS_LABELS[status]}: ${count}`}
                        />
                    );
                })}
            </div>
            <div className="flex flex-wrap gap-4">
                {Object.entries(breakdown)
                    .filter(([, c]) => c > 0)
                    .map(([status, count]) => {
                        const theme = getStatusTheme(status);
                        return (
                            <span key={status} className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                <span className={cn('inline-block size-2 rounded-full', theme.dot)} />
                                {COMPLAINT_STATUS_LABELS[status]} ({count})
                            </span>
                        );
                    })}
            </div>
        </div>
    );
}

// ── Category bar chart ────────────────────────────────────────────────────────
function CategoryBreakdown({ breakdown }) {
    if (!breakdown?.length) {
        return <p className="text-sm text-slate-400 dark:text-slate-500">No complaints in the last 30 days.</p>;
    }
    const max = breakdown[0].count;
    return (
        <div className="flex flex-col gap-2">
            {breakdown.map((c) => (
                <div key={c._id} className="flex items-center gap-3">
                    <span className="w-28 shrink-0 text-sm text-slate-600 dark:text-slate-300">{c._id}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div className="h-full rounded-full bg-primary-500" style={{ width: `${(c.count / max) * 100}%` }} />
                    </div>
                    <span className="w-6 text-right text-xs text-slate-400 dark:text-slate-500">{c.count}</span>
                </div>
            ))}
        </div>
    );
}

// ── Worker leaderboard ────────────────────────────────────────────────────────
function Leaderboard({ workers }) {
    if (!workers?.length) {
        return <p className="text-sm text-slate-400 dark:text-slate-500">No completed tasks yet.</p>;
    }
    return (
        <div className="flex flex-col gap-2">
            {workers.map((w, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3">
                    <span className="w-7 text-sm font-bold text-slate-400 dark:text-slate-500">#{i + 1}</span>
                    <span className="flex-1 text-sm font-semibold text-slate-900 dark:text-white">{w.name}</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">{w.completedCount} completed</span>
                    <span className="flex items-center gap-1 text-sm font-bold text-amber-500">
                        <Star className="size-3.5 fill-amber-500" /> {w.fieldPoints}
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
                left={
                    <BackLink to="/war-room">
                        <span className="flex items-center gap-1">
                            <ArrowLeft className="size-4" /> War Room
                        </span>
                    </BackLink>
                }
                right={
                    <>
                        <NotificationBell />
                        <NavTitle>Ward Reports</NavTitle>
                    </>
                }
            />

            <main className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-6 pb-16 sm:px-6 xl:px-10">
                {loading && <p className="text-sm text-slate-400 dark:text-slate-500">Loading report…</p>}
                <ErrorBanner message={error} />

                {report && (
                    <>
                        <div>
                            <h1 className="mb-1 text-2xl font-extrabold text-slate-900 dark:text-white">{report.ward.name}</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Ward {report.ward.wardNumber} · {report.ward.city}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                            <StatBlock label="Health Score" value={`${report.ward.healthScore}/100`} accent="primary" />
                            <StatBlock
                                label="Avg Resolution"
                                value={report.avgResolutionHours ? `${report.avgResolutionHours}h` : null}
                                sub="last 30 days"
                                accent="violet"
                            />
                            <StatBlock label="Resolved" value={report.resolvedCount30d} sub="last 30 days" accent="emerald" />
                            <StatBlock label="Stress Band" value={report.ward.stressBand} accent="amber" />
                        </div>

                        <section className="flex flex-col gap-4">
                            <h2 className="text-base font-bold text-slate-900 dark:text-white">Status Breakdown</h2>
                            <StatusBar breakdown={report.statusBreakdown} />
                        </section>

                        <section className="flex flex-col gap-4">
                            <h2 className="text-base font-bold text-slate-900 dark:text-white">Top Categories (30 days)</h2>
                            <CategoryBreakdown breakdown={report.categoryBreakdown} />
                        </section>

                        <section className="flex flex-col gap-4">
                            <h2 className="text-base font-bold text-slate-900 dark:text-white">Worker Leaderboard</h2>
                            <Leaderboard workers={report.workerLeaderboard} />
                        </section>
                    </>
                )}
            </main>
        </PageShell>
    );
}
