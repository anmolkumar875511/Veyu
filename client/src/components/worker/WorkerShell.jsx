// src/components/worker/WorkerShell.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Shared primitives for all field worker pages (Tasks, TaskDetail, Observations).
// All tokens from theme/index.js — nothing hard-coded here.
// ─────────────────────────────────────────────────────────────────────────────

import { Link } from 'react-router-dom';
import { color, font, radius, space, shadow, transition, mk } from '../../theme/index.js';
import { SEVERITY_COLOR, OBSERVATION_STATUS_LABELS } from '../../constants/complaint.constants.js';

// ── Page shell ────────────────────────────────────────────────────────────────
export function PageShell({ children }) {
    return (
        <div
            style={{
                minHeight: '100vh',
                background: color.bgPage,
                fontFamily: font.sans,
                color: color.textPrimary,
            }}
        >
            {children}
        </div>
    );
}

// ── Fullscreen state (loading / error / success) ───────────────────────────────
export function FullscreenState({ children }) {
    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: space[4],
                background: color.bgPage,
                color: color.textMuted,
                fontFamily: font.sans,
                fontSize: font.size.base,
            }}
        >
            {children}
        </div>
    );
}

// ── Nav bar ───────────────────────────────────────────────────────────────────
export function NavBar({ left, center, right }) {
    return (
        <header
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: `0 ${space[6]}`,
                height: '56px',
                background: color.bgPage,
                borderBottom: `1px solid ${color.borderFaint}`,
                position: 'sticky',
                top: 0,
                zIndex: 100,
            }}
        >
            <div style={{ flex: 1 }}>{left}</div>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>{center}</div>
            <div
                style={{
                    flex: 1,
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    gap: space[4],
                }}
            >
                {right}
            </div>
        </header>
    );
}

// ── Brand mark (worker variant with sub-label) ────────────────────────────────
export function NavBrand({ sub }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: space[2] }}>
            <span
                style={{
                    width: '0.5rem',
                    height: '0.5rem',
                    borderRadius: radius.full,
                    background: color.accent,
                    boxShadow: shadow.accentGlowSm,
                    display: 'inline-block',
                    flexShrink: 0,
                }}
            />
            <span
                style={{
                    fontSize: font.size.sm,
                    fontWeight: font.weight.bold,
                    color: color.textPrimary,
                    letterSpacing: font.tracking.widest,
                    textTransform: 'uppercase',
                }}
            >
                Veyu
            </span>
            {sub && (
                <>
                    <span style={{ color: color.borderDefault, fontSize: font.size.sm }}>·</span>
                    <span
                        style={{
                            fontSize: font.size.sm,
                            color: color.textMuted,
                            fontWeight: font.weight.medium,
                        }}
                    >
                        {sub}
                    </span>
                </>
            )}
        </div>
    );
}

// ── Nav back link ─────────────────────────────────────────────────────────────
export function BackLink({ to, children }) {
    return (
        <Link
            to={to}
            style={{ fontSize: font.size.sm, color: color.textSecondary, textDecoration: 'none' }}
        >
            {children}
        </Link>
    );
}

// ── Nav accent link ───────────────────────────────────────────────────────────
export function NavAccentLink({ to, children }) {
    return (
        <Link
            to={to}
            style={{
                fontSize: font.size.sm,
                color: '#c4b5fd',
                textDecoration: 'none',
                fontWeight: font.weight.semibold,
            }}
        >
            {children}
        </Link>
    );
}

// ── Nav title (center) ────────────────────────────────────────────────────────
export function NavTitle({ children }) {
    return (
        <span
            style={{
                fontSize: font.size.base,
                fontWeight: font.weight.semibold,
                color: color.textPrimary,
            }}
        >
            {children}
        </span>
    );
}

// ── Nav sign-out button ───────────────────────────────────────────────────────
export function NavLogout({ onClick }) {
    return (
        <button
            onClick={onClick}
            style={{
                background: 'none',
                border: `1px solid ${color.borderDefault}`,
                borderRadius: radius.sm,
                color: color.textSecondary,
                fontSize: font.size.xs,
                padding: '0.3rem 0.7rem',
                cursor: 'pointer',
            }}
        >
            Sign out
        </button>
    );
}

// ── Assignment status badge ────────────────────────────────────────────────────
const ASSIGNMENT_STATUS_COLORS = {
    pending: color.textSecondary,
    acknowledged: '#3b82f6',
    en_route: '#f59e0b',
    on_site: '#a78bfa',
    completed: color.success,
    reassigned: color.textMuted,
};

export function AssignmentBadge({ status, label }) {
    const c = ASSIGNMENT_STATUS_COLORS[status] ?? color.textSecondary;
    return (
        <span
            style={{
                fontSize: font.size.xs,
                fontWeight: font.weight.semibold,
                padding: '0.2rem 0.6rem',
                borderRadius: radius.full,
                color: c,
                background: `${c}1a`,
                whiteSpace: 'nowrap',
            }}
        >
            {label}
        </span>
    );
}

