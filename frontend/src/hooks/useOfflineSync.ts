import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useOfflineSync() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [pendingSync, setPendingSync] = useState(false);
    const queryClient = useQueryClient();

    useEffect(() => {
        const handleOnline = async () => {
            console.log('📡 Back online');
            setIsOnline(true);

            // Trigger background sync if available
            if ('serviceWorker' in navigator && 'sync' in (window as any).ServiceWorkerRegistration?.prototype) {
                try {
                    const registration = await navigator.serviceWorker.ready;
                    await (registration as any).sync.register('sync-pending-data');
                    setPendingSync(true);

                    // Reset pending sync after a delay
                    setTimeout(() => setPendingSync(false), 3000);
                } catch (error) {
                    console.error('Sync registration failed:', error);
                }
            }

            // Invalidate all queries to refresh data
            queryClient.invalidateQueries();
        };

        const handleOffline = () => {
            console.log('📴 Offline');
            setIsOnline(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [queryClient]);

    return { isOnline, pendingSync };
}

// Hook to detect network speed (slow connection)
export function useNetworkStatus() {
    const [connectionType, setConnectionType] = useState<string>('unknown');
    const [effectiveType, setEffectiveType] = useState<string>('unknown');

    useEffect(() => {
        const connection = (navigator as any).connection ||
            (navigator as any).mozConnection ||
            (navigator as any).webkitConnection;

        if (connection) {
            setConnectionType(connection.type || 'unknown');
            setEffectiveType(connection.effectiveType || 'unknown');

            const handleChange = () => {
                setConnectionType(connection.type || 'unknown');
                setEffectiveType(connection.effectiveType || 'unknown');
            };

            connection.addEventListener('change', handleChange);
            return () => connection.removeEventListener('change', handleChange);
        }
    }, []);

    const isSlowConnection = ['slow-2g', '2g'].includes(effectiveType);

    return { connectionType, effectiveType, isSlowConnection };
}
