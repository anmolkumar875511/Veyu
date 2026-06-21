// ─────────────────────────────────────────────────────────────────────────────
// src/api/worker.api.js
// ─────────────────────────────────────────────────────────────────────────────

import { apiClient } from './axios.instance.js';

// ── Task feed ─────────────────────────────────────────────────────────────────
export async function getMyTasksApi(params = {}) {
    const { data } = await apiClient.get('/worker/tasks', { params });
    return data.data; // { tasks }
}

export async function getTaskDetailApi(id) {
    const { data } = await apiClient.get(`/worker/tasks/${id}`);
    return data.data; // { assignment }
}

// ── Advance status: pending → acknowledged → en_route → on_site ───────────────
export async function advanceTaskStatusApi(id) {
    const { data } = await apiClient.patch(`/worker/tasks/${id}/advance`);
    return data.data; // { assignment }
}

// ── Complete task — multipart (proof photo + optional note) ──────────────────
export async function completeTaskApi(id, formData) {
    const { data } = await apiClient.post(`/worker/tasks/${id}/complete`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data; // { assignment, complaint }
}

// ── FieldMesh — submit proactive observation (multipart) ─────────────────────
export async function submitObservationApi(formData) {
    const { data } = await apiClient.post('/worker/observations', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data; // { observation, autoElevated, complaint }
}

export async function getMyObservationsApi(params = {}) {
    const { data } = await apiClient.get('/worker/observations', { params });
    return data.data; // { observations, total, page, totalPages }
}

// ── Worker profile summary ────────────────────────────────────────────────────
export async function getWorkerSummaryApi() {
    const { data } = await apiClient.get('/worker/summary');
    return data.data; // { worker, completedCount, pendingCount, observationCount }
}

// ── Shared error parser ───────────────────────────────────────────────────────
export function parseWorkerError(err) {
    if (err.response?.data?.errors?.length > 0) return err.response.data.errors[0].message;
    return err.response?.data?.message ?? 'Something went wrong. Please try again.';
}
