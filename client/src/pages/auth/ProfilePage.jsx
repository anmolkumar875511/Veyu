// src/pages/auth/ProfilePage.jsx
// Covers: PATCH /users/me + PATCH /auth/password
// Google-only users (no password) see profile edit but not password change.
//
// Lives inside the same sidebar shell as every other authenticated page for
// this role — previously this dropped the user into a bare, chrome-less
// auth-card layout (as if they'd been signed out), which felt broken coming
// from a sidebar link. The nav below mirrors each role's real shell exactly.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    CheckCircle2,
    Lock,
    Shield,
    UserCircle,
    LayoutDashboard,
    Map,
    ClipboardList,
    Radio,
    Zap,
    MapPinned,
    Users,
    UserPlus,
    Camera,
    Eye,
    EyeOff,
    Loader2,
} from 'lucide-react';
import { useCurrentUser, useLogout } from '../../hooks/useAuthGuards.js';
import { updateMyProfileApi, parseUserError } from '../../api/user.api.js';
import { changePasswordApi } from '../../api/auth.api.js';
import { getRoleHome } from '../../guards/RouteGuards.jsx';
import { getRoleTheme } from '../../lib/roleTheme';
import { VEYU_CITY_NAME } from '../../config/mapStyle.js';
import { Sidebar } from '../../components/layout/Sidebar.jsx';
import { SidebarToggle } from '../../components/layout/SidebarToggle.jsx';
import { useSidebar } from '../../components/layout/SidebarContext.jsx';
import { Footer } from '../../components/layout/Footer.jsx';
import { ThemeToggle } from '../../components/ui/ThemeToggle.jsx';
import { NotificationBell } from '../../components/shared/NotificationBell.jsx';
import { GoogleIcon } from '../../components/AuthShell.jsx';
import { cn } from '../../lib/utils';

// ── Per-role nav, mirroring each domain shell exactly ───────────────────────────
function navForRole(role) {
    if (role === 'admin') {
        return {
            accent: 'amber',
            roleLabel: 'Admin',
            items: [
                { to: '/war-room', label: 'War Room', icon: Radio },
                { to: '/admin/wards', label: 'Wards', icon: MapPinned },
                { to: '/admin/users', label: 'Users', icon: Users },
                { to: '/admin/staff', label: 'Add staff', icon: UserPlus },
                { to: '/forecasts', label: 'SilentSignal', icon: Zap },
                { to: '/reports', label: 'Reports', icon: ClipboardList },
                { to: '/profile', label: 'Profile', icon: UserCircle },
            ],
        };
    }
    if (role === 'officer') {
        return {
            accent: 'violet',
            roleLabel: 'Officer',
            items: [
                { to: '/war-room', label: 'War Room', icon: Radio },
                { to: '/forecasts', label: 'SilentSignal', icon: Zap },
                { to: '/reports', label: 'Reports', icon: ClipboardList },
                { to: '/profile', label: 'Profile', icon: UserCircle },
            ],
        };
    }
    if (role === 'worker') {
        return {
            accent: 'emerald',
            roleLabel: 'Field Worker',
            items: [
                { to: '/tasks', label: 'Tasks', icon: ClipboardList },
                { to: '/observations', label: 'Observations', icon: Camera },
                { to: '/profile', label: 'Profile', icon: UserCircle },
            ],
        };
    }
    return {
        accent: 'primary',
        roleLabel: 'Citizen',
        items: [
            { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { to: '/map', label: 'City Map', icon: Map },
            { to: '/my-reports', label: 'My Reports', icon: ClipboardList },
            { to: '/profile', label: 'Profile', icon: UserCircle },
        ],
    };
}

function SectionCard({ children, className }) {
    return (
        <div className={cn('rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-[var(--shadow-card)] sm:p-6', className)}>
            {children}
        </div>
    );
}

function Field({ label, htmlFor, optional, children }) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor={htmlFor}>
                {label}
                {optional && <span className="ml-1 font-normal text-slate-400 dark:text-slate-500">(optional)</span>}
            </label>
            {children}
        </div>
    );
}

const inputClasses =
    'w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-surface-50 dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition-colors hover:border-slate-300 dark:hover:border-slate-600 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10';

