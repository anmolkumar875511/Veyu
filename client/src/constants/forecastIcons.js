// src/constants/forecastIcons.js
// Maps SilentSignal forecast trigger types to Lucide icons (replaces emoji).

import { Calendar, CloudRain, TrendingUp, Zap } from 'lucide-react';

export const FORECAST_TRIGGER_ICON_MAP = {
    seasonal: Calendar,
    weather: CloudRain,
    velocity: TrendingUp,
    combined: Zap,
};

export function getForecastTriggerIcon(trigger) {
    return FORECAST_TRIGGER_ICON_MAP[trigger] ?? Zap;
}
