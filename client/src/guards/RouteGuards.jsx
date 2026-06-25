// src/guards/RouteGuards.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Route guards. Loading state uses FullscreenLoader from AuthShell (themed).
// RoleRoute intentionally does NOT re-check isLoading/isAuthenticated —
// it always sits inside a ProtectedRoute which already handles that.
// ─────────────────────────────────────────────────────────────────────────────

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { FullscreenLoader } from '../components/AuthShell.jsx';

// ── Role → home route ─────────────────────────────────────────────────────────
export function getRoleHome(role) {
    switch (role) {
        case 'admin':
        case 'officer':
            return '/war-room';
        case 'worker':
            return '/tasks';
        case 'citizen':
        default:
            return '/dashboard';
    }
}

// ── ProtectedRoute ────────────────────────────────────────────────────────────
// Blocks unauthenticated access. Preserves intended destination in `from`.
export function ProtectedRoute() {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) return <FullscreenLoader message="Restoring session…" />;
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }
    return <Outlet />;
}

// ── RoleRoute ─────────────────────────────────────────────────────────────────
// Must always be nested inside ProtectedRoute.
// Only checks role — auth state is already resolved by the parent.
export function RoleRoute({ roles, redirectTo = '/unauthorized' }) {
    const { user } = useAuth();
    if (!roles.includes(user?.role)) {
        return <Navigate to={redirectTo} replace />;
    }
    return <Outlet />;
}

// ── PublicOnlyRoute ───────────────────────────────────────────────────────────
// Redirects logged-in users away from /login and /register.
export function PublicOnlyRoute() {
    const { isAuthenticated, isLoading, user } = useAuth();

    if (isLoading) return <FullscreenLoader message="Loading…" />;
    if (isAuthenticated) {
        return <Navigate to={getRoleHome(user?.role)} replace />;
    }
    return <Outlet />;
}
