import { create } from 'zustand';

interface ChatState {
    onlineUsers: Set<string>;
    selectedConversationId: string | null;
    unreadCounts: Record<string, number>;
    typingUsers: Record<string, string[]>; // conversationId -> userNames[]

    setOnline: (userId: string) => void;
    setOffline: (userId: string) => void;
    setSelectedConversation: (id: string | null) => void;
    updateUnread: (conversationId: string, count: number) => void;
    incrementUnread: (conversationId: string) => void;
    clearUnread: (conversationId: string) => void;
    setTypingUsers: (conversationId: string, users: string[]) => void;
    isOnline: (userId: string) => boolean;
    totalUnread: () => number;
}

export const useChatStore = create<ChatState>()((set, get) => ({
    onlineUsers: new Set<string>(),
    selectedConversationId: null,
    unreadCounts: {},
    typingUsers: {},

    setOnline: (userId) =>
        set((state) => {
            const next = new Set(state.onlineUsers);
            next.add(userId);
            return { onlineUsers: next };
        }),

    setOffline: (userId) =>
        set((state) => {
            const next = new Set(state.onlineUsers);
            next.delete(userId);
            return { onlineUsers: next };
        }),

    setSelectedConversation: (id) => set({ selectedConversationId: id }),

    updateUnread: (conversationId, count) =>
        set((state) => ({
            unreadCounts: { ...state.unreadCounts, [conversationId]: count },
        })),

    incrementUnread: (conversationId) =>
        set((state) => ({
            unreadCounts: {
                ...state.unreadCounts,
                [conversationId]: (state.unreadCounts[conversationId] || 0) + 1,
            },
        })),

    clearUnread: (conversationId) =>
        set((state) => ({
            unreadCounts: { ...state.unreadCounts, [conversationId]: 0 },
        })),

    setTypingUsers: (conversationId, users) =>
        set((state) => ({
            typingUsers: { ...state.typingUsers, [conversationId]: users },
        })),

    isOnline: (userId) => get().onlineUsers.has(userId),

    totalUnread: () =>
        Object.values(get().unreadCounts).reduce((sum, c) => sum + c, 0),
}));
