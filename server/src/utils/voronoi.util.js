import { Delaunay } from 'd3-delaunay';
const BOUNDING_PADDING_DEG = 0.02;

export function computeWardVoronoiCells(centers) {
    if (!Array.isArray(centers) || centers.length === 0) return [];
    if (centers.length === 1) {
        const { lat, lon } = centers[0];
        const d = BOUNDING_PADDING_DEG * 4;
        return [
            {
                lat,
                lng: lon,
                polygon: [
                    [lon - d, lat - d],
                    [lon + d, lat - d],
                    [lon + d, lat + d],
                    [lon - d, lat + d],
                    [lon - d, lat - d],
                ],
            },
        ];
    }

    const points = centers.map((c) => [c.lon, c.lat]);

    const lons = points.map((p) => p[0]);
    const lats = points.map((p) => p[1]);
    const bounds = [
        Math.min(...lons) - BOUNDING_PADDING_DEG,
        Math.min(...lats) - BOUNDING_PADDING_DEG,
        Math.max(...lons) + BOUNDING_PADDING_DEG,
        Math.max(...lats) + BOUNDING_PADDING_DEG,
    ];

    const delaunay = Delaunay.from(points);
    const voronoi = delaunay.voronoi(bounds);

    return centers.map((c, i) => {
        const cell = voronoi.cellPolygon(i);
        return {
            lat: c.lat,
            lng: c.lon,
            polygon: cell ? cell.map(([lng, lat]) => [lng, lat]) : null,
        };
    });
}
