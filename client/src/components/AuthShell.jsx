// src/components/AuthShell.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Shared UI primitives for auth pages (Login, Register, Unauthorized, etc.)
// All visual decisions live in theme/index.js — nothing is hard-coded here.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { color, font, space, radius, shadow, mk } from '../theme/index.js';

// ── Page wrapper ──────────────────────────────────────────────────────────────
export function AuthPage({ children }) {
    return <div style={mk.authPage()}>{children}</div>;
}

// ── Card ──────────────────────────────────────────────────────────────────────
export function AuthCard({ children, maxWidth }) {
    return <div style={mk.authCard(maxWidth)}>{children}</div>;
}

// ── Brand mark ────────────────────────────────────────────────────────────────
export function BrandMark({ name = 'Veyu' }) {
    return (
        <div style={mk.brandRow()}>
            <span style={mk.brandDot()} />
            <span style={mk.brandName()}>{name}</span>
        </div>
    );
}

// ── Heading block ─────────────────────────────────────────────────────────────
export function AuthHeading({ title, subtitle }) {
    return (
        <>
            <h1 style={mk.heading()}>{title}</h1>
            {subtitle && <p style={mk.subheading()}>{subtitle}</p>}
        </>
    );
}

// ── Error banner ──────────────────────────────────────────────────────────────
export function ErrorBanner({ message }) {
    if (!message) return null;
    return (
        <div style={mk.errorBanner()} role="alert" aria-live="polite">
            <span style={{ marginRight: space[2], opacity: 0.75 }}>⚠</span>
            {message}
        </div>
    );
}

// ── Form field (label + input slot + optional error) ──────────────────────────
export function FormField({ label, htmlFor, error, optional, labelRight, children }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={mk.label()} htmlFor={htmlFor}>
                    {label}
                    {optional && (
                        <span
                            style={{
                                marginLeft: space[1],
                                fontWeight: font.weight.normal,
                                color: color.textMuted,
                            }}
                        >
                            (optional)
                        </span>
                    )}
                </label>
                {labelRight}
            </div>
            {children}
            {error && (
                <span style={mk.fieldError()} role="alert">
                    {error}
                </span>
            )}
        </div>
    );
}

// ── Plain text input ──────────────────────────────────────────────────────────
export function TextInput({ hasError, ...props }) {
    return <input style={mk.input({ hasError })} {...props} />;
}

// ── Password input with show/hide toggle ──────────────────────────────────────
export function PasswordInput({ hasError, ...props }) {
    const [visible, setVisible] = useState(false);
    return (
        <div style={mk.passwordWrapper()}>
            <input
                type={visible ? 'text' : 'password'}
                style={{ ...mk.input({ hasError }), paddingRight: '3rem' }}
                {...props}
            />
            <button
                type="button"
                onClick={() => setVisible((v) => !v)}
                style={mk.showPasswordBtn()}
                aria-label={visible ? 'Hide password' : 'Show password'}
            >
                {visible ? 'Hide' : 'Show'}
            </button>
        </div>
    );
}

// ── Primary CTA button ────────────────────────────────────────────────────────
export function PrimaryButton({ loading, loadingText, children, disabled, ...rest }) {
    const isDisabled = loading || disabled;
    return (
        <button
            type="submit"
            disabled={isDisabled}
            style={mk.btnPrimary({ disabled: isDisabled })}
            {...rest}
        >
            {loading ? (loadingText ?? 'Loading…') : children}
        </button>
    );
}

// ── Ghost / secondary button ──────────────────────────────────────────────────
export function SecondaryButton({ children, ...rest }) {
    return (
        <button type="button" style={mk.btnSecondary()} {...rest}>
            {children}
        </button>
    );
}

// ── Full-screen loading state (used by RouteGuards) ───────────────────────────
export function FullscreenLoader({ message = 'Loading…' }) {
    return <div style={mk.fullscreenLoader()}>{message}</div>;
}

// ── Horizontal rule with optional label ──────────────────────────────────────
export function Divider({ label }) {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: space[3],
                margin: `${space[2]} 0`,
            }}
        >
            <div style={{ flex: 1, height: '1px', background: color.borderSubtle }} />
            {label && (
                <span
                    style={{ fontSize: font.size.xs, color: color.textMuted, whiteSpace: 'nowrap' }}
                >
                    {label}
                </span>
            )}
            <div style={{ flex: 1, height: '1px', background: color.borderSubtle }} />
        </div>
    );
}

// ── Role chip (inline badge for role label + color) ───────────────────────────
export function RoleChip({ label, accentColor }) {
    return (
        <span style={{ color: accentColor ?? color.accent, fontWeight: font.weight.medium }}>
            {label}
        </span>
    );
}
