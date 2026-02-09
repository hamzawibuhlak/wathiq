import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import { ConfirmDialogProvider } from '@/components/ui';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import '@/styles/globals.css';

// Register Service Worker with auto-update
const updateSW = registerSW({
    onNeedRefresh() {
        if (confirm('تحديث جديد متاح! هل تريد التحديث الآن؟')) {
            updateSW(true);
        }
    },
    onOfflineReady() {
        console.log('✅ التطبيق جاهز للعمل بدون اتصال');
    },
    onRegistered(registration) {
        console.log('✅ Service Worker registered:', registration);
    },
    onRegisterError(error) {
        console.error('❌ Service Worker registration failed:', error);
    },
});

// Create React Query client with optimized settings
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            gcTime: 1000 * 60 * 30, // 30 minutes (cache time)
            retry: 1,
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
        },
        mutations: {
            retry: 0,
        },
    },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <ConfirmDialogProvider>
                <App />
                <Toaster
                    position="top-center"
                    reverseOrder={false}
                    toastOptions={{
                        duration: 4000,
                        style: {
                            fontFamily: 'Cairo, Tajawal, sans-serif',
                            direction: 'rtl',
                        },
                        success: {
                            iconTheme: {
                                primary: '#10b981',
                                secondary: '#fff',
                            },
                        },
                        error: {
                            iconTheme: {
                                primary: '#ef4444',
                                secondary: '#fff',
                            },
                        },
                    }}
                />
                <ReactQueryDevtools initialIsOpen={false} />
            </ConfirmDialogProvider>
        </QueryClientProvider>
    </React.StrictMode>
);