function PasswordField(props) {
    const [visible, setVisible] = useState(false);
    return (
        <div className="relative">
            <input type={visible ? 'text' : 'password'} className={cn(inputClasses, 'pr-11')} {...props} />
            <button
                type="button"
                onClick={() => setVisible((v) => !v)}
                aria-label={visible ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
            >
                {visible ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
            </button>
        </div>
    );
}

function InlineError({ message }) {
    if (!message) return null;
    return (
        <p role="alert" className="rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-700 dark:text-rose-300">
            {message}
        </p>
    );
}

export default function ProfilePage() {
    const user = useCurrentUser();
    const logout = useLogout();
    const navigate = useNavigate();
    const { collapsed } = useSidebar();
    const nav = navForRole(user?.role);
    const roleTheme = getRoleTheme(user?.role);

    // ── Profile form ──────────────────────────────────────────────────────────
    const [name, setName] = useState(user?.name ?? '');
    const [phone, setPhone] = useState(user?.phone ?? '');
    const [avatar, setAvatar] = useState(user?.avatar ?? '');
    const [saving, setSaving] = useState(false);
    const [profileErr, setProfileErr] = useState(null);
    const [profileOk, setProfileOk] = useState(false);

    async function handleProfileSave(e) {
        e.preventDefault();
        setSaving(true);
        setProfileErr(null);
        setProfileOk(false);
        try {
            await updateMyProfileApi({
                name: name.trim() || undefined,
                phone: phone.trim() || undefined,
                avatar: avatar.trim() || undefined,
            });
            setProfileOk(true);
            setTimeout(() => setProfileOk(false), 3000);
        } catch (err) {
            setProfileErr(parseUserError(err));
        } finally {
            setSaving(false);
        }
    }

    // ── Change password (hidden for Google-only accounts) ─────────────────────
    const isGoogleOnly = !!user?.googleId && !user?.hasPassword;

    const [curPass, setCurPass] = useState('');
    const [newPass, setNewPass] = useState('');
    const [changing, setChanging] = useState(false);
    const [passErr, setPassErr] = useState(null);
    const [passOk, setPassOk] = useState(false);

    async function handlePasswordChange(e) {
        e.preventDefault();
        if (newPass.length < 6) {
            setPassErr('New password must be at least 6 characters.');
            return;
        }
        setChanging(true);
        setPassErr(null);
        try {
            await changePasswordApi({ currentPassword: curPass, newPassword: newPass });
            setPassOk(true);
            setTimeout(async () => {
                await logout();
            }, 1500);
        } catch (err) {
            setPassErr(err.response?.data?.message ?? 'Could not change password.');
            setChanging(false);
        }
    }

    const wardLabel = user?.assignedWard
        ? `Ward ${user.assignedWard.wardNumber}${user.assignedWard.name ? `: ${user.assignedWard.name}` : ''}`
        : 'Unassigned';
    const statusTile = { label: 'Status', value: user?.isActive === false ? 'Inactive' : 'Active' };

    const stats =
        user?.role === 'citizen'
            ? [
                  { label: 'Role', value: nav.roleLabel },
                  { label: 'Reputation', value: `${user?.reputationScore ?? 0} pts` },
                  { label: 'Status', value: user?.isVerified ? 'Verified' : 'Unverified' },
              ]
            : user?.role === 'worker'
              ? [
                    { label: 'Role', value: nav.roleLabel },
                    { label: 'Field score', value: `${user?.fieldPoints ?? 0} pts` },
                    { label: 'Assigned ward', value: wardLabel },
                    statusTile,
                ]
              : user?.role === 'officer'
                ? [
                      { label: 'Role', value: nav.roleLabel },
                      { label: 'Assigned ward', value: wardLabel },
                      statusTile,
                  ]
                : [
                      // admin — scoped to the whole city, not a single ward
                      { label: 'Role', value: nav.roleLabel },
                      { label: 'City', value: VEYU_CITY_NAME },
                      statusTile,
                  ];

    return (
        <div className="min-h-screen bg-surface-50 dark:bg-slate-950 text-slate-900 dark:text-white">
            <Sidebar items={nav.items} accent={nav.accent} roleLabel={nav.roleLabel} />
            <div className={cn('flex min-h-screen flex-col transition-[padding] duration-200', collapsed ? 'lg:pl-[76px]' : 'lg:pl-64')}>
                <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/80 backdrop-blur-md px-4 sm:px-6">
                    <div className="flex items-center gap-2">
                        <SidebarToggle />
                        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Settings</span>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-5">
                        <NotificationBell />
                        <ThemeToggle />
                    </div>
                </header>

                <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 pb-16 sm:px-6">
                    {/* ── Identity header ──────────────────────────────────────── */}
                    <div className="flex flex-wrap items-center gap-5">
                        <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full text-xl font-bold text-white shadow-[var(--shadow-card)]">
                            {avatar ? (
                                <img src={avatar} alt="" className="size-full object-cover" onError={(e) => (e.target.style.display = 'none')} />
                            ) : (
                                <span className={cn('flex size-full items-center justify-center bg-gradient-to-br', roleTheme.gradient)}>
                                    {(user?.name ?? '?').charAt(0).toUpperCase()}
                                </span>
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h1 className="truncate text-xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                                {user?.name ?? 'Your account'}
                            </h1>
                            <p className="truncate text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
                        </div>
                        <button
                            onClick={() => navigate(getRoleHome(user?.role))}
                            className="ml-auto shrink-0 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors hover:bg-surface-50 dark:hover:bg-slate-800"
                        >
                            Back to dashboard
                        </button>
                    </div>

                    {/* ── Stat tiles ───────────────────────────────────────────── */}
                    <div className={cn('grid grid-cols-2 gap-3', stats.length >= 4 ? 'sm:grid-cols-4' : 'sm:grid-cols-3')}>
                        {stats.map(({ label, value }) => (
                            <div key={label} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3">
                                <p className="text-[0.65rem] uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</p>
                                <p className="mt-0.5 truncate text-sm font-bold capitalize text-slate-900 dark:text-white">{value}</p>
                            </div>
                        ))}
                    </div>

                    {/* ── Account details ──────────────────────────────────────── */}
                    <SectionCard className="flex flex-col gap-5">
                        <div>
                            <h2 className="text-base font-bold text-slate-900 dark:text-white">Account details</h2>
                            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                                This is how your name appears on reports and to your ward office.
                            </p>
                        </div>

                        {user?.googleId && (
                            <div className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-surface-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-500 dark:text-slate-400">
                                <GoogleIcon size={14} />
                                Signed in with Google
                            </div>
                        )}

                        <InlineError message={profileErr} />
                        {profileOk && (
                            <p className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="size-4" /> Profile updated.
                            </p>
                        )}

                        <form onSubmit={handleProfileSave} className="flex flex-col gap-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Field label="Full name" htmlFor="name">
                                    <input
                                        id="name"
                                        type="text"
                                        autoComplete="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Your name"
                                        className={inputClasses}
                                    />
                                </Field>

                                <Field label="Mobile number" htmlFor="phone" optional>
                                    <input
                                        id="phone"
                                        type="tel"
                                        autoComplete="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="10-digit Indian mobile number"
                                        className={inputClasses}
                                    />
                                </Field>
                            </div>

                            <Field label="Avatar URL" htmlFor="avatar" optional>
                                <input
                                    id="avatar"
                                    type="url"
                                    value={avatar}
                                    onChange={(e) => setAvatar(e.target.value)}
                                    placeholder="https://…"
                                    className={inputClasses}
                                />
                            </Field>

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex h-10 items-center justify-center gap-2 rounded-lg bg-primary-600 px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-primary-300"
                                >
                                    {saving && <Loader2 className="size-4 animate-spin" />}
                                    {saving ? 'Saving…' : 'Save changes'}
                                </button>
                            </div>
                        </form>
                    </SectionCard>

                    {/* ── Security ─────────────────────────────────────────────── */}
                    <SectionCard className="flex flex-col gap-5">
                        <div className="flex items-center gap-2">
                            <Shield className="size-4 text-slate-400 dark:text-slate-500" />
                            <h2 className="text-base font-bold text-slate-900 dark:text-white">Security</h2>
                        </div>

                        {isGoogleOnly ? (
                            <div className="flex items-start gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-surface-50 dark:bg-slate-950 p-4 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                                <Lock className="mt-0.5 size-4 shrink-0 text-slate-400 dark:text-slate-500" />
                                Your account uses Google sign-in. Password management is handled by Google.
                            </div>
                        ) : (
                            <>
                                <p className="-mt-2 text-sm text-slate-500 dark:text-slate-400">
                                    You&apos;ll be signed out after changing your password.
                                </p>

                                <InlineError message={passErr} />
                                {passOk && (
                                    <p className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
                                        <CheckCircle2 className="size-4" /> Password updated. Signing you out…
                                    </p>
                                )}

                                <form onSubmit={handlePasswordChange} className="flex flex-col gap-4">
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <Field label="Current password" htmlFor="curPass">
                                            <PasswordField
                                                id="curPass"
                                                autoComplete="current-password"
                                                value={curPass}
                                                onChange={(e) => setCurPass(e.target.value)}
                                                placeholder="••••••••"
                                            />
                                        </Field>

                                        <Field label="New password" htmlFor="newPass">
                                            <PasswordField
                                                id="newPass"
                                                autoComplete="new-password"
                                                value={newPass}
                                                onChange={(e) => setNewPass(e.target.value)}
                                                placeholder="At least 6 characters"
                                            />
                                        </Field>
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={changing || !curPass || !newPass}
                                            className="flex h-10 items-center justify-center rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-500/10 px-5 text-sm font-semibold text-rose-600 dark:text-rose-300 transition-colors hover:bg-rose-100 dark:hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {changing ? 'Updating…' : 'Update password'}
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}
                    </SectionCard>
                </main>
                <Footer />
            </div>
        </div>
    );
}
