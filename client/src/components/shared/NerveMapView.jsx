// src/components/shared/NerveMapView.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Real Google Maps PulseGrid visualization for NerveMap.jsx.
//
// Layers, bottom to top:
//   1. Ward boundary polygon — the actual ward outline (GeoJSON polygon from
//                              Ward.boundary), filled + stroked in the same
//                              color as its PulseGrid stress band, so the map
//                              reads as a proper choropleth. Wards that don't
//                              have boundary data yet (e.g. freshly created by
//                              an admin) fall back to a soft heat-glow circle
//                              at their centroid so nothing is left blank.
//   2. Radar ping             — an expanding, fading ring animated on top of
//                              any critical/emergency ward so it's impossible
//                              to miss.
//   3. Ward label             — always-visible "Ward N — Name" plus health
//                              score + velocity, anchored at the ward centroid.
//   4. Click (polygon/circle) → info window — full detail on demand.
//
// Use case 1 of 3: "nerve map visualization"
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useEffect } from 'react';
import { MapContainer } from './MapContainer.jsx';
import { STRESS_BAND_META } from '../../constants/complaint.constants.js';

const HOT_BANDS = new Set(['critical', 'emergency']);

// GeoJSON coordinates are [lng, lat]; Google Maps wants { lat, lng }.
function ringToPath(ring) {
    return ring.map(([lng, lat]) => ({ lat, lng }));
}

function wardCentroidLatLng(ward) {
    if (ward.location?.coordinates?.length === 2) {
        const [lng, lat] = ward.location.coordinates;
        return { lat, lng };
    }
    // No stored centroid — fall back to averaging the outer boundary ring.
    const ring = ward.boundary?.coordinates?.[0];
    if (ring?.length) {
        const sum = ring.reduce((acc, [lng, lat]) => ({ lat: acc.lat + lat, lng: acc.lng + lng }), {
            lat: 0,
            lng: 0,
        });
        return { lat: sum.lat / ring.length, lng: sum.lng / ring.length };
    }
    return null;
}

// ── WardLabelOverlay ────────────────────────────────────────────────────────
// Always-visible HTML label pinned to a LatLng: ward number + name, plus a
// small health-score/velocity readout. Built as a raw google.maps.OverlayView
// (rather than a React portal) so it stays perfectly anchored to the map's
// projection during pan/zoom, same as native markers.
function createWardLabelOverlayClass() {
    class WardLabelOverlay extends window.google.maps.OverlayView {
        constructor(position, ward, meta) {
            super();
            this.position = position;
            this.ward = ward;
            this.meta = meta;
            this.div = null;
        }

        onAdd() {
            const div = document.createElement('div');
            div.style.position = 'absolute';
            div.style.transform = 'translate(-50%, -50%)';
            div.style.pointerEvents = 'none';
            div.style.display = 'flex';
            div.style.flexDirection = 'column';
            div.style.alignItems = 'center';
            div.style.gap = '3px';
            div.style.fontFamily = 'Inter, ui-sans-serif, system-ui, sans-serif';
            div.style.whiteSpace = 'nowrap';
            div.style.zIndex = '1';

            const velocity = (this.ward.pulseVelocity ?? 1).toFixed(1);
            div.innerHTML = `
                <span style="
                    padding: 2px 8px;
                    border-radius: 6px;
                    font-size: 11px;
                    font-weight: 700;
                    color: #0f172a;
                    background: rgba(255,255,255,0.92);
                    border: 1.5px solid ${this.meta.color};
                    box-shadow: 0 1px 4px rgba(15,23,42,0.25);
                ">Ward ${this.ward.wardNumber ?? '—'} · ${this.ward.name ?? ''}</span>
                <span style="
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    padding: 1px 7px;
                    border-radius: 9999px;
                    font-size: 10px;
                    font-weight: 700;
                    color: #ffffff;
                    background: ${this.meta.color};
                    box-shadow: 0 1px 3px rgba(15,23,42,0.3);
                ">${this.ward.healthScore ?? '—'} <span style="opacity:0.85;font-weight:600;">· ${velocity}×</span></span>
            `;
            this.div = div;

            const panes = this.getPanes();
            panes.overlayMouseTarget.appendChild(div);
        }

        draw() {
            if (!this.div) return;
            const projection = this.getProjection();
            if (!projection) return;
            const point = projection.fromLatLngToDivPixel(this.position);
            if (!point) return;
            this.div.style.left = `${point.x}px`;
            this.div.style.top = `${point.y}px`;
        }

        onRemove() {
            if (this.div?.parentNode) {
                this.div.parentNode.removeChild(this.div);
            }
            this.div = null;
        }
    }
    return WardLabelOverlay;
}

