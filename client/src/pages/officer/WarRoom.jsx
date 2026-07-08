// src/pages/officer/WarRoom.jsx

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ChevronUp, Zap } from 'lucide-react';
import { useCurrentUser } from '../../hooks/useAuthGuards.js';
import { usePolling } from '../../hooks/usePolling.js';
import { getTriageQueueApi } from '../../api/officer.api.js';
import {
    PageShell,
    NavBar,
    NavBrand,
    NavUser,
    StatusBadge,
    SeverityBar,
    ErrorBanner,
    SkeletonRows,
    EmptyState,
    FilterTabs,
    Pagination,
} from '../../components/officer/OfficerShell.jsx';
import { NotificationBell } from '../../components/shared/NotificationBell.jsx';
import { getCategoryIcon } from '../../constants/categoryIcons.js';
import { cn } from '../../lib/utils';

const FILTER_TABS = [
    { value: '', label: 'All Active' },
    { value: 'submitted', label: 'New' },
    { value: 'verified', label: 'Verified' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'in_progress', label: 'In Progress' },
];

function formatTimeAgo(dateStr) {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60_000);
    const hours = Math.floor(diff / 3_600_000);
    const days = Math.floor(diff / 86_400_000);
    if (mins < 60) return `${mins}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
}

function QueueRow({ complaint, onClick }) {
    const Icon = getCategoryIcon(complaint.category);
    return (
        <tr
            onClick={onClick}
            className={cn('cursor-pointer border-b border-slate-100 dark:border-slate-800 transition-colors hover:bg-surface-50 dark:hover:bg-slate-800', complaint.cascadeRisk && 'bg-orange-50/40 dark:bg-orange-500/10')}
        >
            <td className="px-3.5 py-3 align-middle">
                {complaint.cascadeRisk && <Zap className="size-4 text-orange-500" title="Cascade risk" />}
            </td>
            <td className="px-3.5 py-3 align-middle">
                <Icon className="size-4.5 text-slate-400 dark:text-slate-500" aria-hidden="true" />
            </td>
            <td className="min-w-[240px] px-3.5 py-3 align-middle">
                <span className="block text-sm font-semibold text-slate-900 dark:text-white">{complaint.title}</span>
                <span className="mt-0.5 block text-xs text-slate-400 dark:text-slate-500">
                    {complaint.category} · {complaint.wardId?.name ?? 'Unknown ward'}
                </span>
            </td>
            <td className="px-3.5 py-3 align-middle">
                <SeverityBar severity={complaint.severity} />
            </td>
            <td className="px-3.5 py-3 align-middle">
                {complaint.upvotes > 0 ? (
                    <span className="flex items-center gap-0.5 text-xs font-bold text-amber-600">
                        <ChevronUp className="size-3.5" /> {complaint.upvotes}
                    </span>
                ) : (
                    <span className="text-slate-300 dark:text-slate-600">—</span>
                )}
            </td>
            <td className="px-3.5 py-3 align-middle">
                <StatusBadge status={complaint.status} />
            </td>
            <td className="px-3.5 py-3 align-middle">
                <span className="text-xs text-slate-400 dark:text-slate-500">{formatTimeAgo(complaint.createdAt)}</span>
            </td>
        </tr>
    );
}

// Card layout for the triage queue on small screens — the table is unreadable
// once it has to horizontally scroll on a phone, so below `md` we render this
// stacked card instead of the row.
function QueueCard({ complaint, onClick }) {
    const Icon = getCategoryIcon(complaint.category);
    return (
        <button
            onClick={onClick}
            className={cn(
                'flex w-full flex-col gap-2.5 border-b border-slate-100 dark:border-slate-800 px-4 py-3.5 text-left transition-colors last:border-b-0 hover:bg-surface-50 dark:hover:bg-slate-800',
                complaint.cascadeRisk && 'bg-orange-50/40 dark:bg-orange-500/10'
            )}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-start gap-2">
                    <Icon className="mt-0.5 size-4 shrink-0 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                    <div className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">{complaint.title}</span>
                        <span className="mt-0.5 block text-xs text-slate-400 dark:text-slate-500">
                            {complaint.category} · {complaint.wardId?.name ?? 'Unknown ward'}
                        </span>
                    </div>
                </div>
                {complaint.cascadeRisk && <Zap className="size-4 shrink-0 text-orange-500" title="Cascade risk" />}
            </div>
            <div className="flex items-center justify-between gap-3">
                <div className="min-w-[90px] flex-1">
                    <SeverityBar severity={complaint.severity} />
                </div>
                <StatusBadge status={complaint.status} />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                {complaint.upvotes > 0 ? (
                    <span className="flex items-center gap-0.5 font-bold text-amber-600">
                        <ChevronUp className="size-3.5" /> {complaint.upvotes} vote{complaint.upvotes !== 1 ? 's' : ''}
                    </span>
                ) : (
                    <span>No votes yet</span>
                )}
                <span>{formatTimeAgo(complaint.createdAt)}</span>
            </div>
        </button>
    );
}

const TH_CLASS = 'border-b border-slate-200 dark:border-slate-800 px-3.5 py-3 text-left text-[0.68rem] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500';

export default function WarRoom() {
    const user = useCurrentUser();
    const navigate = useNavigate();

    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusTab, setStatusTab] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    const fetchQueue = useCallback(
        async (p = page, st = statusTab) => {
            try {
                const params = { page: p, limit: 20 };
                if (st) params.status = st;
                const result = await getTriageQueueApi(params);
                setComplaints(result.complaints ?? []);
                setTotal(result.total ?? 0);
                setTotalPages(result.totalPages ?? 1);
                setError(null);
            } catch {
                setError('Could not load the triage queue.');
            } finally {
                setLoading(false);
            }
        },
        [page, statusTab]
    );

    useEffect(() => {
        fetchQueue(page, statusTab);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, statusTab]);
    usePolling(() => fetchQueue(page, statusTab), 30_000, true);

    function handleTabChange(val) {
        setStatusTab(val);
        setPage(1);
    }
    const cascadeCount = complaints.filter((c) => c.cascadeRisk).length;

    return (
        <PageShell>
            <NavBar
                left={<NavBrand sub="War Room" />}
                right={
                    <>
                        <NotificationBell />
                        <NavUser name={user?.name} />
                    </>
                }
            />
            <main className="mx-auto max-w-7xl px-4 py-6 pb-16 sm:px-6 xl:px-10">
                <div className="mb-5">
                    <h1 className="mb-1 text-xl font-extrabold text-slate-900 dark:text-white sm:text-2xl">Triage Queue</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {loading ? 'Loading…' : `${total} active complaint${total !== 1 ? 's' : ''}`}
                        {cascadeCount > 0 && (
                            <span className="ml-1 flex items-center gap-1 font-bold text-orange-600 dark:text-orange-400 sm:inline-flex">
                                <Zap className="inline size-3.5" /> {cascadeCount} cascade risk{cascadeCount !== 1 ? 's' : ''}
                            </span>
                        )}
                    </p>
                </div>

                <FilterTabs tabs={FILTER_TABS} active={statusTab} onChange={handleTabChange} />
                <ErrorBanner message={error} onRetry={() => fetchQueue(page, statusTab)} />
                {loading && <SkeletonRows count={5} height="52px" />}
                {!loading && complaints.length === 0 && (
                    <EmptyState icon={CheckCircle2} heading="No complaints in this queue." />
                )}
                {!loading && complaints.length > 0 && (
                    <>
                        {/* Mobile / small screens: stacked cards, no horizontal scrolling */}
                        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 md:hidden">
                            {complaints.map((c) => (
                                <QueueCard key={c._id} complaint={c} onClick={() => navigate(`/war-room/${c._id}`)} />
                            ))}
                        </div>
                        {/* Tablet / desktop: full table */}
                        <div className="hidden overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 md:block">
                            <table className="w-full min-w-[640px] border-collapse">
                                <thead>
                                    <tr>
                                        <th className={TH_CLASS}></th>
                                        <th className={TH_CLASS}></th>
                                        <th className={TH_CLASS}>Complaint</th>
                                        <th className={TH_CLASS}>Severity</th>
                                        <th className={TH_CLASS}>Votes</th>
                                        <th className={TH_CLASS}>Status</th>
                                        <th className={TH_CLASS}>Age</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {complaints.map((c) => (
                                        <QueueRow key={c._id} complaint={c} onClick={() => navigate(`/war-room/${c._id}`)} />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
                <Pagination page={page} totalPages={totalPages} onPrev={() => setPage((p) => p - 1)} onNext={() => setPage((p) => p + 1)} />
            </main>
        </PageShell>
    );
}
