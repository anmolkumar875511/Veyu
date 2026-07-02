// src/pages/citizen/SubmitComplaint.jsx

import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { submitComplaintApi, parseComplaintError } from '../../api/complaints.api.js';
import { COMPLAINT_CATEGORIES } from '../../constants/complaint.constants.js';
import { PageShell, NavBar, ErrorBanner } from '../../components/citizen/CitizenShell.jsx';
import { LocationPicker } from '../../components/shared/LocationPicker.jsx';
import { color, font, space, radius, transition, mk } from '../../theme/index.js';

const MAX_FILE_SIZE = 8 * 1024 * 1024;

// ── Field wrapper ─────────────────────────────────────────────────────────────
function Field({ label, required, optional, htmlFor, error, children }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label
                style={{
                    fontSize: font.size.sm,
                    fontWeight: font.weight.medium,
                    color: color.textSecondary,
                }}
                htmlFor={htmlFor}
            >
                {label} {required && <span style={{ color: color.danger }}>*</span>}
                {optional && (
                    <span style={{ color: color.textMuted, fontWeight: font.weight.normal }}>
                        (optional)
                    </span>
                )}
            </label>
            {children}
            {error && <span style={{ fontSize: font.size.xs, color: color.danger }}>{error}</span>}
        </div>
    );
}

