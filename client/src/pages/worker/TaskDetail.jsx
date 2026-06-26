// src/pages/worker/TaskDetail.jsx

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    getTaskDetailApi,
    advanceTaskStatusApi,
    completeTaskApi,
    parseWorkerError,
} from '../../api/worker.api.js';
import {
    PageShell,
    NavBar,
    BackLink,
    NavTitle,
    FullscreenState,
    AssignmentBadge,
    SeverityTag,
    ErrorBanner,
    InstructionsBox,
    ImagePicker,
    Textarea,
    PrimaryButton,
    SuccessCard,
    Card,
    SectionLabel,
} from '../../components/worker/WorkerShell.jsx';
import { color, font, space, radius, mk } from '../../theme/index.js';
import {
    ASSIGNMENT_STATUS_LABELS,
    ASSIGNMENT_NEXT_ACTION,
    CATEGORY_ICONS,
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
    const [showComplete, setShowComplete] = useState(false);
    const [proofImage, setProofImage] = useState(null);
    const [proofPreview, setProofPreview] = useState(null);
    const [completionNote, setCompletionNote] = useState('');
    const [completing, setCompleting] = useState(false);
    const [completed, setCompleted] = useState(false);

    useEffect(() => {
        setLoading(true);
        getTaskDetailApi(id)
            .then((data) => {
                setAssignment(data.assignment);
                setError(null);
            })
            .catch(() => setError('Could not load task details.'))
            .finally(() => setLoading(false));
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

    if (loading) return <FullscreenState>Loading…</FullscreenState>;

    if (completed) {
        return (
            <PageShell>
                <FullscreenState>
                    <SuccessCard
                        icon="✅"
                        heading="Task completed!"
                        sub="+10 field points earned. Great work."
                    >
                        <button onClick={() => navigate('/tasks')} style={mk.btnPrimary()}>
                            Back to tasks
                        </button>
                    </SuccessCard>
                </FullscreenState>
            </PageShell>
        );
    }

    if (error || !assignment) {
        return (
            <FullscreenState>
                <p style={{ color: color.textMuted, margin: 0 }}>{error ?? 'Task not found.'}</p>
                <BackLink to="/tasks">← Back to tasks</BackLink>
            </FullscreenState>
        );
    }

    const complaint = assignment.complaintId;
    const icon = CATEGORY_ICONS[complaint?.category] ?? '📋';
    const nextAction = ASSIGNMENT_NEXT_ACTION[assignment.status];
    const isOnSite = assignment.status === 'on_site';
    const isCompleted = assignment.status === 'completed';

    return (
        <PageShell>
            <NavBar
                left={<BackLink to="/tasks">← Tasks</BackLink>}
                center={<NavTitle>Task Detail</NavTitle>}
                right={<span />}
            />

            <main
                style={{
                    maxWidth: '540px',
                    margin: '0 auto',
                    padding: `${space[6]} ${space[5]} ${space[16]}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: space[5],
                }}
            >
                {/* Complaint image */}
                <img
                    src={complaint?.imageUrl}
                    alt={complaint?.title}
                    style={{
                        width: '100%',
                        height: '220px',
                        objectFit: 'cover',
                        borderRadius: radius.xl,
                        border: `1px solid ${color.borderDefault}`,
                    }}
                />

                {/* Title + meta */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: space[2] }}>
                    <h1
                        style={{
                            fontSize: '1.2rem',
                            fontWeight: font.weight.extrabold,
                            color: color.textPrimary,
                            margin: 0,
                            lineHeight: 1.3,
                        }}
                    >
                        {complaint?.title}
                    </h1>
                    <div
                        style={{
                            display: 'flex',
                            gap: space[2],
                            flexWrap: 'wrap',
                            alignItems: 'center',
                        }}
                    >
                        <span style={{ fontSize: font.size.xs, color: color.textSecondary }}>
                            {icon} {complaint?.category}
                        </span>
                        <AssignmentBadge
                            status={assignment.status}
                            label={ASSIGNMENT_STATUS_LABELS[assignment.status]}
                        />
                        <SeverityTag severity={complaint?.severity} />
                    </div>
                </div>

                <p
                    style={{
                        fontSize: font.size.base,
                        color: color.textSecondary,
                        lineHeight: 1.7,
                        margin: 0,
                    }}
                >
                    {complaint?.description}
                </p>

                {complaint?.address && (
                    <p style={{ fontSize: font.size.sm, color: color.textMuted, margin: 0 }}>
                        📍 {complaint.address}
                    </p>
                )}

                <InstructionsBox text={assignment.instructions} />

                <ErrorBanner message={actionErr} />

                {/* ── Status action card ─────────────────────────────────────── */}
                {!isCompleted && (
                    <Card>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: space[3] }}>
                            <SectionLabel>Task progress</SectionLabel>
                            <span
                                style={{
                                    fontSize: '1.1rem',
                                    fontWeight: font.weight.bold,
                                    color: color.textPrimary,
                                }}
                            >
                                {ASSIGNMENT_STATUS_LABELS[assignment.status]}
                            </span>

                            {nextAction && !isOnSite && (
                                <PrimaryButton
                                    onClick={handleAdvance}
                                    loading={advancing}
                                    loadingText="Updating…"
                                >
                                    {nextAction}
                                </PrimaryButton>
                            )}

                            {isOnSite && !showComplete && (
                                <PrimaryButton onClick={() => setShowComplete(true)}>
                                    ✓ Complete Task
                                </PrimaryButton>
                            )}
                        </div>
                    </Card>
                )}

                {/* ── Completion form ────────────────────────────────────────── */}
                {showComplete && (
                    <Card>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: space[4] }}>
                            <SectionLabel>Proof of completion</SectionLabel>

                            <ImagePicker
                                preview={proofPreview}
                                onClick={() => fileRef.current?.click()}
                                minHeight="150px"
                            />
                            <input
                                ref={fileRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handleImagePick}
                                style={{ display: 'none' }}
                            />
                            {proofPreview && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setProofImage(null);
                                        setProofPreview(null);
                                    }}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: color.danger,
                                        fontSize: font.size.xs,
                                        cursor: 'pointer',
                                        alignSelf: 'flex-start',
                                    }}
                                >
                                    Remove photo
                                </button>
                            )}

                            <Textarea
                                value={completionNote}
                                onChange={(e) => setCompletionNote(e.target.value)}
                                placeholder="Notes about the fix (optional)"
                            />

                            <PrimaryButton
                                onClick={handleComplete}
                                loading={completing}
                                disabled={!proofImage}
                                loadingText="Submitting…"
                            >
                                Submit &amp; Resolve
                            </PrimaryButton>

                            <button
                                type="button"
                                onClick={() => setShowComplete(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: color.textMuted,
                                    fontSize: font.size.sm,
                                    cursor: 'pointer',
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </Card>
                )}

                {/* ── Completed state ────────────────────────────────────────── */}
                {isCompleted && (
                    <div
                        style={{
                            background: '#052e1611',
                            border: '1px solid #22c55e33',
                            borderRadius: radius.xl,
                            padding: space[5],
                            display: 'flex',
                            flexDirection: 'column',
                            gap: space[2],
                        }}
                    >
                        <span
                            style={{
                                fontSize: font.size.base,
                                color: color.success,
                                fontWeight: font.weight.bold,
                            }}
                        >
                            ✓ Task completed
                        </span>
                        {assignment.completedAt && (
                            <span style={{ fontSize: font.size.xs, color: color.textMuted }}>
                                {new Date(assignment.completedAt).toLocaleString('en-IN')}
                            </span>
                        )}
                        {assignment.completionImageUrl && (
                            <img
                                src={assignment.completionImageUrl}
                                alt="Resolution"
                                style={{
                                    width: '100%',
                                    borderRadius: radius.md,
                                    marginTop: space[2],
                                }}
                            />
                        )}
                        {assignment.completionNote && (
                            <p
                                style={{
                                    fontSize: font.size.sm,
                                    color: color.textSecondary,
                                    fontStyle: 'italic',
                                    margin: 0,
                                }}
                            >
                                "{assignment.completionNote}"
                            </p>
                        )}
                    </div>
                )}
            </main>
        </PageShell>
    );
}
