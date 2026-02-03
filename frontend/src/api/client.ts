import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/auth.store';
import toast from 'react-hot-toast';

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance
const api: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - add auth token
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = useAuthStore.getState().token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - handle errors
api.interceptors.response.use(
    (response) => response,
    (error: AxiosError<{ message?: string | string[] }>) => {
        const { response } = error;

        // Handle different error scenarios
        if (!response) {
            toast.error('خطأ في الاتصال بالخادم');
            return Promise.reject(error);
        }

        const { status, data } = response;

        // Extract error message
        let message = 'حدث خطأ غير متوقع';
        if (data?.message) {
            message = Array.isArray(data.message) ? data.message[0] : data.message;
        }

        switch (status) {
            case 401:
                // Unauthorized - logout user
                useAuthStore.getState().logout();
                toast.error('انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى');
                window.location.href = '/login';
                break;
            case 403:
                toast.error('ليس لديك صلاحية للوصول');
                break;
            case 404:
                toast.error(message || 'العنصر غير موجود');
                break;
            case 422:
            case 400:
                toast.error(message);
                break;
            case 500:
                toast.error('خطأ في الخادم، يرجى المحاولة لاحقاً');
                break;
            default:
                toast.error(message);
        }

        return Promise.reject(error);
    }
);

export default api;

// Helper functions for common HTTP methods
export const apiGet = <T>(url: string, params?: object) =>
    api.get<T>(url, { params }).then((res) => res.data);

export const apiPost = <T>(url: string, data?: object) =>
    api.post<T>(url, data).then((res) => res.data);

export const apiPatch = <T>(url: string, data?: object) =>
    api.patch<T>(url, data).then((res) => res.data);

export const apiDelete = <T>(url: string) =>
    api.delete<T>(url).then((res) => res.data);

export const apiUpload = <T>(url: string, formData: FormData) =>
    api
        .post<T>(url, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then((res) => res.data);
