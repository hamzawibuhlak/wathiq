import { useState, useEffect, lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useWebSocket } from '@/hooks/use-websocket';
import toast from 'react-hot-toast';

const Softphone = lazy(() => import('@/components/call-center/Softphone'));

export function AppLayout() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { subscribe, isConnected } = useWebSocket();
    const queryClient = useQueryClient();

    // Subscribe to real-time notifications
    useEffect(() => {
        if (!isConnected) return;

        const unsubscribeNotification = subscribe('notification', (data: unknown) => {
            const notification = data as { title?: string; message?: string; type?: string };

            // Refresh notifications in React Query
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });

            if (notification.title) {
                if (notification.type === 'ERROR') {
                    toast.error(notification.title, { duration: 5000 });
                } else if (notification.type === 'SUCCESS') {
                    toast.success(notification.title, { duration: 4000 });
                } else if (notification.type === 'WARNING') {
                    toast(notification.title, { icon: '⚠️', duration: 5000 });
                } else {
                    toast(notification.title, { icon: '🔔', duration: 4000 });
                }
            }
        });

        const unsubscribeCaseUpdate = subscribe('case:update', () => {
            queryClient.invalidateQueries({ queryKey: ['cases'] });
        });

        const unsubscribeHearingUpdate = subscribe('hearing:update', () => {
            queryClient.invalidateQueries({ queryKey: ['hearings'] });
        });

        const unsubscribeWhatsApp = subscribe('whatsapp:message', (data: unknown) => {
            const msg = data as { direction?: string };
            queryClient.invalidateQueries({ queryKey: ['whatsapp', 'messages'] });
            if (msg.direction === 'INBOUND') {
                toast('رسالة واتساب جديدة', { icon: '💬' });
            }
        });

        const unsubscribeDocument = subscribe('document:upload', () => {
            queryClient.invalidateQueries({ queryKey: ['documents'] });
        });

        return () => {
            unsubscribeNotification();
            unsubscribeCaseUpdate();
            unsubscribeHearingUpdate();
            unsubscribeWhatsApp();
            unsubscribeDocument();
        };
    }, [isConnected, subscribe, queryClient]);

    return (
        <div className="min-h-screen bg-background" dir="rtl">
            {/* Sidebar */}
            <Sidebar isCollapsed={isCollapsed} onToggle={() => setIsCollapsed(!isCollapsed)} />

            {/* Header */}
            <Header isCollapsed={isCollapsed} />

            {/* Main Content */}
            <main
                className={cn(
                    'pt-16 min-h-screen transition-all duration-300',
                    isCollapsed ? 'mr-16' : 'mr-64'
                )}
            >
                <div className="p-6">
                    <Outlet />
                </div>
            </main>

            {/* Softphone — floating WebRTC dialer (Phase 32) */}
            <Suspense fallback={null}>
                <Softphone />
            </Suspense>
        </div>
    );
}

export default AppLayout;
