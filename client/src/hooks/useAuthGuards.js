import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getRoleHome } from "../guards/RouteGuards.jsx";

export function useCurrentUser() {
  const { user } = useAuth();
  return user;
}

export function useRequireRole(requiredRoles, redirectTo = "/unauthorized") {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) { navigate("/login", { replace: true }); return; }
    if (!roles.includes(user?.role)) { navigate(redirectTo, { replace: true }); }
  }, [isLoading, isAuthenticated, user?.role]);
}

export function usePermission(roles) {
  const { user } = useAuth();
  if (!user) return false;
  const allowed = Array.isArray(roles) ? roles : [roles];
  return allowed.includes(user.role);
}

export function useRedirectIfAuthenticated() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate(getRoleHome(user?.role), { replace: true });
    }
  }, [isLoading, isAuthenticated, user?.role]);
}

export function useLogout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return async () => {
    await logout();
    navigate("/login", { replace: true });
  };
}