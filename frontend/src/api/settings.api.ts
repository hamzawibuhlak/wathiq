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

    // New endpoints for Phase 10
    getStats: () =>
        api.get<ApiResponse<{ total: number; active: number; inactive: number; byRole: Record<string, number> }>>('/users/stats').then((res) => res.data),

    changeRole: (id: string, role: string) =>
        api.patch<ApiResponse<void>>(`/users/${id}/role`, { role }).then((res) => res.data),

    deactivate: (id: string) =>
        api.patch<ApiResponse<void>>(`/users/${id}/deactivate`).then((res) => res.data),

    reactivate: (id: string) =>
        api.patch<ApiResponse<void>>(`/users/${id}/reactivate`).then((res) => res.data),
};

// =====================
// Invitations API
// =====================
export interface UserInvitation {
    id: string;
    email: string;
    role: string;
    status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED';
    token: string;
    expiresAt: string;
    acceptedAt?: string;
    createdAt: string;
    inviter: { id: string; name: string; email: string };
    acceptedUser?: { id: string; name: string; email: string };
    tenant: { id: string; name: string; logo?: string };
}

export interface CreateInvitationData {
    email: string;
    role?: string;
}

export interface AcceptInvitationData {
    token: string;
    name: string;
    password: string;
    phone?: string;
}

export const invitationsApi = {
    getAll: (status?: string) =>
        api.get<ApiResponse<UserInvitation[]>>('/invitations', { params: status ? { status } : undefined }).then((res) => res.data),

    getStats: () =>
        api.get<ApiResponse<{ pending: number; accepted: number; expired: number; cancelled: number; total: number }>>('/invitations/stats').then((res) => res.data),

    verifyToken: (token: string) =>
        api.get<ApiResponse<UserInvitation>>(`/invitations/verify/${token}`).then((res) => res.data),

    accept: (data: AcceptInvitationData) =>
        api.post<ApiResponse<User>>('/invitations/accept', data).then((res) => res.data),

    create: (data: CreateInvitationData) =>
        api.post<ApiResponse<UserInvitation>>('/invitations', data).then((res) => res.data),

    cancel: (id: string) =>
        api.patch<ApiResponse<void>>(`/invitations/${id}/cancel`).then((res) => res.data),

    resend: (id: string) =>
        api.patch<ApiResponse<UserInvitation>>(`/invitations/${id}/resend`).then((res) => res.data),
};

// =====================
// Firm Settings API
// =====================
export interface FirmSettings {
    id: string;
    name: string;
    logo?: string;
    letterheadUrl?: string;
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

    uploadLetterhead: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post<ApiResponse<{ letterheadUrl: string }>>('/uploads/letterhead', formData, {
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

// =====================
// SMTP Email Settings API
// =====================
export interface SmtpSettings {
    smtpHost: string | null;
    smtpPort: number | null;
    smtpUser: string | null;
    smtpPass: string | null;
    smtpFrom: string | null;
    smtpFromName: string | null;
    smtpSecure: boolean;
    smtpEnabled: boolean;
    hasPassword?: boolean;
}

export interface UpdateSmtpSettingsData {
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPass?: string;
    smtpFrom?: string;
    smtpFromName?: string;
    smtpSecure?: boolean;
    smtpEnabled?: boolean;
}

export interface TestEmailData {
    testEmail: string;
}

export const smtpApi = {
    get: () =>
        api.get<ApiResponse<SmtpSettings>>('/tenants/smtp-settings').then((res) => res.data),

    update: (data: UpdateSmtpSettingsData) =>
        api.put<ApiResponse<SmtpSettings>>('/tenants/smtp-settings', data).then((res) => res.data),

    test: (data: TestEmailData) =>
        api.post<{ success: boolean; message: string }>('/tenants/smtp-settings/test', data).then((res) => res.data),
};

export default {
    profile: profileApi,
    users: usersApi,
    firm: firmApi,
    notifications: notificationsApi,
    smtp: smtpApi,
};
