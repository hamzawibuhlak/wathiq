import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth.store';
import { useChatStore } from '@/stores/chat.store';

const API_URL = import.meta.env.VITE_API_URL || '/api';
// Derive base URL for socket.io (remove /api suffix if present)
const WS_URL = API_URL.replace(/\/api\/?$/, '') || window.location.origin;

interface UseChatSocketOptions {
    conversationId?: string;
    onNewMessage?: (message: any) => void;
    onUserTyping?: (data: { conversationId: string; userId: string; isTyping: boolean }) => void;
    onMessageUpdated?: (message: any) => void;
    onMessageDeleted?: (data: { messageId: string; conversationId: string }) => void;
    onMessagesRead?: (data: { conversationId: string; userId: string; readAt: string }) => void;
    onReactionUpdated?: (data: any) => void;
}

export function useChatSocket(options: UseChatSocketOptions = {}) {
    const {
        conversationId,
        onNewMessage,
        onUserTyping,
        onMessageUpdated,
        onMessageDeleted,
        onMessagesRead,
        onReactionUpdated,
    } = options;

    const token = useAuthStore((state) => state.token);
    const { setOnline, setOffline } = useChatStore();
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        if (!token) return;

        socketRef.current = io(`${WS_URL}/chat`, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 10,
        });

        const socket = socketRef.current;

        socket.on('connect', () => {
            // Join specific conversation if provided
            if (conversationId) {
                socket.emit('chat:join_conversation', { conversationId });
            }
        });

        // Online status
        socket.on('user:online', (data: { userId: string }) => setOnline(data.userId));
        socket.on('user:offline', (data: { userId: string }) => setOffline(data.userId));

        // Chat events
        socket.on('chat:new_message', (msg: any) => onNewMessage?.(msg));
        socket.on('chat:user_typing', (data: any) => onUserTyping?.(data));
        socket.on('chat:message_updated', (msg: any) => onMessageUpdated?.(msg));
        socket.on('chat:message_deleted', (data: any) => onMessageDeleted?.(data));
        socket.on('chat:messages_read', (data: any) => onMessagesRead?.(data));
        socket.on('chat:reaction_updated', (data: any) => onReactionUpdated?.(data));

        return () => {
            socket.disconnect();
        };
    }, [token, conversationId]);

    const emitTyping = useCallback(
        (isTyping: boolean) => {
            if (conversationId) {
                socketRef.current?.emit('chat:typing', { conversationId, isTyping });
            }
        },
        [conversationId],
    );

    const emitSendMessage = useCallback(
        (data: any): Promise<any> => {
            return new Promise((resolve, reject) => {
                if (!conversationId) return reject('No conversation');
                socketRef.current?.emit(
                    'chat:send_message',
                    { conversationId, ...data },
                    (response: any) => {
                        if (response?.error) reject(response.error);
                        else resolve(response);
                    },
                );
            });
        },
        [conversationId],
    );

    const emitMarkRead = useCallback(() => {
        if (conversationId) {
            socketRef.current?.emit('chat:mark_read', { conversationId });
        }
    }, [conversationId]);

    const emitReaction = useCallback(
        (messageId: string, emoji: string) => {
            if (conversationId) {
                socketRef.current?.emit('chat:reaction', { messageId, conversationId, emoji });
            }
        },
        [conversationId],
    );

    const emitEditMessage = useCallback(
        (messageId: string, content: string) => {
            if (conversationId) {
                socketRef.current?.emit('chat:edit_message', { messageId, conversationId, content });
            }
        },
        [conversationId],
    );

    const emitDeleteMessage = useCallback(
        (messageId: string) => {
            if (conversationId) {
                socketRef.current?.emit('chat:delete_message', { messageId, conversationId });
            }
        },
        [conversationId],
    );

    return {
        emitTyping,
        emitSendMessage,
        emitMarkRead,
        emitReaction,
        emitEditMessage,
        emitDeleteMessage,
        socket: socketRef.current,
    };
}
