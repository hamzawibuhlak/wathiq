import { apiGet, apiPost, apiDelete, apiUpload } from './client';

export const chatApi = {
    // Conversations
    getConversations: () => apiGet<any[]>('/chat/conversations'),
    getOrCreateDM: (userId: string) => apiPost<any>('/chat/conversations/dm', { userId }),
    createGroup: (data: { name: string; description?: string; memberIds: string[] }) =>
        apiPost<any>('/chat/conversations/group', data),
    deleteConversation: (conversationId: string) =>
        apiDelete<any>(`/chat/conversations/${conversationId}`),

    // Group management
    updateGroup: (conversationId: string, data: { name?: string; description?: string }) =>
        apiPost<any>(`/chat/conversations/${conversationId}/update`, data),
    addMember: (conversationId: string, userId: string) =>
        apiPost<any>(`/chat/conversations/${conversationId}/members`, { userId }),
    removeMember: (conversationId: string, userId: string) =>
        apiDelete<any>(`/chat/conversations/${conversationId}/members/${userId}`),
    toggleAdmin: (conversationId: string, userId: string) =>
        apiPost<any>(`/chat/conversations/${conversationId}/members/${userId}/toggle-admin`, {}),

    // Messages
    getMessages: (conversationId: string, cursor?: string, limit?: number) =>
        apiGet<any[]>(`/chat/conversations/${conversationId}/messages`, { cursor, limit }),
    sendMessage: (conversationId: string, data: {
        content?: string; type?: string; replyToId?: string;
        fileUrl?: string; fileName?: string; fileSize?: number; fileMimeType?: string;
    }) => apiPost<any>(`/chat/conversations/${conversationId}/messages`, data),
    editMessage: (messageId: string, content: string) =>
        apiPost<any>(`/chat/messages/${messageId}/edit`, { content }),
    deleteMessage: (messageId: string) =>
        apiDelete<any>(`/chat/messages/${messageId}`),
    forwardMessage: (messageId: string, targetConversationId: string) =>
        apiPost<any>(`/chat/messages/${messageId}/forward`, { targetConversationId }),

    // Upload
    uploadFile: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return apiUpload<{ url: string; fileName: string; fileSize: number; mimeType: string; }>('/chat/upload', formData);
    },

    // Search
    searchMessages: (query: string) => apiGet<any[]>('/chat/search', { q: query }),

    // Users for creating conversations
    getUsers: async () => {
        const res = await apiGet<any>('/users', { limit: 100 });
        return Array.isArray(res) ? res : (res?.data || []);
    },

    // Online status
    heartbeat: () => apiPost<any>('/chat/heartbeat', {}),
    getOnlineUsers: () => apiGet<string[]>('/chat/online-users'),

    // Mark as read
    markAsRead: (conversationId: string) =>
        apiPost<any>(`/chat/conversations/${conversationId}/read`, {}),
};
