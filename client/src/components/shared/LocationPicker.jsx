// src/components/shared/LocationPicker.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Tap-anywhere-to-pin map for SubmitComplaint.jsx. Used alongside (not instead
// of) the "Capture location" GPS button — citizens can fine-tune the pin after
// GPS gives an approximate fix, or place it manually if GPS fails/is denied.
// Use case 2 of 3: "location pinning for complaint submission"
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { MapContainer } from './MapContainer.jsx';
import { captureMarkerIcon } from '../../config/mapMarkers.js';

function PinLayer({ map, lat, lng, onPinMove }) {
    const markerRef = useRef(null);

    useEffect(() => {
        if (!map) return;

        // Click anywhere on the map → move/create the pin
        const clickListener = map.addListener('click', (e) => {
            const newLat = e.latLng.lat();
            const newLng = e.latLng.lng();
            onPinMove(newLat, newLng);
        });

        return () => window.google.maps.event.removeListener(clickListener);
    }, [map, onPinMove]);

    useEffect(() => {
        if (!map || lat == null || lng == null) return;

        if (!markerRef.current) {
            markerRef.current = new window.google.maps.Marker({
                map,
                position: { lat, lng },
                icon: captureMarkerIcon(),
                draggable: true,
                animation: window.google.maps.Animation.DROP,
            });

            markerRef.current.addListener('dragend', (e) => {
                onPinMove(e.latLng.lat(), e.latLng.lng());
            });
        } else {
            markerRef.current.setPosition({ lat, lng });
        }

        map.panTo({ lat, lng });
    }, [map, lat, lng]);

    useEffect(() => () => markerRef.current?.setMap(null), []);

    return null;
}

export function LocationPicker({ lat, lng, onChange, height = '280px' }) {
    const [center, setCenter] = useState(lat != null && lng != null ? { lat, lng } : undefined);

    function handlePinMove(newLat, newLng) {
        onChange(newLat, newLng);
    }

    return (
        <div className="flex flex-col gap-2">
            <MapContainer height={height} center={center} zoom={16}>
                {(map) => <PinLayer map={map} lat={lat} lng={lng} onPinMove={handlePinMove} />}
            </MapContainer>

            <p className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                <MapPin className="size-3.5 shrink-0" />
                Tap the map or drag the pin to set the exact location
            </p>
        </div>
    );
}
