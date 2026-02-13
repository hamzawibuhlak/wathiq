import api from './client';
import type {
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    User,
    ApiResponse,
} from '@/types';

// Auth endpoints
export const authApi = {
    login: (data: LoginRequest) =>
        api.post<AuthResponse>('/auth/login', data).then((res) => res.data),

    register: (data: RegisterRequest) =>
        api.post<AuthResponse>('/auth/register', data).then((res) => res.data),

    getMe: () =>
        api.get<ApiResponse<User>>('/auth/me').then((res) => res.data),

    logout: () =>
        api.post('/auth/logout').then((res) => res.data),

    forgotPassword: (email: string) =>
        api.post('/auth/forgot-password', { email }).then((res) => res.data),
};

export default authApi;
