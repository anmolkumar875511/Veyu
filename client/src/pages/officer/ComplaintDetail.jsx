// src/pages/officer/ComplaintDetail.jsx
// Adds reassign panel (POST /officer/complaints/:id/reassign) + NotificationBell.

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ClipboardList, MapPin, Repeat2, RotateCcw, XCircle, Zap } from 'lucide-react';
import {
    getOfficerComplaintDetailApi,
    updateComplaintStatusApi,
    dispatchToWorkerApi,
    reassignWorkerApi,
    getAvailableWorkersApi,
    parseOfficerError,
} from '../../api/officer.api.js';
import {
    PageShell,
    NavBar,
    BackLink,
    NavTitle,
    FullscreenState,
    SectionLabel,
    MetaGrid,
    ErrorBanner,
    Textarea,
    Select,
    BtnPrimary,
    BtnDanger,
    BtnDangerSolid,
    BtnGhost,
    Card,
} from '../../components/officer/OfficerShell.jsx';
import { NotificationBell } from '../../components/shared/NotificationBell.jsx';
import { MapContainer } from '../../components/shared/MapContainer.jsx';
import { complaintMarkerIcon } from '../../config/mapMarkers.js';
import { getStatusTheme } from '../../lib/roleTheme';
import { cn } from '../../lib/utils';
import { COMPLAINT_STATUS_LABELS, ASSIGNMENT_STATUS_LABELS } from '../../constants/complaint.constants.js';

