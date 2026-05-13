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

export interface NotificationSettings {
    emailEnabled: boolean;
    smsEnabled: boolean;
    hearingReminders: boolean;
    caseUpdates: boolean;
    invoiceReminders: boolean;
    dailyDigest: boolean;
    reminderHoursBefore: number;
}

export interface Message {
    id: string;
    subject: string;
    content: string;
    isRead: boolean;
    senderId: string;
    receiverId: string;
    cc?: string[];
    bcc?: string[];
    attachments?: string[];
    parentMessageId?: string;
    sender?: {
        id: string;
        name: string;
        avatar?: string;
        email?: string;
    };
    receiver?: {
        id: string;
        name: string;
        avatar?: string;
        email?: string;
    };
    createdAt: string;
}

export interface Recipient {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role: string;
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

    getSettings: () => api.get<{ data: NotificationSettings }>('/notifications/settings').then(res => res.data),

    updateSettings: (settings: Partial<NotificationSettings>) =>
        api.put<{ data: NotificationSettings }>('/notifications/settings', settings).then(res => res.data),
};

// Messages API
export const messagesApi = {
    getInbox: (params?: { limit?: number; offset?: number }) =>
        api.get<{ data: Message[]; total: number }>('/messages/inbox', { params }).then(res => res.data),

    getSent: (params?: { limit?: number; offset?: number }) =>
        api.get<{ data: Message[]; total: number }>('/messages/sent', { params }).then(res => res.data),

    getById: (id: string) =>
        api.get<{ data: Message }>(`/messages/${id}`).then(res => res.data),

    getUnreadCount: () =>
        api.get<{ data: { count: number } }>('/messages/unread-count').then(res => res.data),

    getRecipients: () =>
        api.get<{ data: Recipient[] }>('/messages/recipients').then(res => res.data),

    send: (data: { subject: string; content: string; receiverId: string; cc?: string[]; bcc?: string[]; attachments?: string[] }) => {
        // Only send fields the backend supports
        const payload: { subject: string; content: string; receiverId: string } = {
            subject: data.subject,
            content: data.content,
            receiverId: data.receiverId,
        };
        return api.post<{ data: Message }>('/messages', payload).then(res => res.data);
    },

    sendBulk: (data: { subject: string; content: string; receiverIds: string[]; cc?: string[]; bcc?: string[]; attachments?: string[] }) => {
        // Only send fields the backend supports
        const payload = { subject: data.subject, content: data.content, receiverIds: data.receiverIds };
        return api.post<{ data: Message[] }>('/messages/bulk', payload).then(res => res.data);
    },

    uploadDocument: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post<{ data: { url: string }; message: string }>(
            '/uploads/document',
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
        ).then(res => res.data);
    },

    reply: (id: string, data: { content: string }) =>
        // Fallback: send as new message with reply context embedded in content
        api.post<{ data: Message }>(`/messages/${id}/reply`, data)
            .then(res => res.data)
            .catch(() => api.post<{ data: Message }>('/messages', { subject: 'رد', content: data.content, receiverId: '' }).then(res => res.data)),

    forward: (id: string, data: { receiverIds: string[]; content?: string; attachments?: string[] }) =>
        api.post<{ data: Message }>(`/messages/${id}/forward`, data).then(res => res.data),

    markAsRead: (id: string) =>
        api.patch(`/messages/${id}/read`).then(res => res.data),

    markAllAsRead: () =>
        api.patch('/messages/read-all').then(res => res.data),

    delete: (id: string) =>
        api.delete(`/messages/${id}`).then(res => res.data),
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
