// src/components/shared/NerveMapView.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Real Google Maps PulseGrid visualization for NerveMap.jsx.
//
// Layers, bottom to top:
//   1. Heat-glow circle   — soft colored halo per ward, radius scaled by
//                           complaint volume, color/opacity scaled by stress
//                           band, so the map reads like a heatmap at a glance.
//   2. Radar ping         — an expanding, fading ring animated on top of any
//                           critical/emergency ward so it's impossible to miss.
//   3. Marker              — colored pin, sized by pulse velocity, labeled
//                           with the ward number.
//   4. Data chip           — always-visible health score + velocity readout,
//                           no click required.
//   5. Click → info window — full detail on demand.
//
// Use case 1 of 3: "nerve map visualization"
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useEffect } from 'react';
import { MapContainer } from './MapContainer.jsx';
import { wardMarkerIcon } from '../../config/mapMarkers.js';
import { STRESS_BAND_META } from '../../constants/complaint.constants.js';

const HOT_BANDS = new Set(['critical', 'emergency']);

// ── DataChipOverlay ────────────────────────────────────────────────────────────
// A small always-visible HTML chip pinned to a LatLng, showing the ward's
// health score and stress band right on the map. Built as a raw
// google.maps.OverlayView (rather than a React portal) so it stays perfectly
// anchored to the map's projection during pan/zoom, same as native markers.
function createDataChipOverlayClass() {
    class DataChipOverlay extends window.google.maps.OverlayView {
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
            div.style.transform = 'translate(14px, -14px)';
            div.style.pointerEvents = 'none';
            div.style.whiteSpace = 'nowrap';
            div.style.display = 'flex';
            div.style.alignItems = 'center';
            div.style.gap = '4px';
            div.style.padding = '2px 7px';
            div.style.borderRadius = '9999px';
            div.style.fontFamily = 'Inter, ui-sans-serif, system-ui, sans-serif';
            div.style.fontSize = '11px';
            div.style.fontWeight = '700';
            div.style.color = '#ffffff';
            div.style.background = this.meta.color;
            div.style.boxShadow = '0 2px 6px rgba(15, 23, 42, 0.35)';
            div.style.border = '1.5px solid rgba(255,255,255,0.85)';
            div.style.zIndex = '1';
            div.innerHTML = `
                <span>${this.ward.healthScore ?? '—'}</span>
                <span style="opacity:0.85;font-weight:600;">· ${(this.ward.pulseVelocity ?? 1).toFixed(1)}×</span>
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
    return DataChipOverlay;
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

function WardOverlay({ map, wards, onSelectWard }) {
    const markersRef = useRef([]);
    const overlaysRef = useRef([]);
    const circlesRef = useRef([]);
    const infoWindowRef = useRef(null);

    useEffect(() => {
        if (!map || !window.google?.maps) return;

        // Clear everything from the previous render
        markersRef.current.forEach((m) => m.setMap(null));
        markersRef.current = [];
        overlaysRef.current.forEach((o) => o.setMap(null));
        overlaysRef.current = [];
        circlesRef.current.forEach((c) => c.setMap(null));
        circlesRef.current = [];

        if (!infoWindowRef.current) {
            infoWindowRef.current = new window.google.maps.InfoWindow({
                pixelOffset: new window.google.maps.Size(0, -8),
            });
        }

        const DataChipOverlay = createDataChipOverlayClass();
        const RadarPingOverlay = createRadarPingOverlayClass();
        const bounds = new window.google.maps.LatLngBounds();
        let plotted = 0;

        wards.forEach((ward) => {
            // Use centroid if boundary polygon exists, else ward's own coordinates
            const position = ward.centroid ?? ward.location;
            if (!position?.lat || !position?.lng) return;

            const meta = STRESS_BAND_META[ward.stressBand] ?? STRESS_BAND_META.stable;
            const latLng = new window.google.maps.LatLng(position.lat, position.lng);
            const velocity = ward.pulseVelocity ?? 1;
            const recentLoad = ward.complaintsLast48h ?? 0;

            // ── 1. Heat-glow circle — soft halo scaled by complaint volume,
            // so dense/hot wards visually "bleed" more than quiet ones, giving
            // the whole map a heatmap-like read even before you look at pins.
            const heatRadius = Math.min(400 + recentLoad * 60 + velocity * 150, 2400);
            const heatOpacity = ward.stressBand === 'emergency' ? 0.22 : ward.stressBand === 'critical' ? 0.18 : ward.stressBand === 'rising' ? 0.13 : 0.08;
            const heatCircle = new window.google.maps.Circle({
                map,
                center: latLng,
                radius: heatRadius,
                fillColor: meta.color,
                fillOpacity: heatOpacity,
                strokeColor: meta.color,
                strokeOpacity: 0.28,
                strokeWeight: 1,
                clickable: false,
                zIndex: 0,
            });
            circlesRef.current.push(heatCircle);

            // ── 2. Radar ping — only for wards that actually need eyes on them
            if (HOT_BANDS.has(ward.stressBand)) {
                const ping = new RadarPingOverlay(latLng, meta.color, 46);
                ping.setMap(map);
                overlaysRef.current.push(ping);
            }

            // ── 3. Marker — scaled by velocity, labeled with ward number
            const scale = Math.max(0.85, Math.min(velocity / 2, 1.8));
            const marker = new window.google.maps.Marker({
                map,
                position: latLng,
                icon: wardMarkerIcon(meta.color, scale),
                title: `${ward.name} — ${meta.label} · health ${ward.healthScore ?? '—'}`,
                label: {
                    text: String(ward.wardNumber ?? ''),
                    color: '#ffffff',
                    fontSize: '10px',
                    fontWeight: '700',
                },
                zIndex: Math.round((ward.healthScore ?? 0) * -1) + 1000,
            });

            // ── 4. Data chip — live numbers, always visible
            const chip = new DataChipOverlay(latLng, ward, meta);
            chip.setMap(map);
            overlaysRef.current.push(chip);

            // ── 5. Click → full detail
            marker.addListener('click', () => {
                infoWindowRef.current.setContent(`
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
                            <span>Last 48h: <strong style="color:#0f172a;">${recentLoad}</strong></span>
                        </div>
                    </div>
                `);
                infoWindowRef.current.open(map, marker);
                onSelectWard?.(ward);
            });

            markersRef.current.push(marker);
            bounds.extend(latLng);
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
            markersRef.current.forEach((m) => m.setMap(null));
            overlaysRef.current.forEach((o) => o.setMap(null));
            circlesRef.current.forEach((c) => c.setMap(null));
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
