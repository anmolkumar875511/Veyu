import { Router } from 'express';
import { protect, requireRole } from '../middleware/auth.middleware.js';
import * as WardController from '../controllers/ward.controller.js';
import {
    validateListQuery,
    validateCreateWard,
    validateUpdateWard,
    validateAssignOfficer,
    validateMongoIdParam,
    validate,
} from '../validators/ward.validators.js';

const router = Router();

router.get('/', validateListQuery, validate, WardController.listWards);
router.get('/leaderboard', WardController.getWardLeaderboard);
router.get('/pulse', WardController.getPulseGridSnapshot);
router.get('/:id', validateMongoIdParam('id'), validate, WardController.getWardById);

router.post(
    '/:id/recompute-stats',
    protect,
    requireRole('officer', 'admin'),
    validateMongoIdParam('id'),
    validate,
    WardController.recomputeWardStats
);

router.post(
    '/',
    protect,
    requireRole('admin'),
    validateCreateWard,
    validate,
    WardController.createWard
);

router.patch(
    '/:id',
    protect,
    requireRole('admin'),
    validateMongoIdParam('id'),
    validateUpdateWard,
    validate,
    WardController.updateWard
);

router.post(
    '/:id/assign-officer',
    protect,
    requireRole('admin'),
    validateMongoIdParam('id'),
    validateAssignOfficer,
    validate,
    WardController.assignOfficer
);

router.post('/pulse/recompute', protect, requireRole('admin'), WardController.recomputeAllPulse);
router.post(
    '/stats/recompute-all',
    protect,
    requireRole('admin'),
    WardController.recomputeAllStats
);

export default router;
