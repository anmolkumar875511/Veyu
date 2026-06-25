import { asyncHandler } from '../utils/asyncHandler.js';
import * as NotificationService from '../services/notification.service.js';

export const getMyNotifications = asyncHandler(async (req, res) => {
    const data = await NotificationService.getMyNotifications(req.user.id, req.query);
    res.status(200).json({ success: true, data });
});

export const getUnreadCount = asyncHandler(async (req, res) => {
    const data = await NotificationService.getUnreadCount(req.user.id);
    res.status(200).json({ success: true, data });
});

export const markAsRead = asyncHandler(async (req, res) => {
    const notification = await NotificationService.markAsRead(req.params.id, req.user.id);
    res.status(200).json({ success: true, data: { notification } });
});

export const markAllAsRead = asyncHandler(async (req, res) => {
    const data = await NotificationService.markAllAsRead(req.user.id);
    res.status(200).json({ success: true, data });
});

export const deleteNotification = asyncHandler(async (req, res) => {
    await NotificationService.deleteNotification(req.params.id, req.user.id);
    res.status(200).json({ success: true, message: 'Notification deleted.' });
});
