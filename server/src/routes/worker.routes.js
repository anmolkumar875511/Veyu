import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { protect, requireRole } from '../middleware/auth.middleware.js';
import { uploadCompletionImage, uploadObservationImage } from '../config/cloudinary.js';
import * as WorkerController from '../controllers/worker.controller.js';
import {
    validateTaskQuery,
    validateCompleteTask,
    validateObservation,
    validateObservationQuery,
    validateMongoIdParam,
    validate,
} from '../validators/worker.validators.js';

const router = Router();

router.use(protect, requireRole('worker'));

const observationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: {
        success: false,
        code: 'TOO_MANY_REQUESTS',
        message: 'Max 20 observations per 15 minutes.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

router.get('/tasks', validateTaskQuery, validate, WorkerController.getMyTasks);

router.get('/tasks/:id', validateMongoIdParam('id'), validate, WorkerController.getTaskDetail);

router.patch(
    '/tasks/:id/advance',
    validateMongoIdParam('id'),
    validate,
    WorkerController.advanceTaskStatus
);

router.post(
    '/tasks/:id/complete',
    validateMongoIdParam('id'),
    uploadCompletionImage,
    validateCompleteTask,
    validate,
    WorkerController.completeTask
);

router.post(
    '/observations',
    observationLimiter,
    uploadObservationImage,
    validateObservation,
    validate,
    WorkerController.submitObservation
);

router.get('/observations', validateObservationQuery, validate, WorkerController.getMyObservations);

router.get('/summary', WorkerController.getWorkerSummary);

export default router;
