import { Router } from 'express';
import { protect, requireRole } from '../middleware/auth.middleware.js';
import * as ForecastController from '../controllers/forecast.controller.js';
import {
    validateForecastQuery,
    validateMongoIdParam,
    validate,
} from '../validators/forecast.validators.js';

const router = Router();

router.use(protect, requireRole('officer', 'admin'));

router.get('/', validateForecastQuery, validate, ForecastController.getActiveForecasts);
router.get('/accuracy', ForecastController.getForecastAccuracy);
router.patch(
    '/:id/acknowledge',
    validateMongoIdParam('id'),
    validate,
    ForecastController.acknowledgeForecast
);
router.post('/generate', requireRole('admin'), ForecastController.generateForecasts);
router.post('/expire-and-score', requireRole('admin'), ForecastController.expireAndScoreForecasts);

export default router;
