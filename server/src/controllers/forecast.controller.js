import * as SilentSignalService from '../services/silentSignal.service.js';

export async function getActiveForecasts(req, res, next) {
    try {
        const data = await SilentSignalService.getActiveForecasts(req.query);
        res.status(200).json({ success: true, data });
    } catch (err) {
        next(err);
    }
}

export async function acknowledgeForecast(req, res, next) {
    try {
        const data = await SilentSignalService.acknowledgeForecast(req.params.id, req.user.id);
        res.status(200).json({ success: true, data });
    } catch (err) {
        next(err);
    }
}

export async function getForecastAccuracy(req, res, next) {
    try {
        const data = await SilentSignalService.getForecastAccuracy();
        res.status(200).json({ success: true, data });
    } catch (err) {
        next(err);
    }
}

export async function generateForecasts(req, res, next) {
    try {
        const data = await SilentSignalService.generateForecasts();
        res.status(200).json({ success: true, data });
    } catch (err) {
        next(err);
    }
}

export async function expireAndScoreForecasts(req, res, next) {
    try {
        const data = await SilentSignalService.expireAndScoreForecasts();
        res.status(200).json({ success: true, data });
    } catch (err) {
        next(err);
    }
}
