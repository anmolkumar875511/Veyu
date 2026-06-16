// ─────────────────────────────────────────────────────────────────────────────
// src/pages/auth/LoginPage.jsx
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { getRoleHome } from '../../guards/RouteGuards.jsx';

export default function LoginPage() {
    const { login, isLoading, error, clearError, isAuthenticated, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [form, setForm] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);

    // Redirect after successful login
    useEffect(() => {
        if (isAuthenticated && user) {
            const intended = location.state?.from?.pathname;
            navigate(intended ?? getRoleHome(user.role), { replace: true });
        }
    }, [isAuthenticated, user]);

    // Clear error when user edits any field
    function handleChange(e) {
        if (error) clearError();
        setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        await login(form.email, form.password);
    }

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                {/* Brand mark */}
                <div style={styles.brand}>
                    <span style={styles.brandDot} />
                    <span style={styles.brandName}>Nagarik</span>
                </div>

                <h1 style={styles.heading}>Sign in to your city</h1>
                <p style={styles.subheading}>Monitor, report, and resolve civic issues.</p>

                {/* Error banner */}
                {error && (
                    <div style={styles.errorBanner} role="alert">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={styles.form} noValidate>
                    <div style={styles.fieldGroup}>
                        <label style={styles.label} htmlFor="email">
                            Email address
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={form.email}
                            onChange={handleChange}
                            style={styles.input}
                            placeholder="you@example.com"
                        />
                    </div>

                    <div style={styles.fieldGroup}>
                        <div style={styles.labelRow}>
                            <label style={styles.label} htmlFor="password">
                                Password
                            </label>
                        </div>
                        <div style={styles.passwordWrapper}>
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="current-password"
                                required
                                value={form.password}
                                onChange={handleChange}
                                style={{ ...styles.input, paddingRight: '2.75rem' }}
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((s) => !s)}
                                style={styles.showPasswordBtn}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? 'Hide' : 'Show'}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{ ...styles.submitBtn, opacity: isLoading ? 0.65 : 1 }}
                    >
                        {isLoading ? 'Signing in…' : 'Sign in'}
                    </button>
                </form>

                <p style={styles.footer}>
                    New to Nagarik?{' '}
                    <Link to="/register" style={styles.link}>
                        Create an account
                    </Link>
                </p>

                {/* Public map link — no login needed */}
                <p style={styles.publicLink}>
                    <Link to="/map" style={styles.linkMuted}>
                        View public city map →
                    </Link>
                </p>
            </div>
        </div>
    );
}

// ── Styles (inline for portability — move to CSS modules in production) ───────
const styles = {
    page: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f172a',
        padding: '1rem',
        fontFamily: "'Inter', system-ui, sans-serif",
    },
    card: {
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '1rem',
        padding: '2.5rem',
        width: '100%',
        maxWidth: '400px',
    },
    brand: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '1.75rem',
    },
    brandDot: {
        width: '0.6rem',
        height: '0.6rem',
        borderRadius: '50%',
        background: '#22d3ee',
        display: 'inline-block',
        boxShadow: '0 0 8px #22d3ee88',
    },
    brandName: {
        fontSize: '0.9rem',
        fontWeight: 600,
        color: '#e2e8f0',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
    },
    heading: {
        fontSize: '1.5rem',
        fontWeight: 700,
        color: '#f8fafc',
        margin: '0 0 0.4rem 0',
    },
    subheading: {
        fontSize: '0.875rem',
        color: '#94a3b8',
        margin: '0 0 1.75rem 0',
    },
    errorBanner: {
        background: '#450a0a',
        border: '1px solid #7f1d1d',
        borderRadius: '0.5rem',
        color: '#fca5a5',
        fontSize: '0.85rem',
        padding: '0.75rem 1rem',
        marginBottom: '1.25rem',
    },
    form: { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
    fieldGroup: { display: 'flex', flexDirection: 'column', gap: '0.375rem' },
    labelRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    label: { fontSize: '0.8rem', fontWeight: 500, color: '#94a3b8' },
    input: {
        background: '#0f172a',
        border: '1px solid #334155',
        borderRadius: '0.5rem',
        color: '#f1f5f9',
        fontSize: '0.9rem',
        padding: '0.65rem 0.875rem',
        outline: 'none',
        width: '100%',
        boxSizing: 'border-box',
        transition: 'border-color 0.15s',
    },
    passwordWrapper: { position: 'relative' },
    showPasswordBtn: {
        position: 'absolute',
        right: '0.75rem',
        top: '50%',
        transform: 'translateY(-50%)',
        background: 'none',
        border: 'none',
        color: '#64748b',
        fontSize: '0.75rem',
        cursor: 'pointer',
        padding: '0.25rem',
    },
    submitBtn: {
        background: '#22d3ee',
        border: 'none',
        borderRadius: '0.5rem',
        color: '#0f172a',
        cursor: 'pointer',
        fontSize: '0.9rem',
        fontWeight: 700,
        padding: '0.75rem',
        marginTop: '0.5rem',
        transition: 'opacity 0.15s',
        letterSpacing: '0.02em',
    },
    footer: {
        fontSize: '0.8rem',
        color: '#64748b',
        textAlign: 'center',
        marginTop: '1.5rem',
    },
    publicLink: {
        fontSize: '0.75rem',
        textAlign: 'center',
        marginTop: '0.75rem',
    },
    link: { color: '#22d3ee', textDecoration: 'none', fontWeight: 500 },
    linkMuted: { color: '#475569', textDecoration: 'none' },
};
