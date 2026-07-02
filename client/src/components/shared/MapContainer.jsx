// src/components/shared/MapContainer.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Base map wrapper used by NerveMap, SubmitComplaint location picker, and
// worker route navigation. Handles script loading, instance creation, and
// theme-consistent loading/error states. Children receive the map instance
// via render prop for adding markers/routes.
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useEffect, useState } from 'react';
import { useGoogleMaps } from '../../hooks/useGoogleMaps.js';
import {
    VEYU_MAP_DEFAULTS,
    VEYU_DEFAULT_CENTER,
    VEYU_DEFAULT_ZOOM,
} from '../../config/mapStyle.js';
import { color, font, radius } from '../../theme/index.js';

export function MapContainer({
    center = VEYU_DEFAULT_CENTER,
    zoom = VEYU_DEFAULT_ZOOM,
    height = '400px',
    onMapReady,
    children,
}) {
    const { isLoaded, loadError } = useGoogleMaps();
    const containerRef = useRef(null);
    const mapRef = useRef(null);
    const [mapInstance, setMapInstance] = useState(null);

    useEffect(() => {
        if (!isLoaded || !containerRef.current || mapRef.current) return;

        const map = new window.google.maps.Map(containerRef.current, {
            center,
            zoom,
            ...VEYU_MAP_DEFAULTS,
        });

        mapRef.current = map;
        setMapInstance(map);
        onMapReady?.(map);
    }, [isLoaded]);

    if (loadError) {
        return (
            <div
                style={{
                    height,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: color.bgSurface,
                    border: `1px solid ${color.dangerBorder}`,
                    borderRadius: radius.xl,
                    color: color.danger,
                    fontSize: font.size.sm,
                    textAlign: 'center',
                    padding: '1rem',
                }}
            >
                Could not load map. Check your connection or API key configuration.
            </div>
        );
    }

    return (
        <div style={{ position: 'relative', height, width: '100%' }}>
            {!isLoaded && (
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: color.bgSurface,
                        borderRadius: radius.xl,
                        border: `1px solid ${color.borderDefault}`,
                        color: color.textMuted,
                        fontSize: font.size.sm,
                    }}
                >
                    Loading map…
                </div>
            )}
            <div
                ref={containerRef}
                style={{
                    height: '100%',
                    width: '100%',
                    borderRadius: radius.xl,
                    overflow: 'hidden',
                    border: `1px solid ${color.borderDefault}`,
                    opacity: isLoaded ? 1 : 0,
                    transition: 'opacity 0.3s',
                }}
            />
            {mapInstance && children?.(mapInstance)}
        </div>
    );
}
