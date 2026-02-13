import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth.store';

let socket: Socket | null = null;

export interface WebSocketMessage {
    type: string;
    data: unknown;
}

export const connectWebSocket = () => {
    const token = useAuthStore.getState().token;

    if (!token) {
        console.warn('No token available for WebSocket connection');
        return null;
    }

    if (socket?.connected) {
        return socket;
    }

    const wsUrl = import.meta.env.VITE_WS_URL || window.location.origin;

    socket = io(`${wsUrl}/ws`, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
        console.log('WebSocket connected:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error.message);
    });

    return socket;
};

export const disconnectWebSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};

export const getSocket = () => socket;

// Event types
export type WebSocketEventType =
    | 'notification'
    | 'case:update'
    | 'hearing:update'
    | 'invoice:update'
    | 'whatsapp:message'
    | 'whatsapp:qr'
    | 'whatsapp:status'
    | 'document:upload'
    | 'client:update';

export const subscribeToEvent = (
    event: WebSocketEventType,
    callback: (data: unknown) => void
) => {
    if (!socket) {
        console.warn('WebSocket not connected');
        return () => { };
    }

    socket.on(event, callback);

    return () => {
        socket?.off(event, callback);
    };
};
