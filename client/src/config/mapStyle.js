// src/config/mapStyle.js
// ─────────────────────────────────────────────────────────────────────────────
// Custom Google Maps style — dark navy theme matching theme/index.js exactly.
// Default Google Maps (light grey roads, yellow highways, green parks) clashes
// hard with Veyu's dark UI. This style desaturates everything except the
// signal colors the app actually uses: cyan (accent), and status colors for
// markers (handled separately via custom marker icons, not map style).
//
// Generated for use with the Google Maps JavaScript API `styles` option:
//   new google.maps.Map(el, { styles: VEYU_MAP_STYLE, ...otherOptions })
//
// Color reference (must match theme/index.js if that file changes):
//   bgPage:        #09111f
//   bgSurface:     #111d2e
//   borderDefault: #243c58
//   textSecondary: #6e93b8
//   textMuted:     #354e66
//   accent:        #22d3ee
// ─────────────────────────────────────────────────────────────────────────────

export const VEYU_MAP_STYLE = [
    // ── Base canvas ──────────────────────────────────────────────────────────
    { elementType: 'geometry', stylers: [{ color: '#09111f' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#09111f' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#6e93b8' }] },
    { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },

    // ── Administrative boundaries (ward/district lines) ────────────────────
    {
        featureType: 'administrative',
        elementType: 'geometry',
        stylers: [{ color: '#243c58' }],
    },
    {
        featureType: 'administrative.country',
        elementType: 'geometry.stroke',
        stylers: [{ color: '#354e66' }],
    },
    {
        featureType: 'administrative.locality',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#6e93b8' }],
    },
    {
        featureType: 'administrative.neighborhood',
        stylers: [{ visibility: 'off' }],
    },

    // ── Points of interest — muted, decorative only ─────────────────────────
    {
        featureType: 'poi',
        elementType: 'geometry',
        stylers: [{ color: '#111d2e' }],
    },
    {
        featureType: 'poi',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#354e66' }],
    },
    {
        featureType: 'poi.park',
        elementType: 'geometry',
        stylers: [{ color: '#0f2418' }],
    },
    {
        featureType: 'poi.park',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#2d4a3a' }],
    },
    {
        featureType: 'poi.business',
        stylers: [{ visibility: 'off' }],
    },

    // ── Roads — the most important navigational layer ──────────────────────
    {
        featureType: 'road',
        elementType: 'geometry',
        stylers: [{ color: '#1c2e45' }],
    },
    {
        featureType: 'road',
        elementType: 'geometry.stroke',
        stylers: [{ color: '#0c1726' }],
    },
    {
        featureType: 'road',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#6e93b8' }],
    },
    {
        featureType: 'road.highway',
        elementType: 'geometry',
        stylers: [{ color: '#243c58' }],
    },
    {
        featureType: 'road.highway',
        elementType: 'geometry.stroke',
        stylers: [{ color: '#0c1726' }],
    },
    {
        featureType: 'road.highway',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#22d3ee' }],
    },
    {
        featureType: 'road.arterial',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#6e93b8' }],
    },
    {
        featureType: 'road.local',
        elementType: 'geometry',
        stylers: [{ color: '#172236' }],
    },

    // ── Transit — subtle, not a primary use case here ───────────────────────
    {
        featureType: 'transit',
        elementType: 'geometry',
        stylers: [{ color: '#172236' }],
    },
    {
        featureType: 'transit.station',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#354e66' }],
    },

    // ── Water — cyan-tinted dark, ties into accent color ────────────────────
    {
        featureType: 'water',
        elementType: 'geometry',
        stylers: [{ color: '#0a1825' }],
    },
    {
        featureType: 'water',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#1c4a56' }],
    },
];

// ── Map default options — pair with VEYU_MAP_STYLE on every map instance ────
export const VEYU_MAP_DEFAULTS = {
    styles: VEYU_MAP_STYLE,
    disableDefaultUI: true, // we build custom controls matching theme
    zoomControl: true,
    zoomControlOptions: {
        position: 7, // google.maps.ControlPosition.RIGHT_BOTTOM (avoid magic number import at module load)
    },
    fullscreenControl: false,
    streetViewControl: false,
    mapTypeControl: false,
    clickableIcons: false, // prevent accidental POI clicks stealing taps
    gestureHandling: 'greedy', // single-finger pan on mobile (no two-finger requirement)
    backgroundColor: '#09111f', // matches color.bgPage — prevents white flash while tiles load
};

// ── City-wide default center/zoom — override per-deployment ─────────────────
// Set these from your actual city coordinates (same values as CITY_LAT/CITY_LON
// used by weather.service.js on the backend, for consistency).
export const VEYU_DEFAULT_CENTER = { lat: 25.4358, lng: 81.8463 }; // Prayagraj example
export const VEYU_DEFAULT_ZOOM = 12;
