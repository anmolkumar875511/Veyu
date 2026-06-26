// src/components/admin/AdminShell.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Shared primitives for WardManagement and NerveMap.
// All tokens from theme/index.js — nothing hard-coded here.
// ─────────────────────────────────────────────────────────────────────────────

import { Link } from 'react-router-dom';
import { color, font, radius, space, shadow, transition, mk } from '../../theme/index.js';
import { STRESS_BAND_META } from '../../constants/complaint.constants.js';

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

// ── Nav bar ───────────────────────────────────────────────────────────────────
export function NavBar({ left, right }) {
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
            <div>{left}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: space[5] }}>{right}</div>
        </header>
    );
}

// ── Brand mark ────────────────────────────────────────────────────────────────
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

// ── Nav link ──────────────────────────────────────────────────────────────────
export function NavLink({ to, children }) {
    return (
        <Link
            to={to}
            style={{ fontSize: font.size.sm, color: color.textSecondary, textDecoration: 'none' }}
        >
            {children}
        </Link>
    );
}

// ── Nav CTA link (filled button style) ───────────────────────────────────────
export function NavCta({ to, children }) {
    return (
        <Link
            to={to}
            style={{
                fontSize: font.size.sm,
                color: color.accentText,
                background: color.accent,
                fontWeight: font.weight.bold,
                padding: `0.45rem ${space[4]}`,
                borderRadius: radius.md,
                textDecoration: 'none',
            }}
        >
            {children}
        </Link>
    );
}

// ── Nav user text ─────────────────────────────────────────────────────────────
export function NavUser({ name }) {
    return <span style={{ fontSize: font.size.xs, color: color.textMuted }}>{name}</span>;
}

// ── Nav logout button ─────────────────────────────────────────────────────────
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

// ── Success message ───────────────────────────────────────────────────────────
export function SuccessMsg({ message }) {
    if (!message) return null;
    return <span style={{ fontSize: font.size.sm, color: color.success }}>{message}</span>;
}

// ── Skeleton rows ─────────────────────────────────────────────────────────────
export function SkeletonRows({ count = 3, height = '70px' }) {
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

// ── Skeleton grid ─────────────────────────────────────────────────────────────
export function SkeletonGrid({ count = 6, height = '150px', minCol = '220px' }) {
    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: `repeat(auto-fill, minmax(${minCol}, 1fr))`,
                gap: space[4],
            }}
        >
            {Array.from({ length: count }, (_, i) => (
                <div
                    key={i}
                    style={{
                        height,
                        background: color.bgSurface,
                        borderRadius: radius.xl,
                        border: `1px solid ${color.borderFaint}`,
                    }}
                />
            ))}
        </div>
    );
}

// ── Stress band badge ─────────────────────────────────────────────────────────
export function StressBand({ band }) {
    const meta = STRESS_BAND_META[band] ?? STRESS_BAND_META.stable;
    return (
        <span
            style={{
                fontSize: '0.65rem',
                fontWeight: font.weight.bold,
                padding: '0.18rem 0.55rem',
                borderRadius: radius.full,
                color: meta.color,
                background: `${meta.color}1a`,
            }}
        >
            {meta.label}
        </span>
    );
}

// ── Form input ────────────────────────────────────────────────────────────────
export function Input({ value, onChange, placeholder, type = 'text', required, style: extra }) {
    return (
        <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            style={{
                background: color.bgPage,
                border: `1px solid ${color.borderDefault}`,
                borderRadius: radius.md,
                color: color.textPrimary,
                fontSize: font.size.sm,
                padding: `0.6rem 0.8rem`,
                outline: 'none',
                flex: 1,
                minWidth: '140px',
                fontFamily: font.sans,
                boxSizing: 'border-box',
                ...extra,
            }}
        />
    );
}

// ── Primary button ────────────────────────────────────────────────────────────
export function BtnPrimary({
    onClick,
    disabled,
    loading,
    loadingText,
    children,
    type = 'button',
    size = 'md',
}) {
    const pad = size === 'sm' ? '0.45rem 0.875rem' : `0.6rem ${space[4]}`;
    const fz = size === 'sm' ? font.size.xs : font.size.sm;
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            style={{
                ...mk.btnPrimary({ disabled: disabled || loading }),
                fontSize: fz,
                padding: pad,
                width: 'auto',
            }}
        >
            {loading ? (loadingText ?? 'Loading…') : children}
        </button>
    );
}