// ── RadarPingOverlay ───────────────────────────────────────────────────────────
// An expanding, fading ring "pinging" outward from critical/emergency wards —
// pure CSS animation (see .veyu-pulse-ring in index.css), rendered on the map
// itself so the eye is drawn straight to the wards that need attention most.
function createRadarPingOverlayClass() {
    class RadarPingOverlay extends window.google.maps.OverlayView {
        constructor(position, color, sizePx) {
            super();
            this.position = position;
            this.color = color;
            this.sizePx = sizePx;
            this.div = null;
        }

        onAdd() {
            const div = document.createElement('div');
            div.style.position = 'absolute';
            div.style.width = `${this.sizePx}px`;
            div.style.height = `${this.sizePx}px`;
            div.style.marginLeft = `${-this.sizePx / 2}px`;
            div.style.marginTop = `${-this.sizePx / 2}px`;
            div.style.borderRadius = '9999px';
            div.style.border = `2px solid ${this.color}`;
            div.style.pointerEvents = 'none';
            div.style.zIndex = '0';
            div.className = 'veyu-pulse-ring';
            this.div = div;
            this.getPanes().overlayLayer.appendChild(div);
        }

        draw() {
            if (!this.div) return;
            const projection = this.getProjection();
            if (!projection) return;
            const point = projection.fromLatLngToDivPixel(this.position);
            if (!point) return;
            this.div.style.left = `${point.x}px`;
            this.div.style.top = `${point.y}px`;
        }

        onRemove() {
            if (this.div?.parentNode) {
                this.div.parentNode.removeChild(this.div);
            }
            this.div = null;
        }
    }
    return RadarPingOverlay;
}

function infoWindowContent(ward, meta) {
    const velocity = ward.pulseVelocity ?? 1;
    return `
        <div style="font-family: Inter, sans-serif; padding: 4px 2px; min-width: 180px;">
            <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">
                ${ward.name}
            </div>
            <div style="font-size: 11px; color: #475569; margin-bottom: 6px;">
                Ward ${ward.wardNumber}
            </div>
            <div style="display: flex; gap: 10px; font-size: 11px; margin-bottom: 4px;">
                <span style="color: ${meta.color}; font-weight: 700;">${meta.label}</span>
                <span style="color: #64748b;">${velocity.toFixed(1)}× velocity</span>
            </div>
            <div style="display: flex; gap: 10px; font-size: 11px; color: #64748b;">
                <span>Health: <strong style="color:#0f172a;">${ward.healthScore ?? '—'}</strong></span>
                <span>Last 48h: <strong style="color:#0f172a;">${ward.complaintsLast48h ?? 0}</strong></span>
            </div>
        </div>
    `;
}

