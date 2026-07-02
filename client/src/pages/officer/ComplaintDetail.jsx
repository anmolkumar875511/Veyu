// src/pages/officer/ComplaintDetail.jsx
// Adds reassign panel (POST /officer/complaints/:id/reassign) + NotificationBell.

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
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
    StatusBadge,
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
import { color, font, space, radius } from '../../theme/index.js';
import {
    COMPLAINT_STATUS_LABELS,
    ASSIGNMENT_STATUS_LABELS,
    STATUS_META,
} from '../../constants/complaint.constants.js';

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: space[3] }}>
            <SectionLabel>History</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: space[3] }}>
                {[...history].reverse().map((h, i) => {
                    const m = STATUS_META[h.status] ?? STATUS_META.submitted;
                    return (
                        <div
                            key={i}
                            style={{ display: 'flex', alignItems: 'flex-start', gap: space[3] }}
                        >
                            <span
                                style={{
                                    width: '0.5rem',
                                    height: '0.5rem',
                                    borderRadius: radius.full,
                                    background: m.color,
                                    marginTop: '0.3rem',
                                    flexShrink: 0,
                                }}
                            />
                            <div>
                                <span
                                    style={{
                                        fontSize: font.size.sm,
                                        fontWeight: font.weight.semibold,
                                        color: color.textPrimary,
                                    }}
                                >
                                    {COMPLAINT_STATUS_LABELS[h.status]}
                                </span>
                                {h.note && (
                                    <span
                                        style={{
                                            fontSize: font.size.sm,
                                            color: color.textSecondary,
                                        }}
                                    >
                                        {' '}
                                        — {h.note}
                                    </span>
                                )}
                                <span
                                    style={{
                                        display: 'block',
                                        fontSize: font.size.xs,
                                        color: color.textMuted,
                                        marginTop: '0.1rem',
                                    }}
                                >
                                    {new Date(h.changedAt).toLocaleString('en-IN')}
                                </span>
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
            const d = await updateComplaintStatusApi(id, {
                status: 'rejected',
                note: rejectNote.trim(),
            });
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
            const d = await dispatchToWorkerApi(id, {
                workerId: selectedWorker,
                instructions: instructions.trim() || undefined,
            });
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
            await reassignWorkerApi(id, {
                newWorkerId: newWorker,
                reason: reassignReason.trim() || undefined,
            });
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
                <BackLink to="/war-room">← War Room</BackLink>
            </FullscreenState>
        );

    const statusColor = STATUS_META[complaint.status]?.color ?? color.textSecondary;
    const isAssigned = ['assigned', 'in_progress'].includes(complaint.status);

    const WorkerSelect = ({ value, onChange }) =>
        workersLoading ? (
            <span style={{ fontSize: font.size.sm, color: color.textMuted }}>Loading…</span>
        ) : workers.length === 0 ? (
            <span style={{ fontSize: font.size.sm, color: color.textMuted }}>
                No workers available.
            </span>
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
                left={<BackLink to="/war-room">← War Room</BackLink>}
                right={
                    <>
                        <NotificationBell />
                        <NavTitle>Complaint Detail</NavTitle>
                    </>
                }
            />
            <main
                style={{
                    maxWidth: '1000px',
                    margin: '0 auto',
                    padding: `${space[6]} ${space[6]} ${space[16]}`,
                }}
            >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: space[6] }}>
                    {/* LEFT */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: space[5] }}>
                        <img
                            src={complaint.imageUrl}
                            alt={complaint.title}
                            style={{
                                width: '100%',
                                height: '320px',
                                objectFit: 'cover',
                                borderRadius: radius.xl,
                                border: `1px solid ${color.borderDefault}`,
                            }}
                        />
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                justifyContent: 'space-between',
                                gap: space[4],
                            }}
                        >
                            <h1
                                style={{
                                    fontSize: '1.3rem',
                                    fontWeight: font.weight.extrabold,
                                    color: color.textPrimary,
                                    margin: 0,
                                    lineHeight: 1.3,
                                }}
                            >
                                {complaint.title}
                            </h1>
                            <span
                                style={{
                                    fontSize: font.size.xs,
                                    fontWeight: font.weight.bold,
                                    padding: '0.3rem 0.75rem',
                                    borderRadius: radius.full,
                                    whiteSpace: 'nowrap',
                                    color: statusColor,
                                    background: `${statusColor}1a`,
                                }}
                            >
                                {COMPLAINT_STATUS_LABELS[complaint.status]}
                            </span>
                        </div>
                        {complaint.cascadeRisk && (
                            <div
                                style={{
                                    background: '#7c2d1215',
                                    border: '1px solid #f9731644',
                                    borderRadius: radius.md,
                                    padding: `${space[3]} ${space[4]}`,
                                    fontSize: font.size.sm,
                                    color: '#fb923c',
                                }}
                            >
                                ⚡ Cascade risk detected nearby.
                            </div>
                        )}
                        {complaint.duplicateOf && (
                            <div
                                style={{
                                    background: color.bgSurface,
                                    border: `1px solid ${color.borderDefault}`,
                                    borderRadius: radius.md,
                                    padding: `${space[3]} ${space[4]}`,
                                    fontSize: font.size.sm,
                                    color: color.textSecondary,
                                }}
                            >
                                🔁 Duplicate of: {complaint.duplicateOf.title}
                            </div>
                        )}
                        <p
                            style={{
                                fontSize: font.size.base,
                                color: color.textSecondary,
                                lineHeight: 1.7,
                                margin: 0,
                            }}
                        >
                            {complaint.description}
                        </p>
                        <MetaGrid
                            items={[
                                { label: 'Category', value: complaint.category },
                                { label: 'Severity', value: `${complaint.severity ?? '—'}/10` },
                                { label: 'Ward', value: complaint.wardId?.name },
                                {
                                    label: 'AI Confidence',
                                    value: complaint.aiConfidence
                                        ? `${Math.round(complaint.aiConfidence * 100)}%`
                                        : '—',
                                },
                                { label: 'Reported by', value: complaint.createdBy?.name },
                                { label: 'Upvotes', value: `▲ ${complaint.upvotes}` },
                            ]}
                        />
                        {complaint.address && (
                            <p
                                style={{
                                    fontSize: font.size.sm,
                                    color: color.textMuted,
                                    margin: 0,
                                }}
                            >
                                📍 {complaint.address}
                            </p>
                        )}

                        <ComplaintPinMap complaint={complaint} />
                        <StatusHistory history={complaint.statusHistory} />
                    </div>

                    {/* RIGHT */}
                    <div>
                        <Card style={{ position: 'sticky', top: '72px' }}>
                            <div
                                style={{ display: 'flex', flexDirection: 'column', gap: space[3] }}
                            >
                                <SectionLabel>Actions</SectionLabel>
                                <ErrorBanner message={actionErr} />

                                {complaint.status === 'submitted' && (
                                    <>
                                        <BtnPrimary
                                            onClick={handleVerify}
                                            loading={actionLoading}
                                            loadingText="Verifying…"
                                        >
                                            ✓ Verify
                                        </BtnPrimary>
                                        <BtnDanger onClick={() => setShowReject((v) => !v)}>
                                            ✗ Reject
                                        </BtnDanger>
                                        {showReject && (
                                            <>
                                                <Textarea
                                                    value={rejectNote}
                                                    onChange={(e) => setRejectNote(e.target.value)}
                                                    placeholder="Reason for rejection…"
                                                    rows={3}
                                                />
                                                <BtnDangerSolid
                                                    onClick={handleReject}
                                                    loading={actionLoading}
                                                >
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
                                        📋 Dispatch to Worker
                                    </BtnPrimary>
                                )}
                                {showDispatch && (
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: space[2],
                                            borderTop: `1px solid ${color.borderDefault}`,
                                            paddingTop: space[3],
                                        }}
                                    >
                                        <SectionLabel>Dispatch</SectionLabel>
                                        <WorkerSelect
                                            value={selectedWorker}
                                            onChange={(e) => setSelectedWorker(e.target.value)}
                                        />
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
                                        <BtnGhost onClick={() => setShowDispatch(false)}>
                                            Cancel
                                        </BtnGhost>
                                    </div>
                                )}

                                {isAssigned && assignment && (
                                    <div
                                        style={{
                                            borderTop: `1px solid ${color.borderDefault}`,
                                            paddingTop: space[3],
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: space[2],
                                        }}
                                    >
                                        <SectionLabel>Assigned worker</SectionLabel>
                                        <p
                                            style={{
                                                fontSize: font.size.md,
                                                fontWeight: font.weight.bold,
                                                color: color.textPrimary,
                                                margin: 0,
                                            }}
                                        >
                                            {assignment.workerId?.name}
                                        </p>
                                        <span
                                            style={{
                                                fontSize: font.size.xs,
                                                color: '#a78bfa',
                                                fontWeight: font.weight.semibold,
                                            }}
                                        >
                                            {ASSIGNMENT_STATUS_LABELS[assignment.status]}
                                        </span>
                                        {assignment.instructions && (
                                            <p
                                                style={{
                                                    fontSize: font.size.sm,
                                                    color: color.textMuted,
                                                    fontStyle: 'italic',
                                                    margin: 0,
                                                }}
                                            >
                                                "{assignment.instructions}"
                                            </p>
                                        )}

                                        {!showReassign && (
                                            <button
                                                onClick={() => {
                                                    setShowReassign(true);
                                                    loadWorkers();
                                                }}
                                                style={{
                                                    background: 'none',
                                                    border: `1px solid ${color.borderDefault}`,
                                                    borderRadius: radius.md,
                                                    color: color.textMuted,
                                                    fontSize: font.size.xs,
                                                    padding: space[2],
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                ↺ Reassign
                                            </button>
                                        )}
                                        {showReassign && (
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: space[2],
                                                    borderTop: `1px solid ${color.borderDefault}`,
                                                    paddingTop: space[2],
                                                }}
                                            >
                                                <SectionLabel>Reassign to</SectionLabel>
                                                <WorkerSelect
                                                    value={newWorker}
                                                    onChange={(e) => setNewWorker(e.target.value)}
                                                />
                                                <Textarea
                                                    value={reassignReason}
                                                    onChange={(e) =>
                                                        setReassignReason(e.target.value)
                                                    }
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
                                                <BtnGhost onClick={() => setShowReassign(false)}>
                                                    Cancel
                                                </BtnGhost>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {complaint.status === 'resolved' && (
                                    <div
                                        style={{
                                            background: '#052e1611',
                                            border: '1px solid #22c55e33',
                                            borderRadius: radius.md,
                                            padding: space[3],
                                            fontSize: font.size.sm,
                                            color: '#4ade80',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: space[2],
                                        }}
                                    >
                                        ✓ Resolved{' '}
                                        {complaint.resolvedAt &&
                                            new Date(complaint.resolvedAt).toLocaleDateString(
                                                'en-IN'
                                            )}
                                        {complaint.resolutionImageUrl && (
                                            <img
                                                src={complaint.resolutionImageUrl}
                                                alt="Resolution"
                                                style={{ width: '100%', borderRadius: radius.sm }}
                                            />
                                        )}
                                    </div>
                                )}

                                {complaint.status === 'rejected' && (
                                    <div
                                        style={{
                                            background: '#450a0a11',
                                            border: '1px solid #7f1d1d44',
                                            borderRadius: radius.md,
                                            padding: space[3],
                                            fontSize: font.size.sm,
                                            color: '#f87171',
                                        }}
                                    >
                                        ✗ Rejected
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
