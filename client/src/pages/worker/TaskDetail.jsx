// ─────────────────────────────────────────────────────────────────────────────
// src/pages/worker/TaskDetail.jsx
//
// Single task view. Worker can:
//   - See full complaint info + officer instructions
//   - Advance status: pending → acknowledged → en_route → on_site
//   - Complete the task by uploading a proof photo (only when on_site)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    getTaskDetailApi,
    advanceTaskStatusApi,
    completeTaskApi,
    parseWorkerError,
} from '../../api/worker.api.js';
import {
    ASSIGNMENT_STATUS_LABELS,
    ASSIGNMENT_NEXT_ACTION,
} from '../../constants/complaint.constants.js';

export default function WorkerTaskDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const fileRef = useRef(null);

    const [assignment, setAssignment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionErr, setActionErr] = useState(null);
    const [advancing, setAdvancing] = useState(false);

    // Completion form state
    const [showComplete, setShowComplete] = useState(false);
    const [proofImage, setProofImage] = useState(null);
    const [proofPreview, setProofPreview] = useState(null);
    const [completionNote, setCompletionNote] = useState('');
    const [completing, setCompleting] = useState(false);
    const [completed, setCompleted] = useState(false);

    async function fetchTask() {
        try {
            const data = await getTaskDetailApi(id);
            setAssignment(data.assignment);
            setError(null);
        } catch {
            setError('Could not load task details.');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchTask();
    }, [id]);

    async function handleAdvance() {
        setAdvancing(true);
        setActionErr(null);
        try {
            const data = await advanceTaskStatusApi(id);
            setAssignment(data.assignment);
        } catch (e) {
            setActionErr(parseWorkerError(e));
        } finally {
            setAdvancing(false);
        }
    }

    function handleImagePick(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        setProofImage(file);
        setProofPreview(URL.createObjectURL(file));
    }

    async function handleComplete() {
        if (!proofImage) {
            setActionErr('A proof photo is required.');
            return;
        }

        const fd = new FormData();
        fd.append('image', proofImage);
        if (completionNote.trim()) fd.append('completionNote', completionNote.trim());

        setCompleting(true);
        setActionErr(null);
        try {
            await completeTaskApi(id, fd);
            setCompleted(true);
        } catch (e) {
            setActionErr(parseWorkerError(e));
        } finally {
            setCompleting(false);
        }
    }

    if (loading) return <div style={s.loadingPage}>Loading…</div>;

    if (completed) {
        return (
            <div style={s.loadingPage}>
                <div style={s.successCard}>
                    <span style={s.successIcon}>✅</span>
                    <h2 style={s.successHeading}>Task completed!</h2>
                    <p style={s.successSub}>+10 field points earned. Great work.</p>
                    <button onClick={() => navigate('/tasks')} style={s.btnPrimary}>
                        Back to tasks
                    </button>
                </div>
            </div>
        );
    }

    if (error || !assignment) {
        return (
            <div style={s.loadingPage}>
                <p>{error ?? 'Task not found.'}</p>
                <Link to="/tasks" style={s.backLink}>
                    ← Back to tasks
                </Link>
            </div>
        );
    }

    const complaint = assignment.complaintId;
    const nextAction = ASSIGNMENT_NEXT_ACTION[assignment.status];
    const isOnSite = assignment.status === 'on_site';

    return (
        <div style={s.page}>
            <header style={s.nav}>
                <Link to="/tasks" style={s.backLink}>
                    ← Tasks
                </Link>
                <span style={s.navTitle}>Task Detail</span>
                <span />
            </header>

            <main style={s.main}>
                <img src={complaint?.imageUrl} alt={complaint?.title} style={s.image} />

                <h1 style={s.title}>{complaint?.title}</h1>
                <div style={s.metaRow}>
                    <span style={s.metaTag}>{complaint?.category}</span>
                    {complaint?.severity && (
                        <span
                            style={{
                                ...s.metaTag,
                                color:
                                    complaint.severity >= 7
                                        ? '#ef4444'
                                        : complaint.severity >= 4
                                          ? '#f59e0b'
                                          : '#22c55e',
                            }}
                        >
                            Severity {complaint.severity}/10
                        </span>
                    )}
                </div>

                <p style={s.description}>{complaint?.description}</p>

                {complaint?.address && <p style={s.address}>📍 {complaint.address}</p>}

                {assignment.instructions && (
                    <div style={s.instructionsBox}>
                        <span style={s.instructionsLabel}>Officer instructions</span>
                        <p style={s.instructionsText}>{assignment.instructions}</p>
                    </div>
                )}

                {actionErr && <div style={s.errorBanner}>{actionErr}</div>}

                {/* ── Status progression ─────────────────────────────────────────── */}
                <div style={s.statusCard}>
                    <span style={s.statusLabel}>Current status</span>
                    <span style={s.statusValue}>{ASSIGNMENT_STATUS_LABELS[assignment.status]}</span>

                    {nextAction && !isOnSite && (
                        <button onClick={handleAdvance} disabled={advancing} style={s.btnPrimary}>
                            {advancing ? 'Updating…' : nextAction}
                        </button>
                    )}

                    {isOnSite && !showComplete && (
                        <button onClick={() => setShowComplete(true)} style={s.btnPrimary}>
                            ✓ Complete Task
                        </button>
                    )}
                </div>

                {/* ── Completion form ───────────────────────────────────────────── */}
                {showComplete && (
                    <div style={s.completeCard}>
                        <span style={s.completeLabel}>Proof of completion</span>

                        <div
                            style={{
                                ...s.imagePicker,
                                background: proofPreview ? 'transparent' : '#0f172a',
                            }}
                            onClick={() => fileRef.current?.click()}
                        >
                            {proofPreview ? (
                                <img src={proofPreview} alt="Proof" style={s.proofPreviewImg} />
                            ) : (
                                <div style={s.imagePickerInner}>
                                    <span style={s.cameraIcon}>📷</span>
                                    <span style={s.imagePickerText}>Tap to add proof photo</span>
                                </div>
                            )}
                        </div>
                        <input
                            ref={fileRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleImagePick}
                            style={{ display: 'none' }}
                        />

                        <textarea
                            value={completionNote}
                            onChange={(e) => setCompletionNote(e.target.value)}
                            placeholder="Notes about the fix (optional)"
                            rows={3}
                            style={s.textarea}
                        />

                        <button
                            onClick={handleComplete}
                            disabled={completing || !proofImage}
                            style={s.btnPrimary}
                        >
                            {completing ? 'Submitting…' : 'Submit & Resolve'}
                        </button>
                    </div>
                )}
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
    main: {
        maxWidth: '540px',
        margin: '0 auto',
        padding: '1.5rem 1.25rem 4rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.1rem',
    },
    image: {
        width: '100%',
        height: '220px',
        objectFit: 'cover',
        borderRadius: '0.875rem',
        border: '1px solid #334155',
    },
    title: { fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', margin: 0 },
    metaRow: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' },
    metaTag: {
        fontSize: '0.72rem',
        fontWeight: 600,
        color: '#94a3b8',
        background: '#1e293b',
        padding: '0.25rem 0.625rem',
        borderRadius: '9999px',
        border: '1px solid #334155',
    },
    description: { fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.6, margin: 0 },
    address: { fontSize: '0.78rem', color: '#475569', margin: 0 },
    instructionsBox: {
        background: '#a78bfa11',
        border: '1px solid #a78bfa33',
        borderRadius: '0.625rem',
        padding: '0.875rem',
    },
    instructionsLabel: {
        fontSize: '0.68rem',
        fontWeight: 700,
        color: '#c4b5fd',
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
    },
    instructionsText: { fontSize: '0.82rem', color: '#ddd6fe', margin: '0.35rem 0 0 0' },
    errorBanner: {
        background: '#450a0a',
        border: '1px solid #7f1d1d',
        borderRadius: '0.5rem',
        color: '#fca5a5',
        fontSize: '0.82rem',
        padding: '0.7rem 0.875rem',
    },
    statusCard: {
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '0.875rem',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.6rem',
    },
    statusLabel: {
        fontSize: '0.7rem',
        color: '#475569',
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
    },
    statusValue: { fontSize: '1.1rem', fontWeight: 700, color: '#e2e8f0' },
    btnPrimary: {
        background: '#22d3ee',
        border: 'none',
        borderRadius: '0.5rem',
        color: '#0f172a',
        fontSize: '0.875rem',
        fontWeight: 700,
        padding: '0.7rem',
        cursor: 'pointer',
        marginTop: '0.25rem',
    },
    completeCard: {
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '0.875rem',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
    },
    completeLabel: { fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8' },
    imagePicker: {
        border: '2px dashed #334155',
        borderRadius: '0.75rem',
        minHeight: '150px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    imagePickerInner: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.4rem',
        padding: '1.5rem',
    },
    cameraIcon: { fontSize: '2rem' },
    imagePickerText: { fontSize: '0.8rem', color: '#94a3b8' },
    proofPreviewImg: { width: '100%', height: '180px', objectFit: 'cover', display: 'block' },
    textarea: {
        background: '#0f172a',
        border: '1px solid #334155',
        borderRadius: '0.5rem',
        color: '#f1f5f9',
        fontSize: '0.84rem',
        padding: '0.65rem 0.8rem',
        resize: 'vertical',
        outline: 'none',
        fontFamily: 'inherit',
    },
    successCard: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.875rem',
        textAlign: 'center',
    },
    successIcon: { fontSize: '2.5rem' },
    successHeading: { fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', margin: 0 },
    successSub: { fontSize: '0.84rem', color: '#94a3b8', margin: 0 },
};
