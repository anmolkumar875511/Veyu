// ─────────────────────────────────────────────────────────────────────────────
// src/pages/worker/Observations.jsx
//
// FieldMesh — proactive observation submission for field workers.
// No citizen complaint required. Worker drops a geo-tagged photo while
// traveling between jobs. AI classifies it; high-confidence observations
// auto-elevate to a full complaint immediately.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    submitObservationApi,
    getMyObservationsApi,
    parseWorkerError,
} from '../../api/worker.api.js';
import { OBSERVATION_STATUS_LABELS } from '../../constants/complaint.constants.js';

const STATUS_COLORS = {
    pending: '#94a3b8',
    ai_reviewed: '#3b82f6',
    elevated: '#22c55e',
    dismissed: '#64748b',
    flagged: '#f59e0b',
};

function ObservationRow({ obs }) {
    const color = STATUS_COLORS[obs.status] ?? '#94a3b8';
    return (
        <div style={s.obsRow}>
            <img src={obs.imageUrl} alt="Observation" style={s.obsThumb} />
            <div style={s.obsBody}>
                <span style={s.obsCategory}>{obs.aiCategory ?? 'Unclassified'}</span>
                {obs.note && <span style={s.obsNote}>{obs.note}</span>}
                <span style={s.obsDate}>{new Date(obs.createdAt).toLocaleDateString('en-IN')}</span>
            </div>
            <div style={s.obsRight}>
                <span style={{ ...s.obsBadge, color, background: `${color}1a` }}>
                    {OBSERVATION_STATUS_LABELS[obs.status]}
                </span>
                {obs.pointsAwarded > 0 && <span style={s.obsPoints}>★ +{obs.pointsAwarded}</span>}
            </div>
        </div>
    );
}

