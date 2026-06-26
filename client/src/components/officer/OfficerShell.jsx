// src/components/officer/OfficerShell.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Shared primitives for all officer pages (WarRoom, ComplaintDetail,
// Reports, Forecasts). All tokens from theme/index.js.
// ─────────────────────────────────────────────────────────────────────────────

import { Link } from 'react-router-dom';
import { color, font, radius, space, shadow, transition, mk } from '../../theme/index.js';
import {
    COMPLAINT_STATUS_LABELS,
    STATUS_META,
    SEVERITY_COLOR,
} from '../../constants/complaint.constants.js';

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

// ── Full-screen loading / error state ─────────────────────────────────────────
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

// ── Brand mark with optional sub-label ───────────────────────────────────────
export function NavBrand({ name = 'Veyu', sub }) {
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
                {name}
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

// ── Back link (← label) ───────────────────────────────────────────────────────
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

// ── Nav user name ─────────────────────────────────────────────────────────────
export function NavUser({ name }) {
    return <span style={{ fontSize: font.size.xs, color: color.textMuted }}>{name}</span>;
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

// ── Nav title (center label) ──────────────────────────────────────────────────
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

// ── Status badge ──────────────────────────────────────────────────────────────
export function StatusBadge({ status }) {
    const m = STATUS_META[status] ?? STATUS_META.submitted;
    return (
        <span
            style={{
                fontSize: font.size.xs,
                fontWeight: font.weight.bold,
                padding: '0.2rem 0.6rem',
                borderRadius: radius.full,
                color: m.color,
                background: m.bg,
                whiteSpace: 'nowrap',
            }}
        >
            {m.label}
        </span>
    );
}

// ── Severity bar + label ──────────────────────────────────────────────────────
export function SeverityBar({ severity }) {
    if (!severity)
        return <span style={{ color: color.borderDefault, fontSize: font.size.sm }}>—</span>;
    const c = SEVERITY_COLOR(severity);
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: space[2], minWidth: '90px' }}>
            <div
                style={{
                    flex: 1,
                    height: '4px',
                    background: color.borderDefault,
                    borderRadius: radius.full,
                    overflow: 'hidden',
                }}
            >
                <div
                    style={{
                        width: `${severity * 10}%`,
                        height: '100%',
                        background: c,
                        borderRadius: radius.full,
                    }}
                />
            </div>
            <span
                style={{
                    fontSize: '0.72rem',
                    fontWeight: font.weight.bold,
                    color: c,
                    minWidth: '1rem',
                }}
            >
                {severity}
            </span>
        </div>
    );
}

// ── Section label (CAPS metadata label) ──────────────────────────────────────
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

// ── Error banner ──────────────────────────────────────────────────────────────
export function ErrorBanner({ message, onRetry }) {
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: space[3],
            }}
        >
            <span>{message}</span>
            {onRetry && (
                <button
                    onClick={onRetry}
                    style={{
                        background: 'none',
                        border: `1px solid ${color.dangerBorder}`,
                        borderRadius: radius.sm,
                        color: '#fca5a5',
                        fontSize: font.size.xs,
                        padding: '0.2rem 0.6rem',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                    }}
                >
                    Retry
                </button>
            )}
        </div>
    );
}

// ── Skeleton rows ─────────────────────────────────────────────────────────────
export function SkeletonRows({ count = 5, height = '52px' }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: space[2] }}>
            {Array.from({ length: count }, (_, i) => (
                <div
                    key={i}
                    style={{
                        height,
                        background: color.bgSurface,
                        borderRadius: radius.md,
                        border: `1px solid ${color.borderFaint}`,
                    }}
                />
            ))}
        </div>
    );
}

// ── Skeleton grid ─────────────────────────────────────────────────────────────
export function SkeletonGrid({ count = 3, height = '220px', minColWidth = '280px' }) {
    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: `repeat(auto-fill, minmax(${minColWidth}, 1fr))`,
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

// ── Empty state ───────────────────────────────────────────────────────────────
export function EmptyState({ icon, heading, sub }) {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: space[3],
                padding: `${space[12]} ${space[4]}`,
                textAlign: 'center',
            }}
        >
            {icon && <span style={{ fontSize: '2.25rem' }}>{icon}</span>}
            <p
                style={{
                    fontSize: font.size.base,
                    fontWeight: font.weight.semibold,
                    color: color.textSecondary,
                    margin: 0,
                }}
            >
                {heading}
            </p>
            {sub && (
                <p
                    style={{
                        fontSize: font.size.sm,
                        color: color.textMuted,
                        maxWidth: '380px',
                        lineHeight: 1.6,
                        margin: 0,
                    }}
                >
                    {sub}
                </p>
            )}
        </div>
    );
}

// ── Filter tabs (shared by WarRoom and MyComplaints) ──────────────────────────
export function FilterTabs({ tabs, active, onChange }) {
    return (
        <div
            style={{
                display: 'flex',
                borderBottom: `1px solid ${color.borderFaint}`,
                marginBottom: space[5],
            }}
        >
            {tabs.map((t) => (
                <button
                    key={t.value}
                    onClick={() => onChange(t.value)}
                    style={{
                        padding: `${space[3]} ${space[3]}`,
                        fontSize: font.size.xs,
                        fontWeight: font.weight.medium,
                        cursor: 'pointer',
                        border: 'none',
                        background: 'transparent',
                        color: active === t.value ? color.textPrimary : color.textMuted,
                        borderBottom: `2px solid ${active === t.value ? color.accent : 'transparent'}`,
                        whiteSpace: 'nowrap',
                        transition: transition.fast,
                    }}
                >
                    {t.label}
                </button>
            ))}
        </div>
    );
}

