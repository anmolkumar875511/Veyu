// src/pages/auth/LoginPage.jsx

import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { getRoleHome } from '../../guards/RouteGuards.jsx';
import {
    AuthPage,
    AuthCard,
    BrandMark,
    AuthHeading,
    ErrorBanner,
    FormField,
    TextInput,
    PasswordInput,
    PrimaryButton,
} from '../../components/AuthShell.jsx';
import { mk, space, font, color } from '../../theme/index.js';

export default function LoginPage() {
    const { login, isLoading, error, clearError, isAuthenticated, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [form, setForm] = useState({ email: '', password: '' });

    // ✅ Full dep array — navigate + location were missing in original
    useEffect(() => {
        if (isAuthenticated && user) {
            const intended = location.state?.from?.pathname;
            navigate(intended ?? getRoleHome(user.role), { replace: true });
        }
    }, [isAuthenticated, user, navigate, location]);

    function handleChange(e) {
        if (error) clearError();
        setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        await login(form.email, form.password);
    }

    return (
        <AuthPage>
            <AuthCard maxWidth="400px">
                <BrandMark />
                <AuthHeading
                    title="Sign in to your city"
                    subtitle="Monitor, report, and resolve civic issues."
                />
                <ErrorBanner message={error} />

                <form
                    onSubmit={handleSubmit}
                    style={{ display: 'flex', flexDirection: 'column', gap: space[5] }}
                    noValidate
                >
                    <FormField label="Email address" htmlFor="email">
                        <TextInput
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={form.email}
                            onChange={handleChange}
                            placeholder="you@example.com"
                        />
                    </FormField>

                    <FormField label="Password" htmlFor="password">
                        <PasswordInput
                            id="password"
                            name="password"
                            autoComplete="current-password"
                            required
                            value={form.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                        />
                    </FormField>

                    <PrimaryButton loading={isLoading} loadingText="Signing in…">
                        Sign in
                    </PrimaryButton>
                </form>

                <p style={mk.footerText()}>
                    New to Veyu?{' '}
                    <Link to="/register" style={mk.link()}>
                        Create an account
                    </Link>
                </p>

                <p style={{ fontSize: font.size.xs, textAlign: 'center', marginTop: space[3] }}>
                    <Link to="/map" style={mk.linkMuted()}>
                        View public city map →
                    </Link>
                </p>
            </AuthCard>
        </AuthPage>
    );
}
