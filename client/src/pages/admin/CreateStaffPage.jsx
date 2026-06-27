// src/pages/admin/CreateStaffPage.jsx
// Covers: POST /auth/staff — admin creates officer or worker accounts.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createStaffApi } from '../../api/auth.api.js';
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
} from '../../components/auth/AuthShell.jsx';
import { color, font, space, radius, mk } from '../../theme/index.js';

const ROLES = ['officer', 'worker'];

export default function CreateStaffPage() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        role: 'officer',
        assignedWard: '',
    });
    const [fieldErrors, setFieldErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [created, setCreated] = useState(null);

    function set(key) {
        return (e) => {
            setForm((f) => ({ ...f, [key]: e.target.value }));
            if (fieldErrors[key])
                setFieldErrors((fe) => {
                    const n = { ...fe };
                    delete n[key];
                    return n;
                });
        };
    }

    function validate() {
        const errs = {};
        if (!form.name.trim() || form.name.trim().length < 2)
            errs.name = 'Name must be at least 2 characters.';
        if (!form.email || !/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Enter a valid email.';
        if (!form.password || form.password.length < 6)
            errs.password = 'Password must be at least 6 characters.';
        if (!ROLES.includes(form.role)) errs.role = 'Select a valid role.';
        if (form.phone && !/^[6-9]\d{9}$/.test(form.phone))
            errs.phone = 'Enter a valid 10-digit Indian mobile number.';
        return errs;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError(null);
        const errs = validate();
        if (Object.keys(errs).length > 0) {
            setFieldErrors(errs);
            return;
        }

        const payload = {
            name: form.name.trim(),
            email: form.email,
            password: form.password,
            role: form.role,
        };
        if (form.phone) payload.phone = form.phone;
        if (form.assignedWard) payload.assignedWard = form.assignedWard.trim();

        setSubmitting(true);
        try {
            const result = await createStaffApi(payload);
            setCreated(result.user);
        } catch (err) {
            setError(err.response?.data?.message ?? 'Could not create staff account.');
        } finally {
            setSubmitting(false);
        }
    }

    if (created) {
        return (
            <AuthPage>
                <AuthCard maxWidth="420px">
                    <BrandMark />
                    <div
                        style={{
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: space[4],
                            alignItems: 'center',
                        }}
                    >
                        <span style={{ fontSize: '2.5rem' }}>✅</span>
                        <h2
                            style={{
                                fontSize: '1.2rem',
                                fontWeight: font.weight.extrabold,
                                color: color.textPrimary,
                                margin: 0,
                            }}
                        >
                            Account created
                        </h2>
                        <div
                            style={{
                                background: color.bgPage,
                                borderRadius: radius.lg,
                                padding: space[4],
                                width: '100%',
                                border: `1px solid ${color.borderFaint}`,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: space[2],
                                textAlign: 'left',
                            }}
                        >
                            {[
                                ['Name', created.name],
                                ['Email', created.email],
                                ['Role', created.role],
                            ].map(([k, v]) => (
                                <div
                                    key={k}
                                    style={{ display: 'flex', justifyContent: 'space-between' }}
                                >
                                    <span
                                        style={{ fontSize: font.size.xs, color: color.textMuted }}
                                    >
                                        {k}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: font.size.sm,
                                            color: color.textPrimary,
                                            fontWeight: font.weight.medium,
                                            textTransform: 'capitalize',
                                        }}
                                    >
                                        {v}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: space[3], width: '100%' }}>
                            <button
                                onClick={() => {
                                    setCreated(null);
                                    setForm({
                                        name: '',
                                        email: '',
                                        password: '',
                                        phone: '',
                                        role: 'officer',
                                        assignedWard: '',
                                    });
                                }}
                                style={mk.btnPrimary()}
                            >
                                Create another
                            </button>
                            <button
                                onClick={() => navigate('/admin/users')}
                                style={mk.btnSecondary()}
                            >
                                User list
                            </button>
                        </div>
                    </div>
                </AuthCard>
            </AuthPage>
        );
    }

    return (
        <AuthPage>
            <AuthCard maxWidth="460px">
                <BrandMark />
                <button
                    onClick={() => navigate('/admin/users')}
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
                    ← User list
                </button>
                <AuthHeading
                    title="Create Staff Account"
                    subtitle="Create an officer or field worker account."
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
                            type="text"
                            value={form.name}
                            onChange={set('name')}
                            placeholder="Staff member's name"
                            hasError={!!fieldErrors.name}
                        />
                    </FormField>

                    <FormField label="Email address" htmlFor="email" error={fieldErrors.email}>
                        <TextInput
                            id="email"
                            type="email"
                            value={form.email}
                            onChange={set('email')}
                            placeholder="staff@veyu.in"
                            hasError={!!fieldErrors.email}
                        />
                    </FormField>

                    <FormField label="Role" htmlFor="role" error={fieldErrors.role}>
                        <select
                            id="role"
                            value={form.role}
                            onChange={set('role')}
                            style={{
                                background: color.bgPage,
                                border: `1px solid ${color.borderDefault}`,
                                borderRadius: radius.md,
                                color: color.textPrimary,
                                fontSize: font.size.base,
                                padding: '0.65rem 0.875rem',
                                outline: 'none',
                                width: '100%',
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                            }}
                        >
                            {ROLES.map((r) => (
                                <option key={r} value={r} style={{ textTransform: 'capitalize' }}>
                                    {r.charAt(0).toUpperCase() + r.slice(1)}
                                </option>
                            ))}
                        </select>
                    </FormField>

                    <FormField label="Password" htmlFor="password" error={fieldErrors.password}>
                        <PasswordInput
                            id="password"
                            value={form.password}
                            onChange={set('password')}
                            placeholder="At least 6 characters"
                            hasError={!!fieldErrors.password}
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
                            type="tel"
                            value={form.phone}
                            onChange={set('phone')}
                            placeholder="9876543210"
                            hasError={!!fieldErrors.phone}
                        />
                    </FormField>

                    <FormField label="Ward ID" htmlFor="ward" optional>
                        <TextInput
                            id="ward"
                            type="text"
                            value={form.assignedWard}
                            onChange={set('assignedWard')}
                            placeholder="MongoDB ObjectId of ward (optional)"
                        />
                    </FormField>

                    <PrimaryButton loading={submitting} loadingText="Creating…">
                        Create account
                    </PrimaryButton>
                </form>
            </AuthCard>
        </AuthPage>
    );
}