// ── Static complaint location map — read-only pin showing where issue is ──────
function ComplaintPinLayer({ map, complaint }) {
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

function ComplaintPinMap({ complaint }) {
    if (!complaint?.location?.coordinates) return null;
    const [lng, lat] = complaint.location.coordinates;
    return (
        <MapContainer center={{ lat, lng }} zoom={15} height="220px">
            {(map) => <ComplaintPinLayer map={map} complaint={complaint} />}
        </MapContainer>
    );
}

function StatusHistory({ history }) {
    if (!history?.length) return null;
    return (
        <div className="flex flex-col gap-3">
            <SectionLabel>History</SectionLabel>
            <div className="flex flex-col gap-3">
                {[...history].reverse().map((h, i) => {
                    const theme = getStatusTheme(h.status);
                    return (
                        <div key={i} className="flex items-start gap-3">
                            <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', theme.dot)} />
                            <div>
                                <span className="text-sm font-semibold text-slate-900 dark:text-white">{COMPLAINT_STATUS_LABELS[h.status]}</span>
                                {h.note && <span className="text-sm text-slate-500 dark:text-slate-400"> — {h.note}</span>}
                                <span className="mt-0.5 block text-xs text-slate-400 dark:text-slate-500">{new Date(h.changedAt).toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function OfficerComplaintDetail() {
    const { id } = useParams();

    const [complaint, setComplaint] = useState(null);
    const [assignment, setAssignment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionErr, setActionErr] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [showDispatch, setShowDispatch] = useState(false);
    const [showReject, setShowReject] = useState(false);
    const [showReassign, setShowReassign] = useState(false);
    const [workers, setWorkers] = useState([]);
    const [workersLoading, setWorkersLoading] = useState(false);
    const [selectedWorker, setSelectedWorker] = useState('');
    const [newWorker, setNewWorker] = useState('');
    const [instructions, setInstructions] = useState('');
    const [rejectNote, setRejectNote] = useState('');
    const [reassignReason, setReassignReason] = useState('');
    const [reassigning, setReassigning] = useState(false);

    const fetchDetail = useCallback(async () => {
        try {
            const data = await getOfficerComplaintDetailApi(id);
            setComplaint(data.complaint);
            setAssignment(data.assignment ?? null);
            setError(null);
        } catch {
            setError('Could not load complaint details.');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchDetail();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    async function handleVerify() {
        setActionLoading(true);
        setActionErr(null);
        try {
            const d = await updateComplaintStatusApi(id, { status: 'verified' });
            setComplaint(d.complaint);
        } catch (e) {
            setActionErr(parseOfficerError(e));
        } finally {
            setActionLoading(false);
        }
    }

    async function handleReject() {
        if (!rejectNote.trim()) {
            setActionErr('Provide a rejection reason.');
            return;
        }
        setActionLoading(true);
        setActionErr(null);
        try {
            const d = await updateComplaintStatusApi(id, { status: 'rejected', note: rejectNote.trim() });
            setComplaint(d.complaint);
            setShowReject(false);
        } catch (e) {
            setActionErr(parseOfficerError(e));
        } finally {
            setActionLoading(false);
        }
    }

    async function loadWorkers() {
        setWorkersLoading(true);
        try {
            const d = await getAvailableWorkersApi(complaint.wardId?._id);
            setWorkers(d.workers ?? []);
        } catch {
            setActionErr('Could not load workers.');
        } finally {
            setWorkersLoading(false);
        }
    }

    async function handleDispatch() {
        if (!selectedWorker) {
            setActionErr('Select a worker.');
            return;
        }
        setActionLoading(true);
        setActionErr(null);
        try {
            const d = await dispatchToWorkerApi(id, { workerId: selectedWorker, instructions: instructions.trim() || undefined });
            setComplaint(d.complaint);
            setShowDispatch(false);
            fetchDetail();
        } catch (e) {
            setActionErr(parseOfficerError(e));
        } finally {
            setActionLoading(false);
        }
    }

    async function handleReassign() {
        if (!newWorker) {
            setActionErr('Select a worker.');
            return;
        }
        setReassigning(true);
        setActionErr(null);
        try {
            await reassignWorkerApi(id, { newWorkerId: newWorker, reason: reassignReason.trim() || undefined });
            setShowReassign(false);
            fetchDetail();
        } catch (e) {
            setActionErr(parseOfficerError(e));
        } finally {
            setReassigning(false);
        }
    }

    if (loading) return <FullscreenState>Loading…</FullscreenState>;
    if (error || !complaint)
        return (
            <FullscreenState>
                <p>{error ?? 'Not found.'}</p>
                <BackLink to="/war-room">
                    <span className="flex items-center gap-1">
                        <ArrowLeft className="size-4" /> War Room
                    </span>
                </BackLink>
            </FullscreenState>
        );

    const statusTheme = getStatusTheme(complaint.status);
    const isAssigned = ['assigned', 'in_progress'].includes(complaint.status);

    const WorkerSelect = ({ value, onChange }) =>
        workersLoading ? (
            <span className="text-sm text-slate-400 dark:text-slate-500">Loading…</span>
        ) : workers.length === 0 ? (
            <span className="text-sm text-slate-400 dark:text-slate-500">No workers available.</span>
        ) : (
            <Select value={value} onChange={onChange}>
                <option value="">Choose worker…</option>
                {workers.map((w) => (
                    <option key={w._id} value={w._id}>
                        {w.name} — {w.activeTaskCount} active
                    </option>
                ))}
            </Select>
        );

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
                        <NavTitle>Complaint Detail</NavTitle>
                    </>
                }
            />
            <main className="mx-auto max-w-6xl px-4 py-6 pb-16 sm:px-6 xl:px-10">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
                    {/* LEFT */}
                    <div className="flex flex-col gap-5">
                        <img src={complaint.imageUrl} alt={complaint.title} className="h-72 w-full rounded-xl border border-slate-200 dark:border-slate-800 object-cover sm:h-80" />
                        <div className="flex items-start justify-between gap-4">
                            <h1 className="text-xl font-extrabold leading-snug text-slate-900 dark:text-white sm:text-2xl">{complaint.title}</h1>
                            <span
                                className={cn(
                                    'shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold',
                                    statusTheme.text,
                                    statusTheme.bg
                                )}
                            >
                                {COMPLAINT_STATUS_LABELS[complaint.status]}
                            </span>
                        </div>
                        {complaint.cascadeRisk && (
                            <div className="flex items-center gap-2 rounded-lg border border-orange-200 dark:border-orange-900/50 bg-orange-50 dark:bg-orange-500/10 px-4 py-3 text-sm text-orange-700 dark:text-orange-300">
                                <Zap className="size-4 shrink-0" /> Cascade risk detected nearby.
                            </div>
                        )}
                        {complaint.duplicateOf && (
                            <div className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                                <Repeat2 className="size-4 shrink-0" /> Duplicate of: {complaint.duplicateOf.title}
                            </div>
                        )}
                        <p className="text-base leading-relaxed text-slate-600 dark:text-slate-300">{complaint.description}</p>
                        <MetaGrid
                            columns={2}
                            items={[
                                { label: 'Category', value: complaint.category },
                                { label: 'Severity', value: `${complaint.severity ?? '—'}/10` },
                                { label: 'Ward', value: complaint.wardId?.name },
                                { label: 'AI Confidence', value: complaint.aiConfidence ? `${Math.round(complaint.aiConfidence * 100)}%` : '—' },
                                { label: 'Reported by', value: complaint.createdBy?.name },
                                { label: 'Upvotes', value: complaint.upvotes },
                            ]}
                        />
                        {complaint.address && (
                            <p className="flex items-center gap-1.5 text-sm text-slate-400 dark:text-slate-500">
                                <MapPin className="size-4 shrink-0" /> {complaint.address}
                            </p>
                        )}

                        <ComplaintPinMap complaint={complaint} />
                        <StatusHistory history={complaint.statusHistory} />
                    </div>

                    {/* RIGHT */}
                    <div>
                        <Card className="lg:sticky lg:top-[72px]">
                            <div className="flex flex-col gap-3">
                                <SectionLabel>Actions</SectionLabel>
                                <ErrorBanner message={actionErr} />

                                {complaint.status === 'submitted' && (
                                    <>
                                        <BtnPrimary onClick={handleVerify} loading={actionLoading} loadingText="Verifying…">
                                            <span className="flex items-center justify-center gap-1.5">
                                                <CheckCircle2 className="size-4" /> Verify
                                            </span>
                                        </BtnPrimary>
                                        <BtnDanger onClick={() => setShowReject((v) => !v)}>
                                            <span className="flex items-center justify-center gap-1.5">
                                                <XCircle className="size-4" /> Reject
                                            </span>
                                        </BtnDanger>
                                        {showReject && (
                                            <>
                                                <Textarea
                                                    value={rejectNote}
                                                    onChange={(e) => setRejectNote(e.target.value)}
                                                    placeholder="Reason for rejection…"
                                                    rows={3}
                                                />
                                                <BtnDangerSolid onClick={handleReject} loading={actionLoading}>
                                                    Confirm Rejection
                                                </BtnDangerSolid>
                                            </>
                                        )}
                                    </>
                                )}

                                {complaint.status === 'verified' && !showDispatch && (
                                    <BtnPrimary
                                        onClick={() => {
                                            setShowDispatch(true);
                                            loadWorkers();
                                        }}
                                    >
                                        <span className="flex items-center justify-center gap-1.5">
                                            <ClipboardList className="size-4" /> Dispatch to Worker
                                        </span>
                                    </BtnPrimary>
                                )}
                                {showDispatch && (
                                    <div className="flex flex-col gap-2 border-t border-slate-200 dark:border-slate-800 pt-3">
                                        <SectionLabel>Dispatch</SectionLabel>
                                        <WorkerSelect value={selectedWorker} onChange={(e) => setSelectedWorker(e.target.value)} />
                                        <Textarea
                                            value={instructions}
                                            onChange={(e) => setInstructions(e.target.value)}
                                            placeholder="Instructions (optional)"
                                            rows={2}
                                        />
                                        <BtnPrimary
                                            onClick={handleDispatch}
                                            loading={actionLoading}
                                            disabled={!selectedWorker}
                                            loadingText="Dispatching…"
                                        >
                                            Confirm
                                        </BtnPrimary>
                                        <BtnGhost onClick={() => setShowDispatch(false)}>Cancel</BtnGhost>
                                    </div>
                                )}

                                {isAssigned && assignment && (
                                    <div className="flex flex-col gap-2 border-t border-slate-200 dark:border-slate-800 pt-3">
                                        <SectionLabel>Assigned worker</SectionLabel>
                                        <p className="text-base font-bold text-slate-900 dark:text-white">{assignment.workerId?.name}</p>
                                        <span className="text-xs font-semibold text-violet-600">{ASSIGNMENT_STATUS_LABELS[assignment.status]}</span>
                                        {assignment.instructions && (
                                            <p className="text-sm italic text-slate-400 dark:text-slate-500">&quot;{assignment.instructions}&quot;</p>
                                        )}

                                        {!showReassign && (
                                            <button
                                                onClick={() => {
                                                    setShowReassign(true);
                                                    loadWorkers();
                                                }}
                                                className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 p-2 text-xs text-slate-500 dark:text-slate-400 transition-colors hover:bg-surface-50 dark:hover:bg-slate-800"
                                            >
                                                <RotateCcw className="size-3.5" /> Reassign
                                            </button>
                                        )}
                                        {showReassign && (
                                            <div className="flex flex-col gap-2 border-t border-slate-200 dark:border-slate-800 pt-2">
                                                <SectionLabel>Reassign to</SectionLabel>
                                                <WorkerSelect value={newWorker} onChange={(e) => setNewWorker(e.target.value)} />
                                                <Textarea
                                                    value={reassignReason}
                                                    onChange={(e) => setReassignReason(e.target.value)}
                                                    placeholder="Reason (optional)"
                                                    rows={2}
                                                />
                                                <BtnPrimary
                                                    onClick={handleReassign}
                                                    loading={reassigning}
                                                    disabled={!newWorker}
                                                    loadingText="Reassigning…"
                                                >
                                                    Confirm
                                                </BtnPrimary>
                                                <BtnGhost onClick={() => setShowReassign(false)}>Cancel</BtnGhost>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {complaint.status === 'resolved' && (
                                    <div className="flex flex-col gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                                        <span className="flex items-center gap-1.5">
                                            <CheckCircle2 className="size-4" /> Resolved{' '}
                                            {complaint.resolvedAt && new Date(complaint.resolvedAt).toLocaleDateString('en-IN')}
                                        </span>
                                        {complaint.resolutionImageUrl && (
                                            <img src={complaint.resolutionImageUrl} alt="Resolution" className="w-full rounded-md" />
                                        )}
                                    </div>
                                )}

                                {complaint.status === 'rejected' && (
                                    <div className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                                        <XCircle className="size-4" /> Rejected
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            </main>
        </PageShell>
    );
}
