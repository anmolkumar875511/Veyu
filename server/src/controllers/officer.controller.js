import { asyncHandler } from '../utils/asyncHandler.js';
import * as OfficerService from '../services/officer.service.js';
import User from '../models/user.model.js';

async function getOfficerWardId(user) {
    if (user.role !== 'officer') return null;
    const u = await User.findById(user.id).select('assignedWard');
    return u?.assignedWard ?? null;
}

export const getTriageQueue = asyncHandler(async (req, res) => {
    const wardId = await getOfficerWardId(req.user);
    const data = await OfficerService.getTriageQueue(wardId, req.query);
    res.status(200).json({ success: true, data });
});

export const getComplaintDetail = asyncHandler(async (req, res) => {
    const data = await OfficerService.getComplaintDetail(req.params.id);
    res.status(200).json({ success: true, data });
});

export const updateComplaintStatus = asyncHandler(async (req, res) => {
    const data = await OfficerService.updateComplaintStatus(req.params.id, req.user.id, req.body);
    res.status(200).json({ success: true, data });
});

export const dispatchToWorker = asyncHandler(async (req, res) => {
    const data = await OfficerService.dispatchToWorker(req.params.id, req.user.id, req.body);
    res.status(201).json({ success: true, data });
});

export const reassignWorker = asyncHandler(async (req, res) => {
    const data = await OfficerService.reassignWorker(req.params.id, req.user.id, req.body);
    res.status(200).json({ success: true, data });
});

export const getObservationQueue = asyncHandler(async (req, res) => {
    const wardId = await getOfficerWardId(req.user);
    const data = await OfficerService.getObservationQueue(wardId, req.query);
    res.status(200).json({ success: true, data });
});

export const reviewObservation = asyncHandler(async (req, res) => {
    const data = await OfficerService.reviewObservation(req.params.id, req.user.id, req.body);
    res.status(200).json({ success: true, data });
});

export const getWardReport = asyncHandler(async (req, res) => {
    const data = await OfficerService.getWardReport(req.params.wardId);
    res.status(200).json({ success: true, data });
});

export const getAvailableWorkers = asyncHandler(async (req, res) => {
    const data = await OfficerService.getAvailableWorkers(req.query.wardId);
    res.status(200).json({ success: true, data });
});
