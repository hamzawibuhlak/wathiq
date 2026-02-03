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
        onSuccess: (response) => {
            login(response.user, response.accessToken);
            toast.success('تم تسجيل الدخول بنجاح');
            navigate('/dashboard');
        },
    });
}

/**
 * Hook for register mutation
 */
export function useRegister() {
    const navigate = useNavigate();
    const { login } = useAuthStore();

    return useMutation({
        mutationFn: (data: RegisterRequest) => authApi.register(data),
        onSuccess: (response) => {
            login(response.user, response.accessToken);
            toast.success('تم إنشاء الحساب بنجاح');
            navigate('/dashboard');
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
