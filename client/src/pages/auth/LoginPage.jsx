// src/pages/auth/LoginPage.jsx

import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { getGoogleAuthUrl } from '../../api/auth.api.js';
import { getRoleHome } from '../../guards/RouteGuards.jsx';
import { ArrowRight } from 'lucide-react';
import {
    AuthSplitShell,
    AuthHeading,
    ErrorBanner,
    FormField,
    TextInput,
    PasswordInput,
    PrimaryButton,
    GoogleButton,
    Divider,
    TrustStrip,
} from '../../components/AuthShell.jsx';

export default function LoginPage() {
    const { login, isLoading, error, clearError, isAuthenticated, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [form, setForm] = useState({ email: '', password: '' });

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
        <AuthSplitShell>
            <AuthHeading title="Welcome back" subtitle="Sign in to monitor, report, and resolve civic issues." />

            <ErrorBanner message={error} />

            <GoogleButton onClick={() => (window.location.href = getGoogleAuthUrl())}>
                Continue with Google
            </GoogleButton>

            <Divider label="or sign in with email" />

            <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
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

            <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
                New to Veyu?{' '}
                <Link to="/register" className="font-semibold text-primary-600 hover:text-primary-700">
                    Create an account
                </Link>
            </p>

            <div className="mt-3 flex items-center justify-center">
                <Link
                    to="/map"
                    className="inline-flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                >
                    View public city map <ArrowRight className="size-3.5" />
                </Link>
            </div>

            <TrustStrip />
        </AuthSplitShell>
    );
}
