import { asyncHandler } from '../utils/asyncHandler.js';
import * as SilentSignalService from '../services/silentSignal.service.js';

export const getActiveForecasts = asyncHandler(async (req, res) => {
    const data = await SilentSignalService.getActiveForecasts(req.query);
    res.status(200).json({ success: true, data });
});

export const acknowledgeForecast = asyncHandler(async (req, res) => {
    const data = await SilentSignalService.acknowledgeForecast(req.params.id, req.user.id);
    res.status(200).json({ success: true, data });
});

export const getForecastAccuracy = asyncHandler(async (req, res) => {
    const data = await SilentSignalService.getForecastAccuracy();
    res.status(200).json({ success: true, data });
});

export const generateForecasts = asyncHandler(async (req, res) => {
    const data = await SilentSignalService.generateForecasts();
    res.status(200).json({ success: true, data });
});

export const expireAndScoreForecasts = asyncHandler(async (req, res) => {
    const data = await SilentSignalService.expireAndScoreForecasts();
    res.status(200).json({ success: true, data });
});
