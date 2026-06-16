import axios from 'axios';
import { getAccessToken, setAccessToken, clearAccessToken } from './tokenStore.js';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

export const apiClient = axios.create({
    baseURL: `${BASE_URL}/api`,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
    timeout: 15_000,
});

// ── Request interceptor — inject access token ─────────────────────────────────
apiClient.interceptors.request.use(
    (config) => {
        const token = getAccessToken();
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (err) => Promise.reject(err)
);

// ── Response interceptor — silent refresh on 401 ─────────────────────────────

let isRefreshing = false;
let pendingQueue = [];

function processPendingQueue(error, newToken = null) {
    pendingQueue.forEach(({ resolve, reject }) => {
        error ? reject(error) : resolve(newToken);
    });
    pendingQueue = [];
}

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        const isTokenExpired =
            error.response?.status === 401 &&
            error.response?.data?.code === 'TOKEN_EXPIRED' &&
            !originalRequest._retried;

        if (!isTokenExpired) return Promise.reject(error);

        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                pendingQueue.push({ resolve, reject });
            }).then((newToken) => {
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return apiClient(originalRequest);
            });
        }

        originalRequest._retried = true;
        isRefreshing = true;

        try {
            const { data } = await axios.post(
                `${BASE_URL}/api/auth/refresh`,
                {},
                { withCredentials: true }
            );
            const newToken = data.data.accessToken;
            setAccessToken(newToken);
            processPendingQueue(null, newToken);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return apiClient(originalRequest);
        } catch (refreshError) {
            clearAccessToken();
            processPendingQueue(refreshError);
            window.dispatchEvent(new CustomEvent('nagarik:session-expired'));
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    }
);
