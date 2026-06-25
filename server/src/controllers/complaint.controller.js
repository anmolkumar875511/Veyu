import { asyncHandler } from '../utils/asyncHandler.js';
import * as ComplaintService from '../services/complaint.service.js';

export const submitComplaint = asyncHandler(async (req, res) => {
    const result = await ComplaintService.submitComplaint(req.user.id, req.body, req.file);
    res.status(result.isDuplicate ? 200 : 201).json({ success: true, data: result });
});

export const getMyComplaints = asyncHandler(async (req, res) => {
    const data = await ComplaintService.getMyComplaints(req.user.id, req.query);
    res.status(200).json({ success: true, data });
});

export const getPublicStats = asyncHandler(async (req, res) => {
    const data = await ComplaintService.getPublicStats();
    res.status(200).json({ success: true, data });
});

export const getPublicMapComplaints = asyncHandler(async (req, res) => {
    const data = await ComplaintService.getPublicMapComplaints(req.query);
    res.status(200).json({ success: true, data });
});

export const getComplaintById = asyncHandler(async (req, res) => {
    const data = await ComplaintService.getComplaintById(req.params.id, req.user?.id ?? null);
    res.status(200).json({ success: true, data });
});

export const toggleUpvote = asyncHandler(async (req, res) => {
    const data = await ComplaintService.toggleUpvote(req.params.id, req.user.id);
    res.status(200).json({ success: true, data });
});

export const deleteComplaint = asyncHandler(async (req, res) => {
    await ComplaintService.deleteComplaint(req.params.id, req.user.id);
    res.status(200).json({ success: true, message: 'Complaint deleted.' });
});
