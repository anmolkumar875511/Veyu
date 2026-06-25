import { logger } from '../utils/logger.js';

const SCOPE = 'Weather';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

export async function getRainForecast(days = 5) {
    const { OPENWEATHER_API_KEY, CITY_LAT, CITY_LON } = process.env;

    if (!OPENWEATHER_API_KEY || !CITY_LAT || !CITY_LON) {
        logger.warn(SCOPE, 'Missing OPENWEATHER_API_KEY or city coordinates — skipping forecast.');
        return [];
    }

    try {
        const url = `${BASE_URL}/forecast?lat=${CITY_LAT}&lon=${CITY_LON}&appid=${OPENWEATHER_API_KEY}&units=metric`;
        const res = await fetch(url);

        if (!res.ok) {
            logger.warn(SCOPE, `API returned ${res.status} — skipping forecast.`);
            return [];
        }

        const data = await res.json();
        const dailyMap = new Map();

        for (const entry of data.list ?? []) {
            const date = entry.dt_txt.split(' ')[0];
            const rainMm = entry.rain?.['3h'] ?? 0;
            const condition = entry.weather?.[0]?.main ?? 'Clear';

            if (!dailyMap.has(date)) {
                dailyMap.set(date, { date, rainMm: 0, condition });
            }
            const day = dailyMap.get(date);
            day.rainMm += rainMm;
            if (['Rain', 'Thunderstorm', 'Drizzle'].includes(condition)) {
                day.condition = condition;
            }
        }

        return Array.from(dailyMap.values())
            .slice(0, days)
            .map((d) => ({ ...d, rainMm: Math.round(d.rainMm * 10) / 10 }));
    } catch (err) {
        logger.warn(SCOPE, `Fetch failed: ${err.message}`);
        return [];
    }
}

export async function getPeakRainDay() {
    const forecast = await getRainForecast(5);
    if (forecast.length === 0) return null;

    const peak = forecast.reduce((max, d) => (d.rainMm > max.rainMm ? d : max), forecast[0]);
    return peak.rainMm >= 5 ? peak : null;
}
