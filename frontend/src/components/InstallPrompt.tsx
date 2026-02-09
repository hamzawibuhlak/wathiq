import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Download, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
            return;
        }

        const handleBeforeInstallPrompt = (e: Event) => {
            // Prevent default install prompt
            e.preventDefault();

            // Save the event for later
            setDeferredPrompt(e as BeforeInstallPromptEvent);

            // Check if user hasn't dismissed recently
            const dismissed = localStorage.getItem('installPromptDismissed');
            const dismissedTime = dismissed ? parseInt(dismissed, 10) : 0;
            const oneWeek = 7 * 24 * 60 * 60 * 1000;

            if (!dismissed || Date.now() - dismissedTime > oneWeek) {
                setShowPrompt(true);
            }
        };

        const handleAppInstalled = () => {
            console.log('✅ App installed');
            setIsInstalled(true);
            setShowPrompt(false);
            setDeferredPrompt(null);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`Install prompt response: ${outcome}`);

        // Clear the deferred prompt
        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem('installPromptDismissed', Date.now().toString());
    };

    if (!showPrompt || isInstalled) {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-4" dir="rtl">
            <Card className="shadow-xl border-primary/20">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Smartphone className="h-5 w-5 text-primary" />
                            <CardTitle className="text-lg">تثبيت التطبيق</CardTitle>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleDismiss}
                            className="h-6 w-6 rounded-full"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                        ثبّت Watheeq على جهازك للوصول السريع والعمل دون اتصال
                    </p>
                    <div className="flex gap-2">
                        <Button onClick={handleInstall} className="flex-1">
                            <Download className="ml-2 h-4 w-4" />
                            تثبيت
                        </Button>
                        <Button variant="outline" onClick={handleDismiss}>
                            لاحقاً
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
