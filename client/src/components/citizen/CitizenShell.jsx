// src/components/citizen/CitizenShell.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Shared primitives for all citizen pages.
// All tokens from theme/index.js — nothing hard-coded here.
// ─────────────────────────────────────────────────────────────────────────────

import { Link } from 'react-router-dom';
import { color, font, radius, space, shadow, mk, transition } from '../../theme/index.js';
import { STATUS_META, SEVERITY_COLOR } from '../../constants/complaint.constants.js';

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

// ── Sticky nav bar ────────────────────────────────────────────────────────────
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
            <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>{right}</div>
        </header>
    );
}

// ── Brand mark (for the dashboard nav) ───────────────────────────────────────
export function NavBrand({ name = 'Veyu' }) {
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
        </div>
    );
}

// ── Nav link ──────────────────────────────────────────────────────────────────
export function NavLink({ to, children }) {
    return (
        <Link
            to={to}
            style={{
                fontSize: font.size.sm,
                color: color.textSecondary,
                textDecoration: 'none',
                fontWeight: font.weight.medium,
            }}
        >
            {children}
        </Link>
    );
}

export function NavLinkAccent({ to, children }) {
    return (
        <Link
            to={to}
            style={{
                fontSize: font.size.sm,
                color: color.accent,
                textDecoration: 'none',
                fontWeight: font.weight.semibold,
            }}
        >
            {children}
        </Link>
    );
}

// ── Ghost nav button ──────────────────────────────────────────────────────────
export function NavButton({ onClick, children }) {
    return (
        <button
            onClick={onClick}
            style={{
                background: 'none',
                border: `1px solid ${color.borderDefault}`,
                borderRadius: radius.sm,
                color: color.textSecondary,
                fontSize: font.size.xs,
                padding: `0.28rem 0.65rem`,
                cursor: 'pointer',
            }}
        >
            {children}
        </button>
    );
}

// ── Status badge ──────────────────────────────────────────────────────────────
export function StatusBadge({ status }) {
    const m = STATUS_META[status] ?? STATUS_META.submitted;
    return (
        <span
            style={{
                fontSize: font.size.xs,
                fontWeight: font.weight.semibold,
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

// ── Severity pill ─────────────────────────────────────────────────────────────
export function SeverityPip({ severity }) {
    if (!severity) return null;
    return (
        <span
            style={{
                fontSize: '0.62rem',
                fontWeight: font.weight.bold,
                color: color.bgPage,
                padding: '0.12rem 0.4rem',
                borderRadius: radius.full,
                background: SEVERITY_COLOR(severity),
                whiteSpace: 'nowrap',
            }}
        >
            {severity}/10
        </span>
    );
}

// ── Section label (CAPS metadata label) ──────────────────────────────────────
export function SectionLabel({ children }) {
    return (
        <span
            style={{
                fontSize: '0.65rem',
                fontWeight: font.weight.semibold,
                color: color.textMuted,
                letterSpacing: font.tracking.wider,
                textTransform: 'uppercase',
            }}
        >
            {children}
        </span>
    );
}

// ── Error banner with optional retry ─────────────────────────────────────────
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
                        padding: `0.2rem 0.6rem`,
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

// ── Skeleton placeholder ──────────────────────────────────────────────────────
export function Skeleton({ height = '68px', count = 3 }) {
    return (
        <>
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
        </>
    );
}

// ── Pagination ────────────────────────────────────────────────────────────────
export function Pagination({ page, totalPages, onPrev, onNext, style: extraStyle }) {
    if (totalPages <= 1) return null;
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: space[5],
                ...(extraStyle ?? {}),
            }}
        >
            <PaginationBtn onClick={onPrev} disabled={page <= 1}>
                ← Prev
            </PaginationBtn>
            <span
                style={{
                    fontSize: font.size.sm,
                    color: color.textMuted,
                }}
            >
                {page} / {totalPages}
            </span>
            <PaginationBtn onClick={onNext} disabled={page >= totalPages}>
                Next →
            </PaginationBtn>
        </div>
    );
}

function PaginationBtn({ onClick, disabled, children }) {
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
                padding: `0.35rem 0.875rem`,
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.4 : 1,
                transition: transition.fast,
            }}
        >
            {children}
        </button>
    );
}

// ── Empty state ───────────────────────────────────────────────────────────────
export function EmptyState({ icon = '🏙️', heading, sub, cta, ctaTo }) {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: space[3],
                padding: `${space[12]} ${space[6]}`,
                textAlign: 'center',
                background: color.bgSurface,
                borderRadius: radius.xl,
                border: `1px dashed ${color.borderDefault}`,
            }}
        >
            <div style={{ fontSize: '2.5rem' }}>{icon}</div>
            <h3
                style={{
                    fontSize: font.size.md,
                    fontWeight: font.weight.bold,
                    color: color.textPrimary,
                    margin: 0,
                }}
            >
                {heading}
            </h3>
            {sub && (
                <p
                    style={{
                        fontSize: font.size.base,
                        color: color.textMuted,
                        lineHeight: font.leading.relaxed,
                        margin: 0,
                        maxWidth: '320px',
                    }}
                >
                    {sub}
                </p>
            )}
            {cta && ctaTo && (
                <Link
                    to={ctaTo}
                    style={{
                        marginTop: space[2],
                        display: 'inline-block',
                        background: color.accent,
                        color: color.accentText,
                        fontSize: font.size.base,
                        fontWeight: font.weight.bold,
                        padding: `0.65rem ${space[6]}`,
                        borderRadius: radius.md,
                        textDecoration: 'none',
                    }}
                >
                    {cta}
                </Link>
            )}
        </div>
    );
}

// ── Surface card ──────────────────────────────────────────────────────────────
export function Card({ children, style: extraStyle }) {
    return (
        <div
            style={{
                background: color.bgSurface,
                border: `1px solid ${color.borderDefault}`,
                borderRadius: radius.xl,
                ...extraStyle,
            }}
        >
            {children}
        </div>
    );
}

// ── Accent CTA link (styled as button) ───────────────────────────────────────
export function AccentLink({ to, children }) {
    return (
        <Link
            to={to}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                background: color.accent,
                color: color.accentText,
                fontSize: font.size.base,
                fontWeight: font.weight.bold,
                padding: `0.65rem ${space[5]}`,
                borderRadius: radius.md,
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                flexShrink: 0,
            }}
        >
            {children}
        </Link>
    );
}
