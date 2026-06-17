import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { protect, optionalAuth, requireRole } from '../middleware/auth.middleware.js';
import { uploadComplaintImage } from '../config/cloudinary.js';
import * as ComplaintController from '../controllers/complaint.controller.js';
import {
    validateSubmit,
    validateListQuery,
    validateMongoId,
    validate,
} from '../validators/complaint.validators.js';

const router = Router();

const submitLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: {
        success: false,
        code: 'TOO_MANY_REQUESTS',
        message: 'Slow down — max 10 reports per 15 minutes.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

router.get('/stats/public', ComplaintController.getPublicStats);
router.get('/map', validateListQuery, validate, ComplaintController.getPublicMapComplaints);

router.post(
    '/',
    protect,
    requireRole('citizen'),
    submitLimiter,
    uploadComplaintImage,
    validateSubmit,
    validate,
    ComplaintController.submitComplaint
);

router.get(
    '/mine',
    protect,
    requireRole('citizen'),
    validateListQuery,
    validate,
    ComplaintController.getMyComplaints
);

router.delete(
    '/:id',
    protect,
    requireRole('citizen'),
    validateMongoId,
    validate,
    ComplaintController.deleteComplaint
);

router.post('/:id/upvote', protect, validateMongoId, validate, ComplaintController.toggleUpvote);

router.get('/:id', optionalAuth, validateMongoId, validate, ComplaintController.getComplaintById);

export default router;