export default function WorkerObservations() {
    const fileRef = useRef(null);

    // Submission form state
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

    // History
    const [observations, setObservations] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(true);

    const fetchHistory = useCallback(async () => {
        try {
            const data = await getMyObservationsApi({ limit: 10 });
            setObservations(data.observations ?? []);
        } catch {
            // non-fatal
        } finally {
            setHistoryLoading(false);
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
            { timeout: 8000, maximumAge: 30000 }
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
    }

    return (
        <div style={s.page}>
            <header style={s.nav}>
                <Link to="/tasks" style={s.backLink}>
                    ← Tasks
                </Link>
                <span style={s.navTitle}>FieldMesh</span>
                <span />
            </header>

            <main style={s.main}>
                <div style={s.intro}>
                    <h1 style={s.heading}>Report an Observation</h1>
                    <p style={s.subheading}>
                        Spotted something on your route? Report it directly — no citizen complaint
                        needed. AI will classify it instantly.
                    </p>
                </div>

                {/* ── Success state ─────────────────────────────────────────────── */}
                {result && (
                    <div style={s.successCard}>
                        <span style={s.successIcon}>{result.autoElevated ? '🚀' : '✅'}</span>
                        <h2 style={s.successHeading}>
                            {result.autoElevated
                                ? 'Auto-elevated to complaint!'
                                : 'Observation submitted'}
                        </h2>
                        <p style={s.successSub}>
                            {result.autoElevated
                                ? `High AI confidence (${Math.round(result.observation.aiConfidence * 100)}%) — this was instantly promoted to a verified complaint. +15 field points.`
                                : 'Your observation will be reviewed by an officer shortly.'}
                        </p>
                        <div style={s.aiResultBox}>
                            <span style={s.aiLabel}>AI classified as</span>
                            <span style={s.aiCategory}>{result.observation.aiCategory}</span>
                            <span style={s.aiSeverity}>
                                Severity: {result.observation.aiSeverity}/10
                            </span>
                        </div>
                        <button onClick={resetForm} style={s.btnPrimary}>
                            Report another
                        </button>
                    </div>
                )}

                {/* ── Form ──────────────────────────────────────────────────────── */}
                {!result && (
                    <form onSubmit={handleSubmit} style={s.form} noValidate>
                        {error && <div style={s.errorBanner}>{error}</div>}

                        <div style={s.fieldGroup}>
                            <label style={s.label}>Photo *</label>
                            <div
                                style={{
                                    ...s.imagePicker,
                                    background: preview ? 'transparent' : '#0f172a',
                                }}
                                onClick={() => fileRef.current?.click()}
                            >
                                {preview ? (
                                    <img src={preview} alt="Preview" style={s.previewImg} />
                                ) : (
                                    <div style={s.imagePickerInner}>
                                        <span style={s.cameraIcon}>📷</span>
                                        <span style={s.imagePickerText}>Tap to add photo</span>
                                    </div>
                                )}
                            </div>
                            <input
                                ref={fileRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handleImageChange}
                                style={{ display: 'none' }}
                            />
                        </div>

                        <div style={s.fieldGroup}>
                            <label style={s.label} htmlFor="note">
                                Note (optional)
                            </label>
                            <textarea
                                id="note"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                rows={3}
                                placeholder="e.g. Cracked pavement near bus stop, getting worse"
                                style={s.textarea}
                            />
                        </div>

                        <div style={s.fieldGroup}>
                            <label style={s.label}>Location *</label>
                            <button
                                type="button"
                                onClick={captureGPS}
                                style={s.gpsBtn}
                                disabled={gpsStatus === 'loading'}
                            >
                                {gpsStatus === 'loading' && '📡 Getting location…'}
                                {gpsStatus === 'ok' && '📍 Location captured'}
                                {gpsStatus === 'idle' && '📍 Capture location'}
                                {gpsStatus === 'error' && '⚠️ GPS failed — retry'}
                            </button>
                            {gpsStatus === 'ok' && (
                                <p style={s.coordsText}>
                                    {parseFloat(lat).toFixed(4)}°N, {parseFloat(lng).toFixed(4)}°E
                                </p>
                            )}
                        </div>

                        <div style={s.fieldGroup}>
                            <label style={s.label} htmlFor="address">
                                Landmark (optional)
                            </label>
                            <input
                                id="address"
                                type="text"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="e.g. Near bus stop, Sector 4"
                                style={s.input}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            style={{ ...s.submitBtn, opacity: submitting ? 0.65 : 1 }}
                        >
                            {submitting ? 'Submitting…' : 'Submit Observation'}
                        </button>
                    </form>
                )}

                {/* ── History ───────────────────────────────────────────────────── */}
                <section style={s.historySection}>
                    <h2 style={s.historyTitle}>Recent Observations</h2>
                    {historyLoading ? (
                        <p style={s.dimText}>Loading…</p>
                    ) : observations.length === 0 ? (
                        <p style={s.dimText}>No observations submitted yet.</p>
                    ) : (
                        <div style={s.obsList}>
                            {observations.map((o) => (
                                <ObservationRow key={o._id} obs={o} />
                            ))}
                        </div>
                    )}
                </section>
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
        gap: '2rem',
    },
    intro: {},
    heading: { fontSize: '1.3rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 0.35rem 0' },
    subheading: { fontSize: '0.82rem', color: '#64748b', lineHeight: 1.5, margin: 0 },
    errorBanner: {
        background: '#450a0a',
        border: '1px solid #7f1d1d',
        borderRadius: '0.5rem',
        color: '#fca5a5',
        fontSize: '0.82rem',
        padding: '0.7rem 0.875rem',
    },
    form: { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
    fieldGroup: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
    label: { fontSize: '0.8rem', fontWeight: 500, color: '#94a3b8' },
    imagePicker: {
        border: '2px dashed #334155',
        borderRadius: '0.75rem',
        minHeight: '160px',
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
    cameraIcon: { fontSize: '2.2rem' },
    imagePickerText: { fontSize: '0.82rem', color: '#94a3b8' },
    previewImg: { width: '100%', height: '200px', objectFit: 'cover', display: 'block' },
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
    gpsBtn: {
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '0.5rem',
        color: '#94a3b8',
        fontSize: '0.82rem',
        padding: '0.6rem 0.875rem',
        cursor: 'pointer',
        textAlign: 'left',
    },
    coordsText: { fontSize: '0.75rem', color: '#22c55e', margin: 0 },
    input: {
        background: '#0f172a',
        border: '1px solid #334155',
        borderRadius: '0.5rem',
        color: '#f1f5f9',
        fontSize: '0.84rem',
        padding: '0.6rem 0.8rem',
        outline: 'none',
    },
    submitBtn: {
        background: '#22d3ee',
        border: 'none',
        borderRadius: '0.625rem',
        color: '#0f172a',
        fontSize: '0.875rem',
        fontWeight: 700,
        padding: '0.75rem',
        cursor: 'pointer',
    },
    successCard: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.875rem',
        textAlign: 'center',
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '1rem',
        padding: '2rem',
    },
    successIcon: { fontSize: '2.5rem' },
    successHeading: { fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc', margin: 0 },
    successSub: { fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.6, margin: 0 },
    aiResultBox: {
        background: '#0f172a',
        borderRadius: '0.625rem',
        padding: '0.875rem 1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.3rem',
        width: '100%',
        border: '1px solid #1e293b',
    },
    aiLabel: {
        fontSize: '0.68rem',
        color: '#475569',
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
    },
    aiCategory: { fontSize: '0.95rem', fontWeight: 700, color: '#22d3ee' },
    aiSeverity: { fontSize: '0.78rem', color: '#94a3b8' },
    btnPrimary: {
        background: '#22d3ee',
        border: 'none',
        borderRadius: '0.5rem',
        color: '#0f172a',
        fontSize: '0.85rem',
        fontWeight: 700,
        padding: '0.65rem 1.5rem',
        cursor: 'pointer',
    },
    historySection: { display: 'flex', flexDirection: 'column', gap: '0.875rem' },
    historyTitle: { fontSize: '1rem', fontWeight: 700, color: '#e2e8f0', margin: 0 },
    dimText: { fontSize: '0.82rem', color: '#475569' },
    obsList: { display: 'flex', flexDirection: 'column', gap: '0.625rem' },
    obsRow: {
        display: 'flex',
        gap: '0.75rem',
        alignItems: 'center',
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '0.75rem',
        padding: '0.75rem',
    },
    obsThumb: {
        width: '52px',
        height: '52px',
        objectFit: 'cover',
        borderRadius: '0.5rem',
        flexShrink: 0,
    },
    obsBody: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.1rem' },
    obsCategory: { fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0' },
    obsNote: {
        fontSize: '0.72rem',
        color: '#64748b',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    obsDate: { fontSize: '0.68rem', color: '#334155' },
    obsRight: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '0.25rem',
        flexShrink: 0,
    },
    obsBadge: {
        fontSize: '0.65rem',
        fontWeight: 600,
        padding: '0.15rem 0.5rem',
        borderRadius: '9999px',
    },
    obsPoints: { fontSize: '0.7rem', color: '#eab308', fontWeight: 600 },
};
