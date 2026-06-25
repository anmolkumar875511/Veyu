// src/pages/auth/UnauthorizedPage.jsx

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { getRoleHome } from '../../guards/RouteGuards.jsx';
import { AuthPage, SecondaryButton, RoleChip } from '../../components/AuthShell.jsx';
import { color, font, radius, space, shadow, mk, roleConfig } from '../../theme/index.js';

export default function UnauthorizedPage() {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const role = user?.role ?? 'citizen';
    const { label: roleLabel, accentColor } = roleConfig[role] ?? {
        label: role,
        accentColor: color.accent,
    };
    const homeRoute = isAuthenticated ? getRoleHome(role) : '/login';

    return (
        <AuthPage>
            {/* Ambient red glow */}
            <div
                aria-hidden="true"
                style={{
                    position: 'fixed',
                    top: '10%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '640px',
                    height: '400px',
                    background: `radial-gradient(ellipse, ${color.dangerDim} 0%, transparent 65%)`,
                    pointerEvents: 'none',
                    zIndex: 0,
                }}
            />

            <div
                style={{
                    ...mk.authCard('460px'),
                    position: 'relative',
                    zIndex: 1,
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: space[5],
                    padding: `${space[12]} ${space[10]}`,
                }}
            >
                {/* 403 status row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: space[3] }}>
                    <span
                        style={{
                            fontSize: font.size.base,
                            fontWeight: font.weight.bold,
                            color: color.danger,
                            letterSpacing: font.tracking.widest,
                            fontFamily: 'monospace',
                        }}
                    >
                        403
                    </span>
                    <span
                        style={{
                            width: '1px',
                            height: '1rem',
                            background: color.borderDefault,
                            display: 'inline-block',
                        }}
                    />
                    <span
                        style={{
                            fontSize: font.size.sm,
                            color: color.textMuted,
                            letterSpacing: font.tracking.wider,
                            textTransform: 'uppercase',
                        }}
                    >
                        Forbidden
                    </span>
                </div>

                {/* Icon */}
                <svg width="60" height="60" viewBox="0 0 60 60" fill="none" aria-hidden="true">
                    <circle cx="30" cy="30" r="28" stroke={color.borderDefault} strokeWidth="1.5" />
                    <circle
                        cx="30"
                        cy="30"
                        r="28"
                        stroke={color.danger}
                        strokeWidth="1.5"
                        strokeDasharray="65 115"
                        strokeLinecap="round"
                        opacity="0.7"
                    />
                    <path
                        d="M30 19v15"
                        stroke={color.danger}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                    />
                    <circle cx="30" cy="39.5" r="1.75" fill={color.danger} />
                </svg>

                {/* Heading */}
                <div>
                    <h1
                        style={{
                            fontSize: font.size['2xl'],
                            fontWeight: font.weight.extrabold,
                            color: color.textPrimary,
                            letterSpacing: font.tracking.tight,
                            margin: `0 0 ${space[2]} 0`,
                        }}
                    >
                        Access Denied
                    </h1>
                    <p style={{ fontSize: font.size.base, color: color.textSecondary, margin: 0 }}>
                        You don&apos;t have permission to view this page.
                    </p>
                </div>

                {/* User badge */}
                {isAuthenticated && user && (
                    <div
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: space[2],
                            background: color.bgInput,
                            border: `1px solid ${color.borderSubtle}`,
                            borderRadius: radius.full,
                            padding: `0.4rem 1rem`,
                            fontSize: font.size.xs,
                        }}
                    >
                        <span
                            style={{
                                width: '0.4rem',
                                height: '0.4rem',
                                borderRadius: radius.full,
                                background: color.success,
                                boxShadow: shadow.successGlow,
                                display: 'inline-block',
                                flexShrink: 0,
                            }}
                        />
                        <span style={{ color: color.textSecondary }}>
                            Signed in as{' '}
                            <strong
                                style={{
                                    color: color.textPrimary,
                                    fontWeight: font.weight.semibold,
                                }}
                            >
                                {user.name}
                            </strong>
                            {' · '}
                            <RoleChip label={roleLabel} accentColor={accentColor} />
                        </span>
                    </div>
                )}

                {/* Explanation */}
                <p
                    style={{
                        fontSize: font.size.sm,
                        color: color.textMuted,
                        lineHeight: 1.65,
                        maxWidth: '320px',
                        margin: 0,
                    }}
                >
                    This section is restricted to a different role. If you believe this is a
                    mistake, contact your administrator.
                </p>

                {/* Actions */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: space[3],
                        width: '100%',
                    }}
                >
                    <button
                        onClick={() => navigate(homeRoute, { replace: true })}
                        style={mk.btnPrimary({ disabled: false })}
                    >
                        Take me home
                    </button>
                    <SecondaryButton onClick={() => navigate(-1)}>Go back</SecondaryButton>
                </div>

                {/* Brand footer */}
                <div style={{ display: 'flex', alignItems: 'center', gap: space[2] }}>
                    <span style={{ ...mk.brandDot('0.4rem'), opacity: 0.45 }} />
                    <span
                        style={{
                            ...mk.brandName(),
                            fontSize: font.size.xs,
                            color: color.textMuted,
                        }}
                    >
                        Veyu
                    </span>
                </div>
            </div>
        </AuthPage>
    );
}
