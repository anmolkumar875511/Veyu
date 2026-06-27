// src/pages/auth/ProfilePage.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Available to all authenticated roles via /profile.
// Covers:
//   PATCH /users/me        — update name, phone, avatar URL
//   PATCH /auth/password   — change password (invalidates session)
// ─────────────────────────────────────────────────────────────────────────────

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

    // ── Password form ─────────────────────────────────────────────────────────
    const [curPass, setCurPass] = useState('');
    const [newPass, setNewPass] = useState('');
    const [changing, setChanging] = useState(false);
    const [passErr, setPassErr] = useState(null);

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
            // Password change invalidates session — log out and redirect to login
            await logout();
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

                {/* Back link */}
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

                {/* ── Profile section ──────────────────────────────────────── */}
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

                    {/* Role + reputation display */}
                    <div style={{ display: 'flex', gap: space[4] }}>
                        {[
                            { label: 'Role', value: user?.role ?? '—' },
                            { label: 'Reputation', value: `${user?.reputationScore ?? 0} pts` },
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

                <div style={divider} />

                {/* ── Change password section ───────────────────────────────── */}
                <h2 style={sectionHead}>Change password</h2>
                <p
                    style={{
                        fontSize: font.size.sm,
                        color: color.textMuted,
                        margin: `0 0 ${space[4]} 0`,
                    }}
                >
                    You'll be logged out after changing your password.
                </p>

                <ErrorBanner message={passErr} />

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
                            ...mk.btnPrimary({ disabled: changing || !curPass || !newPass }),
                            background: color.danger,
                        }}
                    >
                        {changing ? 'Updating…' : 'Update password'}
                    </button>
                </form>
            </AuthCard>
        </AuthPage>
    );
}
