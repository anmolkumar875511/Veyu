// src/pages/officer/ComplaintDetail.jsx

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    getOfficerComplaintDetailApi,
    updateComplaintStatusApi,
    dispatchToWorkerApi,
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
import { color, font, space, radius, shadow, mk } from '../../theme/index.js';
import {
    COMPLAINT_STATUS_LABELS,
    ASSIGNMENT_STATUS_LABELS,
    STATUS_META,
} from '../../constants/complaint.constants.js';

// ── Status history ────────────────────────────────────────────────────────────
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

// ── Main ──────────────────────────────────────────────────────────────────────
export default function OfficerComplaintDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [complaint, setComplaint] = useState(null);
    const [assignment, setAssignment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionErr, setActionErr] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    const [showDispatch, setShowDispatch] = useState(false);
    const [workers, setWorkers] = useState([]);
    const [workersLoading, setWorkersLoading] = useState(false);
    const [selectedWorker, setSelectedWorker] = useState('');
    const [instructions, setInstructions] = useState('');

    const [rejectNote, setRejectNote] = useState('');
    const [showReject, setShowReject] = useState(false);

    const fetchDetail = useCallback(async () => {
        try {
            const data = await getOfficerComplaintDetailApi(id);
            setComplaint(data.complaint);
            setAssignment(data.assignment);
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
            const data = await updateComplaintStatusApi(id, { status: 'verified' });
            setComplaint(data.complaint);
        } catch (e) {
            setActionErr(parseOfficerError(e));
        } finally {
            setActionLoading(false);
        }
    }

    async function handleReject() {
        if (!rejectNote.trim()) {
            setActionErr('Please provide a reason for rejection.');
            return;
        }
        setActionLoading(true);
        setActionErr(null);
        try {
            const data = await updateComplaintStatusApi(id, {
                status: 'rejected',
                note: rejectNote.trim(),
            });
            setComplaint(data.complaint);
            setShowReject(false);
        } catch (e) {
            setActionErr(parseOfficerError(e));
        } finally {
            setActionLoading(false);
        }
    }

    async function openDispatchPanel() {
        setShowDispatch(true);
        setWorkersLoading(true);
        try {
            const data = await getAvailableWorkersApi(complaint.wardId?._id);
            setWorkers(data.workers ?? []);
        } catch {
            setActionErr('Could not load available workers.');
        } finally {
            setWorkersLoading(false);
        }
    }

    async function handleDispatch() {
        if (!selectedWorker) {
            setActionErr('Select a worker first.');
            return;
        }
        setActionLoading(true);
        setActionErr(null);
        try {
            const data = await dispatchToWorkerApi(id, {
                workerId: selectedWorker,
                instructions: instructions.trim() || undefined,
            });
            setComplaint(data.complaint);
            setShowDispatch(false);
            fetchDetail();
        } catch (e) {
            setActionErr(parseOfficerError(e));
        } finally {
            setActionLoading(false);
        }
    }

    if (loading) return <FullscreenState>Loading…</FullscreenState>;
    if (error || !complaint) {
        return (
            <FullscreenState>
                <p>{error ?? 'Complaint not found.'}</p>
                <BackLink to="/war-room">← Back to war room</BackLink>
            </FullscreenState>
        );
    }

    const statusColor = STATUS_META[complaint.status]?.color ?? color.textSecondary;

    return (
        <PageShell>
            <NavBar
                left={<BackLink to="/war-room">← War Room</BackLink>}
                right={<NavTitle>Complaint Detail</NavTitle>}
            />

            <main
                style={{
                    maxWidth: '1000px',
                    margin: '0 auto',
                    padding: `${space[6]} ${space[6]} ${space[16]}`,
                }}
            >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: space[6] }}>
                    {/* ── Left: info ─────────────────────────────────────────── */}
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
                                ⚡ Cascade risk — a nearby water/sewage complaint was recently
                                verified.
                                {complaint.cascadeSource && (
                                    <span
                                        style={{
                                            color: '#fdba74',
                                            fontWeight: font.weight.semibold,
                                        }}
                                    >
                                        {' '}
                                        Source: {complaint.cascadeSource.title}
                                    </span>
                                )}
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
                                🔁 Marked as duplicate of: {complaint.duplicateOf.title}
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

                        <StatusHistory history={complaint.statusHistory} />
                    </div>

                    {/* ── Right: actions ─────────────────────────────────────── */}
                    <div>
                        <Card style={{ position: 'sticky', top: '72px' }}>
                            <div
                                style={{ display: 'flex', flexDirection: 'column', gap: space[3] }}
                            >
                                <SectionLabel>Actions</SectionLabel>

                                <ErrorBanner message={actionErr} />

                                {/* Submitted → verify or reject */}
                                {complaint.status === 'submitted' && (
                                    <>
                                        <BtnPrimary
                                            onClick={handleVerify}
                                            loading={actionLoading}
                                            loadingText="Verifying…"
                                        >
                                            ✓ Verify Complaint
                                        </BtnPrimary>
                                        <BtnDanger onClick={() => setShowReject((v) => !v)}>
                                            ✗ Reject
                                        </BtnDanger>
                                        {showReject && (
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: space[2],
                                                }}
                                            >
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
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* Verified → dispatch */}
                                {complaint.status === 'verified' && !showDispatch && (
                                    <BtnPrimary onClick={openDispatchPanel}>
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
                                        <SectionLabel>Select worker</SectionLabel>
                                        {workersLoading ? (
                                            <span
                                                style={{
                                                    fontSize: font.size.sm,
                                                    color: color.textMuted,
                                                }}
                                            >
                                                Loading workers…
                                            </span>
                                        ) : workers.length === 0 ? (
                                            <span
                                                style={{
                                                    fontSize: font.size.sm,
                                                    color: color.textMuted,
                                                }}
                                            >
                                                No available workers in this ward.
                                            </span>
                                        ) : (
                                            <Select
                                                value={selectedWorker}
                                                onChange={(e) => setSelectedWorker(e.target.value)}
                                            >
                                                <option value="">Choose a worker…</option>
                                                {workers.map((w) => (
                                                    <option key={w._id} value={w._id}>
                                                        {w.name} — {w.activeTaskCount} active task
                                                        {w.activeTaskCount !== 1 ? 's' : ''}
                                                    </option>
                                                ))}
                                            </Select>
                                        )}
                                        <Textarea
                                            value={instructions}
                                            onChange={(e) => setInstructions(e.target.value)}
                                            placeholder="Instructions for worker (optional)"
                                            rows={2}
                                        />
                                        <BtnPrimary
                                            onClick={handleDispatch}
                                            loading={actionLoading}
                                            disabled={!selectedWorker}
                                            loadingText="Dispatching…"
                                        >
                                            Confirm Dispatch
                                        </BtnPrimary>
                                        <BtnGhost onClick={() => setShowDispatch(false)}>
                                            Cancel
                                        </BtnGhost>
                                    </div>
                                )}

                                {/* Assigned/In-Progress → show worker */}
                                {['assigned', 'in_progress'].includes(complaint.status) &&
                                    assignment && (
                                        <div
                                            style={{
                                                borderTop: `1px solid ${color.borderDefault}`,
                                                paddingTop: space[3],
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: space[1],
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
                                                        margin: `${space[1]} 0 0`,
                                                    }}
                                                >
                                                    "{assignment.instructions}"
                                                </p>
                                            )}
                                        </div>
                                    )}

                                {/* Resolved */}
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
                                                alt="Resolution proof"
                                                style={{ width: '100%', borderRadius: radius.sm }}
                                            />
                                        )}
                                    </div>
                                )}

                                {/* Rejected */}
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
                                        ✗ This complaint was rejected.
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
