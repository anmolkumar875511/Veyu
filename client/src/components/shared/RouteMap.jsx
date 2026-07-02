// src/components/shared/RouteMap.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Shows a driving/walking route from the field worker's current GPS position
// to the complaint location, with live ETA and distance. Used on TaskDetail.jsx.
// Use case 3 of 3: "make route for worker to location"
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useEffect, useState } from 'react';
import { MapContainer } from './MapContainer.jsx';
import { workerLocationIcon, destinationMarkerIcon } from '../../config/mapMarkers.js';
import { color, font, radius, space, mk } from '../../theme/index.js';

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
                strokeColor: color.accent,
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
            <div
                style={{
                    padding: space[4],
                    background: color.dangerSurface,
                    border: `1px solid ${color.dangerBorder}`,
                    borderRadius: radius.md,
                    color: '#fca5a5',
                    fontSize: font.size.sm,
                }}
            >
                GPS is not available on this device. Navigate manually using the address below.
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: space[3] }}>
            {/* Travel mode toggle */}
            <div style={{ display: 'flex', gap: space[2] }}>
                {[
                    { mode: 'DRIVING', label: '🚗 Drive' },
                    { mode: 'WALKING', label: '🚶 Walk' },
                    { mode: 'BICYCLING', label: '🚲 Bike' },
                ].map(({ mode, label }) => (
                    <button
                        key={mode}
                        onClick={() => setTravelMode(mode)}
                        style={{
                            flex: 1,
                            background: travelMode === mode ? color.accentMuted : color.bgSurface,
                            border: `1px solid ${travelMode === mode ? color.accent : color.borderDefault}`,
                            borderRadius: radius.md,
                            color: travelMode === mode ? color.accent : color.textSecondary,
                            fontSize: font.size.sm,
                            fontWeight: font.weight.medium,
                            padding: '0.5rem',
                            cursor: 'pointer',
                        }}
                    >
                        {label}
                    </button>
                ))}
            </div>

            <MapContainer height={height} zoom={14}>
                {(map) => (
                    <RouteLayer
                        map={map}
                        destination={destination}
                        travelMode={travelMode}
                        onRouteComputed={handleRouteComputed}
                    />
                )}
            </MapContainer>

            {/* ETA / distance display */}
            {routeInfo && (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: color.bgSurface,
                        border: `1px solid ${color.borderDefault}`,
                        borderRadius: radius.lg,
                        padding: `${space[3]} ${space[4]}`,
                    }}
                >
                    <div>
                        <span
                            style={{
                                fontSize: font.size.lg,
                                fontWeight: font.weight.extrabold,
                                color: color.accent,
                            }}
                        >
                            {routeInfo.durationText}
                        </span>
                        <span
                            style={{
                                fontSize: font.size.xs,
                                color: color.textMuted,
                                marginLeft: space[2],
                            }}
                        >
                            ({routeInfo.distanceText})
                        </span>
                    </div>
                    {destinationLabel && (
                        <span
                            style={{
                                fontSize: font.size.xs,
                                color: color.textMuted,
                                textAlign: 'right',
                            }}
                        >
                            to {destinationLabel}
                        </span>
                    )}
                </div>
            )}

            <button
                onClick={() => {
                    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}&travelmode=${travelMode.toLowerCase()}`;
                    window.open(url, '_blank', 'noopener,noreferrer');
                }}
                style={mk.btnSecondary()}
            >
                Open in Google Maps app →
            </button>
        </div>
    );
}
