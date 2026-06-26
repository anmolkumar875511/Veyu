// ─────────────────────────────────────────────────────────────────────────────
// src/api/forecast.api.js
// ─────────────────────────────────────────────────────────────────────────────

import { apiClient } from './axios.instance.js';

// ── Officer/Admin: active forecast alerts ────────────────────────────────────
export async function getActiveForecastsApi(params = {}) {
    const { data } = await apiClient.get('/forecasts', { params });
    return data.data; // { forecasts }
}

export async function acknowledgeForecastApi(id) {
    const { data } = await apiClient.patch(`/forecasts/${id}/acknowledge`);
    return data.data; // { forecast }
}

export async function getForecastAccuracyApi() {
    const { data } = await apiClient.get('/forecasts/accuracy');
    return data.data; // { confirmed, expired, totalScored, accuracyRate }
}

// ── Admin only: manual triggers (normally run via daily cron) ────────────────
export async function generateForecastsApi() {
    const { data } = await apiClient.post('/forecasts/generate');
    return data.data; // { created, forecasts }
}

export async function expireAndScoreForecastsApi() {
    const { data } = await apiClient.post('/forecasts/expire-and-score');
    return data.data; // { scored, confirmed, expired }
}

// ── Shared error parser ───────────────────────────────────────────────────────
export function parseForecastError(err) {
    if (err.response?.data?.errors?.length > 0) return err.response.data.errors[0].message;
    return err.response?.data?.message ?? 'Something went wrong. Please try again.';
}
