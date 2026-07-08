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
import { BarChart3, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useCurrentUser } from '../../hooks/useAuthGuards.js';
import { listUsersApi, setUserActiveApi, changeUserRoleApi, parseUserError } from '../../api/user.api.js';
import { generateForecastsApi, expireAndScoreForecastsApi } from '../../api/forecast.api.js';
import {
    PageShell,
    NavBar,
    NavPageTitle,
    NavUser,
    ErrorBanner,
    SuccessMsg,
    SkeletonRows,
    Input,
    ToolBtn,
} from '../../components/admin/AdminShell.jsx';
import { NotificationBell } from '../../components/shared/NotificationBell.jsx';
import { cn } from '../../lib/utils';

const ROLES = ['citizen', 'officer', 'worker', 'admin'];

const ROLE_TONE = {
    citizen: 'text-sky-600 dark:text-sky-300 bg-sky-50 dark:bg-sky-500/10',
    officer: 'text-violet-600 dark:text-violet-300 bg-violet-50 dark:bg-violet-500/10',
    worker: 'text-emerald-600 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10',
    admin: 'text-amber-600 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10',
};

// ── User row ──────────────────────────────────────────────────────────────────
function UserRow({ user, onToggleActive, onRoleChange, busy }) {
    const [roleEdit, setRoleEdit] = useState(false);
    const tone = ROLE_TONE[user.role] ?? ROLE_TONE.citizen;

    return (
        <div
            className={cn(
                'flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-3.5 transition-opacity',
                !user.isActive && 'opacity-55'
            )}
        >
            {/* Avatar stub */}
            <div className={cn('flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold', tone)}>
                {user.name?.charAt(0).toUpperCase()}
            </div>

            {/* Name + email */}
            <div className="flex min-w-[160px] flex-1 flex-col gap-0.5">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">{user.name}</span>
                <span className="text-xs text-slate-400 dark:text-slate-500">{user.email}</span>
                {user.assignedWard && (
                    <span className="text-[0.68rem] text-slate-400 dark:text-slate-500">
                        Ward {user.assignedWard.wardNumber}: {user.assignedWard.name}
                    </span>
                )}
            </div>

            {/* Role — inline edit */}
            <div className="flex items-center gap-2">
                {roleEdit ? (
                    <select
                        defaultValue={user.role}
                        autoFocus
                        onBlur={() => setRoleEdit(false)}
                        onChange={(e) => {
                            onRoleChange(user._id, e.target.value);
                            setRoleEdit(false);
                        }}
                        className="cursor-pointer rounded-md border border-primary-500 bg-white dark:bg-slate-900 px-2 py-1 text-xs text-slate-900 dark:text-white outline-none"
                    >
                        {ROLES.map((r) => (
                            <option key={r} value={r}>
                                {r}
                            </option>
                        ))}
                    </select>
                ) : (
                    <button
                        onClick={() => setRoleEdit(true)}
                        title="Click to change role"
                        className={cn('rounded-full px-2.5 py-1 text-xs font-bold capitalize transition-opacity hover:opacity-80', tone)}
                    >
                        {user.role}
                    </button>
                )}
            </div>

            {/* Active toggle */}
            <button
                onClick={() => onToggleActive(user._id, !user.isActive)}
                disabled={busy === user._id}
                className={cn(
                    'rounded-md border px-2.5 py-1 text-xs font-semibold transition-opacity',
                    user.isActive
                        ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
                        : 'border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-300',
                    busy === user._id && 'opacity-60'
                )}
            >
                {user.isActive ? 'Active' : 'Inactive'}
            </button>
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function UserManagement() {
    const user = useCurrentUser();

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
    const [forecastOk, setForecastOk] = useState(true);
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, roleFilter]);

    // Debounced search
    useEffect(() => {
        const t = setTimeout(() => {
            setPage(1);
            fetchUsers(1, search, roleFilter);
        }, 400);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
            setForecastOk(true);
            setForecastMsg(`${label}: ${JSON.stringify(result).slice(0, 80)}`);
        } catch {
            setForecastOk(false);
            setForecastMsg(`${label} failed.`);
        } finally {
            setForecasting(false);
        }
    }

    return (
        <PageShell sidebar>
            <NavBar
                withToggle
                left={<NavPageTitle>User Management</NavPageTitle>}
                right={
                    <>
                        <NotificationBell />
                        <NavUser name={user?.name} />
                    </>
                }
            />

            <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 pb-16 sm:px-6 xl:px-10">
                {/* Header */}
                <div>
                    <h1 className="mb-1 text-xl font-extrabold text-slate-900 dark:text-white sm:text-2xl">Users</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{loading ? 'Loading…' : `${total} registered user${total !== 1 ? 's' : ''}`}</p>
                </div>

                {/* SilentSignal admin triggers */}
                <div className="flex flex-col gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-4">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">SilentSignal — Manual Triggers</span>
                    <div className="flex flex-wrap items-center gap-3">
                        <ToolBtn onClick={() => handleForecastAction(generateForecastsApi, 'Generate Forecasts')} disabled={forecasting}>
                            <span className="flex items-center gap-1.5">
                                <Sparkles className="size-3.5" /> Generate Forecasts
                            </span>
                        </ToolBtn>
                        <ToolBtn onClick={() => handleForecastAction(expireAndScoreForecastsApi, 'Expire & Score')} disabled={forecasting}>
                            <span className="flex items-center gap-1.5">
                                <BarChart3 className="size-3.5" /> Expire & Score
                            </span>
                        </ToolBtn>
                        {forecastMsg && (
                            <span className={cn('text-xs', forecastOk ? 'text-emerald-600' : 'text-rose-600')}>{forecastMsg}</span>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
                    <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or email…" className="max-w-[260px]" />
                    <div className="flex flex-wrap gap-2">
                        {['', ...ROLES].map((r) => (
                            <button
                                key={r}
                                onClick={() => {
                                    setRoleFilter(r);
                                    setPage(1);
                                }}
                                className={cn(
                                    'rounded-full border px-3 py-1.5 text-xs capitalize transition-colors',
                                    roleFilter === r ? 'border-slate-300 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:bg-surface-50 dark:hover:bg-slate-800'
                                )}
                            >
                                {r || 'All'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <ErrorBanner message={error} />
                    {actionMsg && <SuccessMsg message={actionMsg} />}
                </div>

                {/* List */}
                {loading && <SkeletonRows count={5} height="68px" />}

                {!loading && users.length === 0 && <p className="p-8 text-center text-sm text-slate-400 dark:text-slate-500">No users match the current filter.</p>}

                {!loading && users.length > 0 && (
                    <div className="flex flex-col gap-2">
                        {users.map((u) => (
                            <UserRow key={u._id} user={u} onToggleActive={handleToggleActive} onRoleChange={handleRoleChange} busy={busy} />
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-5">
                        <button
                            onClick={() => setPage((p) => p - 1)}
                            disabled={page <= 1}
                            className="flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-1.5 text-sm text-slate-600 dark:text-slate-300 transition-colors disabled:cursor-not-allowed disabled:opacity-40 enabled:hover:bg-surface-50 dark:hover:bg-slate-800"
                        >
                            <ChevronLeft className="size-4" /> Prev
                        </button>
                        <span className="text-sm text-slate-400 dark:text-slate-500">
                            {page} / {totalPages}
                        </span>
                        <button
                            onClick={() => setPage((p) => p + 1)}
                            disabled={page >= totalPages}
                            className="flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-1.5 text-sm text-slate-600 dark:text-slate-300 transition-colors disabled:cursor-not-allowed disabled:opacity-40 enabled:hover:bg-surface-50 dark:hover:bg-slate-800"
                        >
                            Next <ChevronRight className="size-4" />
                        </button>
                    </div>
                )}
            </main>
        </PageShell>
    );
}
