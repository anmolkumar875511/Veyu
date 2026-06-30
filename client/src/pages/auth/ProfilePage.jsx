// src/pages/auth/ProfilePage.jsx
// Covers: PATCH /users/me + PATCH /auth/password
// Google-only users (no password) see profile edit but not password change.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser, useLogout } from '../../hooks/useAuthGuards.js';
import { updateMyProfileApi, parseUserError } from '../../api/user.api.js';
import { changePasswordApi } from '../../api/auth.api.js';
import { getRoleHome } from '../../guards/RouteGuards.jsx';
import {
    AuthPage,
    AuthCard,
    BrandMark,
    ErrorBanner,
    FormField,
    TextInput,
    PrimaryButton,
} from '../../components/auth/AuthShell.jsx';
import { color, font, space, radius, mk } from '../../theme/index.js';

export default function ProfilePage() {
    const user = useCurrentUser();
    const logout = useLogout();
    const navigate = useNavigate();

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

    const sectionHead = {
        fontSize: font.size.base,
        fontWeight: font.weight.bold,
        color: color.textPrimary,
        margin: `0 0 ${space[4]} 0`,
    };
    const divider = { height: '1px', background: color.borderFaint, margin: `${space[6]} 0` };

    return (
        <AuthPage>
            <AuthCard maxWidth="480px">
                <BrandMark />

                <button
                    onClick={() => navigate(getRoleHome(user?.role))}
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
                    ← Back to dashboard
                </button>

                <h1
                    style={{
                        fontSize: '1.3rem',
                        fontWeight: font.weight.extrabold,
                        color: color.textPrimary,
                        margin: `0 0 ${space[6]} 0`,
                    }}
                >
                    My Profile
                </h1>

                {/* ── Profile ──────────────────────────────────────────────── */}
                <h2 style={sectionHead}>Account details</h2>

                <ErrorBanner message={profileErr} />
                {profileOk && (
                    <p
                        style={{
                            fontSize: font.size.sm,
                            color: color.success,
                            margin: `0 0 ${space[3]} 0`,
                        }}
                    >
                        ✓ Profile updated.
                    </p>
                )}

                {/* Google badge */}
                {user?.googleId && (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: space[2],
                            background: color.bgPage,
                            border: `1px solid ${color.borderFaint}`,
                            borderRadius: radius.md,
                            padding: `${space[2]} ${space[3]}`,
                            marginBottom: space[4],
                            fontSize: font.size.xs,
                            color: color.textSecondary,
                        }}
                    >
                        <GoogleIcon size={14} />
                        Signed in with Google
                    </div>
                )}

                <form
                    onSubmit={handleProfileSave}
                    style={{ display: 'flex', flexDirection: 'column', gap: space[4] }}
                    noValidate
                >
                    <FormField label="Full name" htmlFor="name">
                        <TextInput
                            id="name"
                            type="text"
                            autoComplete="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your name"
                        />
                    </FormField>

                    <FormField label="Mobile number" htmlFor="phone" optional>
                        <TextInput
                            id="phone"
                            type="tel"
                            autoComplete="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="10-digit Indian mobile number"
                        />
                    </FormField>

                    <FormField label="Avatar URL" htmlFor="avatar" optional>
                        <TextInput
                            id="avatar"
                            type="url"
                            value={avatar}
                            onChange={(e) => setAvatar(e.target.value)}
                            placeholder="https://…"
                        />
                        {avatar && (
                            <img
                                src={avatar}
                                alt="Avatar preview"
                                style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: radius.full,
                                    objectFit: 'cover',
                                    marginTop: space[2],
                                }}
                                onError={(e) => (e.target.style.display = 'none')}
                            />
                        )}
                    </FormField>

                    <div style={{ display: 'flex', gap: space[4] }}>
                        {[
                            { label: 'Role', value: user?.role ?? '—' },
                            { label: 'Reputation', value: `${user?.reputationScore ?? 0} pts` },
                            {
                                label: 'Status',
                                value: user?.isVerified ? 'Verified' : 'Unverified',
                            },
                        ].map(({ label, value }) => (
                            <div
                                key={label}
                                style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}
                            >
                                <span
                                    style={{
                                        fontSize: '0.68rem',
                                        color: color.textMuted,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.06em',
                                    }}
                                >
                                    {label}
                                </span>
                                <span
                                    style={{
                                        fontSize: font.size.base,
                                        fontWeight: font.weight.semibold,
                                        color: color.textPrimary,
                                        textTransform: 'capitalize',
                                    }}
                                >
                                    {value}
                                </span>
                            </div>
                        ))}
                    </div>

                    <PrimaryButton loading={saving} loadingText="Saving…">
                        Save changes
                    </PrimaryButton>
                </form>

                {/* ── Change password — hidden for Google-only accounts ──────── */}
                {isGoogleOnly ? (
                    <>
                        <div style={divider} />
                        <div
                            style={{
                                background: color.bgPage,
                                border: `1px solid ${color.borderFaint}`,
                                borderRadius: radius.md,
                                padding: `${space[4]}`,
                                fontSize: font.size.sm,
                                color: color.textMuted,
                                lineHeight: 1.6,
                            }}
                        >
                            🔒 Your account uses Google sign-in. Password management is handled by
                            Google.
                        </div>
                    </>
                ) : (
                    <>
                        <div style={divider} />
                        <h2 style={sectionHead}>Change password</h2>
                        <p
                            style={{
                                fontSize: font.size.sm,
                                color: color.textMuted,
                                margin: `0 0 ${space[4]} 0`,
                            }}
                        >
                            You'll be signed out after changing your password.
                        </p>

                        <ErrorBanner message={passErr} />
                        {passOk && (
                            <p style={{ fontSize: font.size.sm, color: color.success, margin: 0 }}>
                                ✓ Password updated. Signing you out…
                            </p>
                        )}

                        <form
                            onSubmit={handlePasswordChange}
                            style={{ display: 'flex', flexDirection: 'column', gap: space[4] }}
                            noValidate
                        >
                            <FormField label="Current password" htmlFor="curPass">
                                <TextInput
                                    id="curPass"
                                    type="password"
                                    autoComplete="current-password"
                                    value={curPass}
                                    onChange={(e) => setCurPass(e.target.value)}
                                    placeholder="••••••••"
                                />
                            </FormField>

                            <FormField label="New password" htmlFor="newPass">
                                <TextInput
                                    id="newPass"
                                    type="password"
                                    autoComplete="new-password"
                                    value={newPass}
                                    onChange={(e) => setNewPass(e.target.value)}
                                    placeholder="At least 6 characters"
                                />
                            </FormField>

                            <button
                                type="submit"
                                disabled={changing || !curPass || !newPass}
                                style={{
                                    ...mk.btnPrimary({
                                        disabled: changing || !curPass || !newPass,
                                    }),
                                    background: color.danger,
                                }}
                            >
                                {changing ? 'Updating…' : 'Update password'}
                            </button>
                        </form>
                    </>
                )}
            </AuthCard>
        </AuthPage>
    );
}

function GoogleIcon({ size = 16 }) {
    return (
        <svg
            width={size}
            height={size}
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
