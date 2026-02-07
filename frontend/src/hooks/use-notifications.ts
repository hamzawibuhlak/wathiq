import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi, emailApi, smsApi, messagesApi } from '@/api/notifications';
import toast from 'react-hot-toast';

// ==================== Notifications Hooks ====================

export function useNotifications() {
    return useQuery({
        queryKey: ['notifications'],
        queryFn: async () => {
            const response = await notificationsApi.getAll();
            return response.data;
        },
        refetchInterval: 30000, // Refetch every 30 seconds
    });
}

export function useUnreadCount() {
    return useQuery({
        queryKey: ['notifications', 'unread-count'],
        queryFn: async () => {
            const response = await notificationsApi.getUnreadCount();
            return response.data;
        },
        refetchInterval: 30000,
    });
}

export function useMarkAsRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: notificationsApi.markAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
        },
    });
}

export function useMarkAllAsRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: notificationsApi.markAllAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
            toast.success('تم تعليم جميع الإشعارات كمقروءة');
        },
    });
}

export function useDeleteNotification() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: notificationsApi.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
        },
    });
}

export function useNotificationSettings() {
    return useQuery({
        queryKey: ['notifications', 'settings'],
        queryFn: async () => {
            const response = await notificationsApi.getSettings();
            return response.data;
        },
    });
}

export function useUpdateNotificationSettings() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: notificationsApi.updateSettings,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications', 'settings'] });
            toast.success('تم حفظ إعدادات الإشعارات');
        },
        onError: () => {
            toast.error('فشل حفظ الإعدادات');
        },
    });
}

// ==================== Messages Hooks ====================

export function useInboxMessages(params?: { limit?: number; offset?: number }) {
    return useQuery({
        queryKey: ['messages', 'inbox', params],
        queryFn: async () => {
            const response = await messagesApi.getInbox(params);
            return response;
        },
    });
}

export function useSentMessages(params?: { limit?: number; offset?: number }) {
    return useQuery({
        queryKey: ['messages', 'sent', params],
        queryFn: async () => {
            const response = await messagesApi.getSent(params);
            return response;
        },
    });
}

export function useMessage(id: string) {
    return useQuery({
        queryKey: ['messages', id],
        queryFn: async () => {
            const response = await messagesApi.getById(id);
            return response.data;
        },
        enabled: !!id,
    });
}

export function useMessagesUnreadCount() {
    return useQuery({
        queryKey: ['messages', 'unread-count'],
        queryFn: async () => {
            const response = await messagesApi.getUnreadCount();
            return response.data;
        },
        refetchInterval: 30000,
    });
}

export function useRecipients() {
    return useQuery({
        queryKey: ['messages', 'recipients'],
        queryFn: async () => {
            const response = await messagesApi.getRecipients();
            return response.data;
        },
    });
}

export function useSendMessage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: messagesApi.send,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['messages', 'sent'] });
            toast.success('تم إرسال الرسالة بنجاح');
        },
        onError: () => {
            toast.error('فشل إرسال الرسالة');
        },
    });
}

export function useMarkMessageAsRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: messagesApi.markAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['messages'] });
        },
    });
}

export function useMarkAllMessagesAsRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: messagesApi.markAllAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['messages'] });
            toast.success('تم تعليم جميع الرسائل كمقروءة');
        },
    });
}

export function useDeleteMessage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: messagesApi.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['messages'] });
            toast.success('تم حذف الرسالة');
        },
        onError: () => {
            toast.error('فشل حذف الرسالة');
        },
    });
}

// ==================== Email Hooks ====================

export function useEmailLogs(params: { page: number; limit: number }) {
    return useQuery({
        queryKey: ['email', 'logs', params],
        queryFn: async () => {
            const response = await emailApi.getLogs(params);
            return response.data;
        },
    });
}

export function useEmailTemplates() {
    return useQuery({
        queryKey: ['email', 'templates'],
        queryFn: async () => {
            const response = await emailApi.getTemplates();
            return response.data;
        },
    });
}

export function useSendBulkEmail() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: emailApi.sendBulk,
        onSuccess: (data: any) => {
            toast.success(`تم إرسال ${data.data?.sent || 0} رسالة بنجاح`);
            queryClient.invalidateQueries({ queryKey: ['email', 'logs'] });
        },
        onError: () => {
            toast.error('فشل إرسال الرسائل');
        },
    });
}

// ==================== SMS Hooks ====================

export function useSmsLogs(params: { page: number; limit: number }) {
    return useQuery({
        queryKey: ['sms', 'logs', params],
        queryFn: async () => {
            const response = await smsApi.getLogs(params);
            return response.data;
        },
    });
}

export function useSendSms() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: smsApi.send,
        onSuccess: () => {
            toast.success('تم إرسال الرسالة بنجاح');
            queryClient.invalidateQueries({ queryKey: ['sms', 'logs'] });
        },
        onError: () => {
            toast.error('فشل إرسال الرسالة');
        },
    });
}

export function useSendBulkSms() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: smsApi.sendBulk,
        onSuccess: (data: any) => {
            toast.success(`تم إرسال ${data.data?.sent || 0} رسالة بنجاح`);
            queryClient.invalidateQueries({ queryKey: ['sms', 'logs'] });
        },
        onError: () => {
            toast.error('فشل إرسال الرسائل');
        },
    });
}