function WardOverlay({ map, wards, onSelectWard }) {
    const polygonsRef = useRef([]);
    const overlaysRef = useRef([]);
    const shapesRef = useRef([]); // fallback heat-glow circles for boundary-less wards
    const infoWindowRef = useRef(null);

    useEffect(() => {
        if (!map || !window.google?.maps) return;

        // Clear everything from the previous render
        polygonsRef.current.forEach((p) => p.setMap(null));
        polygonsRef.current = [];
        overlaysRef.current.forEach((o) => o.setMap(null));
        overlaysRef.current = [];
        shapesRef.current.forEach((s) => s.setMap(null));
        shapesRef.current = [];

        if (!infoWindowRef.current) {
            infoWindowRef.current = new window.google.maps.InfoWindow({
                pixelOffset: new window.google.maps.Size(0, -8),
            });
        }

        const WardLabelOverlay = createWardLabelOverlayClass();
        const RadarPingOverlay = createRadarPingOverlayClass();
        const bounds = new window.google.maps.LatLngBounds();
        let plotted = 0;

        wards.forEach((ward) => {
            const centroid = wardCentroidLatLng(ward);
            if (!centroid) return; // no boundary and no location — nothing to plot

            const meta = STRESS_BAND_META[ward.stressBand] ?? STRESS_BAND_META.stable;
            const latLng = new window.google.maps.LatLng(centroid.lat, centroid.lng);
            const recentLoad = ward.complaintsLast48h ?? 0;
            const outerRing = ward.boundary?.coordinates?.[0];

            const openInfoWindow = (anchorLatLng) => {
                infoWindowRef.current.setContent(infoWindowContent(ward, meta));
                infoWindowRef.current.setPosition(anchorLatLng);
                infoWindowRef.current.open(map);
                onSelectWard?.(ward);
            };

            if (outerRing?.length >= 3) {
                // ── 1a. Real boundary — choropleth polygon colored by stress band
                const polygon = new window.google.maps.Polygon({
                    map,
                    paths: ringToPath(outerRing),
                    fillColor: meta.color,
                    fillOpacity: 0.32,
                    strokeColor: meta.color,
                    strokeOpacity: 0.9,
                    strokeWeight: 2,
                    clickable: true,
                    zIndex: Math.round((ward.healthScore ?? 0) * -1) + 1000,
                });
                polygon.addListener('click', (e) => openInfoWindow(e.latLng ?? latLng));
                polygonsRef.current.push(polygon);
            } else {
                // ── 1b. No boundary yet — soft heat-glow circle fallback so the
                // ward is still visible on the map (e.g. a brand-new admin-created ward).
                const heatRadius = Math.min(400 + recentLoad * 60 + (ward.pulseVelocity ?? 1) * 150, 2400);
                const circle = new window.google.maps.Circle({
                    map,
                    center: latLng,
                    radius: heatRadius,
                    fillColor: meta.color,
                    fillOpacity: 0.18,
                    strokeColor: meta.color,
                    strokeOpacity: 0.5,
                    strokeWeight: 1.5,
                    clickable: true,
                    zIndex: 0,
                });
                circle.addListener('click', () => openInfoWindow(latLng));
                shapesRef.current.push(circle);
            }

            // ── 2. Radar ping — only for wards that actually need eyes on them
            if (HOT_BANDS.has(ward.stressBand)) {
                const ping = new RadarPingOverlay(latLng, meta.color, 46);
                ping.setMap(map);
                overlaysRef.current.push(ping);
            }

            // ── 3. Label — ward number, name, health score + velocity
            const label = new WardLabelOverlay(latLng, ward, meta);
            label.setMap(map);
            overlaysRef.current.push(label);

            if (outerRing?.length >= 3) {
                outerRing.forEach(([lng, lat]) => bounds.extend(new window.google.maps.LatLng(lat, lng)));
            } else {
                bounds.extend(latLng);
            }
            plotted += 1;
        });

        // Frame every plotted ward on first load so the data is visible
        // without the person needing to manually pan/zoom to find it.
        if (plotted > 1) {
            map.fitBounds(bounds, 48);
        } else if (plotted === 1) {
            map.setCenter(bounds.getCenter());
            map.setZoom(14);
        }

        return () => {
            polygonsRef.current.forEach((p) => p.setMap(null));
            overlaysRef.current.forEach((o) => o.setMap(null));
            shapesRef.current.forEach((s) => s.setMap(null));
        };
    }, [map, wards]);

    return null;
}

export function NerveMapView({ wards, onSelectWard, height = '480px' }) {
    const hasData = wards?.length > 0;
    const hotCount = wards?.filter((w) => HOT_BANDS.has(w.stressBand)).length ?? 0;

    return (
        <div className="flex flex-col gap-3">
            <MapContainer height={height} zoom={12}>
                {(map) => <WardOverlay map={map} wards={wards} onSelectWard={onSelectWard} />}
            </MapContainer>

            {!hasData && (
                <p className="text-center text-xs text-slate-400 dark:text-slate-500">
                    No ward data to plot yet — the map will populate as soon as the PulseGrid snapshot loads.
                </p>
            )}

            {hasData && hotCount > 0 && (
                <p className="text-center text-xs font-medium text-rose-500 dark:text-rose-400">
                    {hotCount} ward{hotCount !== 1 ? 's' : ''} pulsing on the map need attention — look for the radar rings.
                </p>
            )}

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-4">
                {Object.entries(STRESS_BAND_META).map(([key, m]) => (
                    <span key={key} className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <span className="inline-block size-2 rounded-full" style={{ background: m.color }} />
                        {m.label}
                    </span>
                ))}
                <span className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                    <span className="inline-flex items-center rounded-full bg-slate-700 px-1.5 py-0.5 text-[0.6rem] font-bold text-white">
                        82 · 1.4×
                    </span>
                    health score · velocity
                </span>
                <span className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                    <span className="relative inline-flex size-2.5 items-center justify-center">
                        <span className="absolute inline-flex size-2.5 animate-ping rounded-full bg-rose-400 opacity-75" />
                        <span className="relative inline-flex size-1.5 rounded-full bg-rose-500" />
                    </span>
                    critical / emergency
                </span>
            </div>
        </div>
    );
}
