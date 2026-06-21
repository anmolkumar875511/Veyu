// ─────────────────────────────────────────────────────────────────────────────
// src/pages/officer/ComplaintDetail.jsx
//
// Officer's single complaint view. Actions:
//   - Verify / Reject submitted complaints
//   - Dispatch to a worker (loads available workers list)
//   - Watch live status + cascade risk
//   - View assignment progress once dispatched
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    getOfficerComplaintDetailApi,
    updateComplaintStatusApi,
    dispatchToWorkerApi,
    getAvailableWorkersApi,
    parseOfficerError,
} from '../../api/officer.api.js';
import {
    COMPLAINT_STATUS_LABELS,
    ASSIGNMENT_STATUS_LABELS,
} from '../../constants/complaint.constants.js';

const STATUS_COLORS = {
    submitted: '#94a3b8',
    verified: '#3b82f6',
    assigned: '#a78bfa',
    in_progress: '#f59e0b',
    resolved: '#22c55e',
    rejected: '#ef4444',
    duplicate: '#64748b',
};

export default function OfficerComplaintDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [complaint, setComplaint] = useState(null);
    const [assignment, setAssignment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionErr, setActionErr] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Dispatch panel state
    const [showDispatch, setShowDispatch] = useState(false);
    const [workers, setWorkers] = useState([]);
    const [workersLoading, setWorkersLoading] = useState(false);
    const [selectedWorker, setSelectedWorker] = useState('');
    const [instructions, setInstructions] = useState('');

    // Status note state
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
            if (data.cascadeResult?.flaggedCount > 0) {
                setActionErr(null); // not an error — show success message instead
            }
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
            fetchDetail(); // reload to get the new assignment object
        } catch (e) {
            setActionErr(parseOfficerError(e));
        } finally {
            setActionLoading(false);
        }
    }

    if (loading) {
        return <div style={s.loadingPage}>Loading…</div>;
    }

    if (error || !complaint) {
        return (
            <div style={s.loadingPage}>
                <p>{error ?? 'Complaint not found.'}</p>
                <Link to="/war-room" style={s.backLink}>
                    ← Back to war room
                </Link>
            </div>
        );
    }

    const statusColor = STATUS_COLORS[complaint.status] ?? '#94a3b8';

    return (
        <div style={s.page}>
            <header style={s.nav}>
                <Link to="/war-room" style={s.backLink}>
                    ← War Room
                </Link>
                <span style={s.navTitle}>Complaint Detail</span>
                <span />
            </header>

            <main style={s.main}>
                <div style={s.grid}>
                    {/* ── Left: complaint info ─────────────────────────────────────── */}
                    <div style={s.leftCol}>
                        <img src={complaint.imageUrl} alt={complaint.title} style={s.image} />

                        <div style={s.titleRow}>
                            <h1 style={s.title}>{complaint.title}</h1>
                            <span
                                style={{
                                    ...s.statusBadge,
                                    color: statusColor,
                                    background: `${statusColor}1a`,
                                }}
                            >
                                {COMPLAINT_STATUS_LABELS[complaint.status]}
                            </span>
                        </div>

                        {complaint.cascadeRisk && (
                            <div style={s.cascadeBanner}>
                                ⚡ Cascade risk — a nearby water/sewage complaint was recently
                                verified.
                                {complaint.cascadeSource && (
                                    <span style={s.cascadeSourceText}>
                                        {' '}
                                        Source: {complaint.cascadeSource.title}
                                    </span>
                                )}
                            </div>
                        )}

                        {complaint.duplicateOf && (
                            <div style={s.dupBanner}>
                                🔁 Marked as duplicate of: {complaint.duplicateOf.title}
                            </div>
                        )}

                        <p style={s.description}>{complaint.description}</p>

                        <div style={s.metaGrid}>
                            <div style={s.metaItem}>
                                <span style={s.metaLabel}>Category</span>
                                <span style={s.metaValue}>{complaint.category}</span>
                            </div>
                            <div style={s.metaItem}>
                                <span style={s.metaLabel}>Severity</span>
                                <span style={s.metaValue}>{complaint.severity ?? '—'}/10</span>
                            </div>
                            <div style={s.metaItem}>
                                <span style={s.metaLabel}>Ward</span>
                                <span style={s.metaValue}>{complaint.wardId?.name ?? '—'}</span>
                            </div>
                            <div style={s.metaItem}>
                                <span style={s.metaLabel}>AI Confidence</span>
                                <span style={s.metaValue}>
                                    {complaint.aiConfidence
                                        ? `${Math.round(complaint.aiConfidence * 100)}%`
                                        : '—'}
                                </span>
                            </div>
                            <div style={s.metaItem}>
                                <span style={s.metaLabel}>Reported by</span>
                                <span style={s.metaValue}>{complaint.createdBy?.name ?? '—'}</span>
                            </div>
                            <div style={s.metaItem}>
                                <span style={s.metaLabel}>Upvotes</span>
                                <span style={s.metaValue}>▲ {complaint.upvotes}</span>
                            </div>
                        </div>

                        {complaint.address && <p style={s.address}>📍 {complaint.address}</p>}

                        {/* Status timeline */}
                        {complaint.statusHistory?.length > 0 && (
                            <div style={s.historySection}>
                                <span style={s.sectionLabel}>History</span>
                                <div style={s.historyList}>
                                    {complaint.statusHistory
                                        .slice()
                                        .reverse()
                                        .map((h, i) => (
                                            <div key={i} style={s.historyItem}>
                                                <span
                                                    style={{
                                                        ...s.historyDot,
                                                        background: STATUS_COLORS[h.status],
                                                    }}
                                                />
                                                <div>
                                                    <span style={s.historyStatus}>
                                                        {COMPLAINT_STATUS_LABELS[h.status]}
                                                    </span>
                                                    {h.note && (
                                                        <span style={s.historyNote}>
                                                            {' '}
                                                            — {h.note}
                                                        </span>
                                                    )}
                                                    <span style={s.historyDate}>
                                                        {new Date(h.changedAt).toLocaleString(
                                                            'en-IN'
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Right: actions panel ─────────────────────────────────────── */}
                    <div style={s.rightCol}>
                        <div style={s.actionsCard}>
                            <span style={s.sectionLabel}>Actions</span>

                            {actionErr && <div style={s.actionErr}>{actionErr}</div>}

                            {complaint.status === 'submitted' && (
                                <>
                                    <button
                                        onClick={handleVerify}
                                        disabled={actionLoading}
                                        style={s.btnPrimary}
                                    >
                                        {actionLoading ? 'Verifying…' : '✓ Verify Complaint'}
                                    </button>
                                    <button
                                        onClick={() => setShowReject(!showReject)}
                                        style={s.btnDanger}
                                    >
                                        ✗ Reject
                                    </button>
                                    {showReject && (
                                        <div style={s.rejectPanel}>
                                            <textarea
                                                value={rejectNote}
                                                onChange={(e) => setRejectNote(e.target.value)}
                                                placeholder="Reason for rejection…"
                                                rows={3}
                                                style={s.textarea}
                                            />
                                            <button
                                                onClick={handleReject}
                                                disabled={actionLoading}
                                                style={s.btnDangerSolid}
                                            >
                                                Confirm Rejection
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}

                            {complaint.status === 'verified' && !showDispatch && (
                                <button onClick={openDispatchPanel} style={s.btnPrimary}>
                                    📋 Dispatch to Worker
                                </button>
                            )}

                            {showDispatch && (
                                <div style={s.dispatchPanel}>
                                    <span style={s.dispatchLabel}>Select worker</span>
                                    {workersLoading ? (
                                        <p style={s.dimText}>Loading workers…</p>
                                    ) : workers.length === 0 ? (
                                        <p style={s.dimText}>No available workers in this ward.</p>
                                    ) : (
                                        <select
                                            value={selectedWorker}
                                            onChange={(e) => setSelectedWorker(e.target.value)}
                                            style={s.select}
                                        >
                                            <option value="">Choose a worker…</option>
                                            {workers.map((w) => (
                                                <option key={w._id} value={w._id}>
                                                    {w.name} — {w.activeTaskCount} active task
                                                    {w.activeTaskCount !== 1 ? 's' : ''}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                    <textarea
                                        value={instructions}
                                        onChange={(e) => setInstructions(e.target.value)}
                                        placeholder="Instructions for worker (optional)"
                                        rows={2}
                                        style={s.textarea}
                                    />
                                    <button
                                        onClick={handleDispatch}
                                        disabled={actionLoading || !selectedWorker}
                                        style={s.btnPrimary}
                                    >
                                        {actionLoading ? 'Dispatching…' : 'Confirm Dispatch'}
                                    </button>
                                    <button
                                        onClick={() => setShowDispatch(false)}
                                        style={s.btnGhost}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}

                            {['assigned', 'in_progress'].includes(complaint.status) &&
                                assignment && (
                                    <div style={s.assignmentCard}>
                                        <span style={s.dispatchLabel}>Assigned worker</span>
                                        <p style={s.assignedWorkerName}>
                                            {assignment.workerId?.name}
                                        </p>
                                        <span style={s.assignmentStatus}>
                                            {ASSIGNMENT_STATUS_LABELS[assignment.status]}
                                        </span>
                                        {assignment.instructions && (
                                            <p style={s.assignmentInstructions}>
                                                "{assignment.instructions}"
                                            </p>
                                        )}
                                    </div>
                                )}

                            {complaint.status === 'resolved' && (
                                <div style={s.resolvedBanner}>
                                    ✓ Resolved{' '}
                                    {complaint.resolvedAt &&
                                        new Date(complaint.resolvedAt).toLocaleDateString('en-IN')}
                                    {complaint.resolutionImageUrl && (
                                        <img
                                            src={complaint.resolutionImageUrl}
                                            alt="Resolution proof"
                                            style={s.resolutionImg}
                                        />
                                    )}
                                </div>
                            )}

                            {complaint.status === 'rejected' && (
                                <div style={s.rejectedBanner}>✗ This complaint was rejected.</div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

const s = {
    page: {
        minHeight: '100vh',
        background: '#0f172a',
        fontFamily: "'Inter', system-ui, sans-serif",
        color: '#f8fafc',
    },
    loadingPage: {
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        background: '#0f172a',
        color: '#64748b',
    },
    nav: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
        height: '56px',
        background: '#0f172a',
        borderBottom: '1px solid #1e293b',
        position: 'sticky',
        top: 0,
        zIndex: 10,
    },
    backLink: { fontSize: '0.82rem', color: '#94a3b8', textDecoration: 'none' },
    navTitle: { fontSize: '0.9rem', fontWeight: 600, color: '#e2e8f0' },
    main: { maxWidth: '1000px', margin: '0 auto', padding: '1.75rem 1.5rem 4rem' },
    grid: { display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.75rem' },
    leftCol: { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
    rightCol: {},
    image: {
        width: '100%',
        height: '320px',
        objectFit: 'cover',
        borderRadius: '0.875rem',
        border: '1px solid #334155',
    },
    titleRow: {
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '1rem',
    },
    title: { fontSize: '1.3rem', fontWeight: 800, color: '#f8fafc', margin: 0, lineHeight: 1.3 },
    statusBadge: {
        fontSize: '0.75rem',
        fontWeight: 700,
        padding: '0.3rem 0.75rem',
        borderRadius: '9999px',
        whiteSpace: 'nowrap',
    },
    cascadeBanner: {
        background: '#7c2d1215',
        border: '1px solid #f9731644',
        borderRadius: '0.625rem',
        padding: '0.75rem 1rem',
        fontSize: '0.82rem',
        color: '#fb923c',
    },
    cascadeSourceText: { color: '#fdba74', fontWeight: 600 },
    dupBanner: {
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '0.625rem',
        padding: '0.75rem 1rem',
        fontSize: '0.82rem',
        color: '#94a3b8',
    },
    description: { fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.7, margin: 0 },
    metaGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '1rem',
        background: '#1e293b',
        borderRadius: '0.75rem',
        padding: '1rem',
        border: '1px solid #334155',
    },
    metaItem: { display: 'flex', flexDirection: 'column', gap: '0.2rem' },
    metaLabel: {
        fontSize: '0.65rem',
        color: '#475569',
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
    },
    metaValue: { fontSize: '0.84rem', color: '#e2e8f0', fontWeight: 600 },
    address: { fontSize: '0.8rem', color: '#64748b', margin: 0 },
    historySection: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
    sectionLabel: {
        fontSize: '0.7rem',
        fontWeight: 700,
        color: '#475569',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
    },
    historyList: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
    historyItem: { display: 'flex', alignItems: 'flex-start', gap: '0.625rem' },
    historyDot: {
        width: '0.5rem',
        height: '0.5rem',
        borderRadius: '50%',
        marginTop: '0.3rem',
        flexShrink: 0,
    },
    historyStatus: { fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0' },
    historyNote: { fontSize: '0.8rem', color: '#94a3b8' },
    historyDate: { display: 'block', fontSize: '0.7rem', color: '#475569', marginTop: '0.1rem' },
    actionsCard: {
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '0.875rem',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        position: 'sticky',
        top: '80px',
    },
    actionErr: {
        background: '#450a0a',
        border: '1px solid #7f1d1d',
        borderRadius: '0.5rem',
        color: '#fca5a5',
        fontSize: '0.78rem',
        padding: '0.6rem 0.75rem',
    },
    btnPrimary: {
        background: '#22d3ee',
        border: 'none',
        borderRadius: '0.5rem',
        color: '#0f172a',
        fontSize: '0.85rem',
        fontWeight: 700,
        padding: '0.65rem',
        cursor: 'pointer',
    },
    btnDanger: {
        background: 'none',
        border: '1px solid #7f1d1d',
        borderRadius: '0.5rem',
        color: '#ef4444',
        fontSize: '0.85rem',
        fontWeight: 600,
        padding: '0.6rem',
        cursor: 'pointer',
    },
    btnDangerSolid: {
        background: '#ef4444',
        border: 'none',
        borderRadius: '0.5rem',
        color: '#fff',
        fontSize: '0.82rem',
        fontWeight: 700,
        padding: '0.6rem',
        cursor: 'pointer',
    },
    btnGhost: {
        background: 'none',
        border: '1px solid #334155',
        borderRadius: '0.5rem',
        color: '#64748b',
        fontSize: '0.8rem',
        padding: '0.5rem',
        cursor: 'pointer',
    },
    rejectPanel: { display: 'flex', flexDirection: 'column', gap: '0.6rem' },
    dispatchPanel: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.6rem',
        borderTop: '1px solid #334155',
        paddingTop: '0.875rem',
    },
    dispatchLabel: { fontSize: '0.72rem', fontWeight: 600, color: '#64748b' },
    dimText: { fontSize: '0.78rem', color: '#475569' },
    select: {
        background: '#0f172a',
        border: '1px solid #334155',
        borderRadius: '0.5rem',
        color: '#f1f5f9',
        fontSize: '0.82rem',
        padding: '0.6rem 0.75rem',
        outline: 'none',
    },
    textarea: {
        background: '#0f172a',
        border: '1px solid #334155',
        borderRadius: '0.5rem',
        color: '#f1f5f9',
        fontSize: '0.82rem',
        padding: '0.6rem 0.75rem',
        resize: 'vertical',
        outline: 'none',
        fontFamily: 'inherit',
    },
    assignmentCard: {
        borderTop: '1px solid #334155',
        paddingTop: '0.875rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.3rem',
    },
    assignedWorkerName: { fontSize: '0.9rem', fontWeight: 700, color: '#e2e8f0', margin: 0 },
    assignmentStatus: { fontSize: '0.75rem', color: '#a78bfa', fontWeight: 600 },
    assignmentInstructions: {
        fontSize: '0.78rem',
        color: '#64748b',
        fontStyle: 'italic',
        margin: '0.3rem 0 0 0',
    },
    resolvedBanner: {
        background: '#052e1611',
        border: '1px solid #22c55e33',
        borderRadius: '0.625rem',
        padding: '0.875rem',
        fontSize: '0.82rem',
        color: '#4ade80',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.625rem',
    },
    resolutionImg: { width: '100%', borderRadius: '0.5rem' },
    rejectedBanner: {
        background: '#450a0a11',
        border: '1px solid #7f1d1d44',
        borderRadius: '0.625rem',
        padding: '0.875rem',
        fontSize: '0.82rem',
        color: '#f87171',
    },
};
