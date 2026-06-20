import * as WorkerService from '../services/worker.service.js';

export async function getMyTasks(req, res, next) {
    try {
        const data = await WorkerService.getMyTasks(req.user.id, req.query);
        res.status(200).json({ success: true, data });
    } catch (err) {
        next(err);
    }
}

export async function getTaskDetail(req, res, next) {
    try {
        const data = await WorkerService.getTaskDetail(req.params.id, req.user.id);
        res.status(200).json({ success: true, data });
    } catch (err) {
        next(err);
    }
}

export async function advanceTaskStatus(req, res, next) {
    try {
        const data = await WorkerService.advanceTaskStatus(req.params.id, req.user.id);
        res.status(200).json({ success: true, data });
    } catch (err) {
        next(err);
    }
}

export async function completeTask(req, res, next) {
    try {
        const data = await WorkerService.completeTask(
            req.params.id,
            req.user.id,
            req.body,
            req.file
        );
        res.status(200).json({ success: true, data });
    } catch (err) {
        next(err);
    }
}

export async function submitObservation(req, res, next) {
    try {
        const data = await WorkerService.submitObservation(req.user.id, req.body, req.file);
        const statusCode = data.autoElevated ? 201 : 200;
        res.status(statusCode).json({ success: true, data });
    } catch (err) {
        next(err);
    }
}

export async function getMyObservations(req, res, next) {
    try {
        const data = await WorkerService.getMyObservations(req.user.id, req.query);
        res.status(200).json({ success: true, data });
    } catch (err) {
        next(err);
    }
}

export async function getWorkerSummary(req, res, next) {
    try {
        const data = await WorkerService.getWorkerSummary(req.user.id);
        res.status(200).json({ success: true, data });
    } catch (err) {
        next(err);
    }
}
