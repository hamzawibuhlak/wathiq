import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw, X } from 'lucide-react';

export function UpdatePrompt() {
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        const handleUpdateAvailable = (event: CustomEvent) => {
            console.log('📦 Update available:', event.detail);
            setShowPrompt(true);
        };

        window.addEventListener('sw-update-available', handleUpdateAvailable as EventListener);

        return () => {
            window.removeEventListener('sw-update-available', handleUpdateAvailable as EventListener);
        };
    }, []);

    const handleUpdate = () => {
        // Reload the page to activate new service worker
        window.location.reload();
    };

    const handleDismiss = () => {
        setShowPrompt(false);
    };

    if (!showPrompt) {
        return null;
    }

    return (
        <div className="fixed top-4 right-4 z-50 max-w-sm animate-in slide-in-from-top-4" dir="rtl">
            <Card className="shadow-xl border-primary/20 bg-primary text-primary-foreground">
                <CardContent className="py-3">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <RefreshCw className="h-4 w-4" />
                            <span className="text-sm font-medium">يوجد تحديث جديد!</span>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="secondary"
                                onClick={handleUpdate}
                            >
                                تحديث
                            </Button>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/10"
                                onClick={handleDismiss}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
