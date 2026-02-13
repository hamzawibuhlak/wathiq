import { useEffect, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
    connectWebSocket,
    disconnectWebSocket,
    subscribeToEvent,
    WebSocketEventType,
    getSocket,
} from '@/lib/websocket';
import { useAuthStore } from '@/stores/auth.store';
import toast from 'react-hot-toast';

interface NotificationData {
    id: string;
    title: string;
    message: string;
    type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
    link?: string;
}

export function useWebSocket() {
    const [isConnected, setIsConnected] = useState(false);
    const { isAuthenticated } = useAuthStore();

    useEffect(() => {
        if (isAuthenticated) {
            const socket = connectWebSocket();

            if (socket) {
                socket.on('connect', () => setIsConnected(true));
                socket.on('disconnect', () => setIsConnected(false));
            }

            return () => {
                disconnectWebSocket();
            };
        }
    }, [isAuthenticated]);

    const subscribe = useCallback(
        (event: WebSocketEventType, callback: (data: unknown) => void) => {
            return subscribeToEvent(event, callback);
        },
        []
    );

    return { isConnected, subscribe, socket: getSocket() };
}

// Hook for listening to notifications with React Query integration
export function useWebSocketNotifications() {
    const { subscribe } = useWebSocket();
    const queryClient = useQueryClient();

    useEffect(() => {
        const unsubscribe = subscribe('notification', (data: unknown) => {
            const notification = data as NotificationData;

            // Invalidate queries to refresh the notification badge and list
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });

            // Show toast notification based on type
            if (notification.title) {
                switch (notification.type) {
                    case 'ERROR':
                        toast.error(notification.title, { duration: 5000 });
                        break;
                    case 'WARNING':
                        toast(notification.title, {
                            icon: '⚠️',
                            duration: 5000,
                        });
                        break;
                    case 'SUCCESS':
                        toast.success(notification.title, { duration: 4000 });
                        break;
                    default:
                        toast(notification.title, {
                            icon: '🔔',
                            duration: 4000,
                        });
                }
            }
        });

        return unsubscribe;
    }, [subscribe, queryClient]);
}

// Hook for case updates
export function useCaseUpdates(onUpdate: (data: unknown) => void) {
    const { subscribe } = useWebSocket();

    useEffect(() => {
        return subscribe('case:update', onUpdate);
    }, [subscribe, onUpdate]);
}

// Hook for hearing updates
export function useHearingUpdates(onUpdate: (data: unknown) => void) {
    const { subscribe } = useWebSocket();

    useEffect(() => {
        return subscribe('hearing:update', onUpdate);
    }, [subscribe, onUpdate]);
}

// Hook for invoice updates
export function useInvoiceUpdates(onUpdate: (data: unknown) => void) {
    const { subscribe } = useWebSocket();

    useEffect(() => {
        return subscribe('invoice:update', onUpdate);
    }, [subscribe, onUpdate]);
}

// Hook for WhatsApp messages
export function useWhatsAppMessages(onMessage: (data: unknown) => void) {
    const { subscribe } = useWebSocket();

    useEffect(() => {
        return subscribe('whatsapp:message', onMessage);
    }, [subscribe, onMessage]);
}

// Hook for WhatsApp QR code (Phase 32)
export function useWhatsAppQR(onQR: (data: { qr: string }) => void) {
    const { subscribe } = useWebSocket();

    useEffect(() => {
        return subscribe('whatsapp:qr', (data: unknown) => onQR(data as { qr: string }));
    }, [subscribe, onQR]);
}

// Hook for WhatsApp connection status (Phase 32)
export function useWhatsAppStatus(onStatus: (data: { status: string; phone?: string }) => void) {
    const { subscribe } = useWebSocket();

    useEffect(() => {
        return subscribe('whatsapp:status', (data: unknown) => onStatus(data as { status: string; phone?: string }));
    }, [subscribe, onStatus]);
}
