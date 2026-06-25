import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import * as NotificationController from '../controllers/notification.controller.js';
import {
    validateListQuery,
    validateMongoIdParam,
    validate,
} from '../validators/notification.validators.js';

const router = Router();

router.use(protect);

router.get('/', validateListQuery, validate, NotificationController.getMyNotifications);
router.get('/unread-count', NotificationController.getUnreadCount);
router.patch('/read-all', NotificationController.markAllAsRead);
router.patch('/:id/read', validateMongoIdParam('id'), validate, NotificationController.markAsRead);
router.delete(
    '/:id',
    validateMongoIdParam('id'),
    validate,
    NotificationController.deleteNotification
);

export default router;
