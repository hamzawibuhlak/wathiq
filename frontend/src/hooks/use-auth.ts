import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '@/api';
import { useAuthStore } from '@/stores/auth.store';
import type { LoginRequest, RegisterRequest } from '@/types';

/**
 * Hook for login mutation
 */
export function useLogin() {
    const navigate = useNavigate();
    const { login } = useAuthStore();

    return useMutation({
        mutationFn: (data: LoginRequest) => authApi.login(data),
        onSuccess: (response: any) => {
            // Handle pending email verification
            if (response.requiresVerification) {
                toast('يرجى التحقق من بريدك الإلكتروني أولاً', { icon: '📧' });
                navigate('/verify-email', { state: { email: response.email }, replace: true });
                return;
            }

            login(response.user, response.accessToken);
            toast.success('تم تسجيل الدخول بنجاح');

            if (response.redirectTo) {
                navigate(response.redirectTo);
            } else {
                const slug = response.user?.tenant?.slug;
                if (slug) {
                    navigate(`/${slug}/dashboard`);
                } else if (response.user?.role === 'SUPER_ADMIN') {
                    navigate('/super-admin');
                } else {
                    navigate('/dashboard');
                }
            }
        },
    });
}

/**
 * Hook for register mutation
 */
export function useRegister() {
    const navigate = useNavigate();

    return useMutation({
        mutationFn: (data: RegisterRequest) => authApi.register(data),
        onSuccess: (response: any) => {
            // New flow: redirect to email verification
            if (response.requiresVerification) {
                toast.success('تم إنشاء الحساب. تحقق من بريدك الإلكتروني');
                navigate('/verify-email', { state: { email: response.email }, replace: true });
                return;
            }

            // Fallback for old flow (shouldn't happen anymore)
            toast.success('تم إنشاء الحساب بنجاح');
            navigate('/login');
        },
    });
}

/**
 * Hook for logout
 */
export function useLogout() {
    const navigate = useNavigate();
    const { logout } = useAuthStore();

    return useMutation({
        mutationFn: () => authApi.logout(),
        onSuccess: () => {
            logout();
            toast.success('تم تسجيل الخروج');
            navigate('/login');
        },
        onError: () => {
            // Logout anyway on error
            logout();
            navigate('/login');
        },
    });
}
