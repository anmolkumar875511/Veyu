// src/config/mapMarkers.js
// ─────────────────────────────────────────────────────────────────────────────
// Custom SVG marker icons matching the app's indigo/slate palette — Google's
// default red pins don't fit a clean, minimal UI. These are inline SVG data URIs so no extra HTTP
// requests are needed; they scale crisply on retina screens.
// ─────────────────────────────────────────────────────────────────────────────

import { SEVERITY_COLOR } from '../constants/complaint.constants.js';

const WHITE = '#ffffff';
const PRIMARY = '#4f46e5';
const DANGER = '#e11d48';

// ── Complaint pin — colored by severity, used on NerveMap public + officer queue ──
export function complaintMarkerIcon(severity, isSelected = false) {
    const c = SEVERITY_COLOR(severity ?? 5);
    const size = isSelected ? 36 : 28;
    const ring = isSelected
        ? `<circle cx="14" cy="14" r="13" fill="none" stroke="${c}" stroke-width="1.5" opacity="0.4"/>`
        : '';

    const svg = `
        <svg width="${size}" height="${size}" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
            ${ring}
            <circle cx="14" cy="14" r="9" fill="${c}" stroke="${WHITE}" stroke-width="2"/>
            <circle cx="14" cy="14" r="3" fill="${WHITE}"/>
        </svg>`;

    return {
        url: `data:image/svg+xml;base64,${btoa(svg)}`,
        scaledSize: { width: size, height: size },
        anchor: { x: size / 2, y: size / 2 },
    };
}

// ── Ward boundary center marker — used on NerveMap PulseGrid layer ──────────
export function wardMarkerIcon(stressBandColor) {
    const svg = `
        <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="14" fill="${stressBandColor}" opacity="0.15"/>
            <circle cx="16" cy="16" r="14" fill="none" stroke="${stressBandColor}" stroke-width="1.5"/>
            <circle cx="16" cy="16" r="5" fill="${stressBandColor}"/>
        </svg>`;

    return {
        url: `data:image/svg+xml;base64,${btoa(svg)}`,
        scaledSize: { width: 32, height: 32 },
        anchor: { x: 16, y: 16 },
    };
}

// ── Worker / user location marker — used during route navigation ────────────
export function workerLocationIcon() {
    const svg = `
        <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" fill="${PRIMARY}" opacity="0.2"/>
            <circle cx="12" cy="12" r="6" fill="${PRIMARY}" stroke="${WHITE}" stroke-width="2"/>
        </svg>`;

    return {
        url: `data:image/svg+xml;base64,${btoa(svg)}`,
        scaledSize: { width: 24, height: 24 },
        anchor: { x: 12, y: 12 },
    };
}

// ── Destination pin (the complaint location worker is routing to) ───────────
export function destinationMarkerIcon() {
    const svg = `
        <svg width="36" height="44" viewBox="0 0 36 44" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 26 18 26s18-12.5 18-26C36 8.06 27.94 0 18 0Z" fill="${PRIMARY}"/>
            <circle cx="18" cy="18" r="7" fill="${WHITE}"/>
        </svg>`;

    return {
        url: `data:image/svg+xml;base64,${btoa(svg)}`,
        scaledSize: { width: 36, height: 44 },
        anchor: { x: 18, y: 44 },
    };
}

// ── GPS capture pin — used on SubmitComplaint after location is captured ────
export function captureMarkerIcon() {
    const svg = `
        <svg width="36" height="44" viewBox="0 0 36 44" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 26 18 26s18-12.5 18-26C36 8.06 27.94 0 18 0Z" fill="${DANGER}"/>
            <circle cx="18" cy="18" r="7" fill="${WHITE}"/>
        </svg>`;

    return {
        url: `data:image/svg+xml;base64,${btoa(svg)}`,
        scaledSize: { width: 36, height: 44 },
        anchor: { x: 18, y: 44 },
    };
}
