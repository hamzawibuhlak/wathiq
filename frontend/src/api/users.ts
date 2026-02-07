import api from './client';

// =====================================================
// TYPES
// =====================================================

export type UserRole = 'OWNER' | 'ADMIN' | 'LAWYER' | 'SECRETARY';
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED';

export interface User {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: UserRole;
    title?: string;
    avatar?: string;
    isActive: boolean;
    isVerified: boolean;
    lastLoginAt?: string;
    lastLoginIp?: string;
    createdAt: string;
    updatedAt: string;
    tenantId: string;
    createdById?: string;
    _count?: {
        assignedCases: number;
    };
}

export interface UserInvitation {
    id: string;
    email: string;
    role: UserRole;
    status: InvitationStatus;
    token: string;
    expiresAt: string;
    acceptedAt?: string;
    createdAt: string;
    inviter: {
        id: string;
        name: string;
        email: string;
    };
    acceptedUser?: {
        id: string;
        name: string;
        email: string;
    };
    tenant: {
        id: string;
        name: string;
        logo?: string;
    };
}

export interface UserSession {
    id: string;
    token: string;
    ipAddress?: string;
    userAgent?: string;
    deviceInfo?: string;
    location?: string;
    lastActivity: string;
    createdAt: string;
    expiresAt: string;
}

export interface UserStats {
    total: number;
    active: number;
    inactive: number;
    byRole: Record<UserRole, number>;
}

export interface InvitationStats {
    pending: number;
    accepted: number;
    expired: number;
    cancelled: number;
    total: number;
}

export interface SessionStats {
    activeSessions: number;
    totalSessions: number;
    lastActivity?: string;
}

// =====================================================
// DTOs
// =====================================================

export interface CreateUserDto {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role?: UserRole;
    title?: string;
}

export interface UpdateUserDto {
    name?: string;
    email?: string;
    password?: string;
    phone?: string;
    title?: string;
    avatar?: string;
}

export interface FilterUsersDto {
    page?: number;
    limit?: number;
    search?: string;
    role?: UserRole;
    isActive?: boolean;
    sortBy?: 'createdAt' | 'name' | 'email' | 'role';
    sortOrder?: 'asc' | 'desc';
}

export interface CreateInvitationDto {
    email: string;
    role?: UserRole;
}

export interface AcceptInvitationDto {
    token: string;
    name: string;
    password: string;
    phone?: string;
}

// =====================================================
// USERS API
// =====================================================

export const usersApi = {
    // List users with pagination
    getAll: (params?: FilterUsersDto) => 
        api.get<{ data: User[]; meta: { page: number; limit: number; total: number; totalPages: number } }>('/users', { params }),

    // Get single user
    getById: (id: string) => 
        api.get<{ data: User }>(`/users/${id}`),

    // Get current user
    getMe: () => 
        api.get<{ data: User }>('/users/me'),

    // Update current user
    updateMe: (data: UpdateUserDto) => 
        api.patch<{ data: User; message: string }>('/users/me', data),

    // Get lawyers for assignment
    getLawyers: () => 
        api.get<{ data: Pick<User, 'id' | 'name' | 'email' | 'role'>[] }>('/users/lawyers'),

    // Get user statistics
    getStats: () => 
        api.get<{ data: UserStats }>('/users/stats'),

    // Create user
    create: (data: CreateUserDto) => 
        api.post<{ data: User; message: string }>('/users', data),

    // Update user
    update: (id: string, data: UpdateUserDto) => 
        api.patch<{ data: User; message: string }>(`/users/${id}`, data),

    // Change user role
    changeRole: (id: string, role: UserRole) => 
        api.patch<{ message: string }>(`/users/${id}/role`, { role }),

    // Deactivate user
    deactivate: (id: string) => 
        api.patch<{ message: string }>(`/users/${id}/deactivate`),

    // Reactivate user
    reactivate: (id: string) => 
        api.patch<{ message: string }>(`/users/${id}/reactivate`),

    // Verify user email
    verifyEmail: (id: string) => 
        api.patch<{ message: string }>(`/users/${id}/verify`),

    // Delete user (soft delete)
    delete: (id: string) => 
        api.delete<{ message: string }>(`/users/${id}`),
};

// =====================================================
// INVITATIONS API
// =====================================================

export const invitationsApi = {
    // List all invitations
    getAll: (status?: InvitationStatus) => 
        api.get<{ data: UserInvitation[] }>('/invitations', { params: status ? { status } : undefined }),

    // Get invitation stats
    getStats: () => 
        api.get<{ data: InvitationStats }>('/invitations/stats'),

    // Verify invitation token (public)
    verifyToken: (token: string) => 
        api.get<{ data: UserInvitation }>(`/invitations/verify/${token}`),

    // Accept invitation (public)
    accept: (data: AcceptInvitationDto) => 
        api.post<{ data: Pick<User, 'id' | 'email' | 'name' | 'role' | 'tenantId'>; message: string }>('/invitations/accept', data),

    // Send invitation
    create: (data: CreateInvitationDto) => 
        api.post<{ data: UserInvitation; message: string }>('/invitations', data),

    // Cancel invitation
    cancel: (id: string) => 
        api.patch<{ message: string }>(`/invitations/${id}/cancel`),

    // Resend invitation
    resend: (id: string) => 
        api.patch<{ data: UserInvitation; message: string }>(`/invitations/${id}/resend`),
};

// =====================================================
// SESSIONS API
// =====================================================

export const sessionsApi = {
    // Get my sessions
    getMySessions: () => 
        api.get<{ data: UserSession[] }>('/sessions/me'),

    // Get session stats
    getMyStats: () => 
        api.get<{ data: SessionStats }>('/sessions/me/stats'),

    // Logout from all other devices
    logoutAll: () => 
        api.delete<{ message: string; count: number }>('/sessions/me/all'),

    // Logout everywhere including current session
    logoutEverywhere: () => 
        api.delete<{ message: string; count: number }>('/sessions/me/everywhere'),

    // Invalidate specific session
    invalidate: (sessionId: string) => 
        api.delete<{ message: string }>(`/sessions/${sessionId}`),
};
