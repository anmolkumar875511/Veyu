// src/pages/admin/UserManagement.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Admin-only page. Covers:
//   GET    /users                    — paginated user list with search + role filter
//   GET    /users/:id                — user detail (in drawer)
//   PATCH  /users/:id/active         — activate / deactivate
//   PATCH  /users/:id/role           — change role
//   POST   /forecasts/generate       — manual forecast trigger
//   POST   /forecasts/expire-and-score — manual scoring trigger
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import { useCurrentUser, useLogout } from '../../hooks/useAuthGuards.js';
import {
    listUsersApi,
    setUserActiveApi,
    changeUserRoleApi,
    parseUserError,
} from '../../api/user.api.js';
import { generateForecastsApi, expireAndScoreForecastsApi } from '../../api/forecast.api.js';
import {
    PageShell,
    NavBar,
    NavBrand,
    NavLink,
    NavUser,
    NavLogout,
    ErrorBanner,
    SuccessMsg,
    SkeletonRows,
    Input,
    BtnPrimary,
    ToolBtn,
} from '../../components/admin/AdminShell.jsx';
import { NotificationBell } from '../../components/shared/NotificationBell.jsx';
import { color, font, space, radius, transition } from '../../theme/index.js';

const ROLES = ['citizen', 'officer', 'worker', 'admin'];

const ROLE_COLOR = {
    citizen: color.roleCitizen ?? '#22d3ee',
    officer: '#818cf8',
    worker: '#34d399',
    admin: '#f59e0b',
};

