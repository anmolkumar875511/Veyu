// src/pages/citizen/SubmitComplaint.jsx

import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Camera,
    CheckCircle2,
    Crosshair,
    MapPin,
    Repeat2,
    Sparkles,
    TriangleAlert,
    X,
} from 'lucide-react';
import { submitComplaintApi, parseComplaintError } from '../../api/complaints.api.js';
import { COMPLAINT_CATEGORIES } from '../../constants/complaint.constants.js';
import { PageShell, NavBar, ErrorBanner } from '../../components/citizen/CitizenShell.jsx';
import { LocationPicker } from '../../components/shared/LocationPicker.jsx';
import { Field, Input, Textarea, Select } from '../../components/ui/Input.jsx';
import { PrimaryButton, SecondaryButton } from '../../components/AuthShell.jsx';
import { cn } from '../../lib/utils';

const MAX_FILE_SIZE = 8 * 1024 * 1024;

// ── Success screen ─────────────────────────────────────────────────────────────
function SuccessScreen({ result, onReset, navigate }) {
    const { complaint, isDuplicate } = result;
    return (
        <PageShell>
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-auto my-12 flex max-w-md flex-col items-center gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-8 py-10 text-center shadow-[var(--shadow-card)] sm:my-16"
            >
                <div
                    className={cn(
                        'flex size-14 items-center justify-center rounded-full',
                        isDuplicate ? 'bg-amber-50' : 'bg-emerald-50'
                    )}
                >
                    {isDuplicate ? (
                        <Repeat2 className="size-7 text-amber-500" />
                    ) : (
                        <CheckCircle2 className="size-7 text-emerald-500" />
                    )}
                </div>

                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                    {isDuplicate ? 'Already reported!' : 'Report submitted!'}
                </h2>

                {isDuplicate ? (
                    <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                        A similar issue already exists nearby. We&apos;ve linked your report to it. You can upvote
                        the original to increase its priority.
                    </p>
                ) : (
                    <>
                        <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                            Your complaint has been submitted and will be reviewed shortly.
                        </p>
                        <div className="flex w-full flex-col gap-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-surface-50 dark:bg-slate-950 px-5 py-3">
                            <span className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">AI classified as</span>
                            <span className="text-base font-bold text-primary-600">{complaint.category}</span>
                            <span className="text-sm text-slate-500 dark:text-slate-400">
                                Severity: <strong className="text-slate-700 dark:text-slate-200">{complaint.severity}/10</strong>
                            </span>
                        </div>
                    </>
                )}

                <div className="mt-2 flex w-full flex-col gap-3">
                    <PrimaryButton onClick={() => navigate('/my-reports')}>View my reports</PrimaryButton>
                    <SecondaryButton onClick={onReset}>Submit another</SecondaryButton>
                </div>
            </motion.div>
        </PageShell>
    );
}

