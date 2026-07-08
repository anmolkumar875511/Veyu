// src/pages/worker/Observations.jsx

import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, CheckCircle2, MapPin, Rocket, Sparkles, Star, X } from 'lucide-react';
import { submitObservationApi, getMyObservationsApi, parseWorkerError } from '../../api/worker.api.js';
import {
    PageShell,
    NavBar,
    BackLink,
    NavTitle,
    ObservationBadge,
    ErrorBanner,
    SkeletonRows,
    ImagePicker,
    GpsButton,
    Textarea,
    Input,
    PrimaryButton,
    SuccessCard,
    AIResultBox,
    PointsBadge,
} from '../../components/worker/WorkerShell.jsx';
import { NotificationBell } from '../../components/shared/NotificationBell.jsx';
import { LocationPicker } from '../../components/shared/LocationPicker.jsx';

// ── Observation history row ───────────────────────────────────────────────────
function ObservationRow({ obs }) {
    return (
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5">
            <img src={obs.imageUrl} alt="Observation" className="size-13 shrink-0 rounded-md object-cover" />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">{obs.aiCategory ?? 'Unclassified'}</span>
                {obs.note && <span className="truncate text-xs text-slate-400 dark:text-slate-500">{obs.note}</span>}
                <span className="text-[0.68rem] text-slate-300 dark:text-slate-600">
                    {new Date(obs.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
                <ObservationBadge status={obs.status} />
                {obs.pointsAwarded > 0 && (
                    <span className="flex items-center gap-0.5 text-xs font-bold text-amber-500">
                        <Star className="size-3 fill-amber-500" /> +{obs.pointsAwarded}
                    </span>
                )}
            </div>
        </div>
    );
}

// ── Field label ───────────────────────────────────────────────────────────────
function FieldLabel({ children, htmlFor, required }) {
    return (
        <label htmlFor={htmlFor} className="text-sm font-medium text-slate-700 dark:text-slate-200">
            {children}
            {required && <span className="ml-1 text-rose-500">*</span>}
        </label>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function WorkerObservations() {
    const fileRef = useRef(null);

    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [note, setNote] = useState('');
    const [lat, setLat] = useState('');
    const [lng, setLng] = useState('');
    const [address, setAddress] = useState('');
    const [gpsStatus, setGpsStatus] = useState('idle');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);
    const [observations, setObservations] = useState([]);
    const [histLoading, setHistLoading] = useState(true);

    const fetchHistory = useCallback(async () => {
        try {
            const data = await getMyObservationsApi({ limit: 10 });
            setObservations(data.observations ?? []);
        } catch {
            /* non-fatal */
        } finally {
            setHistLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    function handleImageChange(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        setImage(file);
        setPreview(URL.createObjectURL(file));
    }

    function captureGPS() {
        if (!navigator.geolocation) {
            setGpsStatus('error');
            return;
        }
        setGpsStatus('loading');
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLat(pos.coords.latitude.toFixed(6));
                setLng(pos.coords.longitude.toFixed(6));
                setGpsStatus('ok');
            },
            () => setGpsStatus('error'),
            { timeout: 8000, maximumAge: 30_000 }
        );
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError(null);
        if (!image) {
            setError('A photo is required.');
            return;
        }
        if (!lat || !lng) {
            setError("Location is required. Use 'Capture location'.");
            return;
        }

        const fd = new FormData();
        fd.append('image', image);
        fd.append('latitude', lat);
        fd.append('longitude', lng);
        if (address) fd.append('address', address.trim());
        if (note) fd.append('note', note.trim());

        setSubmitting(true);
        try {
            const data = await submitObservationApi(fd);
            setResult(data);
            fetchHistory();
        } catch (err) {
            setError(parseWorkerError(err));
        } finally {
            setSubmitting(false);
        }
    }

    function resetForm() {
        setResult(null);
        setImage(null);
        setPreview(null);
        setNote('');
        setLat('');
        setLng('');
        setAddress('');
        setGpsStatus('idle');
        setError(null);
    }

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
                center={<NavTitle>FieldMesh</NavTitle>}
                right={<NotificationBell />}
            />

            <main className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-6 pb-16 sm:px-5">
                {/* Intro */}
                <div>
                    <h1 className="mb-1 text-xl font-extrabold text-slate-900 dark:text-white sm:text-2xl">Report an Observation</h1>
                    <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                        Spotted something on your route? Report it directly — no citizen complaint needed. AI will classify it
                        instantly.
                    </p>
                </div>

                {/* ── Success state ──────────────────────────────────────────── */}
                {result && (
                    <SuccessCard
                        icon={result.autoElevated ? Rocket : CheckCircle2}
                        heading={result.autoElevated ? 'Auto-elevated to complaint!' : 'Observation submitted'}
                        sub={
                            result.autoElevated
                                ? 'High AI confidence — this was instantly promoted to a verified complaint.'
                                : 'Your observation will be reviewed by an officer shortly.'
                        }
                    >
                        <AIResultBox
                            category={result.observation.aiCategory}
                            severity={result.observation.aiSeverity}
                            confidence={result.observation.aiConfidence}
                        />
                        <PointsBadge points={result.autoElevated ? 15 : 2} />
                        <button
                            onClick={resetForm}
                            className="rounded-lg bg-primary-600 px-6 py-2.5 text-base font-bold text-white transition-colors hover:bg-primary-700"
                        >
                            Report another
                        </button>
                    </SuccessCard>
                )}

                {/* ── Form ──────────────────────────────────────────────────── */}
                {!result && (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
                        <ErrorBanner message={error} />

                        {/* Photo */}
                        <div className="flex flex-col gap-2">
                            <FieldLabel required>Photo</FieldLabel>
                            <ImagePicker preview={preview} onClick={() => fileRef.current?.click()} />
                            <input
                                ref={fileRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handleImageChange}
                                className="hidden"
                            />
                            {preview && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setImage(null);
                                        setPreview(null);
                                    }}
                                    className="flex items-center gap-1 self-start text-xs text-rose-600 hover:text-rose-700"
                                >
                                    <X className="size-3.5" /> Remove photo
                                </button>
                            )}
                        </div>

                        {/* Note */}
                        <div className="flex flex-col gap-2">
                            <FieldLabel htmlFor="note">Note (optional)</FieldLabel>
                            <Textarea
                                id="note"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="e.g. Cracked pavement near bus stop, getting worse"
                            />
                        </div>

                        {/* Location */}
                        <div className="flex flex-col gap-2">
                            <FieldLabel required>Location</FieldLabel>
                            <GpsButton status={gpsStatus} onClick={captureGPS} />

                            {/* Map pin — lets worker fine-tune after GPS fix or use instead of GPS */}
                            <LocationPicker
                                lat={lat ? parseFloat(lat) : null}
                                lng={lng ? parseFloat(lng) : null}
                                onChange={(newLat, newLng) => {
                                    setLat(newLat.toFixed(6));
                                    setLng(newLng.toFixed(6));
                                    setGpsStatus('ok');
                                }}
                                height="220px"
                            />

                            {lat && lng && (
                                <p className="flex items-center gap-1 text-xs text-emerald-600">
                                    <MapPin className="size-3.5" /> {parseFloat(lat).toFixed(4)}°N, {parseFloat(lng).toFixed(4)}°E
                                </p>
                            )}
                        </div>

                        {/* Landmark */}
                        <div className="flex flex-col gap-2">
                            <FieldLabel htmlFor="address">Landmark (optional)</FieldLabel>
                            <Input
                                id="address"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="e.g. Near bus stop, Sector 4"
                            />
                        </div>

                        {/* AI notice */}
                        <div className="flex items-start gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-surface-50 dark:bg-slate-950 p-3">
                            <Sparkles className="mt-0.5 size-4 shrink-0 text-primary-500" aria-hidden="true" />
                            <span className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                                AI will classify your photo instantly. Confidence ≥ 80% auto-elevates to a verified complaint and
                                awards 15 field points.
                            </span>
                        </div>

                        <PrimaryButton type="submit" loading={submitting} loadingText="Submitting…">
                            Submit Observation
                        </PrimaryButton>
                    </form>
                )}

                {/* ── History ───────────────────────────────────────────────── */}
                <section className="flex flex-col gap-4">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">Recent Observations</h2>
                    {histLoading && <SkeletonRows count={3} height="72px" />}
                    {!histLoading && observations.length === 0 && (
                        <p className="text-sm text-slate-400 dark:text-slate-500">No observations submitted yet.</p>
                    )}
                    {!histLoading && observations.length > 0 && (
                        <div className="flex flex-col gap-2">
                            {observations.map((o) => (
                                <ObservationRow key={o._id} obs={o} />
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </PageShell>
    );
}
