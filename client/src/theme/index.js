// src/theme/index.js
// ─────────────────────────────────────────────────────────────────────────────
// Veyu design tokens — single source of truth.
// Never hard-code a color, size, or font value in a component.
// Import from here instead: import { color, font, space, styles } from '../../theme/index.js'
// ─────────────────────────────────────────────────────────────────────────────

// ── Palette ───────────────────────────────────────────────────────────────────
export const color = {
    // Backgrounds
    bgPage: '#09111f',
    bgSurface: '#111d2e',
    bgElevated: '#172236',
    bgInput: '#09111f',

    // Borders
    borderFaint: '#162030',
    borderSubtle: '#1c2e45',
    borderDefault: '#243c58',
    borderStrong: '#2e4e70',

    // Accent (cyan)
    accent: '#22d3ee',
    accentHover: '#06b6d4',
    accentMuted: '#22d3ee18',
    accentText: '#09111f', // text ON accent background

    // Semantic
    success: '#22c55e',
    successDim: '#22c55e18',
    danger: '#ef4444',
    dangerDim: '#ef444418',
    dangerSurface: '#140808',
    dangerBorder: '#2e1010',

    // Text
    textPrimary: '#eef4ff',
    textSecondary: '#6e93b8',
    textMuted: '#354e66',
    textDisabled: '#223040',

    // Per-role accent colors
    roleAdmin: '#f59e0b',
    roleOfficer: '#818cf8',
    roleWorker: '#34d399',
    roleCitizen: '#22d3ee',
};

// ── Typography ────────────────────────────────────────────────────────────────
export const font = {
    sans: "'Inter', system-ui, -apple-system, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace",

    size: {
        xs: '0.7rem',
        sm: '0.8rem',
        base: '0.9rem',
        md: '1rem',
        lg: '1.25rem',
        xl: '1.5rem',
        '2xl': '1.875rem',
    },

    weight: {
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
        extrabold: 800,
    },

    tracking: {
        tight: '-0.02em',
        normal: '0',
        wide: '0.05em',
        wider: '0.08em',
        widest: '0.12em',
    },

    leading: {
        tight: 1.25,
        normal: 1.5,
        relaxed: 1.7,
    },
};

// ── Spacing (rem scale) ───────────────────────────────────────────────────────
export const space = {
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    8: '2rem',
    10: '2.5rem',
    12: '3rem',
};

// ── Border radius ─────────────────────────────────────────────────────────────
export const radius = {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.25rem',
    full: '9999px',
};

// ── Shadows / glows ───────────────────────────────────────────────────────────
export const shadow = {
    card: '0 4px 32px #00000050',
    accentGlow: '0 0 10px #22d3ee40',
    accentGlowSm: '0 0 6px #22d3ee60',
    successGlow: '0 0 6px #22c55e80',
    dangerGlow: '0 0 10px #ef444430',
};

// ── Transitions ───────────────────────────────────────────────────────────────
export const transition = {
    fast: 'all 0.12s ease',
    normal: 'all 0.2s ease',
};

// ── Role metadata ─────────────────────────────────────────────────────────────
export const roleConfig = {
    citizen: { label: 'Citizen', accentColor: color.roleCitizen },
    officer: { label: 'Field Officer', accentColor: color.roleOfficer },
    worker: { label: 'Field Worker', accentColor: color.roleWorker },
    admin: { label: 'Administrator', accentColor: color.roleAdmin },
};

