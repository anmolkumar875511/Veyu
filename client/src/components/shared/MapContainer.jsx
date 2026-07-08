// src/components/shared/MapContainer.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Base map wrapper used by NerveMap, SubmitComplaint location picker, and
// worker route navigation. Handles script loading, instance creation, and
// theme-consistent loading/error states. Children receive the map instance
// via render prop for adding markers/routes.
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useGoogleMaps } from '../../hooks/useGoogleMaps.js';
import {
    VEYU_MAP_DEFAULTS,
    VEYU_DEFAULT_CENTER,
    VEYU_DEFAULT_ZOOM,
} from '../../config/mapStyle.js';

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

            const initializeMap = () => {
                try {
                    // Use the classic global namespace (same pattern LocationPicker.jsx
                    // already relies on) — importLibrary() only exists when Maps is
                    // loaded via Google's special inline bootstrap-loader snippet, not
                    // via a plain <script src="...maps/api/js?..."> tag like the one
                    // useGoogleMaps.js injects. Calling it here always throws.
                    const map = new window.google.maps.Map(containerRef.current, {
                        center,
                        zoom,
                        ...VEYU_MAP_DEFAULTS,
                    });

                    mapRef.current = map;
                    setMapInstance(map);
                    onMapReady?.(map);
                } catch (error) {
                    console.error('Failed to initialize the map:', error);
                }
            };

            initializeMap();
        }, [isLoaded]); // Keep your dependencies as they were

    if (loadError) {
        return (
            <div
                style={{ height }}
                className="flex items-center justify-center rounded-xl border border-rose-200 bg-white dark:bg-slate-900 p-4 text-center text-sm text-rose-600"
            >
                Could not load map. Check your connection or API key configuration.
            </div>
        );
    }

    return (
        <div style={{ height }} className="relative w-full">
            {!isLoaded && (
                <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-400 dark:text-slate-500">
                    <Loader2 className="size-4 animate-spin" /> Loading map…
                </div>
            )}
            <div
                ref={containerRef}
                className="h-full w-full overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 transition-opacity duration-300"
                style={{ opacity: isLoaded ? 1 : 0 }}
            />
            {mapInstance && children?.(mapInstance)}
        </div>
    );
}
