import * as WardService from '../services/ward.service.js';
import * as PulseGridService from '../services/pulseGrid.service.js';

export async function listWards(req, res, next) {
    try {
        const data = await WardService.listWards(req.query);
        res.status(200).json({ success: true, data });
    } catch (err) {
        next(err);
    }
}

export async function getWardLeaderboard(req, res, next) {
    try {
        const data = await WardService.getWardLeaderboard();
        res.status(200).json({ success: true, data });
    } catch (err) {
        next(err);
    }
}

export async function getPulseGridSnapshot(req, res, next) {
    try {
        const data = await PulseGridService.getPulseGridSnapshot();
        res.status(200).json({ success: true, data: { wards: data } });
    } catch (err) {
        next(err);
    }
}

export async function getWardById(req, res, next) {
    try {
        const data = await WardService.getWardById(req.params.id);
        res.status(200).json({ success: true, data });
    } catch (err) {
        next(err);
    }
}

export async function createWard(req, res, next) {
    try {
        const data = await WardService.createWard(req.body);
        res.status(201).json({ success: true, data });
    } catch (err) {
        next(err);
    }
}

export async function updateWard(req, res, next) {
    try {
        const data = await WardService.updateWard(req.params.id, req.body);
        res.status(200).json({ success: true, data });
    } catch (err) {
        next(err);
    }
}

export async function assignOfficer(req, res, next) {
    try {
        const data = await WardService.assignOfficer(req.params.id, req.body.officerId);
        res.status(200).json({ success: true, data });
    } catch (err) {
        next(err);
    }
}

export async function recomputeWardStats(req, res, next) {
    try {
        const ward = await WardService.recomputeWardStats(req.params.id);
        res.status(200).json({ success: true, data: { ward } });
    } catch (err) {
        next(err);
    }
}

export async function recomputeAllPulse(req, res, next) {
    try {
        const data = await PulseGridService.recomputeAllWards();
        res.status(200).json({ success: true, data });
    } catch (err) {
        next(err);
    }
}

export async function recomputeAllStats(req, res, next) {
    try {
        const data = await WardService.recomputeAllWardStats();
        res.status(200).json({ success: true, data });
    } catch (err) {
        next(err);
    }
}
