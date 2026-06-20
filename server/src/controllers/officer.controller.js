import * as OfficerService from '../services/officer.service.js';

export async function getTriageQueue(req, res, next) {
    try {
        const officerWardId = req.user.role === 'officer' ? req.officerWardId : null;
        const data = await OfficerService.getTriageQueue(officerWardId, req.query);
        res.status(200).json({ success: true, data });
    } catch (err) {
        next(err);
    }
}

export async function getComplaintDetail(req, res, next) {
    try {
        const data = await OfficerService.getComplaintDetail(req.params.id);
        res.status(200).json({ success: true, data });
    } catch (err) {
        next(err);
    }
}

export async function updateComplaintStatus(req, res, next) {
    try {
        const data = await OfficerService.updateComplaintStatus(
            req.params.id,
            req.user.id,
            req.body
        );
        res.status(200).json({ success: true, data });
    } catch (err) {
        next(err);
    }
}

export async function dispatchToWorker(req, res, next) {
    try {
        const data = await OfficerService.dispatchToWorker(req.params.id, req.user.id, req.body);
        res.status(201).json({ success: true, data });
    } catch (err) {
        next(err);
    }
}

export async function reassignWorker(req, res, next) {
    try {
        const data = await OfficerService.reassignWorker(req.params.id, req.user.id, req.body);
        res.status(200).json({ success: true, data });
    } catch (err) {
        next(err);
    }
}

export async function getObservationQueue(req, res, next) {
    try {
        const officerWardId = req.user.role === 'officer' ? req.officerWardId : null;
        const data = await OfficerService.getObservationQueue(officerWardId, req.query);
        res.status(200).json({ success: true, data });
    } catch (err) {
        next(err);
    }
}

export async function reviewObservation(req, res, next) {
    try {
        const data = await OfficerService.reviewObservation(req.params.id, req.user.id, req.body);
        res.status(200).json({ success: true, data });
    } catch (err) {
        next(err);
    }
}

export async function getWardReport(req, res, next) {
    try {
        const data = await OfficerService.getWardReport(req.params.wardId);
        res.status(200).json({ success: true, data });
    } catch (err) {
        next(err);
    }
}

export async function getAvailableWorkers(req, res, next) {
    try {
        const data = await OfficerService.getAvailableWorkers(req.query.wardId);
        res.status(200).json({ success: true, data });
    } catch (err) {
        next(err);
    }
}
