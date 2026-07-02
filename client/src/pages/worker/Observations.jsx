// src/pages/worker/Observations.jsx

import { useState, useRef, useEffect, useCallback } from 'react';
import {
    submitObservationApi,
    getMyObservationsApi,
    parseWorkerError,
} from '../../api/worker.api.js';
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
import { color, font, space, radius } from '../../theme/index.js';

// ── Observation history row ───────────────────────────────────────────────────
function ObservationRow({ obs }) {
    return (
        <div
            style={{
                display: 'flex',
                gap: space[3],
                alignItems: 'center',
                background: color.bgSurface,
                border: `1px solid ${color.borderDefault}`,
                borderRadius: radius.lg,
                padding: `${space[3]} ${space[4]}`,
            }}
        >
            <img
                src={obs.imageUrl}
                alt="Observation"
                style={{
                    width: '52px',
                    height: '52px',
                    objectFit: 'cover',
                    borderRadius: radius.md,
                    flexShrink: 0,
                }}
            />
            <div
                style={{
                    flex: 1,
                    minWidth: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.1rem',
                }}
            >
                <span
                    style={{
                        fontSize: font.size.sm,
                        fontWeight: font.weight.semibold,
                        color: color.textPrimary,
                    }}
                >
                    {obs.aiCategory ?? 'Unclassified'}
                </span>
                {obs.note && (
                    <span
                        style={{
                            fontSize: font.size.xs,
                            color: color.textMuted,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {obs.note}
                    </span>
                )}
                <span style={{ fontSize: '0.68rem', color: color.borderDefault }}>
                    {new Date(obs.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                    })}
                </span>
            </div>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: '0.3rem',
                    flexShrink: 0,
                }}
            >
                <ObservationBadge status={obs.status} />
                {obs.pointsAwarded > 0 && (
                    <span
                        style={{
                            fontSize: '0.7rem',
                            color: '#eab308',
                            fontWeight: font.weight.bold,
                        }}
                    >
                        ★ +{obs.pointsAwarded}
                    </span>
                )}
            </div>
        </div>
    );
}

// ── Field label ───────────────────────────────────────────────────────────────
function FieldLabel({ children, htmlFor, required }) {
    return (
        <label
            htmlFor={htmlFor}
            style={{
                fontSize: font.size.sm,
                fontWeight: font.weight.medium,
                color: color.textSecondary,
            }}
        >
            {children}
            {required && <span style={{ color: color.danger, marginLeft: space[1] }}>*</span>}
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
    }, []);

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
                left={<BackLink to="/tasks">← Tasks</BackLink>}
                center={<NavTitle>FieldMesh</NavTitle>}
                right={<NotificationBell />}
            />

            <main
                style={{
                    maxWidth: '540px',
                    margin: '0 auto',
                    padding: `${space[6]} ${space[5]} ${space[16]}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: space[8],
                }}
            >
                {/* Intro */}
                <div>
                    <h1
                        style={{
                            fontSize: '1.3rem',
                            fontWeight: font.weight.extrabold,
                            color: color.textPrimary,
                            margin: `0 0 ${space[1]} 0`,
                        }}
                    >
                        Report an Observation
                    </h1>
                    <p
                        style={{
                            fontSize: font.size.sm,
                            color: color.textMuted,
                            lineHeight: 1.6,
                            margin: 0,
                        }}
                    >
                        Spotted something on your route? Report it directly — no citizen complaint
                        needed. AI will classify it instantly.
                    </p>
                </div>

                {/* ── Success state ──────────────────────────────────────────── */}
                {result && (
                    <SuccessCard
                        icon={result.autoElevated ? '🚀' : '✅'}
                        heading={
                            result.autoElevated
                                ? 'Auto-elevated to complaint!'
                                : 'Observation submitted'
                        }
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
                            style={{
                                background: color.accent,
                                border: 'none',
                                borderRadius: `${radius.md}`,
                                color: color.accentText,
                                fontSize: font.size.base,
                                fontWeight: font.weight.bold,
                                padding: `0.65rem ${space[6]}`,
                                cursor: 'pointer',
                            }}
                        >
                            Report another
                        </button>
                    </SuccessCard>
                )}

                {/* ── Form ──────────────────────────────────────────────────── */}
                {!result && (
                    <form
                        onSubmit={handleSubmit}
                        style={{ display: 'flex', flexDirection: 'column', gap: space[5] }}
                        noValidate
                    >
                        <ErrorBanner message={error} />

                        {/* Photo */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: space[2] }}>
                            <FieldLabel required>Photo</FieldLabel>
                            <ImagePicker
                                preview={preview}
                                onClick={() => fileRef.current?.click()}
                            />
                            <input
                                ref={fileRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handleImageChange}
                                style={{ display: 'none' }}
                            />
                            {preview && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setImage(null);
                                        setPreview(null);
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
                        </div>

                        {/* Note */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: space[2] }}>
                            <FieldLabel htmlFor="note">Note (optional)</FieldLabel>
                            <Textarea
                                id="note"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="e.g. Cracked pavement near bus stop, getting worse"
                            />
                        </div>

                        {/* Location */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: space[2] }}>
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
                                <p
                                    style={{
                                        fontSize: font.size.xs,
                                        color: color.success,
                                        margin: 0,
                                    }}
                                >
                                    📍 {parseFloat(lat).toFixed(4)}°N, {parseFloat(lng).toFixed(4)}
                                    °E
                                </p>
                            )}
                        </div>

                        {/* Landmark */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: space[2] }}>
                            <FieldLabel htmlFor="address">Landmark (optional)</FieldLabel>
                            <Input
                                id="address"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="e.g. Near bus stop, Sector 4"
                            />
                        </div>

                        {/* AI notice */}
                        <div
                            style={{
                                display: 'flex',
                                gap: space[2],
                                alignItems: 'flex-start',
                                background: color.bgSurface,
                                borderRadius: radius.md,
                                padding: space[3],
                                border: `1px solid ${color.borderFaint}`,
                            }}
                        >
                            <span
                                style={{
                                    color: color.accent,
                                    fontSize: font.size.sm,
                                    marginTop: '0.1rem',
                                    flexShrink: 0,
                                }}
                            >
                                ✦
                            </span>
                            <span
                                style={{
                                    fontSize: font.size.xs,
                                    color: color.textMuted,
                                    lineHeight: 1.5,
                                }}
                            >
                                AI will classify your photo instantly. Confidence ≥ 80%
                                auto-elevates to a verified complaint and awards 15 field points.
                            </span>
                        </div>

                        <PrimaryButton type="submit" loading={submitting} loadingText="Submitting…">
                            Submit Observation
                        </PrimaryButton>
                    </form>
                )}

                {/* ── History ───────────────────────────────────────────────── */}
                <section style={{ display: 'flex', flexDirection: 'column', gap: space[4] }}>
                    <h2
                        style={{
                            fontSize: font.size.md,
                            fontWeight: font.weight.bold,
                            color: color.textPrimary,
                            margin: 0,
                        }}
                    >
                        Recent Observations
                    </h2>
                    {histLoading && <SkeletonRows count={3} height="72px" />}
                    {!histLoading && observations.length === 0 && (
                        <p style={{ fontSize: font.size.sm, color: color.textMuted }}>
                            No observations submitted yet.
                        </p>
                    )}
                    {!histLoading && observations.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: space[2] }}>
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
