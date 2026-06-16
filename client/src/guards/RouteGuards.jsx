import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

function AuthLoading() {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                background: '#0f172a',
                color: '#94a3b8',
                fontFamily: 'system-ui, sans-serif',
                fontSize: '0.875rem',
                letterSpacing: '0.05em',
            }}
        >
            <span>Restoring session…</span>
        </div>
    );
}
export function ProtectedRoute() {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) return <AuthLoading />;
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }
    return <Outlet />;
}

export function RoleRoute({ roles, redirectTo = '/unauthorized' }) {
    const { isAuthenticated, isLoading, user } = useAuth();
    const location = useLocation();

    if (isLoading) return <AuthLoading />;

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (!roles.includes(user?.role)) {
        return <Navigate to={redirectTo} replace />;
    }

    return <Outlet />;
}

export function PublicOnlyRoute() {
    const { isAuthenticated, isLoading, user } = useAuth();

    if (isLoading) return <AuthLoading />;

    if (isAuthenticated) {
        return <Navigate to={getRoleHome(user?.role)} replace />;
    }

    return <Outlet />;
}

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
