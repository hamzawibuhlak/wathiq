/**
 * Phase 35: Tenant Roles API
 */
import { apiGet, apiPost, apiPatch, apiDelete } from './client';
import { useAuthStore } from '@/stores/auth.store';

// ─── Types ────────────────────────────────────

export interface PermissionEntry {
    resource: string;
    action: string;
    accessLevel: 'NONE' | 'VIEW' | 'EDIT' | 'FULL';
    scope?: 'OWN' | 'ASSIGNED' | 'TEAM' | 'ALL';
}

export interface TenantRole {
    id: string;
    name: string;
    nameEn?: string;
    description?: string;
    color: string;
    icon: string;
    isActive: boolean;
    isSystem: boolean;
    usersCount: number;
    enabledPermissions: number;
    totalPermissions: number;
    createdAt: string;
    updatedAt: string;
}

export interface TenantRoleDetail extends TenantRole {
    permissions: PermissionEntry[];
    users: { id: string; name: string; email: string; avatar?: string; role: string }[];
    _count: { users: number };
}

export interface PermissionAction {
    key: string;
    label: string;
    labelEn: string;
    description?: string;
    supportsScope?: boolean;
}

export interface PermissionModule {
    key: string;
    label: string;
    labelEn: string;
    icon: string;
    actions: PermissionAction[];
}

export interface RoleTemplate {
    name: string;
    nameEn: string;
    description: string;
    color: string;
    icon: string;
    permissionCount: number;
    totalPermissions: number;
}

export interface MyPermissions {
    role: string;
    tenantRole: { name: string; nameEn?: string } | null;
    isOwner: boolean;
    permissions: Record<string, { accessLevel: string; scope: string }>;
}

// ─── Helper ───────────────────────────────────

function getSlug(): string {
    return useAuthStore.getState().getTenantSlug() || '';
}

// ─── API Functions ────────────────────────────

export const tenantRolesApi = {
    // List all roles
    getRoles: () =>
        apiGet<TenantRole[]>(`/${getSlug()}/tenant-roles`),

    // Get single role with permissions
    getRole: (id: string) =>
        apiGet<TenantRoleDetail>(`/${getSlug()}/tenant-roles/${id}`),

    // Create role
    createRole: (data: { name: string; nameEn?: string; description?: string; color?: string; icon?: string; permissions: PermissionEntry[] }) =>
        apiPost<TenantRoleDetail>(`/${getSlug()}/tenant-roles`, data),

    // Update role
    updateRole: (id: string, data: Partial<{ name: string; nameEn?: string; description?: string; color?: string; icon?: string; isActive?: boolean; permissions?: PermissionEntry[] }>) =>
        apiPatch<TenantRoleDetail>(`/${getSlug()}/tenant-roles/${id}`, data),

    // Delete role
    deleteRole: (id: string) =>
        apiDelete<{ message: string }>(`/${getSlug()}/tenant-roles/${id}`),

    // Clone role
    cloneRole: (id: string, newName: string) =>
        apiPost<TenantRoleDetail>(`/${getSlug()}/tenant-roles/${id}/clone`, { newName }),

    // Assign role to user
    assignRole: (userId: string, roleId: string) =>
        apiPost<{ message: string }>(`/${getSlug()}/tenant-roles/assign`, { userId, roleId }),

    // Unassign role from user
    unassignRole: (userId: string) =>
        apiPost<{ message: string }>(`/${getSlug()}/tenant-roles/unassign/${userId}`),

    // Get role templates
    getTemplates: () =>
        apiGet<RoleTemplate[]>(`/${getSlug()}/tenant-roles/templates`),

    // Get template permissions
    getTemplatePermissions: (name: string) =>
        apiGet<PermissionEntry[]>(`/${getSlug()}/tenant-roles/templates/${name}`),

    // Get permission map (catalog for UI)
    getPermissionMap: () =>
        apiGet<{ modules: PermissionModule[]; totalActions: number }>(`/${getSlug()}/tenant-roles/permission-map`),

    // Get current user's permissions
    getMyPermissions: () =>
        apiGet<MyPermissions>(`/${getSlug()}/tenant-roles/my-permissions`),

    // Seed default roles
    seedRoles: () =>
        apiPost<any>(`/${getSlug()}/tenant-roles/seed`),
};
