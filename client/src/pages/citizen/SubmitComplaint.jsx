// ─────────────────────────────────────────────────────────────────────────────
// src/pages/citizen/SubmitComplaint.jsx
//
// Citizen complaint submission form.
// Features:
//   - Live camera / file picker for image
//   - Auto GPS capture with manual override
//   - AI auto-classifies category + generates title (user sees result)
//   - Category override dropdown if AI is wrong
//   - Duplicate warning if server detects a nearby similar complaint
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { submitComplaintApi, parseComplaintError } from '../../api/complaints.api.js';
import { COMPLAINT_CATEGORIES } from '../../constants/complaint.constants.js';

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB

export default function SubmitComplaint() {
    const navigate = useNavigate();

    const [image, setImage] = useState(null); // File object
    const [preview, setPreview] = useState(null); // data URL
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState(''); // override; empty = let AI decide
    const [lat, setLat] = useState('');
    const [lng, setLng] = useState('');
    const [address, setAddress] = useState('');
    const [gpsStatus, setGpsStatus] = useState('idle'); // idle | loading | ok | error
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});
    const [result, setResult] = useState(null); // success state

    const fileRef = useRef(null);

    // ── Image picker ───────────────────────────────────────────────────────────
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

    // ── GPS capture ────────────────────────────────────────────────────────────
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
            { timeout: 8000, maximumAge: 30000 }
        );
    }

    // ── Client validation ──────────────────────────────────────────────────────
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
            const data = await submitComplaintApi(fd);
            setResult(data);
        } catch (err) {
            setError(parseComplaintError(err));
        } finally {
            setSubmitting(false);
        }
    }

    // ── Success screen ─────────────────────────────────────────────────────────
    if (result) {
        const { complaint, isDuplicate, duplicateOf } = result;
        return (
            <div style={s.page}>
                <div style={s.successCard}>
                    <div style={s.successIcon}>{isDuplicate ? '🔁' : '✅'}</div>
                    <h2 style={s.successHeading}>
                        {isDuplicate ? 'Already reported!' : 'Report submitted!'}
                    </h2>

                    {isDuplicate ? (
                        <p style={s.successSub}>
                            A similar issue already exists nearby. We've linked your report to it.
                            You can upvote the original to increase its priority.
                        </p>
                    ) : (
                        <>
                            <p style={s.successSub}>
                                Your complaint has been submitted and will be reviewed shortly.
                            </p>
                            <div style={s.aiResultBox}>
                                <span style={s.aiLabel}>AI classified as</span>
                                <span style={s.aiCategory}>{complaint.category}</span>
                                <span style={s.aiSeverity}>
                                    Severity: <strong>{complaint.severity}/10</strong>
                                </span>
                            </div>
                        </>
                    )}

                    <div style={s.successActions}>
                        <button onClick={() => navigate('/my-reports')} style={s.btnPrimary}>
                            View my reports
                        </button>
                        <button
                            onClick={() => {
                                setResult(null);
                                setImage(null);
                                setPreview(null);
                                setDescription('');
                                setCategory('');
                                setLat('');
                                setLng('');
                                setAddress('');
                            }}
                            style={s.btnSecondary}
                        >
                            Submit another
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ── Form ───────────────────────────────────────────────────────────────────
    return (
        <div style={s.page}>
            <header style={s.nav}>
                <Link to="/dashboard" style={s.backLink}>
                    ← Dashboard
                </Link>
                <span style={s.navTitle}>Report Issue</span>
                <span />
            </header>

            <main style={s.main}>
                <div style={s.card}>
                    <h1 style={s.heading}>Report a civic issue</h1>
                    <p style={s.subheading}>
                        AI will auto-classify your report and score its severity.
                    </p>

                    {error && (
                        <div style={s.errorBanner} role="alert">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={s.form} noValidate>
                        {/* ── Photo ─────────────────────────────────────────────────── */}
                        <div style={s.fieldGroup}>
                            <label style={s.label}>
                                Photo <span style={s.required}>*</span>
                            </label>

                            <div
                                style={{
                                    ...s.imagePicker,
                                    borderColor: fieldErrors.image ? '#ef4444' : '#334155',
                                    background: preview ? 'transparent' : '#0f172a',
                                }}
                                onClick={() => fileRef.current?.click()}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
                            >
                                {preview ? (
                                    <img src={preview} alt="Preview" style={s.previewImg} />
                                ) : (
                                    <div style={s.imagePickerInner}>
                                        <span style={s.cameraIcon}>📷</span>
                                        <span style={s.imagePickerText}>Tap to add photo</span>
                                        <span style={s.imagePickerSub}>
                                            JPG, PNG or WEBP · max 8MB
                                        </span>
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
                            {preview && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setImage(null);
                                        setPreview(null);
                                    }}
                                    style={s.removeImg}
                                >
                                    Remove photo
                                </button>
                            )}
                            {fieldErrors.image && (
                                <span style={s.fieldError}>{fieldErrors.image}</span>
                            )}
                        </div>

                        {/* ── Description ───────────────────────────────────────────── */}
                        <div style={s.fieldGroup}>
                            <label style={s.label} htmlFor="description">
                                Description <span style={s.required}>*</span>
                            </label>
                            <textarea
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
                                placeholder="Describe the issue in detail. e.g. Large pothole near the school gate causing accidents..."
                                style={{
                                    ...s.textarea,
                                    borderColor: fieldErrors.description ? '#ef4444' : '#334155',
                                }}
                            />
                            <div style={s.charCount}>
                                <span style={fieldErrors.description ? { color: '#ef4444' } : {}}>
                                    {fieldErrors.description ?? `${description.length}/1000`}
                                </span>
                            </div>
                        </div>

                        {/* ── Category override (optional) ───────────────────────────── */}
                        <div style={s.fieldGroup}>
                            <label style={s.label} htmlFor="category">
                                Category{' '}
                                <span style={s.optional}>(optional — AI will auto-detect)</span>
                            </label>
                            <select
                                id="category"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                style={s.select}
                            >
                                <option value="">Let AI decide</option>
                                {COMPLAINT_CATEGORIES.map((c) => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* ── Location ──────────────────────────────────────────────── */}
                        <div style={s.fieldGroup}>
                            <label style={s.label}>
                                Location <span style={s.required}>*</span>
                            </label>

                            <button
                                type="button"
                                onClick={captureGPS}
                                style={s.gpsBtn}
                                disabled={gpsStatus === 'loading'}
                            >
                                {gpsStatus === 'loading' && '📡 Getting location…'}
                                {gpsStatus === 'ok' && '📍 Location captured — tap to refresh'}
                                {gpsStatus === 'idle' && '📍 Use my location'}
                                {gpsStatus === 'error' && '⚠️ GPS failed — enter manually'}
                            </button>

                            {gpsStatus === 'ok' && (
                                <p style={s.coordsText}>
                                    {parseFloat(lat).toFixed(4)}°N, {parseFloat(lng).toFixed(4)}°E
                                </p>
                            )}

                            {(gpsStatus === 'error' || gpsStatus === 'idle') && (
                                <div style={s.manualCoords}>
                                    <input
                                        type="number"
                                        step="any"
                                        placeholder="Latitude"
                                        value={lat}
                                        onChange={(e) => setLat(e.target.value)}
                                        style={s.coordInput}
                                    />
                                    <input
                                        type="number"
                                        step="any"
                                        placeholder="Longitude"
                                        value={lng}
                                        onChange={(e) => setLng(e.target.value)}
                                        style={s.coordInput}
                                    />
                                </div>
                            )}

                            {fieldErrors.coords && (
                                <span style={s.fieldError}>{fieldErrors.coords}</span>
                            )}
                        </div>

                        {/* ── Address (optional) ────────────────────────────────────── */}
                        <div style={s.fieldGroup}>
                            <label style={s.label} htmlFor="address">
                                Landmark / address <span style={s.optional}>(optional)</span>
                            </label>
                            <input
                                id="address"
                                type="text"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="e.g. Near SBI Bank, Sector 12"
                                style={s.input}
                            />
                        </div>

                        {/* ── AI notice ─────────────────────────────────────────────── */}
                        <div style={s.aiNotice}>
                            <span style={s.aiNoticeDot}>✦</span>
                            <span style={s.aiNoticeText}>
                                AI will automatically classify your complaint and score its
                                severity. This usually takes 2–5 seconds after submission.
                            </span>
                        </div>

                        {/* ── Submit ────────────────────────────────────────────────── */}
                        <button
                            type="submit"
                            disabled={submitting}
                            style={{ ...s.submitBtn, opacity: submitting ? 0.65 : 1 }}
                        >
                            {submitting ? 'Submitting…' : 'Submit Report'}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
    page: {
        minHeight: '100vh',
        background: '#0f172a',
        fontFamily: "'Inter', system-ui, sans-serif",
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
    main: { maxWidth: '540px', margin: '0 auto', padding: '2rem 1.25rem 4rem' },
    card: {
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '1rem',
        padding: '2rem 1.75rem',
    },
    heading: { fontSize: '1.3rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 0.3rem 0' },
    subheading: { fontSize: '0.82rem', color: '#64748b', margin: '0 0 1.75rem 0' },
    errorBanner: {
        background: '#450a0a',
        border: '1px solid #7f1d1d',
        borderRadius: '0.5rem',
        color: '#fca5a5',
        fontSize: '0.84rem',
        padding: '0.75rem 1rem',
        marginBottom: '1.25rem',
    },
    form: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
    fieldGroup: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
    label: { fontSize: '0.8rem', fontWeight: 500, color: '#94a3b8' },
    required: { color: '#ef4444' },
    optional: { color: '#475569', fontWeight: 400 },
    imagePicker: {
        border: '2px dashed',
        borderRadius: '0.75rem',
        minHeight: '180px',
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
        gap: '0.5rem',
        padding: '2rem',
    },
    cameraIcon: { fontSize: '2.5rem' },
    imagePickerText: { fontSize: '0.875rem', fontWeight: 500, color: '#94a3b8' },
    imagePickerSub: { fontSize: '0.72rem', color: '#475569' },
    previewImg: { width: '100%', height: '220px', objectFit: 'cover', display: 'block' },
    removeImg: {
        background: 'none',
        border: 'none',
        color: '#ef4444',
        fontSize: '0.75rem',
        cursor: 'pointer',
        alignSelf: 'flex-start',
    },
    textarea: {
        background: '#0f172a',
        border: '1px solid',
        borderRadius: '0.5rem',
        color: '#f1f5f9',
        fontSize: '0.875rem',
        padding: '0.7rem 0.875rem',
        resize: 'vertical',
        outline: 'none',
        width: '100%',
        boxSizing: 'border-box',
        fontFamily: 'inherit',
        lineHeight: 1.6,
    },
    charCount: { fontSize: '0.7rem', color: '#475569', textAlign: 'right' },
    select: {
        background: '#0f172a',
        border: '1px solid #334155',
        borderRadius: '0.5rem',
        color: '#f1f5f9',
        fontSize: '0.875rem',
        padding: '0.65rem 0.875rem',
        outline: 'none',
        width: '100%',
        cursor: 'pointer',
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
    coordsText: { fontSize: '0.75rem', color: '#22c55e', marginTop: '0.25rem' },
    manualCoords: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '0.75rem',
        marginTop: '0.5rem',
    },
    coordInput: {
        background: '#0f172a',
        border: '1px solid #334155',
        borderRadius: '0.5rem',
        color: '#f1f5f9',
        fontSize: '0.82rem',
        padding: '0.6rem 0.75rem',
        outline: 'none',
    },
    input: {
        background: '#0f172a',
        border: '1px solid #334155',
        borderRadius: '0.5rem',
        color: '#f1f5f9',
        fontSize: '0.875rem',
        padding: '0.65rem 0.875rem',
        outline: 'none',
        width: '100%',
        boxSizing: 'border-box',
    },
    fieldError: { fontSize: '0.75rem', color: '#f87171' },
    aiNotice: {
        display: 'flex',
        gap: '0.625rem',
        alignItems: 'flex-start',
        background: '#0f172a',
        borderRadius: '0.5rem',
        padding: '0.75rem',
        border: '1px solid #1e293b',
    },
    aiNoticeDot: { color: '#22d3ee', fontSize: '0.8rem', marginTop: '0.1rem', flexShrink: 0 },
    aiNoticeText: { fontSize: '0.75rem', color: '#475569', lineHeight: 1.5 },
    submitBtn: {
        background: '#22d3ee',
        border: 'none',
        borderRadius: '0.625rem',
        color: '#0f172a',
        fontSize: '0.9rem',
        fontWeight: 700,
        padding: '0.8rem',
        cursor: 'pointer',
        letterSpacing: '0.01em',
    },
    // Success screen
    successCard: {
        maxWidth: '440px',
        margin: '4rem auto',
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '1rem',
        padding: '2.5rem',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
    },
    successIcon: { fontSize: '3rem' },
    successHeading: { fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', margin: 0 },
    successSub: { fontSize: '0.875rem', color: '#64748b', lineHeight: 1.6, margin: 0 },
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
        fontSize: '0.7rem',
        color: '#475569',
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
    },
    aiCategory: { fontSize: '1rem', fontWeight: 700, color: '#22d3ee' },
    aiSeverity: { fontSize: '0.8rem', color: '#94a3b8' },
    successActions: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        width: '100%',
        marginTop: '0.5rem',
    },
    btnPrimary: {
        background: '#22d3ee',
        border: 'none',
        borderRadius: '0.625rem',
        color: '#0f172a',
        fontSize: '0.875rem',
        fontWeight: 700,
        padding: '0.75rem',
        cursor: 'pointer',
    },
    btnSecondary: {
        background: 'transparent',
        border: '1px solid #334155',
        borderRadius: '0.625rem',
        color: '#94a3b8',
        fontSize: '0.875rem',
        padding: '0.7rem',
        cursor: 'pointer',
    },
};
