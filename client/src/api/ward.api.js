// ─────────────────────────────────────────────────────────────────────────────
// src/api/ward.api.js
// ─────────────────────────────────────────────────────────────────────────────

import { apiClient } from './axios.instance.js';

// ── Public ────────────────────────────────────────────────────────────────────
export async function listWardsApi(params = {}) {
    const { data } = await apiClient.get('/wards', { params });
    return data.data; // { wards }
}

export async function getWardLeaderboardApi() {
    const { data } = await apiClient.get('/wards/leaderboard');
    return data.data; // { wards } — ranked, includes `rank`
}

export async function getPulseGridSnapshotApi() {
    const { data } = await apiClient.get('/wards/pulse');
    return data.data; // { wards } — pulseVelocity, stressBand, complaintsLast48h
}

export async function getWardByIdApi(id) {
    const { data } = await apiClient.get(`/wards/${id}`);
    return data.data; // { ward }
}

// ── Officer/Admin ──────────────────────────────────────────────────────────────
export async function recomputeWardStatsApi(id) {
    const { data } = await apiClient.post(`/wards/${id}/recompute-stats`);
    return data.data; // { ward }
}

// ── Admin only ────────────────────────────────────────────────────────────────
export async function createWardApi(dto) {
    const { data } = await apiClient.post('/wards', dto);
    return data.data; // { ward }
}

export async function updateWardApi(id, dto) {
    const { data } = await apiClient.patch(`/wards/${id}`, dto);
    return data.data; // { ward }
}

export async function assignOfficerApi(id, officerId) {
    const { data } = await apiClient.post(`/wards/${id}/assign-officer`, { officerId });
    return data.data; // { ward }
}

export async function recomputeAllPulseApi() {
    const { data } = await apiClient.post('/wards/pulse/recompute');
    return data.data; // { updated, wards }
}

export async function recomputeAllStatsApi() {
    const { data } = await apiClient.post('/wards/stats/recompute-all');
    return data.data; // { updated, wards }
}

// ── Shared error parser ───────────────────────────────────────────────────────
export function parseWardError(err) {
    if (err.response?.data?.errors?.length > 0) return err.response.data.errors[0].message;
    return err.response?.data?.message ?? 'Something went wrong. Please try again.';
}
