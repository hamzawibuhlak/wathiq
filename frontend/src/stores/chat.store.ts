import { create } from 'zustand';

interface ChatState {
    onlineUsers: Set<string>;
    selectedConversationId: string | null;
    unreadCounts: Record<string, number>;
    typingUsers: Record<string, string[]>;

    // Global floating mini-chats (persist across pages)
    miniChats: Array<{ id: string; minimized: boolean }>;

    setOnline: (userId: string) => void;
    setOffline: (userId: string) => void;
    setSelectedConversation: (id: string | null) => void;
    updateUnread: (conversationId: string, count: number) => void;
    incrementUnread: (conversationId: string) => void;
    clearUnread: (conversationId: string) => void;
    setTypingUsers: (conversationId: string, users: string[]) => void;
    isOnline: (userId: string) => boolean;
    totalUnread: () => number;

    openMiniChat: (convId: string) => void;
    closeMiniChat: (convId: string) => void;
    toggleMinimizeChat: (convId: string) => void;
}

export const useChatStore = create<ChatState>()((set, get) => ({
    onlineUsers: new Set<string>(),
    selectedConversationId: null,
    unreadCounts: {},
    typingUsers: {},
    miniChats: [],

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

    openMiniChat: (convId) =>
        set((state) => {
            if (state.miniChats.find(mc => mc.id === convId)) return state;
            const next = [...state.miniChats, { id: convId, minimized: false }];
            return { miniChats: next.slice(-3) }; // max 3
        }),

    closeMiniChat: (convId) =>
        set((state) => ({ miniChats: state.miniChats.filter(mc => mc.id !== convId) })),

    toggleMinimizeChat: (convId) =>
        set((state) => ({
            miniChats: state.miniChats.map(mc =>
                mc.id === convId ? { ...mc, minimized: !mc.minimized } : mc
            ),
        })),
}));

