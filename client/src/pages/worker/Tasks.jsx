// src/pages/worker/Tasks.jsx

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PartyPopper, Plus, StickyNote, Star } from 'lucide-react';
import { useCurrentUser } from '../../hooks/useAuthGuards.js';
import { usePolling } from '../../hooks/usePolling.js';
import { getMyTasksApi, getWorkerSummaryApi } from '../../api/worker.api.js';
import {
    PageShell,
    NavBar,
    NavBrand,
    AssignmentBadge,
    SeverityTag,
    ErrorBanner,
    SkeletonRows,
    EmptyState,
} from '../../components/worker/WorkerShell.jsx';
import { NotificationBell } from '../../components/shared/NotificationBell.jsx';
import { getCategoryIcon } from '../../constants/categoryIcons.js';
import { ASSIGNMENT_STATUS_LABELS } from '../../constants/complaint.constants.js';

function StatPill({ label, value, tone = 'text-slate-900 dark:text-white' }) {
    return (
        <div className="flex min-w-[80px] flex-col gap-0.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3">
            <span className={`text-lg font-extrabold ${tone}`}>{value ?? '—'}</span>
            <span className="text-xs text-slate-400 dark:text-slate-500">{label}</span>
        </div>
    );
}

function TaskCard({ task, index, onClick }) {
    const complaint = task.complaintId;
    const Icon = getCategoryIcon(complaint?.category);
    return (
        <div
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onClick()}
            className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 transition-shadow duration-150 hover:shadow-[var(--shadow-card-hover)]"
        >
            <span className="w-5 shrink-0 text-xs font-bold text-slate-400 dark:text-slate-500">{index + 1}</span>
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                <Icon className="size-4.5" aria-hidden="true" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-sm font-semibold text-slate-900 dark:text-white sm:text-base">{complaint?.title ?? 'Task'}</span>
                <span className="text-xs text-slate-400 dark:text-slate-500">
                    {complaint?.category} · {complaint?.address ?? 'No address'}
                </span>
                {task.instructions && (
                    <span className="mt-0.5 flex items-center gap-1 text-xs text-violet-500">
                        <StickyNote className="size-3 shrink-0" /> {task.instructions}
                    </span>
                )}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
                <AssignmentBadge status={task.status} label={ASSIGNMENT_STATUS_LABELS[task.status]} />
                <SeverityTag severity={complaint?.severity} />
            </div>
        </div>
    );
}

export default function WorkerTasks() {
    const user = useCurrentUser();
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    usePolling(fetchTasks, 30_000, true);

    const firstName = user?.name?.split(' ')[0] ?? 'there';

    return (
        <PageShell>
            <NavBar
                left={<NavBrand sub="Field Tasks" />}
                right={<NotificationBell />}
            />
            <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-6 pb-16 sm:px-6 xl:px-10">
                <section className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <h1 className="mb-1 text-xl font-extrabold text-slate-900 dark:text-white sm:text-2xl">Hi, {firstName}</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Your assigned tasks for today</p>
                        </div>
                        <Link
                            to="/observations"
                            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-semibold text-violet-700 transition-colors hover:bg-violet-100"
                        >
                            <Plus className="size-4" /> Report Observation
                        </Link>
                    </div>
                    {summary && (
                        <div className="flex flex-wrap gap-3">
                            <StatPill label="Active tasks" value={summary.pendingCount} tone="text-primary-600" />
                            <StatPill label="Completed" value={summary.completedCount} tone="text-emerald-600" />
                            <StatPill label="Observations" value={summary.observationCount} tone="text-violet-600" />
                            <StatPill
                                label="Field points"
                                value={
                                    <span className="flex items-center gap-1">
                                        <Star className="size-4 fill-amber-500 text-amber-500" /> {summary.worker?.fieldPoints ?? 0}
                                    </span>
                                }
                                tone="text-amber-500"
                            />
                        </div>
                    )}
                </section>

                <section className="flex flex-col gap-4">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">Today&apos;s Route</h2>
                    <ErrorBanner message={error} />
                    {loading && <SkeletonRows count={3} height="80px" />}
                    {!loading && tasks.length === 0 && (
                        <EmptyState
                            icon={PartyPopper}
                            heading="No tasks assigned right now."
                            sub="Check back soon, or submit a FieldMesh observation while you're on the ground."
                            cta="Submit observation"
                            ctaTo="/observations"
                        />
                    )}
                    {!loading && tasks.length > 0 && (
                        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                            {tasks.map((t, i) => (
                                <TaskCard key={t._id} task={t} index={i} onClick={() => navigate(`/tasks/${t._id}`)} />
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </PageShell>
    );
}