// ── Observation status badge ──────────────────────────────────────────────────
const OBSERVATION_STATUS_COLORS = {
    pending: color.textSecondary,
    ai_reviewed: '#3b82f6',
    elevated: color.success,
    dismissed: color.textMuted,
    flagged: '#f59e0b',
};

export function ObservationBadge({ status }) {
    const c = OBSERVATION_STATUS_COLORS[status] ?? color.textSecondary;
    return (
        <span
            style={{
                fontSize: '0.65rem',
                fontWeight: font.weight.semibold,
                padding: '0.15rem 0.5rem',
                borderRadius: radius.full,
                color: c,
                background: `${c}1a`,
            }}
        >
            {OBSERVATION_STATUS_LABELS[status]}
        </span>
    );
}

// ── Severity tag ──────────────────────────────────────────────────────────────
export function SeverityTag({ severity }) {
    if (!severity) return null;
    const c = SEVERITY_COLOR(severity);
    return (
        <span
            style={{
                fontSize: '0.62rem',
                fontWeight: font.weight.bold,
                color: color.bgPage,
                padding: '0.12rem 0.4rem',
                borderRadius: radius.full,
                background: c,
                whiteSpace: 'nowrap',
            }}
        >
            {severity}/10
        </span>
    );
}

// ── Error banner ──────────────────────────────────────────────────────────────
export function ErrorBanner({ message }) {
    if (!message) return null;
    return (
        <div
            role="alert"
            style={{
                background: color.dangerSurface,
                border: `1px solid ${color.dangerBorder}`,
                borderRadius: radius.md,
                color: '#fca5a5',
                fontSize: font.size.sm,
                padding: `${space[3]} ${space[4]}`,
            }}
        >
            {message}
        </div>
    );
}

// ── Skeleton rows ─────────────────────────────────────────────────────────────
export function SkeletonRows({ count = 3, height = '76px' }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: space[2] }}>
            {Array.from({ length: count }, (_, i) => (
                <div
                    key={i}
                    style={{
                        height,
                        background: color.bgSurface,
                        borderRadius: radius.lg,
                        border: `1px solid ${color.borderFaint}`,
                    }}
                />
            ))}
        </div>
    );
}

// ── Empty state ───────────────────────────────────────────────────────────────
export function EmptyState({ icon, heading, sub, cta, ctaTo }) {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: space[3],
                padding: `${space[12]} ${space[4]}`,
                textAlign: 'center',
                background: color.bgSurface,
                borderRadius: radius.xl,
                border: `1px dashed ${color.borderDefault}`,
            }}
        >
            {icon && <span style={{ fontSize: '2rem' }}>{icon}</span>}
            <p style={{ fontSize: font.size.base, color: color.textMuted, margin: 0 }}>{heading}</p>
            {sub && (
                <p
                    style={{
                        fontSize: font.size.sm,
                        color: color.textMuted,
                        maxWidth: '280px',
                        lineHeight: 1.6,
                        margin: 0,
                    }}
                >
                    {sub}
                </p>
            )}
            {cta && ctaTo && (
                <Link
                    to={ctaTo}
                    style={{ fontSize: font.size.sm, color: color.accent, textDecoration: 'none' }}
                >
                    {cta}
                </Link>
            )}
        </div>
    );
}

// ── Surface card ──────────────────────────────────────────────────────────────
export function Card({ children, style: extra, accent }) {
    return (
        <div
            style={{
                background: color.bgSurface,
                border: `1px solid ${accent ? `${accent}44` : color.borderDefault}`,
                borderRadius: radius.xl,
                padding: space[5],
                ...extra,
            }}
        >
            {children}
        </div>
    );
}

// ── Section label ─────────────────────────────────────────────────────────────
export function SectionLabel({ children }) {
    return (
        <span
            style={{
                fontSize: '0.68rem',
                fontWeight: font.weight.bold,
                color: color.textMuted,
                letterSpacing: font.tracking.wider,
                textTransform: 'uppercase',
            }}
        >
            {children}
        </span>
    );
}

// ── Instructions box ──────────────────────────────────────────────────────────
export function InstructionsBox({ text }) {
    if (!text) return null;
    return (
        <div
            style={{
                background: '#a78bfa11',
                border: '1px solid #a78bfa33',
                borderRadius: radius.lg,
                padding: space[4],
            }}
        >
            <span
                style={{
                    display: 'block',
                    fontSize: '0.68rem',
                    fontWeight: font.weight.bold,
                    color: '#c4b5fd',
                    letterSpacing: font.tracking.wide,
                    textTransform: 'uppercase',
                    marginBottom: space[2],
                }}
            >
                Officer instructions
            </span>
            <p style={{ fontSize: font.size.sm, color: '#ddd6fe', margin: 0, lineHeight: 1.6 }}>
                {text}
            </p>
        </div>
    );
}

