import { asyncHandler } from '../utils/asyncHandler.js';
import * as WorkerService from '../services/worker.service.js';

export const getMyTasks = asyncHandler(async (req, res) => {
    const data = await WorkerService.getMyTasks(req.user.id, req.query);
    res.status(200).json({ success: true, data });
});

export const getTaskDetail = asyncHandler(async (req, res) => {
    const data = await WorkerService.getTaskDetail(req.params.id, req.user.id);
    res.status(200).json({ success: true, data });
});

export const advanceTaskStatus = asyncHandler(async (req, res) => {
    const data = await WorkerService.advanceTaskStatus(req.params.id, req.user.id);
    res.status(200).json({ success: true, data });
});

export const completeTask = asyncHandler(async (req, res) => {
    const data = await WorkerService.completeTask(req.params.id, req.user.id, req.body, req.file);
    res.status(200).json({ success: true, data });
});

export const submitObservation = asyncHandler(async (req, res) => {
    const data = await WorkerService.submitObservation(req.user.id, req.body, req.file);
    res.status(data.autoElevated ? 201 : 200).json({ success: true, data });
});

export const getMyObservations = asyncHandler(async (req, res) => {
    const data = await WorkerService.getMyObservations(req.user.id, req.query);
    res.status(200).json({ success: true, data });
});

export const getWorkerSummary = asyncHandler(async (req, res) => {
    const data = await WorkerService.getWorkerSummary(req.user.id);
    res.status(200).json({ success: true, data });
});
