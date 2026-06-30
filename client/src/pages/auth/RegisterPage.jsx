// src/pages/auth/RegisterPage.jsx
// Two-step flow: fill form → OTP arrives in email → enter code → logged in.

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { sendOtpApi, getGoogleAuthUrl, parseAuthError } from '../../api/auth.api.js';
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
    Divider,
} from '../../components/auth/AuthShell.jsx';
import { mk, space, font, color, radius } from '../../theme/index.js';

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

// ── OTP entry sub-screen ───────────────────────────────────────────────────────
function OtpScreen({ form, onSuccess, onBack }) {
    const { register } = useAuth();
    const navigate = useNavigate();

    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [resending, setResending] = useState(false);
    const [resendMsg, setResendMsg] = useState(null);

    async function handleVerify(e) {
        e.preventDefault();
        if (code.length !== 6) {
            setError('Enter the 6-digit code from your email.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            // Use AuthContext register which calls verifyOtpApi internally
            const result = await register({ ...form, code });
            if (result.success) {
                navigate(getRoleHome('citizen'), { replace: true });
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError(parseAuthError(err));
        } finally {
            setLoading(false);
        }
    }

    async function handleResend() {
        setResending(true);
        setResendMsg(null);
        setError(null);
        try {
            await sendOtpApi(form);
            setResendMsg('New OTP sent — check your inbox.');
        } catch (err) {
            setError(parseAuthError(err));
        } finally {
            setResending(false);
        }
    }

    return (
        <AuthCard maxWidth="420px">
            <BrandMark />
            <button
                onClick={onBack}
                style={{
                    background: 'none',
                    border: 'none',
                    color: color.textMuted,
                    fontSize: font.size.sm,
                    cursor: 'pointer',
                    alignSelf: 'flex-start',
                    padding: 0,
                    marginBottom: space[2],
                }}
            >
                ← Back
            </button>

            <AuthHeading
                title="Check your email"
                subtitle={`We sent a 6-digit code to ${form.email}. Enter it below to confirm your account.`}
            />

            <ErrorBanner message={error} />

            <form
                onSubmit={handleVerify}
                style={{ display: 'flex', flexDirection: 'column', gap: space[5] }}
                noValidate
            >
                {/* OTP input — single large field */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: space[2] }}>
                    <label
                        style={{
                            fontSize: font.size.sm,
                            fontWeight: font.weight.medium,
                            color: color.textSecondary,
                        }}
                    >
                        Verification code
                    </label>
                    <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        style={{
                            background: color.bgPage,
                            border: `1px solid ${color.borderDefault}`,
                            borderRadius: radius.md,
                            color: color.textPrimary,
                            fontSize: '1.75rem',
                            fontWeight: font.weight.bold,
                            fontFamily: 'monospace',
                            letterSpacing: '0.25em',
                            padding: '0.75rem',
                            outline: 'none',
                            width: '100%',
                            boxSizing: 'border-box',
                            textAlign: 'center',
                        }}
                        autoFocus
                        autoComplete="one-time-code"
                    />
                </div>

                <PrimaryButton
                    loading={loading}
                    loadingText="Verifying…"
                    disabled={code.length !== 6}
                >
                    Verify & Create Account
                </PrimaryButton>
            </form>

            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: space[2],
                    marginTop: space[4],
                }}
            >
                {resendMsg && (
                    <span style={{ fontSize: font.size.xs, color: color.success }}>
                        {resendMsg}
                    </span>
                )}
                <button
                    onClick={handleResend}
                    disabled={resending}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: color.accent,
                        fontSize: font.size.sm,
                        cursor: 'pointer',
                        opacity: resending ? 0.6 : 1,
                    }}
                >
                    {resending ? 'Sending…' : "Didn't receive it? Resend OTP"}
                </button>
                <p style={{ fontSize: font.size.xs, color: color.textMuted, margin: 0 }}>
                    Code expires in 10 minutes
                </p>
            </div>
        </AuthCard>
    );
}

// ── Registration form ─────────────────────────────────────────────────────────
export default function RegisterPage() {
    const [form, setForm] = useState(INITIAL_FORM);
    const [fieldErrors, setFieldErrors] = useState({});
    const [sending, setSending] = useState(false);
    const [error, setError] = useState(null);
    const [step, setStep] = useState('form'); // 'form' | 'otp'

    function handleChange(e) {
        const { name, value } = e.target;
        setForm((f) => ({ ...f, [name]: value }));
        if (fieldErrors[name])
            setFieldErrors((fe) => {
                const n = { ...fe };
                delete n[name];
                return n;
            });
        if (error) setError(null);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const errs = validateClient(form);
        if (Object.keys(errs).length > 0) {
            setFieldErrors(errs);
            return;
        }

        setSending(true);
        setError(null);
        try {
            await sendOtpApi({
                name: form.name.trim(),
                email: form.email,
                password: form.password,
                phone: form.phone || undefined,
            });
            setStep('otp');
        } catch (err) {
            setError(parseAuthError(err));
        } finally {
            setSending(false);
        }
    }

    // ── OTP screen ────────────────────────────────────────────────────────────
    if (step === 'otp') {
        return (
            <AuthPage>
                <OtpScreen
                    form={{
                        name: form.name.trim(),
                        email: form.email,
                        password: form.password,
                        phone: form.phone || undefined,
                    }}
                    onBack={() => setStep('form')}
                />
            </AuthPage>
        );
    }

    // ── Registration form ─────────────────────────────────────────────────────
    return (
        <AuthPage>
            <AuthCard maxWidth="440px">
                <BrandMark />
                <AuthHeading
                    title="Join your city"
                    subtitle="Report issues. Track resolution. Build accountability."
                />
                <ErrorBanner message={error} />

                {/* Google OAuth button */}
                <button
                    type="button"
                    onClick={() => (window.location.href = getGoogleAuthUrl())}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: space[3],
                        width: '100%',
                        background: color.bgSurface,
                        border: `1px solid ${color.borderDefault}`,
                        borderRadius: radius.md,
                        color: color.textPrimary,
                        fontSize: font.size.base,
                        fontWeight: font.weight.semibold,
                        padding: '0.7rem',
                        cursor: 'pointer',
                    }}
                >
                    <GoogleIcon />
                    Continue with Google
                </button>

                <Divider label="or register with email" />

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

                    <PrimaryButton loading={sending} loadingText="Sending OTP…">
                        Send Verification Code
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

function GoogleIcon() {
    return (
        <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908C16.658 14.12 17.64 11.84 17.64 9.2z"
                fill="#4285F4"
            />
            <path
                d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
                fill="#34A853"
            />
            <path
                d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
                fill="#FBBC05"
            />
            <path
                d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
                fill="#EA4335"
            />
        </svg>
    );
}
