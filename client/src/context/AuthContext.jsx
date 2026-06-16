import { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import { loginApi, logoutApi, refreshApi, registerApi, parseAuthError } from '../api/auth.api.js';
import { setAccessToken, clearAccessToken } from '../api/tokenStore.js';

const initialState = {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
};

function authReducer(state, action) {
    switch (action.type) {
        case 'AUTH_LOADING':
            return { ...state, isLoading: true, error: null };

        case 'AUTH_SUCCESS':
            return {
                user: action.payload.user,
                isAuthenticated: true,
                isLoading: false,
                error: null,
            };

        case 'AUTH_FAILURE':
            return {
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: action.payload ?? null,
            };

        case 'AUTH_LOGOUT':
            return { ...initialState, isLoading: false };

        case 'CLEAR_ERROR':
            return { ...state, error: null };

        default:
            return state;
    }
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [state, dispatch] = useReducer(authReducer, initialState);

    useEffect(() => {
        async function restoreSession() {
            try {
                const { user, accessToken } = await refreshApi();
                setAccessToken(accessToken);
                dispatch({ type: 'AUTH_SUCCESS', payload: { user } });
            } catch {
                dispatch({ type: 'AUTH_FAILURE' });
            }
        }
        restoreSession();
    }, []);

    useEffect(() => {
        function handleSessionExpired() {
            clearAccessToken();
            dispatch({ type: 'AUTH_LOGOUT' });
        }
        window.addEventListener('nagarik:session-expired', handleSessionExpired);
        return () => window.removeEventListener('nagarik:session-expired', handleSessionExpired);
    }, []);

    const login = useCallback(async (email, password) => {
        dispatch({ type: 'AUTH_LOADING' });
        try {
            const { user, accessToken } = await loginApi({ email, password });
            setAccessToken(accessToken);
            dispatch({ type: 'AUTH_SUCCESS', payload: { user } });
            return { success: true };
        } catch (err) {
            const message = parseAuthError(err);
            dispatch({ type: 'AUTH_FAILURE', payload: message });
            return { success: false, error: message };
        }
    }, []);

    const register = useCallback(async (formData) => {
        dispatch({ type: 'AUTH_LOADING' });
        try {
            const { user, accessToken } = await registerApi(formData);
            setAccessToken(accessToken);
            dispatch({ type: 'AUTH_SUCCESS', payload: { user } });
            return { success: true };
        } catch (err) {
            const message = parseAuthError(err);
            dispatch({ type: 'AUTH_FAILURE', payload: message });
            return { success: false, error: message };
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            await logoutApi();
        } finally {
            clearAccessToken();
            dispatch({ type: 'AUTH_LOGOUT' });
        }
    }, []);

    const clearError = useCallback(() => {
        dispatch({ type: 'CLEAR_ERROR' });
    }, []);

    const value = {
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isLoading: state.isLoading,
        error: state.error,
        login,
        register,
        logout,
        clearError,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider />');
    return ctx;
}
