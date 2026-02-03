import api from './client';

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
    link?: string;
    isRead: boolean;
    createdAt: string;
}

export interface EmailLog {
    id: string;
    to: string;
    subject: string;
    body: string;
    status: 'SENT' | 'FAILED' | 'PENDING';
    sentAt?: string;
    error?: string;
    createdAt: string;
}

export interface SmsLog {
    id: string;
    to: string;
    message: string;
    status: 'SENT' | 'FAILED' | 'PENDING';
    sentAt?: string;
    error?: string;
    createdAt: string;
}

// Notifications API
export const notificationsApi = {
    getAll: () => api.get<{ data: Notification[] }>('/notifications').then(res => res.data),

    getUnreadCount: () => api.get<{ data: { count: number } }>('/notifications/unread-count').then(res => res.data),

    markAsRead: (id: string) => api.patch(`/notifications/${id}/read`).then(res => res.data),

    markAllAsRead: () => api.patch('/notifications/read-all').then(res => res.data),

    delete: (id: string) => api.delete(`/notifications/${id}`).then(res => res.data),
};

// Email API
export const emailApi = {
    getLogs: (params: { page: number; limit: number }) =>
        api.get<{ data: EmailLog[]; meta: { total: number; page: number; limit: number; totalPages: number } }>('/email/logs', { params }).then(res => res.data),

    getTemplates: () => api.get('/email/templates').then(res => res.data),

    sendBulk: (data: { recipients: string[]; subject: string; html: string }) =>
        api.post('/email/send-bulk', data).then(res => res.data),
};

// SMS API
export const smsApi = {
    getLogs: (params: { page: number; limit: number }) =>
        api.get<{ data: SmsLog[]; meta: { total: number; page: number; limit: number; totalPages: number } }>('/sms/logs', { params }).then(res => res.data),

    send: (data: { to: string; message: string }) =>
        api.post('/sms/send', data).then(res => res.data),

    sendBulk: (data: { recipients: string[]; message: string }) =>
        api.post('/sms/send-bulk', data).then(res => res.data),
};
