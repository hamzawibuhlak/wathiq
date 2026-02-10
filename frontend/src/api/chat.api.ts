import { apiGet, apiPost, apiUpload } from './client';

export const chatApi = {
    // Conversations
    getConversations: () => apiGet<any[]>('/chat/conversations'),

    getOrCreateDM: (userId: string) =>
        apiPost<any>('/chat/conversations/dm', { userId }),

    createGroup: (data: { name: string; description?: string; memberIds: string[] }) =>
        apiPost<any>('/chat/conversations/group', data),

    // Messages
    getMessages: (conversationId: string, cursor?: string, limit?: number) =>
        apiGet<any[]>(`/chat/conversations/${conversationId}/messages`, { cursor, limit }),

    sendMessage: (conversationId: string, data: { content?: string; type?: string; replyToId?: string; fileUrl?: string; fileName?: string; fileSize?: number; fileMimeType?: string }) =>
        apiPost<any>(`/chat/conversations/${conversationId}/messages`, data),

    // Upload
    uploadFile: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return apiUpload<{
            url: string;
            fileName: string;
            fileSize: number;
            mimeType: string;
        }>('/chat/upload', formData);
    },

    // Search
    searchMessages: (query: string) =>
        apiGet<any[]>('/chat/search', { q: query }),

    // Users for creating conversations
    getUsers: async () => {
        const res = await apiGet<any>('/users', { limit: 100 });
        return Array.isArray(res) ? res : (res?.data || []);
    },

    // Online status
    heartbeat: () => apiPost<any>('/chat/heartbeat', {}),
    getOnlineUsers: () => apiGet<string[]>('/chat/online-users'),

    // Mark as read via REST
    markAsRead: (conversationId: string) =>
        apiPost<any>(`/chat/conversations/${conversationId}/read`, {}),
};
