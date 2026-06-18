// ─────────────────────────────────────────────────────────────────────────────
// src/api/complaints.api.js
// ─────────────────────────────────────────────────────────────────────────────

import { apiClient } from './axios.instance.js';

// Submit a complaint — multipart/form-data (image + fields)
export async function submitComplaintApi(formData) {
    const { data } = await apiClient.post('/complaints', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
}

// Citizen's own complaints with optional pagination + status filter
export async function getMyComplaintsApi(params = {}) {
    const { data } = await apiClient.get('/complaints/mine', { params });
    return data.data; // { complaints, total, page, totalPages }
}

// Public city stats for the dashboard header cards
export async function getCityStatsApi() {
    const { data } = await apiClient.get('/complaints/stats/public');
    return data.data;
}

// Public complaint list for the map page
export async function getMapComplaintsApi(params = {}) {
    const { data } = await apiClient.get('/complaints/map', { params });
    return data.data; // { complaints }
}

// Single complaint detail
export async function getComplaintByIdApi(id) {
    const { data } = await apiClient.get(`/complaints/${id}`);
    return data.data; // { complaint, hasVoted }
}

// Toggle upvote (returns { upvotes, hasVoted })
export async function toggleUpvoteApi(id) {
    const { data } = await apiClient.post(`/complaints/${id}/upvote`);
    return data.data;
}

// Delete own unverified complaint
export async function deleteComplaintApi(id) {
    const { data } = await apiClient.delete(`/complaints/${id}`);
    return data;
}

// Shared error parser
export function parseComplaintError(err) {
    if (err.response?.data?.errors?.length > 0) {
        return err.response.data.errors[0].message;
    }
    return err.response?.data?.message ?? 'Something went wrong. Please try again.';
}
