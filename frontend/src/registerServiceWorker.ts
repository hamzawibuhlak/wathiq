export function register() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            const swUrl = '/service-worker.js';

            navigator.serviceWorker
                .register(swUrl)
                .then((registration) => {
                    console.log('✅ Service Worker registered:', registration.scope);

                    // Check for updates
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        if (newWorker) {
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    // New content available, notify user
                                    console.log('📦 New content available, please refresh!');
                                    showUpdateNotification();
                                }
                            });
                        }
                    });
                })
                .catch((error) => {
                    console.error('❌ Service Worker registration failed:', error);
                });
        });
    }
}

export function unregister() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
            registration.unregister();
        });
    }
}

function showUpdateNotification() {
    // Dispatch custom event for update notification
    window.dispatchEvent(
        new CustomEvent('sw-update-available', {
            detail: {
                message: 'يوجد تحديث جديد متاح!',
                action: 'تحديث الآن'
            },
        })
    );
}

// Request notification permission
export async function requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
        console.warn('Notifications not supported');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    return false;
}

// Subscribe to push notifications
export async function subscribeToPush(): Promise<PushSubscription | null> {
    try {
        const registration = await navigator.serviceWorker.ready;

        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(
                import.meta.env.VITE_VAPID_PUBLIC_KEY || ''
            ),
        });

        return subscription;
    } catch (error) {
        console.error('Failed to subscribe to push:', error);
        return null;
    }
}

// Helper: Convert VAPID key
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray.buffer as ArrayBuffer;
}