// ── Shared style factories ────────────────────────────────────────────────────
// Return plain objects for React inline styles.
// These are the canonical definitions — AuthShell.jsx exposes them as components.
export const mk = {
    authPage: () => ({
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: color.bgPage,
        padding: space[4],
        fontFamily: font.sans,
    }),

    authCard: (maxWidth = '420px') => ({
        background: color.bgSurface,
        border: `1px solid ${color.borderDefault}`,
        borderRadius: radius['2xl'],
        padding: space[10],
        width: '100%',
        maxWidth,
        boxShadow: shadow.card,
    }),

    input: ({ hasError = false } = {}) => ({
        background: color.bgInput,
        border: `1px solid ${hasError ? color.danger : color.borderDefault}`,
        borderRadius: radius.md,
        color: color.textPrimary,
        fontSize: font.size.base,
        padding: '0.65rem 0.875rem',
        outline: 'none',
        width: '100%',
        boxSizing: 'border-box',
        transition: transition.fast,
        fontFamily: font.sans,
    }),

    btnPrimary: ({ disabled = false } = {}) => ({
        background: color.accent,
        border: 'none',
        borderRadius: radius.md,
        color: color.accentText,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: font.size.base,
        fontWeight: font.weight.bold,
        padding: `0.75rem ${space[4]}`,
        width: '100%',
        opacity: disabled ? 0.58 : 1,
        transition: transition.fast,
        letterSpacing: font.tracking.wide,
        fontFamily: font.sans,
        marginTop: space[2],
    }),

    btnSecondary: () => ({
        background: 'transparent',
        border: `1px solid ${color.borderDefault}`,
        borderRadius: radius.md,
        color: color.textSecondary,
        cursor: 'pointer',
        fontSize: font.size.base,
        fontWeight: font.weight.medium,
        padding: `0.7rem ${space[4]}`,
        width: '100%',
        transition: transition.fast,
        fontFamily: font.sans,
    }),

    label: () => ({
        fontSize: font.size.sm,
        fontWeight: font.weight.medium,
        color: color.textSecondary,
        letterSpacing: font.tracking.wide,
    }),

    fieldError: () => ({
        fontSize: font.size.xs,
        color: color.danger,
        lineHeight: font.leading.normal,
    }),

    errorBanner: () => ({
        background: color.dangerSurface,
        border: `1px solid ${color.dangerBorder}`,
        borderRadius: radius.md,
        color: '#fca5a5',
        fontSize: font.size.sm,
        padding: `${space[3]} ${space[4]}`,
        marginBottom: space[5],
        lineHeight: font.leading.normal,
    }),

    brandRow: () => ({
        display: 'flex',
        alignItems: 'center',
        gap: space[2],
        marginBottom: space[6],
    }),

    brandDot: (size = '0.55rem') => ({
        width: size,
        height: size,
        borderRadius: radius.full,
        background: color.accent,
        display: 'inline-block',
        boxShadow: shadow.accentGlowSm,
        flexShrink: 0,
    }),

    brandName: () => ({
        fontSize: font.size.sm,
        fontWeight: font.weight.semibold,
        color: color.textSecondary,
        letterSpacing: font.tracking.widest,
        textTransform: 'uppercase',
    }),

    heading: () => ({
        fontSize: font.size['2xl'],
        fontWeight: font.weight.extrabold,
        color: color.textPrimary,
        margin: `0 0 ${space[1]} 0`,
        letterSpacing: font.tracking.tight,
        lineHeight: font.leading.tight,
    }),

    subheading: () => ({
        fontSize: font.size.base,
        color: color.textSecondary,
        margin: `0 0 ${space[6]} 0`,
        lineHeight: font.leading.relaxed,
    }),

    link: () => ({
        color: color.accent,
        textDecoration: 'none',
        fontWeight: font.weight.medium,
    }),

    linkMuted: () => ({
        color: color.textMuted,
        textDecoration: 'none',
    }),

    footerText: () => ({
        fontSize: font.size.sm,
        color: color.textMuted,
        textAlign: 'center',
        marginTop: space[6],
    }),

    fullscreenLoader: () => ({
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: color.bgPage,
        color: color.textSecondary,
        fontFamily: font.sans,
        fontSize: font.size.base,
        letterSpacing: font.tracking.wide,
    }),

    passwordWrapper: () => ({
        position: 'relative',
    }),

    showPasswordBtn: () => ({
        position: 'absolute',
        right: '0.75rem',
        top: '50%',
        transform: 'translateY(-50%)',
        background: 'none',
        border: 'none',
        color: color.textMuted,
        fontSize: font.size.xs,
        cursor: 'pointer',
        padding: space[1],
        fontFamily: font.sans,
    }),
};
