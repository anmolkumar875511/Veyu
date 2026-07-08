// src/pages/auth/RegisterPage.jsx
// Two-step flow: fill form → OTP arrives in email → enter code → logged in.

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { sendOtpApi, getGoogleAuthUrl, parseAuthError } from '../../api/auth.api.js';
import { getRoleHome } from '../../guards/RouteGuards.jsx';
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
} from '../../components/AuthShell.jsx';

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
function OtpScreen({ form, onBack }) {
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
        <AuthSplitShell>
            <button
                onClick={onBack}
                className="mb-5 -ml-1 flex items-center gap-1 self-start rounded-md px-1 py-0.5 text-sm text-slate-500 dark:text-slate-400 transition-colors hover:text-slate-700 dark:hover:text-slate-200"
            >
                <ArrowLeft className="size-4" /> Back
            </button>

            <AuthHeading
                title="Check your email"
                subtitle={`We sent a 6-digit code to ${form.email}. Enter it below to confirm your account.`}
            />

            <ErrorBanner message={error} />

            <form onSubmit={handleVerify} className="flex flex-col gap-5" noValidate>
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Verification code</label>
                    <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        autoFocus
                        autoComplete="one-time-code"
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-surface-50 dark:bg-slate-950 px-3 py-3 text-center font-mono text-2xl font-bold tracking-[0.35em] text-slate-900 dark:text-white outline-none transition-colors focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
                    />
                </div>

                <PrimaryButton loading={loading} loadingText="Verifying…" disabled={code.length !== 6}>
                    Verify &amp; create account
                </PrimaryButton>
            </form>

            <div className="mt-5 flex flex-col items-center gap-2">
                {resendMsg && (
                    <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="size-3.5" /> {resendMsg}
                    </span>
                )}
                <button
                    onClick={handleResend}
                    disabled={resending}
                    className="text-sm font-medium text-primary-600 transition-opacity hover:text-primary-700 disabled:opacity-60"
                >
                    {resending ? 'Sending…' : "Didn't receive it? Resend OTP"}
                </button>
                <p className="text-xs text-slate-400 dark:text-slate-500">Code expires in 10 minutes.</p>
            </div>
        </AuthSplitShell>
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

    if (step === 'otp') {
        return (
            <OtpScreen
                form={{
                    name: form.name.trim(),
                    email: form.email,
                    password: form.password,
                    phone: form.phone || undefined,
                }}
                onBack={() => setStep('form')}
            />
        );
    }

    return (
        <AuthSplitShell>
            <AuthHeading title="Join your city" subtitle="Report issues. Track resolution. Build accountability." />
            <ErrorBanner message={error} />

            <GoogleButton onClick={() => (window.location.href = getGoogleAuthUrl())}>
                Continue with Google
            </GoogleButton>

            <Divider label="or register with email" />

            <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
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

                <FormField label="Mobile number" htmlFor="phone" error={fieldErrors.phone} optional>
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
                    Send verification code
                </PrimaryButton>
            </form>

            <p className="mt-4 text-center text-xs leading-relaxed text-slate-400 dark:text-slate-500">
                By registering you agree to Veyu&apos;s community guidelines.
            </p>

            <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700">
                    Sign in
                </Link>
            </p>
        </AuthSplitShell>
    );
}
