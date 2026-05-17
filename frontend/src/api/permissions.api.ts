import { apiGet, apiPost, apiPatch } from './client';
import api from './client';

export interface Permission {
    id: string;
    name: string;        // e.g., "cases.create"
    description: string | null;
    module: string;      // e.g., "cases"
    action: string;      // e.g., "create"
    labelAr: string | null;
    category: string;    // work | finance | hr | comms | marketing | analytics | settings | custom
    isSystem: boolean;
    createdAt: string;
}

export interface CategoryInfo {
    key: string;
    label: string;
    count: number;
}

export interface PermissionsResponse {
    data: Permission[];
}

export interface MyPermissionsResponse {
    data: string[];
}

export interface CategoriesResponse {
    data: CategoryInfo[];
}

export interface RolePermissionsResponse {
    data: Permission[];
}

export interface CreatePermissionInput {
    module: string;
    action: string;
    labelAr?: string;
    description?: string;
    category?: string;
}

const BASE = '/permissions';

export const permissionsApi = {
    // ── Reads ─────────────────────────────────────
    getMyPermissions: () =>
        apiGet<MyPermissionsResponse>(`${BASE}/my-permissions`),

    getAllPermissions: () =>
        apiGet<PermissionsResponse>(`${BASE}/all`),

    getCategories: () =>
        apiGet<CategoriesResponse>(`${BASE}/categories`),

    getRolePermissions: (role: string) =>
        apiGet<RolePermissionsResponse>(`${BASE}/role/${role}`),

    getDefaultPermissions: (role: string) =>
        apiGet<MyPermissionsResponse>(`${BASE}/defaults/${role}`),

    // ── Single assign/revoke ──────────────────────
    assignPermission: (role: string, permission: string) =>
        apiPost<{ message: string }>(`${BASE}/assign`, { role, permission }),

    revokePermission: (role: string, permission: string) =>
        api.delete<{ message: string }>(`${BASE}/revoke`, { data: { role, permission } }).then(r => r.data),

    // ── Bulk ──────────────────────────────────────
    bulkAssign: (role: string, permissions: string[]) =>
        apiPost<{ message: string; count: number }>(`${BASE}/bulk-assign`, { role, permissions }),

    bulkRevoke: (role: string, permissions: string[]) =>
        apiPost<{ message: string; count: number }>(`${BASE}/bulk-revoke`, { role, permissions }),

    resetRole: (role: string) =>
        apiPost<{ message: string }>(`${BASE}/reset/${role}`, {}),

    clearRole: (role: string) =>
        apiPost<{ message: string; count: number }>(`${BASE}/clear/${role}`, {}),

    // ── Custom permission CRUD ────────────────────
    createPermission: (input: CreatePermissionInput) =>
        apiPost<{ message: string; data: Permission }>(BASE, input),

    updatePermission: (id: string, input: Partial<Pick<Permission, 'labelAr' | 'description' | 'category'>>) =>
        apiPatch<{ message: string; data: Permission }>(`${BASE}/${id}`, input),

    deletePermission: (id: string) =>
        api.delete<{ message: string }>(`${BASE}/${id}`).then(r => r.data),
};

export default permissionsApi;