// ── User row ──────────────────────────────────────────────────────────────────
function UserRow({ user, onToggleActive, onRoleChange, busy }) {
    const [roleEdit, setRoleEdit] = useState(false);

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: space[4],
                flexWrap: 'wrap',
                background: color.bgSurface,
                border: `1px solid ${color.borderDefault}`,
                borderRadius: radius.xl,
                padding: `${space[3]} ${space[5]}`,
                opacity: !user.isActive ? 0.55 : 1,
                transition: transition.fast,
            }}
        >
            {/* Avatar stub */}
            <div
                style={{
                    width: '2rem',
                    height: '2rem',
                    borderRadius: radius.full,
                    background: ROLE_COLOR[user.role] + '22',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: font.size.xs,
                    fontWeight: font.weight.bold,
                    color: ROLE_COLOR[user.role],
                }}
            >
                {user.name?.charAt(0).toUpperCase()}
            </div>

            {/* Name + email */}
            <div
                style={{
                    flex: 1,
                    minWidth: '160px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.1rem',
                }}
            >
                <span
                    style={{
                        fontSize: font.size.base,
                        fontWeight: font.weight.semibold,
                        color: color.textPrimary,
                    }}
                >
                    {user.name}
                </span>
                <span style={{ fontSize: font.size.xs, color: color.textMuted }}>{user.email}</span>
                {user.assignedWard && (
                    <span style={{ fontSize: '0.68rem', color: color.textMuted }}>
                        Ward {user.assignedWard.wardNumber}: {user.assignedWard.name}
                    </span>
                )}
            </div>

            {/* Role — inline edit */}
            <div style={{ display: 'flex', alignItems: 'center', gap: space[2] }}>
                {roleEdit ? (
                    <select
                        defaultValue={user.role}
                        autoFocus
                        onBlur={() => setRoleEdit(false)}
                        onChange={(e) => {
                            onRoleChange(user._id, e.target.value);
                            setRoleEdit(false);
                        }}
                        style={{
                            background: color.bgPage,
                            border: `1px solid ${color.accent}`,
                            borderRadius: radius.sm,
                            color: color.textPrimary,
                            fontSize: font.size.xs,
                            padding: '0.25rem 0.5rem',
                            cursor: 'pointer',
                        }}
                    >
                        {ROLES.map((r) => (
                            <option key={r} value={r}>
                                {r}
                            </option>
                        ))}
                    </select>
                ) : (
                    <span
                        onClick={() => setRoleEdit(true)}
                        title="Click to change role"
                        style={{
                            fontSize: font.size.xs,
                            fontWeight: font.weight.bold,
                            padding: '0.2rem 0.55rem',
                            borderRadius: radius.full,
                            color: ROLE_COLOR[user.role],
                            background: ROLE_COLOR[user.role] + '1a',
                            cursor: 'pointer',
                        }}
                    >
                        {user.role}
                    </span>
                )}
            </div>

            {/* Active toggle */}
            <button
                onClick={() => onToggleActive(user._id, !user.isActive)}
                disabled={busy === user._id}
                style={{
                    background: user.isActive ? '#22c55e18' : color.dangerSurface,
                    border: `1px solid ${user.isActive ? '#22c55e44' : color.dangerBorder}`,
                    borderRadius: radius.sm,
                    cursor: 'pointer',
                    color: user.isActive ? color.success : color.danger,
                    fontSize: font.size.xs,
                    fontWeight: font.weight.semibold,
                    padding: '0.3rem 0.65rem',
                    opacity: busy === user._id ? 0.6 : 1,
                }}
            >
                {user.isActive ? 'Active' : 'Inactive'}
            </button>
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function UserManagement() {
    const user = useCurrentUser();
    const logout = useLogout();

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [busy, setBusy] = useState(null);
    const [actionMsg, setActionMsg] = useState(null);
    const [forecastMsg, setForecastMsg] = useState(null);
    const [forecasting, setForecasting] = useState(false);

    const fetchUsers = useCallback(
        async (p = page, s = search, r = roleFilter) => {
            setLoading(true);
            try {
                const params = { page: p, limit: 20 };
                if (s) params.search = s;
                if (r) params.role = r;
                const result = await listUsersApi(params);
                setUsers(result.users ?? []);
                setTotal(result.total ?? 0);
                setTotalPages(result.totalPages ?? 1);
                setError(null);
            } catch {
                setError('Could not load users.');
            } finally {
                setLoading(false);
            }
        },
        [page, search, roleFilter]
    );

    useEffect(() => {
        fetchUsers(page, search, roleFilter);
    }, [page, roleFilter]);

    // Debounced search
    useEffect(() => {
        const t = setTimeout(() => {
            setPage(1);
            fetchUsers(1, search, roleFilter);
        }, 400);
        return () => clearTimeout(t);
    }, [search]);

    async function handleToggleActive(id, isActive) {
        setBusy(id);
        try {
            const result = await setUserActiveApi(id, isActive);
            setUsers((prev) => prev.map((u) => (u._id === id ? result.user : u)));
            setActionMsg(`User ${isActive ? 'activated' : 'deactivated'}.`);
            setTimeout(() => setActionMsg(null), 3000);
        } catch (e) {
            setError(parseUserError(e));
        } finally {
            setBusy(null);
        }
    }

    async function handleRoleChange(id, role) {
        setBusy(id);
        try {
            const result = await changeUserRoleApi(id, role);
            setUsers((prev) => prev.map((u) => (u._id === id ? result.user : u)));
            setActionMsg(`Role updated to ${role}.`);
            setTimeout(() => setActionMsg(null), 3000);
        } catch (e) {
            setError(parseUserError(e));
        } finally {
            setBusy(null);
        }
    }

    async function handleForecastAction(fn, label) {
        setForecasting(true);
        setForecastMsg(null);
        try {
            const result = await fn();
            setForecastMsg(`✓ ${label}: ${JSON.stringify(result).slice(0, 80)}`);
        } catch {
            setForecastMsg(`✗ ${label} failed.`);
        } finally {
            setForecasting(false);
        }
    }

    return (
        <PageShell>
            <NavBar
                left={<NavBrand sub="User Management" />}
                right={
                    <>
                        <NavLink to="/war-room">War Room</NavLink>
                        <NavLink to="/admin/wards">Wards</NavLink>
                        <NotificationBell />
                        <NavUser name={user?.name} />
                        <NavLogout onClick={logout} />
                    </>
                }
            />

            <main
                style={{
                    maxWidth: '860px',
                    margin: '0 auto',
                    padding: `${space[6]} ${space[6]} ${space[16]}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: space[6],
                }}
            >
                {/* Header */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        flexWrap: 'wrap',
                        gap: space[4],
                    }}
                >
                    <div>
                        <h1
                            style={{
                                fontSize: '1.4rem',
                                fontWeight: font.weight.extrabold,
                                color: color.textPrimary,
                                margin: `0 0 ${space[1]} 0`,
                            }}
                        >
                            Users
                        </h1>
                        <p style={{ fontSize: font.size.sm, color: color.textMuted, margin: 0 }}>
                            {loading
                                ? 'Loading…'
                                : `${total} registered user${total !== 1 ? 's' : ''}`}
                        </p>
                    </div>
                </div>

                {/* SilentSignal admin triggers */}
                <div
                    style={{
                        background: color.bgSurface,
                        border: `1px solid ${color.borderDefault}`,
                        borderRadius: radius.xl,
                        padding: `${space[4]} ${space[5]}`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: space[3],
                    }}
                >
                    <span
                        style={{
                            fontSize: font.size.sm,
                            fontWeight: font.weight.semibold,
                            color: color.textSecondary,
                        }}
                    >
                        SilentSignal — Manual Triggers
                    </span>
                    <div
                        style={{
                            display: 'flex',
                            gap: space[3],
                            flexWrap: 'wrap',
                            alignItems: 'center',
                        }}
                    >
                        <ToolBtn
                            onClick={() =>
                                handleForecastAction(generateForecastsApi, 'Generate Forecasts')
                            }
                            disabled={forecasting}
                        >
                            🔮 Generate Forecasts
                        </ToolBtn>
                        <ToolBtn
                            onClick={() =>
                                handleForecastAction(expireAndScoreForecastsApi, 'Expire & Score')
                            }
                            disabled={forecasting}
                        >
                            📊 Expire & Score
                        </ToolBtn>
                        {forecastMsg && (
                            <span
                                style={{
                                    fontSize: font.size.xs,
                                    color: forecastMsg.startsWith('✓')
                                        ? color.success
                                        : color.danger,
                                }}
                            >
                                {forecastMsg}
                            </span>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <div
                    style={{
                        display: 'flex',
                        gap: space[3],
                        flexWrap: 'wrap',
                        alignItems: 'center',
                    }}
                >
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search name or email…"
                        style={{ maxWidth: '260px' }}
                    />
                    <div style={{ display: 'flex', gap: space[2] }}>
                        {['', ...ROLES].map((r) => (
                            <button
                                key={r}
                                onClick={() => {
                                    setRoleFilter(r);
                                    setPage(1);
                                }}
                                style={{
                                    border: `1px solid ${color.borderDefault}`,
                                    borderRadius: radius.full,
                                    fontSize: font.size.xs,
                                    padding: '0.3rem 0.7rem',
                                    cursor: 'pointer',
                                    background: roleFilter === r ? color.bgElevated : 'transparent',
                                    color: roleFilter === r ? color.textPrimary : color.textMuted,
                                    transition: transition.fast,
                                }}
                            >
                                {r || 'All'}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: space[3], alignItems: 'center' }}>
                    <ErrorBanner message={error} />
                    {actionMsg && <SuccessMsg message={actionMsg} />}
                </div>

                {/* List */}
                {loading && <SkeletonRows count={5} height="68px" />}

                {!loading && users.length === 0 && (
                    <p
                        style={{
                            fontSize: font.size.sm,
                            color: color.textMuted,
                            textAlign: 'center',
                            padding: space[8],
                        }}
                    >
                        No users match the current filter.
                    </p>
                )}

                {!loading && users.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: space[2] }}>
                        {users.map((u) => (
                            <UserRow
                                key={u._id}
                                user={u}
                                onToggleActive={handleToggleActive}
                                onRoleChange={handleRoleChange}
                                busy={busy}
                            />
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: space[5] }}>
                        <button
                            onClick={() => setPage((p) => p - 1)}
                            disabled={page <= 1}
                            style={{
                                background: color.bgSurface,
                                border: `1px solid ${color.borderDefault}`,
                                borderRadius: radius.md,
                                color: color.textSecondary,
                                fontSize: font.size.sm,
                                padding: `0.4rem ${space[4]}`,
                                cursor: page <= 1 ? 'not-allowed' : 'pointer',
                                opacity: page <= 1 ? 0.4 : 1,
                            }}
                        >
                            ← Prev
                        </button>
                        <span
                            style={{
                                fontSize: font.size.sm,
                                color: color.textMuted,
                                alignSelf: 'center',
                            }}
                        >
                            {page} / {totalPages}
                        </span>
                        <button
                            onClick={() => setPage((p) => p + 1)}
                            disabled={page >= totalPages}
                            style={{
                                background: color.bgSurface,
                                border: `1px solid ${color.borderDefault}`,
                                borderRadius: radius.md,
                                color: color.textSecondary,
                                fontSize: font.size.sm,
                                padding: `0.4rem ${space[4]}`,
                                cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                                opacity: page >= totalPages ? 0.4 : 1,
                            }}
                        >
                            Next →
                        </button>
                    </div>
                )}
            </main>
        </PageShell>
    );
}