// ── Image picker (tap-to-upload zone) ─────────────────────────────────────────
export function ImagePicker({ preview, onClick, minHeight = '160px' }) {
    return (
        <div
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onClick()}
            style={{
                border: `2px dashed ${color.borderDefault}`,
                borderRadius: radius.lg,
                minHeight,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                background: preview ? 'transparent' : color.bgPage,
            }}
        >
            {preview ? (
                <img
                    src={preview}
                    alt="Preview"
                    style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block' }}
                />
            ) : (
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: space[2],
                        padding: space[6],
                    }}
                >
                    <span style={{ fontSize: '2.2rem' }}>📷</span>
                    <span style={{ fontSize: font.size.sm, color: color.textSecondary }}>
                        Tap to add photo
                    </span>
                </div>
            )}
        </div>
    );
}

// ── GPS button ────────────────────────────────────────────────────────────────
export function GpsButton({ status, onClick }) {
    const labels = {
        idle: '📍 Capture location',
        loading: '📡 Getting location…',
        ok: '📍 Location captured — tap to refresh',
        error: '⚠️ GPS failed — retry',
    };
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={status === 'loading'}
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
            {labels[status] ?? labels.idle}
        </button>
    );
}

// ── Shared form inputs ────────────────────────────────────────────────────────
export function Textarea({ value, onChange, placeholder, rows = 3, id }) {
    return (
        <textarea
            id={id}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            rows={rows}
            style={{
                background: color.bgPage,
                border: `1px solid ${color.borderDefault}`,
                borderRadius: radius.md,
                color: color.textPrimary,
                fontSize: font.size.sm,
                padding: `0.65rem 0.8rem`,
                resize: 'vertical',
                outline: 'none',
                fontFamily: font.sans,
                width: '100%',
                boxSizing: 'border-box',
            }}
        />
    );
}

export function Input({ value, onChange, placeholder, type = 'text', id }) {
    return (
        <input
            id={id}
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            style={{
                background: color.bgPage,
                border: `1px solid ${color.borderDefault}`,
                borderRadius: radius.md,
                color: color.textPrimary,
                fontSize: font.size.sm,
                padding: `0.6rem 0.8rem`,
                outline: 'none',
                width: '100%',
                boxSizing: 'border-box',
                fontFamily: font.sans,
            }}
        />
    );
}

// ── Primary button ────────────────────────────────────────────────────────────
export function PrimaryButton({
    onClick,
    disabled,
    loading,
    loadingText,
    children,
    type = 'button',
}) {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            style={mk.btnPrimary({ disabled: disabled || loading })}
        >
            {loading ? (loadingText ?? 'Loading…') : children}
        </button>
    );
}

// ── Success card ──────────────────────────────────────────────────────────────
export function SuccessCard({ icon, heading, sub, children }) {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: space[4],
                textAlign: 'center',
                background: color.bgSurface,
                border: `1px solid ${color.borderDefault}`,
                borderRadius: radius.xl,
                padding: `${space[8]} ${space[6]}`,
            }}
        >
            <span style={{ fontSize: '2.5rem' }}>{icon}</span>
            <h2
                style={{
                    fontSize: '1.2rem',
                    fontWeight: font.weight.extrabold,
                    color: color.textPrimary,
                    margin: 0,
                }}
            >
                {heading}
            </h2>
            {sub && (
                <p
                    style={{
                        fontSize: font.size.sm,
                        color: color.textSecondary,
                        lineHeight: 1.6,
                        margin: 0,
                    }}
                >
                    {sub}
                </p>
            )}
            {children}
        </div>
    );
}

// ── AI result box ─────────────────────────────────────────────────────────────
export function AIResultBox({ category, severity, confidence }) {
    return (
        <div
            style={{
                background: color.bgPage,
                borderRadius: radius.md,
                padding: `${space[3]} ${space[5]}`,
                border: `1px solid ${color.borderFaint}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.3rem',
                width: '100%',
            }}
        >
            <span
                style={{
                    fontSize: '0.68rem',
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
                {category}
            </span>
            <span style={{ fontSize: font.size.sm, color: color.textSecondary }}>
                Severity: <strong>{severity}/10</strong>
                {confidence != null && ` · Confidence: ${Math.round(confidence * 100)}%`}
            </span>
        </div>
    );
}

// ── Field points earned badge ─────────────────────────────────────────────────
export function PointsBadge({ points }) {
    return (
        <span
            style={{
                fontSize: font.size.sm,
                color: '#eab308',
                fontWeight: font.weight.bold,
            }}
        >
            ★ +{points} field points
        </span>
    );
}
