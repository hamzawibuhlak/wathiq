import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '@/api';
import { useAuthStore } from '@/stores/auth.store';
import type { LoginRequest } from '@/types';

export function useLogin() {
    const navigate = useNavigate();
    const { login } = useAuthStore();

    return useMutation({
        mutationFn: (data: LoginRequest) => authApi.login(data),
        onSuccess: (response: any) => {
            login(response.user, response.accessToken);
            toast.success('تم تسجيل الدخول بنجاح');
            navigate(response.redirectTo || '/dashboard');
        },
    });
}

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
            logout();
            navigate('/login');
        },
    });
}
