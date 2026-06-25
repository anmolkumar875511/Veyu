// src/pages/auth/RegisterPage.jsx

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

const INITIAL_FORM = { name: '', email: '', phone: '', password: '' };

function validateClient(form) {
    const errs = {};
    if (!form.name.trim() || form.name.trim().length < 2)
        errs.name = 'Enter your full name (at least 2 characters).';
    if (!form.email || !/^\S+@\S+\.\S+$/.test(form.email))
        errs.email = 'Enter a valid email address.';
    if (!form.password || form.password.length < 6)
        errs.password = 'Password must be at least 6 characters.';
    if (form.phone && !/^[6-9]\d{9}$/.test(form.phone))
        errs.phone = 'Enter a valid 10-digit Indian mobile number.';
    return errs;
}

export default function RegisterPage() {
    const { register, isLoading, error, clearError, user } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState(INITIAL_FORM);
    const [fieldErrors, setFieldErrors] = useState({});

    function handleChange(e) {
        if (error) clearError();
        const { name, value } = e.target;
        setForm((f) => ({ ...f, [name]: value }));
        if (fieldErrors[name]) {
            setFieldErrors((fe) => {
                const n = { ...fe };
                delete n[name];
                return n;
            });
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const clientErrors = validateClient(form);
        if (Object.keys(clientErrors).length > 0) {
            setFieldErrors(clientErrors);
            return;
        }

        const payload = { name: form.name.trim(), email: form.email, password: form.password };
        if (form.phone) payload.phone = form.phone;

        const result = await register(payload);
        if (result.success) {
            // ✅ FIX: use role from auth state, not hardcoded 'citizen'
            navigate(getRoleHome(user?.role ?? 'citizen'), { replace: true });
        }
    }

    return (
        <AuthPage>
            <AuthCard maxWidth="440px">
                <BrandMark />
                <AuthHeading
                    title="Join your city"
                    subtitle="Report issues. Track resolution. Build accountability."
                />
                <ErrorBanner message={error} />

                <form
                    onSubmit={handleSubmit}
                    style={{ display: 'flex', flexDirection: 'column', gap: space[4] }}
                    noValidate
                >
                    <FormField label="Full name" htmlFor="name" error={fieldErrors.name}>
                        <TextInput
                            id="name"
                            name="name"
                            type="text"
                            autoComplete="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="Anmol Kumar"
                            hasError={!!fieldErrors.name}
                        />
                    </FormField>

                    <FormField label="Email address" htmlFor="email" error={fieldErrors.email}>
                        <TextInput
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="you@example.com"
                            hasError={!!fieldErrors.email}
                        />
                    </FormField>

                    <FormField
                        label="Mobile number"
                        htmlFor="phone"
                        error={fieldErrors.phone}
                        optional
                    >
                        <TextInput
                            id="phone"
                            name="phone"
                            type="tel"
                            autoComplete="tel"
                            value={form.phone}
                            onChange={handleChange}
                            placeholder="9876543210"
                            hasError={!!fieldErrors.phone}
                        />
                    </FormField>

                    <FormField label="Password" htmlFor="password" error={fieldErrors.password}>
                        <PasswordInput
                            id="password"
                            name="password"
                            autoComplete="new-password"
                            value={form.password}
                            onChange={handleChange}
                            placeholder="At least 6 characters"
                            hasError={!!fieldErrors.password}
                        />
                    </FormField>

                    <PrimaryButton loading={isLoading} loadingText="Creating account…">
                        Create account
                    </PrimaryButton>
                </form>

                <p
                    style={{
                        fontSize: font.size.xs,
                        color: color.textMuted,
                        textAlign: 'center',
                        marginTop: space[4],
                        lineHeight: 1.6,
                    }}
                >
                    By registering you agree to Veyu&apos;s community guidelines.
                </p>

                <p style={mk.footerText()}>
                    Already have an account?{' '}
                    <Link to="/login" style={mk.link()}>
                        Sign in
                    </Link>
                </p>
            </AuthCard>
        </AuthPage>
    );
}
