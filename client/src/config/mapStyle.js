// src/config/mapStyle.js
// ─────────────────────────────────────────────────────────────────────────────
// Custom Google Maps style — clean, minimal light theme matching the app's
// indigo/slate design system. Default Google Maps (busy POI icons, saturated
// greens/yellows) competes with the UI, so this desaturates everything except
// roads and the accent color used for highways.
//
// Generated for use with the Google Maps JavaScript API `styles` option:
//   new google.maps.Map(el, { styles: VEYU_MAP_STYLE, ...otherOptions })
//
// Color reference (keep in sync with src/index.css @theme tokens):
//   surface-50:   #f8fafc
//   surface-100:  #f1f5f9
//   slate-200:    #e2e8f0
//   slate-400:    #94a3b8
//   slate-500:    #64748b
//   primary-600:  #4f46e5
// ─────────────────────────────────────────────────────────────────────────────

export const VEYU_MAP_STYLE = [
    // ── Base canvas ──────────────────────────────────────────────────────────
    { elementType: 'geometry', stylers: [{ color: '#f8fafc' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
    { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },

    // ── Administrative boundaries (ward/district lines) ────────────────────
    {
        featureType: 'administrative',
        elementType: 'geometry',
        stylers: [{ color: '#cbd5e1' }],
    },
    {
        featureType: 'administrative.country',
        elementType: 'geometry.stroke',
        stylers: [{ color: '#94a3b8' }],
    },
    {
        featureType: 'administrative.locality',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#475569' }],
    },
    {
        featureType: 'administrative.neighborhood',
        stylers: [{ visibility: 'off' }],
    },

    // ── Points of interest — muted, decorative only ─────────────────────────
    {
        featureType: 'poi',
        elementType: 'geometry',
        stylers: [{ color: '#f1f5f9' }],
    },
    {
        featureType: 'poi',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#94a3b8' }],
    },
    {
        featureType: 'poi.park',
        elementType: 'geometry',
        stylers: [{ color: '#e7f3ec' }],
    },
    {
        featureType: 'poi.park',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#86a893' }],
    },
    {
        featureType: 'poi.business',
        stylers: [{ visibility: 'off' }],
    },

    // ── Roads — the most important navigational layer ──────────────────────
    {
        featureType: 'road',
        elementType: 'geometry',
        stylers: [{ color: '#ffffff' }],
    },
    {
        featureType: 'road',
        elementType: 'geometry.stroke',
        stylers: [{ color: '#e2e8f0' }],
    },
    {
        featureType: 'road',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#64748b' }],
    },
    {
        featureType: 'road.highway',
        elementType: 'geometry',
        stylers: [{ color: '#e0e7ff' }],
    },
    {
        featureType: 'road.highway',
        elementType: 'geometry.stroke',
        stylers: [{ color: '#c7d2fe' }],
    },
    {
        featureType: 'road.highway',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#4f46e5' }],
    },
    {
        featureType: 'road.arterial',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#64748b' }],
    },
    {
        featureType: 'road.local',
        elementType: 'geometry',
        stylers: [{ color: '#f8fafc' }],
    },

    // ── Transit — subtle, not a primary use case here ───────────────────────
    {
        featureType: 'transit',
        elementType: 'geometry',
        stylers: [{ color: '#f1f5f9' }],
    },
    {
        featureType: 'transit.station',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#94a3b8' }],
    },

    // ── Water — soft indigo-tinted, ties into accent color ──────────────────
    {
        featureType: 'water',
        elementType: 'geometry',
        stylers: [{ color: '#dbeafe' }],
    },
    {
        featureType: 'water',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#7dabc9' }],
    },
];

// ── Map default options — pair with VEYU_MAP_STYLE on every map instance ────
export const VEYU_MAP_DEFAULTS = {
    styles: VEYU_MAP_STYLE,
    disableDefaultUI: true, // we build custom controls matching the app UI
    zoomControl: true,
    zoomControlOptions: {
        position: 7, // google.maps.ControlPosition.RIGHT_BOTTOM (avoid magic number import at module load)
    },
    fullscreenControl: false,
    streetViewControl: false,
    mapTypeControl: false,
    clickableIcons: false, // prevent accidental POI clicks stealing taps
    gestureHandling: 'greedy', // single-finger pan on mobile (no two-finger requirement)
    backgroundColor: '#f8fafc', // matches surface-50 — prevents dark flash while tiles load
};

// ── City-wide default center/zoom — override per-deployment ─────────────────
// Set these from your actual city coordinates (same values as CITY_LAT/CITY_LON
// used by weather.service.js on the backend, for consistency).
export const VEYU_CITY_NAME = 'Bareilly'; // Shown on the admin profile page — set to your deployment's city.
export const VEYU_DEFAULT_CENTER = { lat: 28.3670, lng: 79.4304 }; // Bareilly example
export const VEYU_DEFAULT_ZOOM = 12;
