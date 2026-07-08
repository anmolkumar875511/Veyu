// src/components/shared/RouteMap.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Shows a driving/walking route from the field worker's current GPS position
// to the complaint location, with live ETA and distance. Used on TaskDetail.jsx.
// Use case 3 of 3: "make route for worker to location"
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useEffect, useState } from 'react';
import { Bike, Car, ExternalLink, Footprints } from 'lucide-react';
import { MapContainer } from './MapContainer.jsx';
import { workerLocationIcon, destinationMarkerIcon } from '../../config/mapMarkers.js';

const PRIMARY_HEX = '#4f46e5';

function RouteLayer({ map, destination, travelMode, onRouteComputed }) {
    const directionsRendererRef = useRef(null);
    const workerMarkerRef = useRef(null);
    const watchIdRef = useRef(null);

    useEffect(() => {
        if (!map) return;

        directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
            map,
            suppressMarkers: true, // we draw our own themed markers
            polylineOptions: {
                strokeColor: PRIMARY_HEX,
                strokeWeight: 4,
                strokeOpacity: 0.85,
            },
        });

        return () => directionsRendererRef.current?.setMap(null);
    }, [map]);

    // Live GPS tracking — recompute route as worker moves
    useEffect(() => {
        if (!map || !destination || !navigator.geolocation) return;

        const directionsService = new window.google.maps.DirectionsService();

        function updateRoute(position) {
            const origin = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
            };

            // Update worker's live position marker
            if (!workerMarkerRef.current) {
                workerMarkerRef.current = new window.google.maps.Marker({
                    map,
                    position: origin,
                    icon: workerLocationIcon(),
                    zIndex: 999,
                });
            } else {
                workerMarkerRef.current.setPosition(origin);
            }

            // Destination marker
            new window.google.maps.Marker({
                map,
                position: destination,
                icon: destinationMarkerIcon(),
            });

            directionsService.route(
                {
                    origin,
                    destination,
                    travelMode: window.google.maps.TravelMode[travelMode],
                },
                (result, status) => {
                    if (status === 'OK') {
                        directionsRendererRef.current?.setDirections(result);
                        const leg = result.routes[0]?.legs[0];
                        onRouteComputed?.({
                            distanceText: leg?.distance?.text,
                            durationText: leg?.duration?.text,
                            distanceMeters: leg?.distance?.value,
                            durationSeconds: leg?.duration?.value,
                        });

                        // Fit bounds to show both worker and destination
                        const bounds = new window.google.maps.LatLngBounds();
                        bounds.extend(origin);
                        bounds.extend(destination);
                        map.fitBounds(bounds, { top: 60, bottom: 60, left: 40, right: 40 });
                    }
                }
            );
        }

        // Get initial position immediately, then watch for movement
        navigator.geolocation.getCurrentPosition(updateRoute, null, { enableHighAccuracy: true });
        watchIdRef.current = navigator.geolocation.watchPosition(updateRoute, null, {
            enableHighAccuracy: true,
            maximumAge: 15_000, // recompute at most every 15s to limit API calls
        });

        return () => {
            if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
        };
    }, [map, destination, travelMode]);

    useEffect(() => () => workerMarkerRef.current?.setMap(null), []);

    return null;
}

export function RouteMap({ destination, destinationLabel, height = '320px' }) {
    const [travelMode, setTravelMode] = useState('DRIVING');
    const [routeInfo, setRouteInfo] = useState(null);
    const [gpsError, setGpsError] = useState(null);

    function handleRouteComputed(info) {
        setRouteInfo(info);
        setGpsError(null);
    }

    if (!navigator.geolocation) {
        return (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                GPS is not available on this device. Navigate manually using the address below.
            </div>
        );
    }

    const TRAVEL_MODES = [
        { mode: 'DRIVING', label: 'Drive', icon: Car },
        { mode: 'WALKING', label: 'Walk', icon: Footprints },
        { mode: 'BICYCLING', label: 'Bike', icon: Bike },
    ];

    return (
        <div className="flex flex-col gap-3">
            {/* Travel mode toggle */}
            <div className="flex gap-2">
                {TRAVEL_MODES.map(({ mode, label, icon: Icon }) => (
                    <button
                        key={mode}
                        onClick={() => setTravelMode(mode)}
                        className={
                            'flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-sm font-medium transition-colors ' +
                            (travelMode === mode
                                ? 'border-primary-200 bg-primary-50 text-primary-700'
                                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-surface-50 dark:hover:bg-slate-800')
                        }
                    >
                        <Icon className="size-4" /> {label}
                    </button>
                ))}
            </div>

            <MapContainer height={height} zoom={14}>
                {(map) => (
                    <RouteLayer map={map} destination={destination} travelMode={travelMode} onRouteComputed={handleRouteComputed} />
                )}
            </MapContainer>

            {/* ETA / distance display */}
            {routeInfo && (
                <div className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3">
                    <div>
                        <span className="text-lg font-extrabold text-primary-600">{routeInfo.durationText}</span>
                        <span className="ml-2 text-xs text-slate-400 dark:text-slate-500">({routeInfo.distanceText})</span>
                    </div>
                    {destinationLabel && <span className="text-right text-xs text-slate-400 dark:text-slate-500">to {destinationLabel}</span>}
                </div>
            )}

            <button
                onClick={() => {
                    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}&travelmode=${travelMode.toLowerCase()}`;
                    window.open(url, '_blank', 'noopener,noreferrer');
                }}
                className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 transition-colors hover:bg-surface-50 dark:hover:bg-slate-800"
            >
                Open in Google Maps app <ExternalLink className="size-4" />
            </button>
        </div>
    );
}
