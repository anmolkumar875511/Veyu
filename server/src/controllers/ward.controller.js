import { asyncHandler } from '../utils/asyncHandler.js';
import * as WardService from '../services/ward.service.js';
import * as PulseGridService from '../services/pulseGrid.service.js';

export const listWards = asyncHandler(async (req, res) => {
    const data = await WardService.listWards(req.query);
    res.status(200).json({ success: true, data });
});

export const getWardLeaderboard = asyncHandler(async (req, res) => {
    const data = await WardService.getWardLeaderboard();
    res.status(200).json({ success: true, data });
});

export const getPulseGridSnapshot = asyncHandler(async (req, res) => {
    const data = await PulseGridService.getPulseGridSnapshot();
    res.status(200).json({ success: true, data: { wards: data } });
});

export const getWardById = asyncHandler(async (req, res) => {
    const data = await WardService.getWardById(req.params.id);
    res.status(200).json({ success: true, data });
});

export const createWard = asyncHandler(async (req, res) => {
    const data = await WardService.createWard(req.body);
    res.status(201).json({ success: true, data });
});

export const updateWard = asyncHandler(async (req, res) => {
    const data = await WardService.updateWard(req.params.id, req.body);
    res.status(200).json({ success: true, data });
});

export const assignOfficer = asyncHandler(async (req, res) => {
    const data = await WardService.assignOfficer(req.params.id, req.body.officerId);
    res.status(200).json({ success: true, data });
});

export const recomputeWardStats = asyncHandler(async (req, res) => {
    const ward = await WardService.recomputeWardStats(req.params.id);
    res.status(200).json({ success: true, data: { ward } });
});

export const recomputeAllPulse = asyncHandler(async (req, res) => {
    const data = await PulseGridService.recomputeAllWards();
    res.status(200).json({ success: true, data });
});

export const recomputeAllStats = asyncHandler(async (req, res) => {
    const data = await WardService.recomputeAllWardStats();
    res.status(200).json({ success: true, data });
});
