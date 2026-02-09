import { useOfflineSync, useNetworkStatus } from '@/hooks/useOfflineSync';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';

export function OfflineIndicator() {
    const { isOnline, pendingSync } = useOfflineSync();
    const { isSlowConnection } = useNetworkStatus();

    if (isOnline && !pendingSync && !isSlowConnection) {
        return null;
    }

    return (
        <div className="fixed bottom-4 left-4 z-50 max-w-sm space-y-2" dir="rtl">
            {!isOnline && (
                <Alert variant="destructive" className="shadow-lg">
                    <WifiOff className="h-4 w-4 ml-2" />
                    <AlertDescription className="text-right">
                        لا يوجد اتصال بالإنترنت. بعض الميزات غير متاحة.
                    </AlertDescription>
                </Alert>
            )}

            {pendingSync && (
                <Alert className="shadow-lg border-blue-200 bg-blue-50">
                    <RefreshCw className="h-4 w-4 ml-2 animate-spin text-blue-500" />
                    <AlertDescription className="text-right text-blue-700">
                        جاري مزامنة البيانات...
                    </AlertDescription>
                </Alert>
            )}

            {isSlowConnection && isOnline && (
                <Alert className="shadow-lg border-yellow-200 bg-yellow-50">
                    <AlertTriangle className="h-4 w-4 ml-2 text-yellow-500" />
                    <AlertDescription className="text-right text-yellow-700">
                        اتصال بطيء. قد تتأخر بعض العمليات.
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}