// ── Main form ─────────────────────────────────────────────────────────────────
export default function SubmitComplaint() {
    const navigate = useNavigate();
    const fileRef = useRef(null);

    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [lat, setLat] = useState('');
    const [lng, setLng] = useState('');
    const [address, setAddress] = useState('');
    const [gpsStatus, setGpsStatus] = useState('idle');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});
    const [result, setResult] = useState(null);

    // ── Image ─────────────────────────────────────────────────────────────────
    function handleImageChange(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            setFieldErrors((fe) => ({ ...fe, image: 'Only JPG, PNG, or WEBP accepted.' }));
            return;
        }
        if (file.size > MAX_FILE_SIZE) {
            setFieldErrors((fe) => ({ ...fe, image: 'Image must be under 8MB.' }));
            return;
        }
        setImage(file);
        setPreview(URL.createObjectURL(file));
        setFieldErrors((fe) => {
            const n = { ...fe };
            delete n.image;
            return n;
        });
    }

    // ── GPS ───────────────────────────────────────────────────────────────────
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
                setFieldErrors((fe) => {
                    const n = { ...fe };
                    delete n.coords;
                    return n;
                });
            },
            () => setGpsStatus('error'),
            { timeout: 8000, maximumAge: 30_000 }
        );
    }

    // ── Validate ──────────────────────────────────────────────────────────────
    function validate() {
        const errs = {};
        if (!image) errs.image = 'A photo is required.';
        if (description.trim().length < 10)
            errs.description = 'Description must be at least 10 characters.';
        if (!lat || !lng) errs.coords = "Location is required. Use 'Use my location'.";
        return errs;
    }

    // ── Submit ────────────────────────────────────────────────────────────────
    async function handleSubmit(e) {
        e.preventDefault();
        setError(null);
        const errs = validate();
        if (Object.keys(errs).length > 0) {
            setFieldErrors(errs);
            return;
        }

        const fd = new FormData();
        fd.append('image', image);
        fd.append('description', description.trim());
        fd.append('latitude', lat);
        fd.append('longitude', lng);
        if (address) fd.append('address', address.trim());
        if (category) fd.append('categoryOverride', category);

        setSubmitting(true);
        try {
            setResult(await submitComplaintApi(fd));
        } catch (err) {
            setError(parseComplaintError(err));
        } finally {
            setSubmitting(false);
        }
    }

    function handleReset() {
        setResult(null);
        setImage(null);
        setPreview(null);
        setDescription('');
        setCategory('');
        setLat('');
        setLng('');
        setAddress('');
        setGpsStatus('idle');
        setError(null);
        setFieldErrors({});
    }

    // ── Success ───────────────────────────────────────────────────────────────
    if (result) {
        return <SuccessScreen result={result} onReset={handleReset} navigate={navigate} />;
    }

    const gpsLabel = {
        loading: 'Getting location…',
        ok: 'Location captured — tap to refresh',
        idle: 'Use my location',
        error: 'GPS failed — use map below',
    }[gpsStatus];

    return (
        <PageShell>
            <NavBar
                left={
                    <Link to="/dashboard" className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700">
                        <ArrowLeft className="size-4" /> Dashboard
                    </Link>
                }
                center={<span className="text-sm font-semibold text-slate-900 dark:text-white">Report Issue</span>}
                right={<span />}
            />

            <main className="mx-auto max-w-3xl px-4 py-8 pb-16 sm:px-5 sm:py-10">
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8"
                >
                    <h1 className="mb-1 text-xl font-extrabold text-slate-900 dark:text-white sm:text-2xl">Report a civic issue</h1>
                    <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
                        AI will auto-classify your report and score its severity.
                    </p>

                    <ErrorBanner message={error} />

                    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
                        {/* Photo */}
                        <Field label="Photo" required error={fieldErrors.image}>
                            <div
                                onClick={() => fileRef.current?.click()}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
                                className={cn(
                                    'flex min-h-[180px] cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed',
                                    fieldErrors.image ? 'border-rose-300' : 'border-slate-200 dark:border-slate-800',
                                    !preview && 'bg-surface-50 dark:bg-slate-950'
                                )}
                            >
                                {preview ? (
                                    <img src={preview} alt="Preview" className="block h-56 w-full object-cover" />
                                ) : (
                                    <div className="flex flex-col items-center gap-2 px-8 py-10 text-center">
                                        <Camera className="size-9 text-slate-300 dark:text-slate-600" aria-hidden="true" />
                                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Tap to add photo</span>
                                        <span className="text-xs text-slate-400 dark:text-slate-500">JPG, PNG or WEBP · max 8MB</span>
                                    </div>
                                )}
                            </div>
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
                        </Field>

                        {/* Description */}
                        <Field label="Description" required htmlFor="description" error={fieldErrors.description}>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => {
                                    setDescription(e.target.value);
                                    if (fieldErrors.description)
                                        setFieldErrors((fe) => {
                                            const n = { ...fe };
                                            delete n.description;
                                            return n;
                                        });
                                }}
                                rows={4}
                                placeholder="Describe the issue in detail. e.g. Large pothole near the school gate causing accidents…"
                                error={!!fieldErrors.description}
                            />
                            <div className="text-right text-xs text-slate-400 dark:text-slate-500">{description.length}/1000</div>
                        </Field>

                        {/* Category override */}
                        <Field label="Category" optional htmlFor="category">
                            <Select id="category" value={category} onChange={(e) => setCategory(e.target.value)}>
                                <option value="">Let AI decide</option>
                                {COMPLAINT_CATEGORIES.map((c) => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </Select>
                        </Field>

                        {/* Location */}
                        <Field label="Location" required error={fieldErrors.coords}>
                            <button
                                type="button"
                                onClick={captureGPS}
                                disabled={gpsStatus === 'loading'}
                                className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-left text-sm text-slate-600 dark:text-slate-300 transition-colors hover:bg-surface-50 dark:hover:bg-slate-800 disabled:opacity-60"
                            >
                                {gpsStatus === 'error' ? (
                                    <TriangleAlert className="size-4 shrink-0 text-amber-500" />
                                ) : (
                                    <Crosshair className={cn('size-4 shrink-0 text-primary-600', gpsStatus === 'loading' && 'animate-spin')} />
                                )}
                                {gpsLabel}
                            </button>

                            {/* Map pin picker — always visible so citizen can fine-tune */}
                            <LocationPicker
                                lat={lat ? parseFloat(lat) : null}
                                lng={lng ? parseFloat(lng) : null}
                                onChange={(newLat, newLng) => {
                                    setLat(newLat.toFixed(6));
                                    setLng(newLng.toFixed(6));
                                    if (fieldErrors.coords)
                                        setFieldErrors((fe) => {
                                            const n = { ...fe };
                                            delete n.coords;
                                            return n;
                                        });
                                }}
                                height="240px"
                            />

                            {lat && lng && (
                                <p className="flex items-center gap-1 text-xs text-emerald-600">
                                    <MapPin className="size-3.5" /> {parseFloat(lat).toFixed(4)}°N,{' '}
                                    {parseFloat(lng).toFixed(4)}°E
                                </p>
                            )}
                        </Field>

                        {/* Address */}
                        <Field label="Landmark / address" optional htmlFor="address">
                            <Input
                                id="address"
                                type="text"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="e.g. Near SBI Bank, Sector 12"
                            />
                        </Field>

                        {/* AI notice */}
                        <div className="flex items-start gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-surface-50 dark:bg-slate-950 p-3">
                            <Sparkles className="mt-0.5 size-4 shrink-0 text-primary-500" aria-hidden="true" />
                            <span className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                                AI will automatically classify your complaint and score its severity. This usually
                                takes 2–5 seconds after submission.
                            </span>
                        </div>

                        {/* Submit */}
                        <PrimaryButton type="submit" loading={submitting} loadingText="Submitting…">
                            Submit Report
                        </PrimaryButton>
                    </form>
                </motion.div>
            </main>
        </PageShell>
    );
}