// ── Success screen ─────────────────────────────────────────────────────────────
function SuccessScreen({ result, onReset, navigate }) {
    const { complaint, isDuplicate } = result;
    return (
        <PageShell>
            <div
                style={{
                    maxWidth: '440px',
                    margin: '4rem auto',
                    background: color.bgSurface,
                    border: `1px solid ${color.borderDefault}`,
                    borderRadius: radius.xl,
                    padding: space[10],
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: space[4],
                }}
            >
                <div style={{ fontSize: '3rem' }}>{isDuplicate ? '🔁' : '✅'}</div>

                <h2
                    style={{
                        fontSize: '1.4rem',
                        fontWeight: font.weight.extrabold,
                        color: color.textPrimary,
                        margin: 0,
                    }}
                >
                    {isDuplicate ? 'Already reported!' : 'Report submitted!'}
                </h2>

                {isDuplicate ? (
                    <p
                        style={{
                            fontSize: font.size.base,
                            color: color.textMuted,
                            lineHeight: 1.6,
                            margin: 0,
                        }}
                    >
                        A similar issue already exists nearby. We've linked your report to it. You
                        can upvote the original to increase its priority.
                    </p>
                ) : (
                    <>
                        <p
                            style={{
                                fontSize: font.size.base,
                                color: color.textMuted,
                                lineHeight: 1.6,
                                margin: 0,
                            }}
                        >
                            Your complaint has been submitted and will be reviewed shortly.
                        </p>
                        <div
                            style={{
                                background: color.bgPage,
                                borderRadius: radius.md,
                                padding: `${space[3]} ${space[5]}`,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.3rem',
                                width: '100%',
                                border: `1px solid ${color.borderFaint}`,
                            }}
                        >
                            <span
                                style={{
                                    fontSize: font.size.xs,
                                    color: color.textMuted,
                                    letterSpacing: font.tracking.wide,
                                    textTransform: 'uppercase',
                                }}
                            >
                                AI classified as
                            </span>
                            <span
                                style={{
                                    fontSize: font.size.md,
                                    fontWeight: font.weight.bold,
                                    color: color.accent,
                                }}
                            >
                                {complaint.category}
                            </span>
                            <span style={{ fontSize: font.size.sm, color: color.textSecondary }}>
                                Severity: <strong>{complaint.severity}/10</strong>
                            </span>
                        </div>
                    </>
                )}

                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: space[3],
                        width: '100%',
                        marginTop: space[2],
                    }}
                >
                    <button onClick={() => navigate('/my-reports')} style={mk.btnPrimary()}>
                        View my reports
                    </button>
                    <button onClick={onReset} style={mk.btnSecondary()}>
                        Submit another
                    </button>
                </div>
            </div>
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

    // ── Shared input style helper ─────────────────────────────────────────────
    const inp = (hasError) => ({
        background: color.bgPage,
        border: `1px solid ${hasError ? color.danger : color.borderDefault}`,
        borderRadius: radius.md,
        color: color.textPrimary,
        fontSize: font.size.base,
        padding: '0.65rem 0.875rem',
        outline: 'none',
        width: '100%',
        boxSizing: 'border-box',
        fontFamily: font.sans,
        transition: transition.fast,
    });

    return (
        <PageShell>
            <NavBar
                left={
                    <Link
                        to="/dashboard"
                        style={{
                            fontSize: font.size.sm,
                            color: color.textSecondary,
                            textDecoration: 'none',
                        }}
                    >
                        ← Dashboard
                    </Link>
                }
                center={
                    <span
                        style={{
                            fontSize: font.size.base,
                            fontWeight: font.weight.semibold,
                            color: color.textPrimary,
                        }}
                    >
                        Report Issue
                    </span>
                }
                right={<span />}
            />

            <main
                style={{
                    maxWidth: '540px',
                    margin: '0 auto',
                    padding: `${space[8]} ${space[5]} ${space[16]}`,
                }}
            >
                <div
                    style={{
                        background: color.bgSurface,
                        border: `1px solid ${color.borderDefault}`,
                        borderRadius: radius.xl,
                        padding: `${space[8]} ${space[6]}`,
                    }}
                >
                    <h1
                        style={{
                            fontSize: '1.3rem',
                            fontWeight: font.weight.extrabold,
                            color: color.textPrimary,
                            margin: `0 0 ${space[1]} 0`,
                        }}
                    >
                        Report a civic issue
                    </h1>
                    <p
                        style={{
                            fontSize: font.size.sm,
                            color: color.textMuted,
                            margin: `0 0 ${space[6]} 0`,
                        }}
                    >
                        AI will auto-classify your report and score its severity.
                    </p>

                    <ErrorBanner message={error} />

                    <form
                        onSubmit={handleSubmit}
                        style={{ display: 'flex', flexDirection: 'column', gap: space[6] }}
                        noValidate
                    >
                        {/* Photo */}
                        <Field label="Photo" required error={fieldErrors.image}>
                            <div
                                style={{
                                    border: `2px dashed ${fieldErrors.image ? color.danger : color.borderDefault}`,
                                    borderRadius: radius.lg,
                                    minHeight: '180px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    overflow: 'hidden',
                                    background: preview ? 'transparent' : color.bgPage,
                                }}
                                onClick={() => fileRef.current?.click()}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
                            >
                                {preview ? (
                                    <img
                                        src={preview}
                                        alt="Preview"
                                        style={{
                                            width: '100%',
                                            height: '220px',
                                            objectFit: 'cover',
                                            display: 'block',
                                        }}
                                    />
                                ) : (
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: space[2],
                                            padding: space[8],
                                        }}
                                    >
                                        <span style={{ fontSize: '2.5rem' }}>📷</span>
                                        <span
                                            style={{
                                                fontSize: font.size.base,
                                                fontWeight: font.weight.medium,
                                                color: color.textSecondary,
                                            }}
                                        >
                                            Tap to add photo
                                        </span>
                                        <span
                                            style={{
                                                fontSize: font.size.xs,
                                                color: color.textMuted,
                                            }}
                                        >
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
                        </Field>

                        {/* Description */}
                        <Field
                            label="Description"
                            required
                            htmlFor="description"
                            error={fieldErrors.description}
                        >
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
                                placeholder="Describe the issue in detail. e.g. Large pothole near the school gate causing accidents…"
                                style={{
                                    ...inp(!!fieldErrors.description),
                                    resize: 'vertical',
                                    lineHeight: 1.6,
                                }}
                            />
                            <div
                                style={{
                                    fontSize: font.size.xs,
                                    color: color.textMuted,
                                    textAlign: 'right',
                                }}
                            >
                                {description.length}/1000
                            </div>
                        </Field>

                        {/* Category override */}
                        <Field label="Category" optional htmlFor="category">
                            <select
                                id="category"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                style={{ ...inp(false), cursor: 'pointer' }}
                            >
                                <option value="">Let AI decide</option>
                                {COMPLAINT_CATEGORIES.map((c) => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        {/* Location */}
                        <Field label="Location" required error={fieldErrors.coords}>
                            {/* GPS quick-capture button */}
                            <button
                                type="button"
                                onClick={captureGPS}
                                disabled={gpsStatus === 'loading'}
                                style={{
                                    background: color.bgSurface,
                                    border: `1px solid ${color.borderDefault}`,
                                    borderRadius: radius.md,
                                    color: color.textSecondary,
                                    fontSize: font.size.sm,
                                    padding: `0.6rem 0.875rem`,
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                }}
                            >
                                {gpsStatus === 'loading' && '📡 Getting location…'}
                                {gpsStatus === 'ok' && '📍 Location captured — tap to refresh'}
                                {gpsStatus === 'idle' && '📍 Use my location'}
                                {gpsStatus === 'error' && '⚠️ GPS failed — use map below'}
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
                        </Field>

                        {/* Address */}
                        <Field label="Landmark / address" optional htmlFor="address">
                            <input
                                id="address"
                                type="text"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="e.g. Near SBI Bank, Sector 12"
                                style={inp(false)}
                            />
                        </Field>

                        {/* AI notice */}
                        <div
                            style={{
                                display: 'flex',
                                gap: space[2],
                                alignItems: 'flex-start',
                                background: color.bgPage,
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
                                AI will automatically classify your complaint and score its
                                severity. This usually takes 2–5 seconds after submission.
                            </span>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={submitting}
                            style={mk.btnPrimary({ disabled: submitting })}
                        >
                            {submitting ? 'Submitting…' : 'Submit Report'}
                        </button>
                    </form>
                </div>
            </main>
        </PageShell>
    );
}
