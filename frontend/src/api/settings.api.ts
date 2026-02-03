import api from './client';
import type { User, ApiResponse, PaginatedResponse } from '@/types';

// =====================
// Profile API
// =====================
export interface UpdateProfileData {
    name: string;
    email: string;
    phone?: string;
}

export interface ChangePasswordData {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

export const profileApi = {
    getProfile: () =>
        api.get<ApiResponse<User>>('/users/me').then((res) => res.data),

    updateProfile: (data: UpdateProfileData) =>
        api.patch<ApiResponse<User>>('/users/me', data).then((res) => res.data),

    changePassword: (data: ChangePasswordData) =>
        api.post<ApiResponse<void>>('/auth/change-password', data).then((res) => res.data),

    uploadAvatar: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post<ApiResponse<{ avatarUrl: string }>>('/uploads/avatar', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }).then((res) => res.data);
    },
};

// =====================
// Users Management API
// =====================
export interface CreateUserData {
    name: string;
    email: string;
    password: string;
    role: 'ADMIN' | 'LAWYER' | 'SECRETARY';
    phone?: string;
}

export interface UpdateUserData {
    name?: string;
    email?: string;
    role?: 'ADMIN' | 'LAWYER' | 'SECRETARY';
    phone?: string;
    isActive?: boolean;
}

export interface UsersFilters {
    search?: string;
    role?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
}

export const usersApi = {
    getAll: (filters?: UsersFilters) =>
        api.get<PaginatedResponse<User>>('/users', { params: filters }).then((res) => res.data),

    getById: (id: string) =>
        api.get<ApiResponse<User>>(`/users/${id}`).then((res) => res.data),

    create: (data: CreateUserData) =>
        api.post<ApiResponse<User>>('/users', data).then((res) => res.data),

    update: (id: string, data: UpdateUserData) =>
        api.patch<ApiResponse<User>>(`/users/${id}`, data).then((res) => res.data),

    delete: (id: string) =>
        api.delete<ApiResponse<void>>(`/users/${id}`).then((res) => res.data),

    toggleActive: (id: string, isActive: boolean) =>
        api.patch<ApiResponse<User>>(`/users/${id}`, { isActive }).then((res) => res.data),
};

// =====================
// Firm Settings API
// =====================
export interface FirmSettings {
    id: string;
    name: string;
    logo?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    taxNumber?: string;
    commercialReg?: string;
    website?: string;
}

export interface UpdateFirmData {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    taxNumber?: string;
    commercialReg?: string;
    website?: string;
}

export const firmApi = {
    get: () =>
        api.get<ApiResponse<FirmSettings>>('/tenants/current').then((res) => res.data),

    update: (data: UpdateFirmData) =>
        api.put<ApiResponse<FirmSettings>>('/tenants/current', data).then((res) => res.data),

    uploadLogo: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post<ApiResponse<{ logoUrl: string }>>('/uploads/logo', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }).then((res) => res.data);
    },
};

// =====================
// Notifications Settings API
// =====================
export interface NotificationSettings {
    emailEnabled: boolean;
    smsEnabled: boolean;
    hearingReminders: boolean;
    caseUpdates: boolean;
    invoiceReminders: boolean;
    dailyDigest: boolean;
    reminderHoursBefore: number;
}

export const notificationsApi = {
    get: () =>
        api.get<ApiResponse<NotificationSettings>>('/notifications/settings').then((res) => res.data),

    update: (data: Partial<NotificationSettings>) =>
        api.put<ApiResponse<NotificationSettings>>('/notifications/settings', data).then((res) => res.data),
};

export default {
    profile: profileApi,
    users: usersApi,
    firm: firmApi,
    notifications: notificationsApi,
};
