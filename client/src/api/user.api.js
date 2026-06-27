// src/api/user.api.js

import { apiClient } from './axios.instance.js';

// ── Self ──────────────────────────────────────────────────────────────────────
export async function updateMyProfileApi(dto) {
    const { data } = await apiClient.patch('/users/me', dto);
    return data.data; // { user }
}

// ── Directory (officer/admin) — for dropdowns ─────────────────────────────────
export async function getUserDirectoryApi(role) {
    const { data } = await apiClient.get('/users/directory', { params: { role } });
    return data.data; // { users }
}

// ── Admin: full user list ─────────────────────────────────────────────────────
export async function listUsersApi(params = {}) {
    const { data } = await apiClient.get('/users', { params });
    return data.data; // { users, total, page, totalPages }
}

export async function getUserByIdApi(id) {
    const { data } = await apiClient.get(`/users/${id}`);
    return data.data; // { user }
}

export async function setUserActiveApi(id, isActive) {
    const { data } = await apiClient.patch(`/users/${id}/active`, { isActive });
    return data.data; // { user }
}

export async function changeUserRoleApi(id, role) {
    const { data } = await apiClient.patch(`/users/${id}/role`, { role });
    return data.data; // { user }
}

export function parseUserError(err) {
    if (err.response?.data?.errors?.length > 0) return err.response.data.errors[0].message;
    return err.response?.data?.message ?? 'Something went wrong.';
}
