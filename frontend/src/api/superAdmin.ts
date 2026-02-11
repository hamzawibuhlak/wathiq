import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Separate axios instance for Super Admin (uses its own token)
const saApi = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — use Super Admin token
saApi.interceptors.request.use((config) => {
    const token = localStorage.getItem('sa_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor
saApi.interceptors.response.use(
    (res) => res,
    (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
            localStorage.removeItem('sa_token');
            localStorage.removeItem('sa_admin');
            if (window.location.pathname.startsWith('/super-admin') && !window.location.pathname.includes('/login')) {
                window.location.href = '/super-admin/login';
            }
        }
        return Promise.reject(error);
    },
);

const get = <T>(url: string, params?: object) => saApi.get<T>(url, { params }).then(r => r.data);
const post = <T>(url: string, data?: object) => saApi.post<T>(url, data).then(r => r.data);
const patch = <T>(url: string, data?: object) => saApi.patch<T>(url, data).then(r => r.data);
const del = <T>(url: string) => saApi.delete<T>(url).then(r => r.data);

export const superAdminApi = {
    // Auth
    login: (email: string, password: string) => post<any>('/super-admin/auth/login', { email, password }),
    init: (data: { name: string; email: string; password: string }) => post<any>('/super-admin/auth/init', data),
    getMe: () => get<any>('/super-admin/me'),

    // Overview
    getOverview: () => get<any>('/super-admin/overview'),
    getRecent: (limit = 10) => get<any>('/super-admin/overview/recent', { limit }),

    // Tenants
    getTenants: (params?: { search?: string; planType?: string; isFrozen?: string; page?: number; limit?: number }) =>
        get<any>('/super-admin/tenants', params),
    getTenantDetails: (id: string) => get<any>(`/super-admin/tenants/${id}`),
    freeze: (id: string, reason: string) => post<any>(`/super-admin/tenants/${id}/freeze`, { reason }),
    unfreeze: (id: string) => post<any>(`/super-admin/tenants/${id}/unfreeze`),
    changePlan: (id: string, planType: string) => patch<any>(`/super-admin/tenants/${id}/plan`, { planType }),
    softDelete: (id: string) => del<any>(`/super-admin/tenants/${id}/soft`),
    hardDelete: (id: string) => del<any>(`/super-admin/tenants/${id}/hard`),
    addNote: (id: string, content: string, type = 'GENERAL') =>
        post<any>(`/super-admin/tenants/${id}/notes`, { content, type }),

    // Staff
    getStaff: () => get<any>('/super-admin/staff'),
    addStaff: (data: { name: string; email: string; password: string; role: string }) =>
        post<any>('/super-admin/staff', data),
    updateStaffRole: (id: string, role: string) => patch<any>(`/super-admin/staff/${id}/role`, { role }),
    deactivateStaff: (id: string) => patch<any>(`/super-admin/staff/${id}/deactivate`),
    activateStaff: (id: string) => patch<any>(`/super-admin/staff/${id}/activate`),
    resetPassword: (id: string, password: string) => patch<any>(`/super-admin/staff/${id}/reset-password`, { password }),

    // Chat
    getChatRooms: () => get<any>('/super-admin/chat/rooms'),
    getChatRoom: (tenantId: string) => get<any>(`/super-admin/chat/rooms/${tenantId}`),
    sendMessage: (roomId: string, content: string) => post<any>(`/super-admin/chat/rooms/${roomId}/messages`, { content }),
    markRead: (roomId: string) => post<any>(`/super-admin/chat/rooms/${roomId}/read`),
    resolveRoom: (roomId: string) => post<any>(`/super-admin/chat/rooms/${roomId}/resolve`),

    // Audit
    getAuditLogs: (params?: { page?: number; action?: string }) => get<any>('/super-admin/audit-logs', params),
};
