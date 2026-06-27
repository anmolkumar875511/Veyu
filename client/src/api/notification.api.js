// src/api/notification.api.js

import { apiClient } from './axios.instance.js';

export async function getMyNotificationsApi(params = {}) {
    const { data } = await apiClient.get('/notifications', { params });
    return data.data; // { notifications, total, unreadCount, page, totalPages }
}

export async function getUnreadCountApi() {
    const { data } = await apiClient.get('/notifications/unread-count');
    return data.data; // { unreadCount }
}

export async function markAsReadApi(id) {
    const { data } = await apiClient.patch(`/notifications/${id}/read`);
    return data.data; // { notification }
}

export async function markAllAsReadApi() {
    const { data } = await apiClient.patch('/notifications/read-all');
    return data.data; // { modifiedCount }
}

export async function deleteNotificationApi(id) {
    const { data } = await apiClient.delete(`/notifications/${id}`);
    return data;
}

export function parseNotificationError(err) {
    if (err.response?.data?.errors?.length > 0) return err.response.data.errors[0].message;
    return err.response?.data?.message ?? 'Something went wrong.';
}
