// src/pages/worker/TaskDetail.jsx

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, MapPin, X } from 'lucide-react';
import { getTaskDetailApi, advanceTaskStatusApi, completeTaskApi, parseWorkerError } from '../../api/worker.api.js';
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
import { NotificationBell } from '../../components/shared/NotificationBell.jsx';
import { RouteMap } from '../../components/shared/RouteMap.jsx';
import { getCategoryIcon } from '../../constants/categoryIcons.js';
import { ASSIGNMENT_STATUS_LABELS, ASSIGNMENT_NEXT_ACTION } from '../../constants/complaint.constants.js';

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
                    <SuccessCard icon={CheckCircle2} heading="Task completed!" sub="+10 field points earned. Great work.">
                        <button
                            onClick={() => navigate('/tasks')}
                            className="rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
                        >
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
                <p className="text-slate-400 dark:text-slate-500">{error ?? 'Task not found.'}</p>
                <BackLink to="/tasks">
                    <span className="flex items-center gap-1">
                        <ArrowLeft className="size-4" /> Back to tasks
                    </span>
                </BackLink>
            </FullscreenState>
        );
    }

    const complaint = assignment.complaintId;
    const CategoryIcon = getCategoryIcon(complaint?.category);
    const nextAction = ASSIGNMENT_NEXT_ACTION[assignment.status];
    const isEnRoute = assignment.status === 'en_route';
    const isOnSite = assignment.status === 'on_site';
    const isCompleted = assignment.status === 'completed';

    // Extract destination coords from complaint GeoJSON [lng, lat]
    const coords = complaint?.location?.coordinates;
    const destination = coords ? { lat: coords[1], lng: coords[0] } : null;

    return (
        <PageShell>
            <NavBar
                left={
                    <BackLink to="/tasks">
                        <span className="flex items-center gap-1">
                            <ArrowLeft className="size-4" /> Tasks
                        </span>
                    </BackLink>
                }
                center={<NavTitle>Task Detail</NavTitle>}
                right={<NotificationBell />}
            />

            <main className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-6 pb-16 sm:px-5">
                {/* Complaint image */}
                <img
                    src={complaint?.imageUrl}
                    alt={complaint?.title}
                    className="h-56 w-full rounded-xl border border-slate-200 dark:border-slate-800 object-cover"
                />

                {/* Title + meta */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-xl font-extrabold leading-snug text-slate-900 dark:text-white">{complaint?.title}</h1>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                            <CategoryIcon className="size-3.5" /> {complaint?.category}
                        </span>
                        <AssignmentBadge status={assignment.status} label={ASSIGNMENT_STATUS_LABELS[assignment.status]} />
                        <SeverityTag severity={complaint?.severity} />
                    </div>
                </div>

                <p className="text-base leading-relaxed text-slate-600 dark:text-slate-300">{complaint?.description}</p>

                {complaint?.address && (
                    <p className="flex items-center gap-1.5 text-sm text-slate-400 dark:text-slate-500">
                        <MapPin className="size-4 shrink-0" /> {complaint.address}
                    </p>
                )}

                <InstructionsBox text={assignment.instructions} />

                {/* Route map — shown from en_route until task is complete */}
                {(isEnRoute || isOnSite) && destination && (
                    <div className="flex flex-col gap-2">
                        <SectionLabel>Route to location</SectionLabel>
                        <RouteMap destination={destination} destinationLabel={complaint?.address ?? complaint?.title} height="280px" />
                    </div>
                )}

                <ErrorBanner message={actionErr} />

                {/* ── Status action card ─────────────────────────────────────── */}
                {!isCompleted && (
                    <Card>
                        <div className="flex flex-col gap-3">
                            <SectionLabel>Task progress</SectionLabel>
                            <span className="text-lg font-bold text-slate-900 dark:text-white">{ASSIGNMENT_STATUS_LABELS[assignment.status]}</span>

                            {nextAction && !isOnSite && (
                                <PrimaryButton onClick={handleAdvance} loading={advancing} loadingText="Updating…">
                                    {nextAction}
                                </PrimaryButton>
                            )}

                            {isOnSite && !showComplete && (
                                <PrimaryButton onClick={() => setShowComplete(true)}>
                                    <span className="flex items-center justify-center gap-1.5">
                                        <CheckCircle2 className="size-4" /> Complete Task
                                    </span>
                                </PrimaryButton>
                            )}
                        </div>
                    </Card>
                )}

                {/* ── Completion form ────────────────────────────────────────── */}
                {showComplete && (
                    <Card>
                        <div className="flex flex-col gap-4">
                            <SectionLabel>Proof of completion</SectionLabel>

                            <ImagePicker preview={proofPreview} onClick={() => fileRef.current?.click()} minHeight="150px" />
                            <input
                                ref={fileRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handleImagePick}
                                className="hidden"
                            />
                            {proofPreview && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setProofImage(null);
                                        setProofPreview(null);
                                    }}
                                    className="flex items-center gap-1 self-start text-xs text-rose-600 hover:text-rose-700"
                                >
                                    <X className="size-3.5" /> Remove photo
                                </button>
                            )}

                            <Textarea
                                value={completionNote}
                                onChange={(e) => setCompletionNote(e.target.value)}
                                placeholder="Notes about the fix (optional)"
                            />

                            <PrimaryButton onClick={handleComplete} loading={completing} disabled={!proofImage} loadingText="Submitting…">
                                Submit &amp; Resolve
                            </PrimaryButton>

                            <button
                                type="button"
                                onClick={() => setShowComplete(false)}
                                className="text-sm text-slate-400 dark:text-slate-500 transition-colors hover:text-slate-600 dark:hover:text-slate-300"
                            >
                                Cancel
                            </button>
                        </div>
                    </Card>
                )}

                {/* ── Completed state ────────────────────────────────────────── */}
                {isCompleted && (
                    <div className="flex flex-col gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                        <span className="flex items-center gap-1.5 text-base font-bold text-emerald-600">
                            <CheckCircle2 className="size-4" /> Task completed
                        </span>
                        {assignment.completedAt && (
                            <span className="text-xs text-slate-400 dark:text-slate-500">{new Date(assignment.completedAt).toLocaleString('en-IN')}</span>
                        )}
                        {assignment.completionImageUrl && (
                            <img src={assignment.completionImageUrl} alt="Resolution" className="mt-2 w-full rounded-md" />
                        )}
                        {assignment.completionNote && (
                            <p className="text-sm italic text-slate-600 dark:text-slate-300">&quot;{assignment.completionNote}&quot;</p>
                        )}
                    </div>
                )}
            </main>
        </PageShell>
    );
}
