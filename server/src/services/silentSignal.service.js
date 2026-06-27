import Forecast, { FORECAST_STATUS, FORECAST_TRIGGERS } from '../models/forecast.model.js';
import Complaint from '../models/complaint.model.js';
import Ward from '../models/ward.model.js';
import User from '../models/user.model.js';
import { NOTIFICATION_TYPES } from '../models/notification.model.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';
import { getRainForecast } from './weather.service.js';
import { notify } from './notification.service.js';
import { SILENT_SIGNAL } from '../constants/index.js';

const SCOPE = 'SilentSignal';
const DAY_MS = 86_400_000;

const {
    WEATHER_SENSITIVE_CATEGORIES,
    RAIN_EVENT_THRESHOLD_MM,
    SEASONAL_SIGNIFICANCE_MULTIPLIER,
    SEASONAL_WINDOW_DAYS,
    FORECAST_VALIDITY_DAYS,
    MIN_YEARS_FOR_PATTERN,
} = SILENT_SIGNAL;

async function detectSeasonalPatterns() {
    const now = new Date();
    const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / DAY_MS);

    const results = await Complaint.aggregate([
        {
            $project: {
                wardId: 1,
                category: 1,
                createdAt: 1,
                year: { $year: '$createdAt' },
                dayOfYear: { $dayOfYear: '$createdAt' },
            },
        },
        {
            $match: {
                $expr: {
                    $lte: [
                        { $abs: { $subtract: ['$dayOfYear', dayOfYear] } },
                        SEASONAL_WINDOW_DAYS,
                    ],
                },
            },
        },
        {
            $group: {
                _id: { wardId: '$wardId', category: '$category', year: '$year' },
                windowCount: { $sum: 1 },
            },
        },
        {
            $group: {
                _id: { wardId: '$_id.wardId', category: '$_id.category' },
                avgWindowCount: { $avg: '$windowCount' },
                yearsObserved: { $push: '$_id.year' },
                yearCount: { $sum: 1 },
            },
        },
        { $match: { yearCount: { $gte: MIN_YEARS_FOR_PATTERN } } },
    ]);

    const patterns = [];

    for (const r of results) {
        const { wardId, category } = r._id;

        const yearlyTotal = await Complaint.countDocuments({ wardId, category });
        const yearlyBaselinePerWindow = yearlyTotal / (365 / (SEASONAL_WINDOW_DAYS * 2));

        if (yearlyBaselinePerWindow === 0) continue;

        const multiplier = r.avgWindowCount / yearlyBaselinePerWindow;

        if (multiplier >= SEASONAL_SIGNIFICANCE_MULTIPLIER) {
            patterns.push({
                wardId,
                category,
                multiplier: Math.round(multiplier * 10) / 10,
                yearsObserved: r.yearsObserved,
                avgWindowCount: Math.round(r.avgWindowCount * 10) / 10,
            });
        }
    }

    return patterns;
}

function buildWeatherInfo(forecast, category) {
    if (!WEATHER_SENSITIVE_CATEGORIES.includes(category)) return null;
    if (!forecast || forecast.length === 0) return null;

    const peakRainDay = forecast.reduce(
        (max, d) => (d.rainMm > (max?.rainMm ?? 0) ? d : max),
        null
    );
    if (!peakRainDay || peakRainDay.rainMm < RAIN_EVENT_THRESHOLD_MM) return null;

    return {
        forecastDate: new Date(peakRainDay.date),
        forecastMm: peakRainDay.rainMm,
        condition: peakRainDay.condition,
        historicalThresholdMm: RAIN_EVENT_THRESHOLD_MM,
    };
}

async function checkMonsoonShare(wardId, category) {
    const [monsoonCount, totalCount] = await Promise.all([
        Complaint.countDocuments({
            wardId,
            category,
            $expr: { $in: [{ $month: '$createdAt' }, [6, 7, 8, 9]] },
        }),
        Complaint.countDocuments({ wardId, category }),
    ]);
    if (totalCount === 0) return 0;
    return monsoonCount / totalCount;
}

async function notifyWardOfficer(wardId, forecast, wardName) {
    const officer = await User.findOne({
        assignedWard: wardId,
        role: 'officer',
        isActive: true,
    }).select('_id');
    if (!officer) return;

    await notify({
        userId: officer._id,
        type: NOTIFICATION_TYPES.SILENT_SIGNAL_ALERT,
        data: { summary: forecast.summary },
        refModel: 'Forecast',
        refId: forecast._id,
    });
}

