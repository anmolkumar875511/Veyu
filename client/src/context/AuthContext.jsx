// src/context/AuthContext.jsx
// Changes:
//   - register() now calls verifyOtpApi (OTP step 2) instead of registerApi
//   - dispatch is exported so GoogleSuccessPage can hydrate auth state directly

import { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import { loginApi, logoutApi, refreshApi, verifyOtpApi, parseAuthError } from '../api/auth.api.js';
import { setAccessToken, clearAccessToken } from '../api/tokenStore.js';

export const SESSION_EXPIRED_EVENT = 'veyu:session-expired';

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
        case 'USER_UPDATED':
            return { ...state, user: { ...state.user, ...action.payload } };
        case 'CLEAR_ERROR':
            return { ...state, error: null };
        default:
            return state;
    }
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [state, dispatch] = useReducer(authReducer, initialState);

    // Restore session via httpOnly refresh cookie on mount
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

    // Listen for session-expired events from the Axios interceptor
    useEffect(() => {
        function handleSessionExpired() {
            clearAccessToken();
            dispatch({ type: 'AUTH_LOGOUT' });
        }
        window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
        return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
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

    // register = OTP step 2: verifyOtp({ name, email, password, phone, code })
    const register = useCallback(async (formData) => {
        dispatch({ type: 'AUTH_LOADING' });
        try {
            const { user, accessToken } = await verifyOtpApi(formData);
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

    const clearError = useCallback(() => dispatch({ type: 'CLEAR_ERROR' }), []);

    const updateUser = useCallback((partialUser) => {
        dispatch({ type: 'USER_UPDATED', payload: partialUser });
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
        updateUser,
        // Exposed so GoogleSuccessPage can hydrate auth state without a full refresh cycle
        dispatch,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider />');
    return ctx;
}
