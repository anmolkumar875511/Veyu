// ─────────────────────────────────────────────────────────────────────────────
// src/pages/auth/UnauthorizedPage.jsx
//
// Shown when an authenticated user tries to access a route their role
// doesn't permit (e.g. a citizen hitting /war-room).
//
// Behavior:
//   - If NOT authenticated → redirect to /login
//   - If authenticated with wrong role → show this page
//   - "Take me home" button → role-aware home page
//   - "Go back" button → browser history back
// ─────────────────────────────────────────────────────────────────────────────

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { getRoleHome } from '../../guards/RouteGuards.jsx';

// Role display labels shown in the "you are logged in as" line
const ROLE_LABELS = {
    citizen: 'Citizen',
    officer: 'Field Officer',
    worker: 'Field Worker',
    admin: 'Administrator',
};

export default function UnauthorizedPage() {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const roleLabel = ROLE_LABELS[user?.role] ?? user?.role ?? 'Unknown';
    const homeRoute = isAuthenticated ? getRoleHome(user?.role) : '/login';

    return (
        <div style={s.page}>
            {/* Ambient glow */}
            <div style={s.glow} aria-hidden="true" />

            <div style={s.card}>
                {/* Error code */}
                <div style={s.codeRow}>
                    <span style={s.code}>403</span>
                    <span style={s.codeDivider} />
                    <span style={s.codeLabel}>Forbidden</span>
                </div>

                {/* Icon */}
                <div style={s.iconWrap} aria-hidden="true">
                    <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                        <circle cx="28" cy="28" r="27" stroke="#334155" strokeWidth="1.5" />
                        <circle
                            cx="28"
                            cy="28"
                            r="27"
                            stroke="#ef4444"
                            strokeWidth="1.5"
                            strokeDasharray="60 110"
                            strokeLinecap="round"
                        />
                        <path
                            d="M28 18v14"
                            stroke="#ef4444"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                        />
                        <circle cx="28" cy="37" r="1.5" fill="#ef4444" />
                    </svg>
                </div>

                {/* Heading */}
                <h1 style={s.heading}>Access Denied</h1>
                <p style={s.sub}>You don&apos;t have permission to view this page.</p>

                {/* User context */}
                {isAuthenticated && user && (
                    <div style={s.userBadge}>
                        <span style={s.userDot} />
                        <span style={s.userText}>
                            Signed in as <strong style={s.userStrong}>{user.name}</strong> ·{' '}
                            <span style={s.roleChip}>{roleLabel}</span>
                        </span>
                    </div>
                )}

                {/* Explanation */}
                <p style={s.explanation}>
                    This section is restricted to a different role. If you believe this is a
                    mistake, contact your administrator.
                </p>

                {/* Actions */}
                <div style={s.actions}>
                    <button
                        onClick={() => navigate(homeRoute, { replace: true })}
                        style={s.btnPrimary}
                    >
                        Take me home
                    </button>
                    <button onClick={() => navigate(-1)} style={s.btnSecondary}>
                        Go back
                    </button>
                </div>

                {/* Nagarik brand mark */}
                <div style={s.brand}>
                    <span style={s.brandDot} />
                    <span style={s.brandName}>Nagarik</span>
                </div>
            </div>
        </div>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
    page: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f172a',
        padding: '1.5rem',
        fontFamily: "'Inter', system-ui, sans-serif",
        position: 'relative',
        overflow: 'hidden',
    },
    glow: {
        position: 'absolute',
        top: '20%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '500px',
        height: '300px',
        background: 'radial-gradient(ellipse, #ef444408 0%, transparent 70%)',
        pointerEvents: 'none',
    },
    card: {
        position: 'relative',
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '1.25rem',
        padding: '3rem 2.5rem',
        width: '100%',
        maxWidth: '440px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.25rem',
    },
    codeRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.875rem',
    },
    code: {
        fontSize: '1rem',
        fontWeight: 700,
        color: '#ef4444',
        letterSpacing: '0.1em',
        fontFamily: 'monospace',
    },
    codeDivider: {
        width: '1px',
        height: '1.1rem',
        background: '#334155',
        display: 'inline-block',
    },
    codeLabel: {
        fontSize: '0.85rem',
        color: '#64748b',
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
    },
    iconWrap: {
        marginTop: '0.25rem',
    },
    heading: {
        fontSize: '1.75rem',
        fontWeight: 800,
        color: '#f8fafc',
        margin: 0,
        letterSpacing: '-0.02em',
    },
    sub: {
        fontSize: '0.9rem',
        color: '#94a3b8',
        margin: 0,
    },
    userBadge: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        background: '#0f172a',
        border: '1px solid #334155',
        borderRadius: '2rem',
        padding: '0.4rem 0.875rem',
        fontSize: '0.78rem',
    },
    userDot: {
        width: '0.45rem',
        height: '0.45rem',
        borderRadius: '50%',
        background: '#22c55e',
        display: 'inline-block',
        flexShrink: 0,
        boxShadow: '0 0 6px #22c55e88',
    },
    userText: {
        color: '#94a3b8',
    },
    userStrong: {
        color: '#e2e8f0',
        fontWeight: 600,
    },
    roleChip: {
        color: '#22d3ee',
        fontWeight: 500,
    },
    explanation: {
        fontSize: '0.82rem',
        color: '#475569',
        lineHeight: 1.6,
        maxWidth: '320px',
        margin: 0,
    },
    actions: {
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
        fontSize: '0.9rem',
        fontWeight: 700,
        padding: '0.75rem',
        cursor: 'pointer',
        letterSpacing: '0.02em',
        transition: 'opacity 0.15s',
    },
    btnSecondary: {
        background: 'transparent',
        border: '1px solid #334155',
        borderRadius: '0.625rem',
        color: '#94a3b8',
        fontSize: '0.875rem',
        fontWeight: 500,
        padding: '0.7rem',
        cursor: 'pointer',
        transition: 'border-color 0.15s, color 0.15s',
    },
    brand: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        marginTop: '0.5rem',
    },
    brandDot: {
        width: '0.45rem',
        height: '0.45rem',
        borderRadius: '50%',
        background: '#22d3ee',
        boxShadow: '0 0 6px #22d3ee66',
        display: 'inline-block',
    },
    brandName: {
        fontSize: '0.75rem',
        fontWeight: 600,
        color: '#475569',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
    },
};
