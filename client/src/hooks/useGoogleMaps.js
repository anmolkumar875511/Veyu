// src/hooks/useGoogleMaps.js
// ─────────────────────────────────────────────────────────────────────────────
// Loads the Google Maps JS API exactly once, regardless of how many pages
// mount a map. Subsequent calls reuse the same loading promise.
//
// Usage:
//   const { isLoaded, loadError } = useGoogleMaps();
//   if (!isLoaded) return <MapSkeleton />;
//   // window.google.maps is now safe to use
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';

const SCRIPT_ID = 'veyu-google-maps-script';
let loadPromise = null;

function loadGoogleMapsScript(apiKey) {
    if (loadPromise) return loadPromise;

    loadPromise = new Promise((resolve, reject) => {
        // Already loaded by a previous mount (e.g. fast page nav)
        if (window.google?.maps) {
            resolve();
            return;
        }

        const existing = document.getElementById(SCRIPT_ID);
        if (existing) {
            existing.addEventListener('load', () => resolve());
            existing.addEventListener('error', () =>
                reject(new Error('Google Maps script failed to load.'))
            );
            return;
        }

        const script = document.createElement('script');
        script.id = SCRIPT_ID;
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&v=weekly&loading=async`;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Google Maps script failed to load.'));
        document.head.appendChild(script);
    });

    return loadPromise;
}

export function useGoogleMaps() {
    const [isLoaded, setIsLoaded] = useState(!!window.google?.maps);
    const [loadError, setLoadError] = useState(null);

    useEffect(() => {
        if (isLoaded) return;

        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
            setLoadError(new Error('VITE_GOOGLE_MAPS_API_KEY is not set in .env'));
            return;
        }

        loadGoogleMapsScript(apiKey)
            .then(() => setIsLoaded(true))
            .catch((err) => setLoadError(err));
    }, [isLoaded]);

    return { isLoaded, loadError };
}
