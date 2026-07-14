// src/pages/admin/CreateStaffPage.jsx
// Covers: POST /auth/staff — admin creates officer or worker accounts.
// Lives inside the admin shell (sidebar + navbar), matching WardManagement
// and UserManagement, instead of the standalone auth-page card used for
// unauthenticated Login/Register — this is an authenticated admin tool, not
// a login-adjacent screen.

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, UserPlus } from 'lucide-react';
import { useCurrentUser } from '../../hooks/useAuthGuards.js';
import { createStaffApi } from '../../api/auth.api.js';
import { listWardsApi } from '../../api/ward.api.js';
import {
    PageShell,
    NavBar,
    NavPageTitle,
    NavUser,
    ErrorBanner,
    Card,
    SectionHeading,
    Input,
    BtnPrimary,
    BtnGhost,
} from '../../components/admin/AdminShell.jsx';
import { NotificationBell } from '../../components/shared/NotificationBell.jsx';

const ROLES = ['officer', 'worker'];

const INITIAL_FORM = { name: '', email: '', password: '', phone: '', role: 'officer', assignedWard: '' };

function Field({ label, htmlFor, error, optional, children }) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor={htmlFor}>
                {label}
                {optional && <span className="ml-1 font-normal text-slate-400 dark:text-slate-500">(optional)</span>}
            </label>
            {children}
            {error && (
                <span role="alert" className="text-xs text-rose-600 dark:text-rose-400">
                    {error}
                </span>
            )}
        </div>
    );
}

export default function CreateStaffPage() {
    const user = useCurrentUser();
    const navigate = useNavigate();

    const [form, setForm] = useState(INITIAL_FORM);
    const [fieldErrors, setFieldErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [created, setCreated] = useState(null);

    const [wards, setWards] = useState([]);
    const [wardsLoading, setWardsLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        listWardsApi()
            .then(({ wards }) => {
                if (!cancelled) setWards(wards ?? []);
            })
            .catch(() => {
                if (!cancelled) setWards([]);
            })
            .finally(() => {
                if (!cancelled) setWardsLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

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
        if (!form.name.trim() || form.name.trim().length < 2) errs.name = 'Name must be at least 2 characters.';
        if (!form.email || !/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Enter a valid email.';
        if (!form.password || form.password.length < 6) errs.password = 'Password must be at least 6 characters.';
        if (!ROLES.includes(form.role)) errs.role = 'Select a valid role.';
        if (form.phone && !/^[6-9]\d{9}$/.test(form.phone)) errs.phone = 'Enter a valid 10-digit Indian mobile number.';
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

        const payload = { name: form.name.trim(), email: form.email, password: form.password, role: form.role };
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

    return (
        <PageShell sidebar>
            <NavBar
                withToggle
                left={<NavPageTitle>Add Staff</NavPageTitle>}
                right={
                    <>
                        <NotificationBell />
                        <NavUser name={user?.name} />
                    </>
                }
            />

            <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6 pb-16 sm:px-6">
                <button
                    onClick={() => navigate('/admin/users')}
                    className="-ml-1 flex w-fit items-center gap-1 rounded-md px-1 py-0.5 text-sm text-slate-500 dark:text-slate-400 transition-colors hover:text-slate-700 dark:hover:text-slate-200"
                >
                    <ArrowLeft className="size-4" /> User list
                </button>

                {created ? (
                    <Card className="items-center gap-4 p-8 text-center">
                        <div className="flex size-14 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/10">
                            <CheckCircle2 className="size-7 text-emerald-500" />
                        </div>
                        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Account created</h2>
                        <div className="flex w-full flex-col gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-surface-50 dark:bg-slate-950 p-4 text-left">
                            {[
                                ['Name', created.name],
                                ['Email', created.email],
                                ['Role', created.role],
                            ].map(([k, v]) => (
                                <div key={k} className="flex justify-between">
                                    <span className="text-xs text-slate-400 dark:text-slate-500">{k}</span>
                                    <span className="text-sm font-medium capitalize text-slate-900 dark:text-white">{v}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex w-full gap-3">
                            <BtnPrimary
                                onClick={() => {
                                    setCreated(null);
                                    setForm(INITIAL_FORM);
                                }}
                            >
                                Create another
                            </BtnPrimary>
                            <BtnGhost onClick={() => navigate('/admin/users')}>User list</BtnGhost>
                        </div>
                    </Card>
                ) : (
                    <Card className="gap-5 p-6 sm:p-7">
                        <div className="flex items-center gap-3">
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                <UserPlus className="size-5" />
                            </span>
                            <SectionHeading title="Create staff account" sub="Add an officer or field worker to Veyu." />
                        </div>

                        <ErrorBanner message={error} />

                        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
                            <Field label="Full name" htmlFor="name" error={fieldErrors.name}>
                                <Input
                                    id="name"
                                    type="text"
                                    value={form.name}
                                    onChange={set('name')}
                                    placeholder="Staff member's name"
                                    className={fieldErrors.name ? 'border-rose-300 focus:border-rose-500' : ''}
                                />
                            </Field>

                            <Field label="Email address" htmlFor="email" error={fieldErrors.email}>
                                <Input
                                    id="email"
                                    type="email"
                                    value={form.email}
                                    onChange={set('email')}
                                    placeholder="staff@veyu.in"
                                    className={fieldErrors.email ? 'border-rose-300 focus:border-rose-500' : ''}
                                />
                            </Field>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Field label="Role" htmlFor="role" error={fieldErrors.role}>
                                    <select
                                        id="role"
                                        value={form.role}
                                        onChange={set('role')}
                                        className="w-full cursor-pointer rounded-lg border border-slate-200 dark:border-slate-800 bg-surface-50 dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none transition-colors hover:border-slate-300 dark:hover:border-slate-600 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
                                    >
                                        {ROLES.map((r) => (
                                            <option key={r} value={r}>
                                                {r.charAt(0).toUpperCase() + r.slice(1)}
                                            </option>
                                        ))}
                                    </select>
                                </Field>

                                <Field label="Mobile number" htmlFor="phone" error={fieldErrors.phone} optional>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        value={form.phone}
                                        onChange={set('phone')}
                                        placeholder="9876543210"
                                        className={fieldErrors.phone ? 'border-rose-300 focus:border-rose-500' : ''}
                                    />
                                </Field>
                            </div>

                            <Field label="Password" htmlFor="password" error={fieldErrors.password}>
                                <Input
                                    id="password"
                                    type="password"
                                    value={form.password}
                                    onChange={set('password')}
                                    placeholder="At least 6 characters"
                                    className={fieldErrors.password ? 'border-rose-300 focus:border-rose-500' : ''}
                                />
                            </Field>

                            <Field label="Ward" htmlFor="ward" optional>
                                <select
                                    id="ward"
                                    value={form.assignedWard}
                                    onChange={set('assignedWard')}
                                    disabled={wardsLoading}
                                    className="w-full cursor-pointer rounded-lg border border-slate-200 dark:border-slate-800 bg-surface-50 dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none transition-colors hover:border-slate-300 dark:hover:border-slate-600 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <option value="">{wardsLoading ? 'Loading wards…' : 'Unassigned'}</option>
                                    {wards.map((ward) => (
                                        <option key={ward._id} value={ward._id}>
                                            Ward {ward.wardNumber}
                                            {ward.name ? ` — ${ward.name}` : ''}
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            <div className="mt-1 flex justify-end">
                                <BtnPrimary type="submit" loading={submitting} loadingText="Creating…">
                                    Create account
                                </BtnPrimary>
                            </div>
                        </form>
                    </Card>
                )}
            </main>
        </PageShell>
    );
}
