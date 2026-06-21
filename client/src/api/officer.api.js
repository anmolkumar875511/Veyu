// ─────────────────────────────────────────────────────────────────────────────
// src/api/officer.api.js
// ─────────────────────────────────────────────────────────────────────────────

import { apiClient } from './axios.instance.js';

// ── Triage queue ───────────────────────────────────────────────────────────────
export async function getTriageQueueApi(params = {}) {
    const { data } = await apiClient.get('/officer/queue', { params });
    return data.data; // { complaints, total, page, totalPages }
}

// ── Complaint detail (officer view — includes assignment info) ─────────────────
export async function getOfficerComplaintDetailApi(id) {
    const { data } = await apiClient.get(`/officer/complaints/${id}`);
    return data.data; // { complaint, assignment }
}

// ── Status update ────────────────────────────────────────────────────────────
export async function updateComplaintStatusApi(id, dto) {
    const { data } = await apiClient.patch(`/officer/complaints/${id}/status`, dto);
    return data.data; // { complaint, cascadeResult }
}

// ── Dispatch to worker ───────────────────────────────────────────────────────
export async function dispatchToWorkerApi(id, dto) {
    const { data } = await apiClient.post(`/officer/complaints/${id}/dispatch`, dto);
    return data.data; // { assignment, complaint }
}

// ── Reassign ──────────────────────────────────────────────────────────────────
export async function reassignWorkerApi(id, dto) {
    const { data } = await apiClient.post(`/officer/complaints/${id}/reassign`, dto);
    return data.data; // { assignment }
}

// ── FieldMesh observation review queue ────────────────────────────────────────
export async function getObservationQueueApi(params = {}) {
    const { data } = await apiClient.get('/officer/observations', { params });
    return data.data; // { observations, total, page, totalPages }
}

export async function reviewObservationApi(id, dto) {
    const { data } = await apiClient.patch(`/officer/observations/${id}/review`, dto);
    return data.data; // { observation, complaint }
}

// ── Ward report ───────────────────────────────────────────────────────────────
export async function getWardReportApi(wardId) {
    const { data } = await apiClient.get(`/officer/wards/${wardId}/report`);
    return data.data; // { ward, statusBreakdown, categoryBreakdown, avgResolutionHours, workerLeaderboard }
}

// ── Available workers (for dispatch dropdown) ─────────────────────────────────
export async function getAvailableWorkersApi(wardId) {
    const { data } = await apiClient.get('/officer/workers/available', {
        params: wardId ? { wardId } : {},
    });
    return data.data; // { workers }
}

// ── Shared error parser ───────────────────────────────────────────────────────
export function parseOfficerError(err) {
    if (err.response?.data?.errors?.length > 0) return err.response.data.errors[0].message;
    return err.response?.data?.message ?? 'Something went wrong. Please try again.';
}
