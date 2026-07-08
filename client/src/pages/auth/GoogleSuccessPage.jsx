// src/pages/auth/GoogleSuccessPage.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Backend redirects here after a successful Google OAuth callback:
//   /auth/google/success?token=<accessToken>
//
// This page:
//   1. Reads the access token from the URL
//   2. Stores it in memory (tokenStore)
//   3. Calls /auth/me to hydrate the auth state
//   4. Clears the token from the URL
//   5. Redirects to the role-appropriate dashboard
//
// If token is missing or /auth/me fails, redirects to /login with an error.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setAccessToken } from '../../api/tokenStore.js';
import { getMeApi } from '../../api/auth.api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { getRoleHome } from '../../guards/RouteGuards.jsx';
import { FullscreenLoader } from '../../components/AuthShell.jsx';

export default function GoogleSuccessPage() {
    const navigate = useNavigate();
    const { dispatch } = useAuth(); // we need raw dispatch to hydrate state
    const [status, setStatus] = useState('Completing sign-in…');

    useEffect(() => {
        async function handleGoogleSuccess() {
            try {
                // 1. Extract token from URL
                const params = new URLSearchParams(window.location.search);
                const token = params.get('token');

                if (!token) {
                    navigate('/login?error=google_failed', { replace: true });
                    return;
                }

                // 2. Store in memory
                setAccessToken(token);

                // 3. Fetch user profile
                setStatus('Loading your profile…');
                const user = await getMeApi();

                // 4. Hydrate AuthContext
                dispatch({ type: 'AUTH_SUCCESS', payload: { user } });

                // 5. Clean URL and redirect
                window.history.replaceState({}, document.title, window.location.pathname);
                navigate(getRoleHome(user.role), { replace: true });
            } catch {
                navigate('/login?error=google_failed', { replace: true });
            }
        }

        handleGoogleSuccess();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <FullscreenLoader message={status} />;
}
