// src/api/auth.api.js

import { apiClient } from './axios.instance.js';

// ── OTP registration ──────────────────────────────────────────────────────────

// Step 1: validate + send OTP email
export async function sendOtpApi(dto) {
    const { data } = await apiClient.post('/auth/send-otp', dto);
    return data.data; // { message }
}

// Step 2: verify OTP → receive tokens
export async function verifyOtpApi(dto) {
    const { data } = await apiClient.post('/auth/verify-otp', dto);
    return data.data; // { user, accessToken }
}

// ── Google OAuth (browser redirect — no fetch) ────────────────────────────────
// Call window.location.href = getGoogleAuthUrl() to start the OAuth flow.
export function getGoogleAuthUrl() {
    const base = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';
    return `${base}/api/auth/google`;
}

// ── Standard auth ─────────────────────────────────────────────────────────────
export async function loginApi(dto) {
    const { data } = await apiClient.post('/auth/login', dto);
    return data.data; // { user, accessToken }
}

export async function refreshApi() {
    const { data } = await apiClient.post('/auth/refresh');
    return data.data; // { user, accessToken }
}

export async function logoutApi() {
    await apiClient.post('/auth/logout');
}

export async function getMeApi() {
    const { data } = await apiClient.get('/auth/me');
    return data.data;
}

export async function changePasswordApi(dto) {
    const { data } = await apiClient.patch('/auth/password', dto);
    return data;
}

export async function createStaffApi(dto) {
    const { data } = await apiClient.post('/auth/staff', dto);
    return data.data;
}

// ── Shared error parser ───────────────────────────────────────────────────────
export function parseAuthError(err) {
    if (err.response?.data?.errors?.length > 0) return err.response.data.errors[0].message;
    if (err.response?.data?.message) return err.response.data.message;
    if (!err.response) return 'Network error. Check your connection and try again.';
    return 'Something went wrong. Please try again.';
}
