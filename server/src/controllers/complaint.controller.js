import * as ComplaintService from '../services/complaint.service.js';

export async function submitComplaint(req, res, next) {
    try {
        const result = await ComplaintService.submitComplaint(req.user.id, req.body, req.file);

        const statusCode = result.isDuplicate ? 200 : 201;
        res.status(statusCode).json({ success: true, data: result });
    } catch (err) {
        next(err);
    }
}

export async function getMyComplaints(req, res, next) {
    try {
        const result = await ComplaintService.getMyComplaints(req.user.id, req.query);
        res.status(200).json({ success: true, data: result });
    } catch (err) {
        next(err);
    }
}

export async function getPublicStats(req, res, next) {
    try {
        const data = await ComplaintService.getPublicStats();
        res.status(200).json({ success: true, data });
    } catch (err) {
        next(err);
    }
}

export async function getPublicMapComplaints(req, res, next) {
    try {
        const data = await ComplaintService.getPublicMapComplaints(req.query);
        res.status(200).json({ success: true, data });
    } catch (err) {
        next(err);
    }
}

export async function getComplaintById(req, res, next) {
    try {
        const data = await ComplaintService.getComplaintById(req.params.id, req.user?.id ?? null);
        res.status(200).json({ success: true, data });
    } catch (err) {
        next(err);
    }
}

export async function toggleUpvote(req, res, next) {
    try {
        const data = await ComplaintService.toggleUpvote(req.params.id, req.user.id);
        res.status(200).json({ success: true, data });
    } catch (err) {
        next(err);
    }
}

export async function deleteComplaint(req, res, next) {
    try {
        await ComplaintService.deleteComplaint(req.params.id, req.user.id);
        res.status(200).json({ success: true, message: 'Complaint deleted.' });
    } catch (err) {
        next(err);
    }
}
