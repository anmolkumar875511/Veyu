// src/components/shared/NerveMapView.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Real Google Maps PulseGrid visualization for NerveMap.jsx.
// Plots a colored marker at each ward's centroid (computed from boundary
// polygon if present, or ward's stored lat/lng), sized/colored by stress band.
// Use case 1 of 3: "nerve map visualization"
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useEffect } from 'react';
import { MapContainer } from './MapContainer.jsx';
import { wardMarkerIcon } from '../../config/mapMarkers.js';
import { STRESS_BAND_META } from '../../constants/complaint.constants.js';
import { color, font, radius, space } from '../../theme/index.js';

function WardOverlay({ map, wards, onSelectWard }) {
    const markersRef = useRef([]);
    const infoWindowRef = useRef(null);

    useEffect(() => {
        if (!map) return;

        // Clear previous markers on re-render
        markersRef.current.forEach((m) => m.setMap(null));
        markersRef.current = [];

        if (!infoWindowRef.current) {
            infoWindowRef.current = new window.google.maps.InfoWindow({
                pixelOffset: new window.google.maps.Size(0, -8),
            });
        }

        wards.forEach((ward) => {
            // Use centroid if boundary polygon exists, else ward's own coordinates
            const position = ward.centroid ?? ward.location;
            if (!position) return;

            const meta = STRESS_BAND_META[ward.stressBand] ?? STRESS_BAND_META.stable;

            const marker = new window.google.maps.Marker({
                map,
                position: { lat: position.lat, lng: position.lng },
                icon: wardMarkerIcon(meta.color),
                title: ward.name,
            });

            marker.addListener('click', () => {
                infoWindowRef.current.setContent(`
                    <div style="font-family: Inter, sans-serif; padding: 4px 2px; min-width: 160px;">
                        <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">
                            ${ward.name}
                        </div>
                        <div style="font-size: 11px; color: #475569; margin-bottom: 6px;">
                            Ward ${ward.wardNumber}
                        </div>
                        <div style="display: flex; gap: 8px; font-size: 11px;">
                            <span style="color: ${meta.color}; font-weight: 700;">${meta.label}</span>
                            <span style="color: #64748b;">${ward.pulseVelocity?.toFixed(1)}× velocity</span>
                        </div>
                    </div>
                `);
                infoWindowRef.current.open(map, marker);
                onSelectWard?.(ward);
            });

            markersRef.current.push(marker);
        });

        return () => {
            markersRef.current.forEach((m) => m.setMap(null));
        };
    }, [map, wards]);

    return null;
}

export function NerveMapView({ wards, onSelectWard, height = '480px' }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: space[3] }}>
            <MapContainer height={height} zoom={12}>
                {(map) => <WardOverlay map={map} wards={wards} onSelectWard={onSelectWard} />}
            </MapContainer>

            {/* Legend */}
            <div
                style={{
                    display: 'flex',
                    gap: space[4],
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                }}
            >
                {Object.entries(STRESS_BAND_META).map(([key, m]) => (
                    <span
                        key={key}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            fontSize: font.size.xs,
                            color: color.textMuted,
                        }}
                    >
                        <span
                            style={{
                                width: '0.5rem',
                                height: '0.5rem',
                                borderRadius: radius.full,
                                background: m.color,
                                display: 'inline-block',
                            }}
                        />
                        {m.label}
                    </span>
                ))}
            </div>
        </div>
    );
}