// ── Pagination ────────────────────────────────────────────────────────────────
export function Pagination({ page, totalPages, onPrev, onNext }) {
    if (totalPages <= 1) return null;
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: space[5],
                marginTop: space[5],
            }}
        >
            <PageBtn onClick={onPrev} disabled={page <= 1}>
                ← Prev
            </PageBtn>
            <span style={{ fontSize: font.size.sm, color: color.textMuted }}>
                {page} / {totalPages}
            </span>
            <PageBtn onClick={onNext} disabled={page >= totalPages}>
                Next →
            </PageBtn>
        </div>
    );
}

function PageBtn({ onClick, disabled, children }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            style={{
                background: color.bgSurface,
                border: `1px solid ${color.borderDefault}`,
                borderRadius: radius.md,
                color: color.textSecondary,
                fontSize: font.size.sm,
                padding: `0.4rem 0.875rem`,
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.4 : 1,
                transition: transition.fast,
            }}
        >
            {children}
        </button>
    );
}

// ── Surface card ──────────────────────────────────────────────────────────────
export function Card({ children, style: extra, padding }) {
    return (
        <div
            style={{
                background: color.bgSurface,
                border: `1px solid ${color.borderDefault}`,
                borderRadius: radius.xl,
                padding: padding ?? space[5],
                ...extra,
            }}
        >
            {children}
        </div>
    );
}

// ── Meta grid (label + value pairs) ──────────────────────────────────────────
export function MetaGrid({ items, columns = 3 }) {
    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                gap: space[4],
                background: color.bgSurface,
                borderRadius: radius.lg,
                padding: space[4],
                border: `1px solid ${color.borderDefault}`,
            }}
        >
            {items.map(({ label, value }) => (
                <div
                    key={label}
                    style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}
                >
                    <span
                        style={{
                            fontSize: '0.65rem',
                            color: color.textMuted,
                            letterSpacing: font.tracking.wide,
                            textTransform: 'uppercase',
                        }}
                    >
                        {label}
                    </span>
                    <span
                        style={{
                            fontSize: font.size.sm,
                            color: color.textPrimary,
                            fontWeight: font.weight.semibold,
                        }}
                    >
                        {value ?? '—'}
                    </span>
                </div>
            ))}
        </div>
    );
}

// ── Shared form inputs (for action panels) ────────────────────────────────────
export function Textarea({ placeholder, value, onChange, rows = 3 }) {
    return (
        <textarea
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
                padding: `0.6rem 0.75rem`,
                resize: 'vertical',
                outline: 'none',
                fontFamily: font.sans,
                width: '100%',
                boxSizing: 'border-box',
            }}
        />
    );
}

export function Select({ value, onChange, children }) {
    return (
        <select
            value={value}
            onChange={onChange}
            style={{
                background: color.bgPage,
                border: `1px solid ${color.borderDefault}`,
                borderRadius: radius.md,
                color: color.textPrimary,
                fontSize: font.size.sm,
                padding: `0.6rem 0.75rem`,
                outline: 'none',
                width: '100%',
                cursor: 'pointer',
            }}
        >
            {children}
        </select>
    );
}

// ── Action buttons ─────────────────────────────────────────────────────────────
export function BtnPrimary({ onClick, disabled, loading, loadingText, children }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled || loading}
            style={{
                ...mk.btnPrimary({ disabled: disabled || loading }),
                fontSize: font.size.sm,
            }}
        >
            {loading ? (loadingText ?? 'Loading…') : children}
        </button>
    );
}

export function BtnDanger({ onClick, children }) {
    return (
        <button
            onClick={onClick}
            style={{
                background: 'none',
                border: `1px solid ${color.dangerBorder}`,
                borderRadius: radius.md,
                color: color.danger,
                fontSize: font.size.sm,
                fontWeight: font.weight.semibold,
                padding: '0.6rem',
                cursor: 'pointer',
                width: '100%',
            }}
        >
            {children}
        </button>
    );
}

export function BtnDangerSolid({ onClick, disabled, loading, children }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled || loading}
            style={{
                background: color.danger,
                border: 'none',
                borderRadius: radius.md,
                color: '#fff',
                fontSize: font.size.sm,
                fontWeight: font.weight.bold,
                padding: '0.6rem',
                cursor: disabled || loading ? 'not-allowed' : 'pointer',
                opacity: disabled || loading ? 0.65 : 1,
                width: '100%',
            }}
        >
            {loading ? 'Loading…' : children}
        </button>
    );
}

export function BtnGhost({ onClick, children }) {
    return (
        <button
            onClick={onClick}
            style={{
                background: 'none',
                border: `1px solid ${color.borderDefault}`,
                borderRadius: radius.md,
                color: color.textMuted,
                fontSize: font.size.sm,
                padding: '0.5rem',
                cursor: 'pointer',
                width: '100%',
            }}
        >
            {children}
        </button>
    );
}