// ── Ghost button ──────────────────────────────────────────────────────────────
export function BtnGhost({ onClick, children, size = 'md' }) {
    const pad = size === 'sm' ? '0.45rem 0.875rem' : `0.55rem ${space[4]}`;
    return (
        <button
            type="button"
            onClick={onClick}
            style={{
                background: 'none',
                border: `1px solid ${color.borderDefault}`,
                borderRadius: radius.md,
                color: color.textSecondary,
                fontSize: font.size.sm,
                padding: pad,
                cursor: 'pointer',
            }}
        >
            {children}
        </button>
    );
}

// ── Tool button (secondary action) ────────────────────────────────────────────
export function ToolBtn({ onClick, disabled, children }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            style={{
                background: color.bgSurface,
                border: `1px solid ${color.borderDefault}`,
                borderRadius: radius.md,
                color: color.textSecondary,
                fontSize: font.size.xs,
                padding: `0.5rem 0.875rem`,
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.6 : 1,
            }}
        >
            {children}
        </button>
    );
}

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, style: extra }) {
    return (
        <div
            style={{
                background: color.bgSurface,
                border: `1px solid ${color.borderDefault}`,
                borderRadius: radius.xl,
                padding: space[5],
                display: 'flex',
                flexDirection: 'column',
                gap: space[3],
                ...extra,
            }}
        >
            {children}
        </div>
    );
}

// ── Modal overlay ─────────────────────────────────────────────────────────────
export function Modal({ title, onClose, children }) {
    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.65)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 200,
                padding: space[4],
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: color.bgSurface,
                    border: `1px solid ${color.borderDefault}`,
                    borderRadius: radius['2xl'],
                    padding: `${space[6]} ${space[6]}`,
                    width: '100%',
                    maxWidth: '440px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: space[4],
                    boxShadow: shadow.card,
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <h3
                        style={{
                            fontSize: font.size.md,
                            fontWeight: font.weight.bold,
                            color: color.textPrimary,
                            margin: 0,
                        }}
                    >
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: color.textMuted,
                            fontSize: '1.25rem',
                            cursor: 'pointer',
                            lineHeight: 1,
                        }}
                    >
                        ×
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

// ── Section heading ───────────────────────────────────────────────────────────
export function SectionHeading({ title, sub }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <h2
                style={{
                    fontSize: '1.15rem',
                    fontWeight: font.weight.bold,
                    color: color.textPrimary,
                    margin: 0,
                }}
            >
                {title}
            </h2>
            {sub && (
                <p style={{ fontSize: font.size.sm, color: color.textMuted, margin: 0 }}>{sub}</p>
            )}
        </div>
    );
}

// ── Velocity bar (PulseGrid) ──────────────────────────────────────────────────
export function VelocityBar({ velocity, band }) {
    const meta = STRESS_BAND_META[band] ?? STRESS_BAND_META.stable;
    return (
        <div
            style={{
                height: '4px',
                background: color.bgPage,
                borderRadius: radius.full,
                overflow: 'hidden',
            }}
        >
            <div
                style={{
                    width: `${Math.min((velocity ?? 1) * 25, 100)}%`,
                    height: '100%',
                    background: meta.color,
                    borderRadius: radius.full,
                    transition: transition.slow,
                }}
            />
        </div>
    );
}

// ── Legend row ────────────────────────────────────────────────────────────────
export function StressBandLegend() {
    return (
        <div style={{ display: 'flex', gap: space[4], flexWrap: 'wrap', justifyContent: 'center' }}>
            {Object.entries(STRESS_BAND_META).map(([key, m]) => (
                <span
                    key={key}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontSize: font.size.xs,
                        color: color.textMuted,
                    }}
                >
                    <span
                        style={{
                            width: '0.5rem',
                            height: '0.5rem',
                            borderRadius: radius.full,
                            background: m.color,
                            display: 'inline-block',
                        }}
                    />
                    {m.label}
                </span>
            ))}
        </div>
    );
}