export async function generateForecasts() {
    const seasonalPatterns = await detectSeasonalPatterns();

    const cityWeatherForecast = await getRainForecast(5);

    const created = [];

    for (const pattern of seasonalPatterns) {
        const { wardId, category, multiplier, yearsObserved, avgWindowCount } = pattern;

        const existing = await Forecast.findOne({
            wardId,
            category,
            status: FORECAST_STATUS.ACTIVE,
            createdAt: { $gte: new Date(Date.now() - 14 * DAY_MS) },
        });
        if (existing) continue;

        const ward = await Ward.findById(wardId).select('name');
        const wardName = ward?.name ?? 'Unknown ward';

        const baseWeatherInfo = buildWeatherInfo(cityWeatherForecast, category);
        let weatherInfo = null;

        if (baseWeatherInfo) {
            const monsoonShare = await checkMonsoonShare(wardId, category);
            if (monsoonShare >= 0.5) {
                weatherInfo = {
                    ...baseWeatherInfo,
                    monsoonShare: Math.round(monsoonShare * 100) / 100,
                };
            }
        }

        const predictedStartDate = new Date();
        const predictedEndDate = new Date(Date.now() + FORECAST_VALIDITY_DAYS * DAY_MS);

        let trigger = FORECAST_TRIGGERS.SEASONAL;
        let confidence = Math.min(
            0.95,
            0.5 + (multiplier - SEASONAL_SIGNIFICANCE_MULTIPLIER) * 0.15
        );
        let summary = `${wardName} historically receives ${multiplier}x more ${category} complaints during this period of the year, based on data from ${yearsObserved.join(', ')}.`;

        if (weatherInfo) {
            trigger = FORECAST_TRIGGERS.COMBINED;
            confidence = Math.min(0.97, confidence + 0.2);
            summary = `${wardName} historically receives ${multiplier}x more ${category} complaints following heavy rain (${Math.round(weatherInfo.monsoonShare * 100)}% of cases occur in monsoon months). Forecast shows ${weatherInfo.forecastMm}mm rain expected around ${weatherInfo.forecastDate.toLocaleDateString('en-IN')}.`;
        }

        const forecast = await Forecast.create({
            wardId,
            category,
            predictedStartDate,
            predictedEndDate,
            expectedMultiplier: multiplier,
            trigger,
            confidence: Math.round(confidence * 100) / 100,
            summary,
            weatherContext: weatherInfo
                ? {
                      condition: weatherInfo.condition,
                      forecastMm: weatherInfo.forecastMm,
                      forecastDate: weatherInfo.forecastDate,
                      historicalThresholdMm: weatherInfo.historicalThresholdMm,
                  }
                : undefined,
            historicalYears: yearsObserved,
            baselineAvgComplaints: avgWindowCount,
        });

        await notifyWardOfficer(wardId, forecast, wardName);
        created.push(forecast);
    }

    logger.info(
        SCOPE,
        `Generated ${created.length} forecast(s) from ${seasonalPatterns.length} detected pattern(s)`
    );

    return { created: created.length, forecasts: created };
}

export async function getActiveForecasts(query) {
    const { wardId, category } = query;
    const minConfidence = parseFloat(query.minConfidence) || 0.6;

    const filter = {
        status: FORECAST_STATUS.ACTIVE,
        confidence: { $gte: minConfidence },
    };
    if (wardId) filter.wardId = wardId;
    if (category) filter.category = category;

    const forecasts = await Forecast.find(filter)
        .sort({ confidence: -1, predictedStartDate: 1 })
        .populate('wardId', 'name wardNumber')
        .lean();

    return { forecasts };
}

export async function acknowledgeForecast(forecastId, officerId) {
    const forecast = await Forecast.findById(forecastId);
    if (!forecast) throw ApiError.notFound('Forecast');

    forecast.status = FORECAST_STATUS.ACKNOWLEDGED;
    forecast.acknowledgedBy = officerId;
    forecast.acknowledgedAt = new Date();
    await forecast.save();

    return { forecast };
}

export async function expireAndScoreForecasts() {
    const toScore = await Forecast.find({
        status: { $in: [FORECAST_STATUS.ACTIVE, FORECAST_STATUS.ACKNOWLEDGED] },
        predictedEndDate: { $lt: new Date() },
        actualComplaintsInWindow: null,
    });

    let confirmed = 0;
    let expired = 0;

    for (const f of toScore) {
        const actualCount = await Complaint.countDocuments({
            wardId: f.wardId,
            category: f.category,
            createdAt: { $gte: f.predictedStartDate, $lte: f.predictedEndDate },
        });

        f.actualComplaintsInWindow = actualCount;

        const wasAccurate = f.baselineAvgComplaints
            ? actualCount >= f.baselineAvgComplaints * 1.3
            : actualCount > 0;

        f.status = wasAccurate ? FORECAST_STATUS.CONFIRMED : FORECAST_STATUS.EXPIRED;
        wasAccurate ? confirmed++ : expired++;

        await f.save();
    }

    logger.info(
        SCOPE,
        `Scored ${toScore.length} forecast(s): ${confirmed} confirmed, ${expired} expired`
    );

    return { scored: toScore.length, confirmed, expired };
}

export async function getForecastAccuracy() {
    const [confirmed, expired, totalScored] = await Promise.all([
        Forecast.countDocuments({ status: FORECAST_STATUS.CONFIRMED }),
        Forecast.countDocuments({
            status: FORECAST_STATUS.EXPIRED,
            actualComplaintsInWindow: { $ne: null },
        }),
        Forecast.countDocuments({ actualComplaintsInWindow: { $ne: null } }),
    ]);

    return {
        confirmed,
        expired,
        totalScored,
        accuracyRate: totalScored > 0 ? Math.round((confirmed / totalScored) * 100) : null,
    };
}
