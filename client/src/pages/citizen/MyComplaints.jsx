// src/pages/citizen/MyComplaints.jsx

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ChevronUp, MapPin, Plus, Repeat2, Trash2, X } from 'lucide-react';
import { usePolling } from '../../hooks/usePolling.js';
import {
    getMyComplaintsApi,
    getComplaintByIdApi,
    toggleUpvoteApi,
    deleteComplaintApi,
    parseComplaintError,
} from '../../api/complaints.api.js';
import {
    PageShell,
    NavBar,
    NavLinkAccent,
    StatusBadge,
    SeverityPip,
    SectionLabel,
    ErrorBanner,
    Skeleton,
    Pagination,
} from '../../components/citizen/CitizenShell.jsx';
import { NotificationBell } from '../../components/shared/NotificationBell.jsx';
import { MapContainer } from '../../components/shared/MapContainer.jsx';
import { complaintMarkerIcon } from '../../config/mapMarkers.js';
import { cn } from '../../lib/utils';
import { getCategoryIcon } from '../../constants/categoryIcons.js';
import {
    STATUS_META,
    STATUS_TABS,
    TIMELINE_STEPS,
    DELETABLE_STATUSES,
} from '../../constants/complaint.constants.js';

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(str) {
    if (!str) return '';
    return new Date(str).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

// ── StatusTimeline ────────────────────────────────────────────────────────────
function StatusTimeline({ status }) {
    const isTerminal = status === 'rejected' || status === 'duplicate';

    if (isTerminal) {
        return <StatusBadge status={status} />;
    }

    return (
        <div className="flex items-start">
            {TIMELINE_STEPS.map((st, i) => {
                const m = STATUS_META[st];
                const done = (STATUS_META[status]?.step ?? 0) > i;
                const active = status === st;
                const isReached = done || active;
                return (
                    <div key={st} className="relative flex flex-1 flex-col items-center gap-1">
                        <div
                            className={cn(
                                'size-2.5 shrink-0 rounded-full transition-colors',
                                isReached ? 'bg-primary-500' : 'bg-slate-200 dark:bg-slate-700'
                            )}
                            style={active ? { boxShadow: '0 0 0 4px rgb(79 70 229 / 0.15)' } : undefined}
                        />
                        <span
                            className={cn(
                                'text-center text-[0.58rem] font-medium leading-tight',
                                isReached ? 'text-primary-600' : 'text-slate-400 dark:text-slate-500'
                            )}
                        >
                            {m.label}
                        </span>
                        {i < TIMELINE_STEPS.length - 1 && (
                            <div className={cn('absolute left-1/2 right-[-50%] top-[5px] h-px', done ? 'bg-slate-300' : 'bg-slate-100 dark:bg-slate-800')} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ── ComplaintRow ──────────────────────────────────────────────────────────────
function ComplaintRow({ complaint, isSelected, onClick }) {
    const Icon = getCategoryIcon(complaint.category);
    return (
        <div
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onClick()}
            className={cn(
                'flex cursor-pointer items-center gap-3 rounded-lg border p-3.5 transition-colors duration-150',
                isSelected ? 'border-primary-300 bg-primary-50/50' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-surface-50 dark:hover:bg-slate-800'
            )}
        >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                <Icon className="size-4.5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">{complaint.title}</span>
                <span className="mt-0.5 block text-xs text-slate-400 dark:text-slate-500">
                    {complaint.category} · {formatDate(complaint.createdAt)}
                </span>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
                <StatusBadge status={complaint.status} />
                <SeverityPip severity={complaint.severity} />
            </div>
        </div>
    );
}

// ── Tiny location map shown in the complaint detail drawer ────────────────────
function CitizenPinLayer({ map, complaint }) {
    useEffect(() => {
        if (!map || !complaint?.location?.coordinates) return;
        const [lng, lat] = complaint.location.coordinates;
        const marker = new window.google.maps.Marker({
            map,
            position: { lat, lng },
            icon: complaintMarkerIcon(complaint.severity),
            title: complaint.title,
        });
        map.panTo({ lat, lng });
        return () => marker.setMap(null);
    }, [map, complaint]);
    return null;
}

function CitizenPinMap({ complaint }) {
    if (!complaint?.location?.coordinates) return null;
    const [lng, lat] = complaint.location.coordinates;
    return (
        <MapContainer center={{ lat, lng }} zoom={16} height="180px">
            {(map) => <CitizenPinLayer map={map} complaint={complaint} />}
        </MapContainer>
    );
}

// ── DetailDrawer ──────────────────────────────────────────────────────────────
function DetailDrawer({ complaintId, onClose }) {
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [hasVoted, setHasVoted] = useState(false);
    const [upvotes, setUpvotes] = useState(0);
    const [deleting, setDeleting] = useState(false);
    const [err, setErr] = useState(null);

    useEffect(() => {
        setLoading(true);
        setErr(null);
        getComplaintByIdApi(complaintId)
            .then(({ complaint, hasVoted: hv }) => {
                setDetail(complaint);
                setHasVoted(hv);
                setUpvotes(complaint.upvotes);
            })
            .catch(() => setErr('Could not load complaint details.'))
            .finally(() => setLoading(false));
    }, [complaintId]);

    async function handleVote() {
        try {
            const res = await toggleUpvoteApi(complaintId);
            setUpvotes(res.upvotes);
            setHasVoted(res.hasVoted);
        } catch {
            /* non-fatal */
        }
    }

    async function handleDelete() {
        if (!confirm('Delete this complaint? This cannot be undone.')) return;
        setDeleting(true);
        try {
            await deleteComplaintApi(complaintId);
            onClose('deleted');
        } catch (e) {
            setErr(parseComplaintError(e));
            setDeleting(false);
        }
    }

    const canDelete = detail && DELETABLE_STATUSES.includes(detail.status);

    return (
        <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-40 flex w-full flex-col overflow-y-auto border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sm:static sm:z-auto sm:h-full sm:w-[380px] sm:shrink-0"
        >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-4">
                <span className="text-base font-bold text-slate-900 dark:text-white">Complaint Detail</span>
                <button
                    onClick={() => onClose()}
                    aria-label="Close"
                    className="rounded-lg p-1.5 text-slate-400 dark:text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:text-slate-300"
                >
                    <X className="size-5" />
                </button>
            </div>

            {loading && <div className="p-8 text-center text-sm text-slate-400 dark:text-slate-500">Loading…</div>}
            {err && <div className="px-5 py-4 text-sm text-rose-600">{err}</div>}

            {detail && !loading && (
                <div className="flex flex-col gap-4 p-5">
                    <img src={detail.imageUrl} alt="Complaint" className="h-44 w-full rounded-lg object-cover" />

                    <h2 className="text-base font-bold leading-snug text-slate-900 dark:text-white">{detail.title}</h2>

                    <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={detail.status} />
                        <span className="text-xs text-slate-400 dark:text-slate-500">{detail.category}</span>
                        {detail.wardId && <span className="text-xs text-slate-400 dark:text-slate-500">Ward {detail.wardId.wardNumber}</span>}
                    </div>

                    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{detail.description}</p>

                    {detail.address && (
                        <p className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                            <MapPin className="size-3.5 shrink-0" /> {detail.address}
                        </p>
                    )}

                    <CitizenPinMap complaint={detail} />

                    {/* AI box */}
                    <div className="flex flex-col gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-surface-50 dark:bg-slate-950 p-3">
                        <SectionLabel>AI Assessment</SectionLabel>
                        {[
                            ['Category', detail.category],
                            ['Severity', `${detail.severity ?? '—'}/10`],
                            ['Confidence', detail.aiConfidence ? `${Math.round(detail.aiConfidence * 100)}%` : '—'],
                        ].map(([k, v]) => (
                            <div key={k} className="flex justify-between">
                                <span className="text-xs text-slate-500 dark:text-slate-400">{k}</span>
                                <span className="text-xs font-medium text-slate-800 dark:text-slate-200">{v}</span>
                            </div>
                        ))}
                        {detail.categorySource === 'manual' && (
                            <span className="text-[0.68rem] text-violet-500">Category was set manually</span>
                        )}
                    </div>

                    {/* Duplicate notice */}
                    {detail.duplicateOf && (
                        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                            <Repeat2 className="mt-0.5 size-4 shrink-0" />
                            Linked to an existing report. Consider upvoting the original.
                        </div>
                    )}

                    {/* Progress */}
                    <div className="flex flex-col gap-2">
                        <SectionLabel>Progress</SectionLabel>
                        <StatusTimeline status={detail.status} />
                    </div>

                    {/* Upvote */}
                    <div className="flex flex-col gap-2">
                        <SectionLabel>Community support</SectionLabel>
                        <button
                            onClick={handleVote}
                            className={cn(
                                'flex items-center justify-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                                hasVoted
                                    ? 'border-primary-200 bg-primary-50 text-primary-700'
                                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-surface-50 dark:hover:bg-slate-800'
                            )}
                        >
                            <ChevronUp className="size-4" />
                            {hasVoted ? 'Upvoted' : 'Upvote'} · {upvotes}
                        </button>
                    </div>

                    {/* Delete */}
                    {canDelete && (
                        <button
                            onClick={handleDelete}
                            disabled={deleting}
                            className="flex items-center justify-center gap-1.5 rounded-lg border border-rose-200 p-3 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-60"
                        >
                            <Trash2 className="size-3.5" />
                            {deleting ? 'Deleting…' : 'Delete this complaint'}
                        </button>
                    )}

                    <span className="text-right text-[0.68rem] text-slate-400 dark:text-slate-500">Submitted {formatDate(detail.createdAt)}</span>
                </div>
            )}
        </motion.div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MyComplaints() {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedId, setSelectedId] = useState(null);

    const fetchComplaints = useCallback(
        async (p = page, st = statusFilter) => {
            try {
                const params = { page: p, limit: 10 };
                if (st) params.status = st;
                const result = await getMyComplaintsApi(params);
                setComplaints(result.complaints ?? []);
                setTotal(result.total ?? 0);
                setTotalPages(result.totalPages ?? 1);
                setError(null);
            } catch {
                setError('Could not load complaints.');
            } finally {
                setLoading(false);
            }
        },
        [page, statusFilter]
    );

    useEffect(() => {
        fetchComplaints(page, statusFilter);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, statusFilter]);
    usePolling(() => fetchComplaints(page, statusFilter), 30_000, complaints.length > 0);

    function handleTabChange(val) {
        setStatusFilter(val);
        setPage(1);
        setSelectedId(null);
    }

    function handleDrawerClose(action) {
        setSelectedId(null);
        if (action === 'deleted') fetchComplaints(page, statusFilter);
    }

    return (
        <PageShell>
            <NavBar
                left={
                    <Link to="/dashboard" className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700">
                        <ArrowLeft className="size-4" /> Dashboard
                    </Link>
                }
                center={<span className="text-sm font-semibold text-slate-900 dark:text-white">My Reports</span>}
                right={
                    <>
                        <NotificationBell />
                        <NavLinkAccent to="/report">
                            <span className="flex items-center gap-1">
                                <Plus className="size-3.5" /> New
                            </span>
                        </NavLinkAccent>
                    </>
                }
            />

            <div className="flex h-[calc(100vh-56px)]">
                {/* List panel */}
                <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                    {/* Status tabs */}
                    <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-800 px-5">
                        {STATUS_TABS.map((t) => (
                            <button
                                key={t.value}
                                onClick={() => handleTabChange(t.value)}
                                className={cn(
                                    'whitespace-nowrap border-b-2 px-3 py-3 text-xs font-medium transition-colors',
                                    statusFilter === t.value
                                        ? 'border-primary-600 text-slate-900 dark:text-white'
                                        : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                                )}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {!loading && (
                        <p className="px-5 pt-2 text-xs text-slate-400 dark:text-slate-500">
                            {total} report{total !== 1 ? 's' : ''}
                        </p>
                    )}

                    {error && (
                        <div className="mx-5 my-3">
                            <ErrorBanner message={error} />
                        </div>
                    )}

                    <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-5 py-3">
                        {loading && <Skeleton height="68px" count={4} />}

                        {!loading && complaints.length === 0 && (
                            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-12">
                                <p className="text-sm text-slate-400 dark:text-slate-500">No complaints found.</p>
                                <Link to="/report" className="text-sm text-primary-600 hover:text-primary-700">
                                    Submit your first report
                                </Link>
                            </div>
                        )}

                        {!loading &&
                            complaints.map((c) => (
                                <ComplaintRow
                                    key={c._id}
                                    complaint={c}
                                    isSelected={selectedId === c._id}
                                    onClick={() => setSelectedId(selectedId === c._id ? null : c._id)}
                                />
                            ))}
                    </div>

                    <Pagination
                        page={page}
                        totalPages={totalPages}
                        onPrev={() => setPage((p) => p - 1)}
                        onNext={() => setPage((p) => p + 1)}
                        className="border-t border-slate-200 dark:border-slate-800 p-4"
                    />
                </div>

                {/* Detail drawer */}
                <AnimatePresence>
                    {selectedId && <DetailDrawer key={selectedId} complaintId={selectedId} onClose={handleDrawerClose} />}
                </AnimatePresence>
            </div>
        </PageShell>
    );
}
