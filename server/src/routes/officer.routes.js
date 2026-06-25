import { Router } from 'express';
import { protect, requireRole } from '../middleware/auth.middleware.js';
import * as OfficerController from '../controllers/officer.controller.js';
import {
    validateTriageQuery,
    validateStatusUpdate,
    validateDispatch,
    validateReassign,
    validateObservationReview,
    validateMongoIdParam,
    validate,
} from '../validators/officer.validators.js';

const router = Router();

router.use(protect, requireRole('officer', 'admin'));

router.get('/queue', validateTriageQuery, validate, OfficerController.getTriageQueue);

router.get(
    '/complaints/:id',
    validateMongoIdParam('id'),
    validate,
    OfficerController.getComplaintDetail
);

router.patch(
    '/complaints/:id/status',
    validateMongoIdParam('id'),
    validateStatusUpdate,
    validate,
    OfficerController.updateComplaintStatus
);

router.post(
    '/complaints/:id/dispatch',
    validateMongoIdParam('id'),
    validateDispatch,
    validate,
    OfficerController.dispatchToWorker
);

router.post(
    '/complaints/:id/reassign',
    validateMongoIdParam('id'),
    validateReassign,
    validate,
    OfficerController.reassignWorker
);

router.get('/observations', OfficerController.getObservationQueue);

router.patch(
    '/observations/:id/review',
    validateMongoIdParam('id'),
    validateObservationReview,
    validate,
    OfficerController.reviewObservation
);

router.get(
    '/wards/:wardId/report',
    validateMongoIdParam('wardId'),
    validate,
    OfficerController.getWardReport
);

router.get('/workers/available', OfficerController.getAvailableWorkers);

export default router;
